-- =============================================
-- MIGRAÇÃO: Gerador de Imagens IA com Mercado Pago
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- 1) Tabela de pedidos de créditos de imagens
CREATE TABLE IF NOT EXISTS ai_image_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Referência do Mercado Pago
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  mp_external_reference TEXT UNIQUE,
  -- Produto comprado
  pack_slug TEXT NOT NULL, -- 'starter' | 'basic' | 'pro' | 'unlimited'
  credits_amount INTEGER NOT NULL,
  amount_paid NUMERIC(10, 2),
  currency TEXT DEFAULT 'BRL',
  -- Status do pagamento
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected | cancelled
  payment_method TEXT, -- pix | credit_card
  approved_at TIMESTAMPTZ,
  -- Metadados
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_image_orders_user_id ON ai_image_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_image_orders_mp_payment_id ON ai_image_orders(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_ai_image_orders_external_reference ON ai_image_orders(mp_external_reference);
CREATE INDEX IF NOT EXISTS idx_ai_image_orders_status ON ai_image_orders(status);

-- 2) Tabela de créditos por usuário
CREATE TABLE IF NOT EXISTS ai_image_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Créditos disponíveis
  credits_available INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  -- Créditos gratuitos já consumidos (evitar fraude de recriação de conta)
  free_credits_given BOOLEAN NOT NULL DEFAULT false,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_image_credits_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_image_credits_user_id ON ai_image_credits(user_id);

-- 3) Tabela de gerações de imagens
CREATE TABLE IF NOT EXISTS ai_image_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Prompt usado
  prompt TEXT NOT NULL,
  translated_prompt TEXT,
  style TEXT DEFAULT 'food', -- food | packshot | lifestyle | abstract
  -- Resultado
  image_url TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'pollinations', -- pollinations | dalle | gemini
  width INTEGER DEFAULT 1024,
  height INTEGER DEFAULT 1024,
  -- Crédito descontado
  credits_charged INTEGER NOT NULL DEFAULT 1,
  -- Metadados
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_image_generations_user_id ON ai_image_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_image_generations_created_at ON ai_image_generations(created_at DESC);

-- 4) Função para dar créditos gratuitos ao novo usuário
CREATE OR REPLACE FUNCTION give_free_ai_image_credits(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO ai_image_credits (user_id, credits_available, free_credits_given)
  VALUES (p_user_id, 3, true)
  ON CONFLICT (user_id) DO UPDATE
    SET
      credits_available = ai_image_credits.credits_available + CASE WHEN ai_image_credits.free_credits_given THEN 0 ELSE 3 END,
      free_credits_given = true,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5) Função para adicionar créditos comprados
CREATE OR REPLACE FUNCTION add_ai_image_credits(p_user_id UUID, p_credits INTEGER)
RETURNS void AS $$
BEGIN
  INSERT INTO ai_image_credits (user_id, credits_available, free_credits_given)
  VALUES (p_user_id, p_credits, true)
  ON CONFLICT (user_id) DO UPDATE
    SET
      credits_available = ai_image_credits.credits_available + p_credits,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6) Função para consumir crédito ao gerar imagem
CREATE OR REPLACE FUNCTION consume_ai_image_credit(p_user_id UUID, p_amount INTEGER DEFAULT 1)
RETURNS boolean AS $$
DECLARE
  v_available INTEGER;
BEGIN
  SELECT credits_available INTO v_available
  FROM ai_image_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_available IS NULL OR v_available < p_amount THEN
    RETURN false;
  END IF;

  UPDATE ai_image_credits
  SET
    credits_available = credits_available - p_amount,
    credits_used = credits_used + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7) RLS (Row Level Security)
ALTER TABLE ai_image_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_image_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_image_generations ENABLE ROW LEVEL SECURITY;

-- Usuários veem apenas seus próprios dados
CREATE POLICY "ai_image_orders_user_select" ON ai_image_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_image_credits_user_select" ON ai_image_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_image_generations_user_select" ON ai_image_generations
  FOR SELECT USING (auth.uid() = user_id);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_image_orders_updated_at
  BEFORE UPDATE ON ai_image_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER ai_image_credits_updated_at
  BEFORE UPDATE ON ai_image_credits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================
-- TABELA DE JOBS EM LOTE (BATCH)
-- Cada job agrupa múltiplos prompts para geração em série com checkpoint
-- =============================================

CREATE TABLE IF NOT EXISTS ai_image_batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Status geral do job
  status TEXT NOT NULL DEFAULT 'pending', -- pending | processing | completed | failed | cancelled
  provider TEXT NOT NULL DEFAULT 'pollinations',
  -- Contadores de progresso
  total INTEGER NOT NULL DEFAULT 0,
  done INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  credits_charged INTEGER NOT NULL DEFAULT 0,
  -- Lista de itens com estado de cada um (checkpoint incremental)
  -- Cada item: { index, prompt, style, status, imageUrl?, error? }
  items JSONB NOT NULL DEFAULT '[]',
  -- Metadados
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_image_batch_jobs_user_id ON ai_image_batch_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_image_batch_jobs_status ON ai_image_batch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_image_batch_jobs_created_at ON ai_image_batch_jobs(created_at DESC);

ALTER TABLE ai_image_batch_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_image_batch_jobs_user_select" ON ai_image_batch_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE TRIGGER ai_image_batch_jobs_updated_at
  BEFORE UPDATE ON ai_image_batch_jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

