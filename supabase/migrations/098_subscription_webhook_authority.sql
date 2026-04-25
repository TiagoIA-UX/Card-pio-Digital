-- =====================================================
-- Migration 098: autoridade do webhook de subscriptions
-- Idempotência, lock transacional e trilha auditável.
-- =====================================================
ALTER TABLE public.webhook_events
ADD COLUMN IF NOT EXISTS resource_id TEXT,
  ADD COLUMN IF NOT EXISTS resource_type TEXT,
  ADD COLUMN IF NOT EXISTS provider_event_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ignored_reason TEXT;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_constraint
  WHERE conname = 'webhook_events_provider_event_unique'
    AND conrelid = 'public.webhook_events'::regclass
) THEN
ALTER TABLE public.webhook_events
ADD CONSTRAINT webhook_events_provider_event_unique UNIQUE (provider, event_id);
END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_resource ON public.webhook_events (provider, resource_id, created_at DESC);
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS contract_hash TEXT,
  ADD COLUMN IF NOT EXISTS contracted_monthly_amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS billing_model TEXT DEFAULT 'legacy_billing',
  ADD COLUMN IF NOT EXISTS last_event_id TEXT,
  ADD COLUMN IF NOT EXISTS last_event_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_event_status TEXT,
  ADD COLUMN IF NOT EXISTS last_event_status_rank INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_event_payload JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_value_validated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_value_validation_error TEXT;
ALTER TABLE public.subscriptions
ALTER COLUMN restaurant_id DROP NOT NULL;
UPDATE public.subscriptions s
SET billing_model = COALESCE(s.billing_model, 'legacy_billing'),
  contracted_monthly_amount = COALESCE(s.contracted_monthly_amount, p.preco_mensal)
FROM public.plans p
WHERE s.plan_id = p.id;
CREATE INDEX IF NOT EXISTS idx_subscriptions_contract_hash ON public.subscriptions (contract_hash);
CREATE UNIQUE INDEX IF NOT EXISTS ux_subscriptions_mp_preapproval_id ON public.subscriptions (mp_preapproval_id)
WHERE mp_preapproval_id IS NOT NULL;
CREATE OR REPLACE FUNCTION public.apply_subscription_webhook_event(
    p_mp_preapproval_id TEXT,
    p_event_id TEXT,
    p_event_at TIMESTAMPTZ,
    p_target_status TEXT,
    p_target_status_rank INTEGER,
    p_mp_subscription_status TEXT,
    p_contract_hash TEXT,
    p_contracted_monthly_amount NUMERIC,
    p_payload JSONB,
    p_trial_ends_at TIMESTAMPTZ,
    p_last_payment_date TIMESTAMPTZ,
    p_next_payment_date TIMESTAMPTZ
  ) RETURNS TABLE (
    applied BOOLEAN,
    ignored BOOLEAN,
    ignored_reason TEXT,
    subscription_id UUID,
    previous_status TEXT,
    current_status TEXT
  ) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_subscription public.subscriptions %ROWTYPE;
BEGIN
SELECT * INTO v_subscription
FROM public.subscriptions
WHERE mp_preapproval_id = p_mp_preapproval_id FOR
UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'subscription_not_found' USING ERRCODE = 'P0001';
END IF;
IF v_subscription.last_event_id = p_event_id THEN RETURN QUERY
SELECT false,
  true,
  'duplicate_event_id'::TEXT,
  v_subscription.id,
  v_subscription.status,
  v_subscription.status;
RETURN;
END IF;
IF v_subscription.contract_hash IS NOT NULL
AND p_contract_hash IS NOT NULL
AND v_subscription.contract_hash <> p_contract_hash THEN RAISE EXCEPTION 'contract_hash_mismatch' USING ERRCODE = 'P0001';
END IF;
IF p_target_status_rank < COALESCE(v_subscription.last_event_status_rank, 0) THEN RETURN QUERY
SELECT false,
  true,
  'out_of_order_state_regression'::TEXT,
  v_subscription.id,
  v_subscription.status,
  v_subscription.status;
RETURN;
END IF;
UPDATE public.subscriptions
SET status = p_target_status,
  mp_subscription_status = p_mp_subscription_status,
  contract_hash = COALESCE(v_subscription.contract_hash, p_contract_hash),
  contracted_monthly_amount = COALESCE(
    v_subscription.contracted_monthly_amount,
    p_contracted_monthly_amount
  ),
  trial_ends_at = COALESCE(p_trial_ends_at, v_subscription.trial_ends_at),
  last_payment_date = COALESCE(
    p_last_payment_date,
    v_subscription.last_payment_date
  ),
  next_payment_date = COALESCE(
    p_next_payment_date,
    v_subscription.next_payment_date
  ),
  canceled_at = CASE
    WHEN p_target_status = 'canceled'
    AND v_subscription.canceled_at IS NULL THEN NOW()
    ELSE v_subscription.canceled_at
  END,
  last_event_id = p_event_id,
  last_event_at = p_event_at,
  last_event_status = p_target_status,
  last_event_status_rank = p_target_status_rank,
  last_event_payload = COALESCE(p_payload, '{}'::jsonb),
  last_value_validated_at = NOW(),
  last_value_validation_error = NULL,
  updated_at = NOW()
WHERE id = v_subscription.id;
RETURN QUERY
SELECT true,
  false,
  NULL::TEXT,
  v_subscription.id,
  v_subscription.status,
  p_target_status;
END;
$$;