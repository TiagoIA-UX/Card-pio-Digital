-- =====================================================
-- CHECKOUT SESSION HARDENING
-- Garante rastreabilidade operacional do onboarding SaaS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS checkout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES template_orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  template_slug TEXT,
  onboarding_plan_slug TEXT,
  subscription_plan_slug TEXT,
  payment_method TEXT,
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  init_point TEXT,
  sandbox_init_point TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT checkout_sessions_order_unique UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user ON checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_status ON checkout_sessions(status);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_mp_payment_id ON checkout_sessions(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_mp_preference_id ON checkout_sessions(mp_preference_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_template_orders_payment_id_unique
  ON template_orders(payment_id)
  WHERE payment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_activation_events_onboarding_provisioned_unique
  ON activation_events(restaurant_id, event_type)
  WHERE event_type = 'onboarding_provisioned';

ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'checkout_sessions'
      AND policyname = 'Owners can view own checkout sessions'
  ) THEN
    CREATE POLICY "Owners can view own checkout sessions" ON checkout_sessions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    DROP TRIGGER IF EXISTS trigger_checkout_sessions_updated_at ON checkout_sessions;
    CREATE TRIGGER trigger_checkout_sessions_updated_at
      BEFORE UPDATE ON checkout_sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;