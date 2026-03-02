-- =============================================
-- MIGRAÇÃO: Planos, Assinaturas e Ativação
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- 1) Tabela de planos
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- basico | pro | premium
  price_month DECIMAL(10,2) NOT NULL,
  features_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Tabela de assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active', -- active | canceled | past_due
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  payment_gateway TEXT DEFAULT 'mercadopago',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant ON subscriptions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- 3) Campo de plano atual no restaurante
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS plan_slug TEXT DEFAULT 'basico';

-- 4) Seed inicial de planos
INSERT INTO plans (name, slug, price_month, features_json)
VALUES
  ('Básico', 'basico', 49.00, '{"max_products":60,"label":"Plano para começar"}'),
  ('Profissional', 'pro', 99.00, '{"max_products":200,"label":"Plano para crescer"}'),
  ('Premium', 'premium', 199.00, '{"max_products":null,"label":"Plano para escalar"}')
ON CONFLICT (slug) DO NOTHING;

-- 5) Tabela de eventos de ativação
CREATE TABLE IF NOT EXISTS activation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- created_restaurant | added_first_product | published_menu | received_first_order
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activation_events_restaurant ON activation_events(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_activation_events_user ON activation_events(user_id);

-- Ativar RLS e políticas básicas
ALTER TABLE activation_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'activation_events' AND policyname = 'Usuários veem próprios eventos'
  ) THEN
    CREATE POLICY "Usuários veem próprios eventos" ON activation_events
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'activation_events' AND policyname = 'Usuários criam próprios eventos'
  ) THEN
    CREATE POLICY "Usuários criam próprios eventos" ON activation_events
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

