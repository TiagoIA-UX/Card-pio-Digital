-- =====================================================
-- Migration 016 — price_brl em subscriptions + tenant_id em restaurants
--
-- TASK 1: Adiciona coluna price_brl na tabela subscriptions
--         Usada pelo webhook de comissão de afiliados para saber
--         o valor pago na renovação e calcular a comissão correta.
--
-- TASK 2: Adiciona coluna tenant_id na tabela restaurants
--         Necessária para ligar o restaurante ao fluxo de comissão
--         de afiliados (approve_affiliate_commission recebe p_tenant_id).
--         Para restaurantes legados (sem tenant_id), faz backfill com
--         restaurants.id (UUID do próprio restaurante).
-- =====================================================

-- ── TASK 1: price_brl em subscriptions ──────────────────────────────────
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS price_brl NUMERIC(10,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN subscriptions.price_brl IS
  'Valor em BRL pago na última ativação/renovação da assinatura. '
  'Usado pelo webhook de afiliados para calcular comissões automáticas.';

-- ── TASK 2: tenant_id em restaurants ─────────────────────────────────────
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Backfill: restaurantes legados recebem seu próprio id como tenant_id
UPDATE restaurants
  SET tenant_id = id
  WHERE tenant_id IS NULL;

-- Torna a coluna obrigatória após o backfill e define default para novos
ALTER TABLE restaurants
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN tenant_id SET DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_restaurants_tenant_id ON restaurants(tenant_id);

COMMENT ON COLUMN restaurants.tenant_id IS
  'Identificador lógico do tenant. Para restaurantes legados é igual ao '
  'próprio restaurants.id; para novos pode ser UUID distinto se necessário.';
