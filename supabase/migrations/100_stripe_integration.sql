-- =====================================================
-- Migration 100: Integração Stripe
-- Adiciona colunas Stripe em restaurants e subscriptions,
-- cria view v_tenant_subscription_status e índices.
-- =====================================================

-- -------------------------------------------------------
-- 1. Colunas Stripe na tabela restaurants (tenants)
-- -------------------------------------------------------
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS stripe_customer_id       TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id   TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id          TEXT,
  ADD COLUMN IF NOT EXISTS stripe_current_period_end TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS ux_restaurants_stripe_customer_id
  ON public.restaurants (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_restaurants_stripe_subscription_id
  ON public.restaurants (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- -------------------------------------------------------
-- 2. Colunas Stripe na tabela subscriptions
-- -------------------------------------------------------
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_subscription_id    TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id        TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id           TEXT,
  ADD COLUMN IF NOT EXISTS stripe_current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_cancel_at_period_end BOOLEAN DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS ux_subscriptions_stripe_subscription_id
  ON public.subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- -------------------------------------------------------
-- 3. View v_tenant_subscription_status
--    Usada por lib/stripe/subscription-guard.ts
-- -------------------------------------------------------
DROP VIEW IF EXISTS public.v_tenant_subscription_status;

CREATE VIEW public.v_tenant_subscription_status
  WITH (security_invoker = true)
AS
SELECT
  r.id                              AS tenant_id,
  r.slug                            AS tenant_slug,
  r.plano_id                        AS plano_id,
  r.stripe_customer_id              AS stripe_customer_id,
  r.stripe_subscription_id         AS stripe_subscription_id,
  r.stripe_subscription_status     AS stripe_subscription_status,
  r.stripe_price_id                AS stripe_price_id,
  r.stripe_current_period_end      AS stripe_current_period_end,
  CASE
    WHEN r.stripe_subscription_status IN ('active', 'trialing') THEN TRUE
    ELSE FALSE
  END                               AS subscription_active
FROM public.restaurants r;

COMMENT ON VIEW public.v_tenant_subscription_status IS
  'Status consolidado de assinatura Stripe por tenant. Usado pelo subscription-guard.';

-- -------------------------------------------------------
-- 4. RLS: service_role acessa a view sem restrição
-- -------------------------------------------------------
GRANT SELECT ON public.v_tenant_subscription_status TO service_role;
GRANT SELECT ON public.v_tenant_subscription_status TO authenticated;
