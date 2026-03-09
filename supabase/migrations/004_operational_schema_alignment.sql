-- =====================================================
-- OPERATIONAL SCHEMA ALIGNMENT
-- Alinha o banco ao modelo realmente usado pelo app atual
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descricao TEXT,
  preco_mensal DECIMAL(10,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS nome TEXT,
  ADD COLUMN IF NOT EXISTS descricao TEXT,
  ADD COLUMN IF NOT EXISTS preco_mensal DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preco_anual DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS limites JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS destaque BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'name'
  ) THEN
    EXECUTE $sql$
      UPDATE plans
      SET nome = COALESCE(NULLIF(nome, ''), NULLIF(name, ''))
      WHERE COALESCE(NULLIF(nome, ''), '') = ''
        AND COALESCE(NULLIF(name, ''), '') <> ''
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'price_month'
  ) THEN
    EXECUTE $sql$
      UPDATE plans
      SET preco_mensal = COALESCE(preco_mensal, price_month, 0)
      WHERE preco_mensal IS NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'features_json'
  ) THEN
    EXECUTE $sql$
      UPDATE plans
      SET features = CASE
        WHEN features IS NULL AND jsonb_typeof(features_json) = 'array' THEN features_json
        WHEN features IS NULL THEN '[]'::jsonb
        ELSE features
      END
      WHERE features IS NULL
    $sql$;
  END IF;
END $$;

UPDATE plans
SET nome = CASE slug
      WHEN 'basico' THEN 'Plano Básico'
      WHEN 'pro' THEN 'Plano Pro'
      WHEN 'premium' THEN 'Plano Premium'
      ELSE COALESCE(nome, INITCAP(REPLACE(slug, '-', ' ')), 'Plano')
    END,
    descricao = CASE slug
      WHEN 'basico' THEN COALESCE(descricao, 'Plano de entrada para um restaurante')
      WHEN 'pro' THEN COALESCE(descricao, 'Plano profissional com mais capacidade')
      WHEN 'premium' THEN COALESCE(descricao, 'Plano avançado para operação madura')
      ELSE descricao
    END,
    preco_mensal = CASE
      WHEN slug = 'basico' AND COALESCE(preco_mensal, 0) <= 0 THEN 49
      WHEN slug = 'pro' AND COALESCE(preco_mensal, 0) <= 0 THEN 99
      WHEN slug = 'premium' AND COALESCE(preco_mensal, 0) <= 0 THEN 199
      WHEN slug = 'basico' THEN COALESCE(preco_mensal, 49)
      WHEN slug = 'pro' THEN COALESCE(preco_mensal, 99)
      WHEN slug = 'premium' THEN COALESCE(preco_mensal, 199)
      ELSE COALESCE(preco_mensal, 0)
    END,
    ativo = COALESCE(ativo, TRUE),
    destaque = COALESCE(destaque, slug = 'pro'),
    ordem = CASE
      WHEN COALESCE(ordem, 0) > 0 THEN ordem
      WHEN slug = 'basico' THEN 1
      WHEN slug = 'pro' THEN 2
      WHEN slug = 'premium' THEN 3
      ELSE 99
    END,
    features = COALESCE(features, '[]'::jsonb),
    limites = COALESCE(limites, '{}'::jsonb),
    updated_at = COALESCE(updated_at, NOW())
WHERE slug IN ('basico', 'pro', 'premium')
   OR nome IS NULL
   OR preco_mensal IS NULL
  OR preco_mensal <= 0
   OR ativo IS NULL
   OR ordem IS NULL;

INSERT INTO plans (nome, slug, descricao, preco_mensal, ativo, destaque, ordem, features, limites)
SELECT seed.nome, seed.slug, seed.descricao, seed.preco_mensal, TRUE, seed.destaque, seed.ordem, '[]'::jsonb, '{}'::jsonb
FROM (
  VALUES
    ('Plano Básico', 'basico', 'Plano de entrada para um restaurante', 49::DECIMAL(10,2), FALSE, 1),
    ('Plano Pro', 'pro', 'Plano profissional com mais capacidade', 99::DECIMAL(10,2), TRUE, 2),
    ('Plano Premium', 'premium', 'Plano avançado para operação madura', 199::DECIMAL(10,2), FALSE, 3)
) AS seed(nome, slug, descricao, preco_mensal, destaque, ordem)
WHERE NOT EXISTS (
  SELECT 1
  FROM plans existing
  WHERE existing.slug = seed.slug
);

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS template_slug VARCHAR(30) DEFAULT 'restaurante',
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
  ADD COLUMN IF NOT EXISTS endereco_texto TEXT,
  ADD COLUMN IF NOT EXISTS customizacao JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status_pagamento TEXT DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS plano TEXT DEFAULT 'self-service',
  ADD COLUMN IF NOT EXISTS plan_slug TEXT DEFAULT 'basico',
  ADD COLUMN IF NOT EXISTS valor_pago NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_pagamento TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_restaurants_plan_slug ON restaurants(plan_slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_status_pagamento ON restaurants(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_restaurants_template_slug ON restaurants(template_slug);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan_id UUID REFERENCES plans(id) ON DELETE RESTRICT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_gateway TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  mp_preapproval_id TEXT,
  mp_subscription_status TEXT DEFAULT 'pending',
  last_payment_date TIMESTAMPTZ,
  next_payment_date TIMESTAMPTZ,
  failed_payments INTEGER NOT NULL DEFAULT 0,
  canceled_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT subscriptions_status_check CHECK (status IN ('pending', 'trial', 'active', 'past_due', 'canceled', 'expired'))
);

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS plan_id UUID,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_gateway TEXT,
  ADD COLUMN IF NOT EXISTS mp_preapproval_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_subscription_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_payments INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant ON subscriptions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_mp_preapproval ON subscriptions(mp_preapproval_id);

CREATE TABLE IF NOT EXISTS activation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activation_events
  ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_activation_events_restaurant ON activation_events(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_activation_events_user ON activation_events(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_activation_events_unique_first_order
  ON activation_events(restaurant_id, event_type)
  WHERE event_type = 'received_first_order';

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'Owners can view own subscriptions'
  ) THEN
    CREATE POLICY "Owners can view own subscriptions" ON subscriptions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'activation_events' AND policyname = 'Owners can view own activation events'
  ) THEN
    CREATE POLICY "Owners can view own activation events" ON activation_events
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_users' AND policyname = 'Users can view own admin record'
  ) THEN
    CREATE POLICY "Users can view own admin record" ON admin_users
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION suspend_restaurant_for_nonpayment(p_restaurant_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE restaurants
  SET suspended = TRUE,
      suspended_reason = 'Inadimplência - assinatura vencida',
      suspended_at = NOW(),
      ativo = FALSE
  WHERE id = p_restaurant_id;

  UPDATE subscriptions
  SET status = 'past_due',
      suspended_at = NOW()
  WHERE restaurant_id = p_restaurant_id AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reactivate_restaurant(p_restaurant_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE restaurants
  SET suspended = FALSE,
      suspended_reason = NULL,
      suspended_at = NULL,
      ativo = TRUE
  WHERE id = p_restaurant_id;

  UPDATE subscriptions
  SET status = 'active',
      suspended_at = NULL,
      failed_payments = 0
  WHERE restaurant_id = p_restaurant_id AND status IN ('past_due', 'pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    DROP TRIGGER IF EXISTS trigger_subscriptions_updated_at ON subscriptions;
    CREATE TRIGGER trigger_subscriptions_updated_at
      BEFORE UPDATE ON subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;