-- =====================================================
-- Migration 021 — Fundo de bônus de afiliados
--
-- 10% de cada taxa de setup é reservada automaticamente neste fundo.
-- O fundo é usado exclusivamente para pagar bônus de marco de afiliados.
-- O saldo restante rende CDI (creditado manualmente via API admin).
--
-- Fluxo:
--   1. Restaurante paga setup (R$197–R$697)
--   2. Webhook insere tipo='entrada' com 10% do valor
--   3. Admin paga bônus de marco → tipo='bonus' é inserido
--   4. Mensalmente, admin credita CDI via POST /api/admin/bonus-fund
--
-- FONTE DA VERDADE: lib/affiliate-tiers.ts (marcos e valores de bônus)
-- =====================================================

CREATE TABLE IF NOT EXISTS bonus_fund (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo        VARCHAR(20)  NOT NULL CHECK (tipo IN ('entrada', 'bonus', 'rendimento')),
  valor       NUMERIC(10,2) NOT NULL CHECK (valor >= 0),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  affiliate_id  UUID REFERENCES affiliates(id)  ON DELETE SET NULL,
  descricao   TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Índices para queries frequentes
CREATE INDEX IF NOT EXISTS idx_bonus_fund_tipo       ON bonus_fund(tipo);
CREATE INDEX IF NOT EXISTS idx_bonus_fund_created_at ON bonus_fund(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bonus_fund_restaurant ON bonus_fund(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_bonus_fund_affiliate  ON bonus_fund(affiliate_id);

-- View: saldo atual do fundo (COALESCE garante nunca retornar negativo)
CREATE OR REPLACE VIEW bonus_fund_saldo AS
SELECT
  GREATEST(
    0,
    COALESCE(SUM(CASE WHEN tipo IN ('entrada', 'rendimento') THEN valor ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN tipo = 'bonus' THEN valor ELSE 0 END), 0)
  ) AS saldo_atual,
  COUNT(*) FILTER (WHERE tipo = 'entrada')     AS total_entradas,
  COUNT(*) FILTER (WHERE tipo = 'bonus')       AS total_saques,
  COUNT(*) FILTER (WHERE tipo = 'rendimento')  AS total_rendimentos,
  COALESCE(SUM(CASE WHEN tipo = 'entrada'     THEN valor ELSE 0 END), 0) AS soma_entradas,
  COALESCE(SUM(CASE WHEN tipo = 'bonus'       THEN valor ELSE 0 END), 0) AS soma_saques,
  COALESCE(SUM(CASE WHEN tipo = 'rendimento'  THEN valor ELSE 0 END), 0) AS soma_rendimentos
FROM bonus_fund;

-- RLS: apenas service_role e owner podem ler/inserir
ALTER TABLE bonus_fund ENABLE ROW LEVEL SECURITY;

-- Service role bypassa RLS automaticamente (webhooks e APIs admin)
-- Sem política adicional: leitura e escrita apenas via service_role key

COMMENT ON TABLE bonus_fund IS
  'Fundo de bônus de afiliados. '
  '10% de cada taxa de setup entra como tipo=entrada. '
  'Bônus pagos saem como tipo=bonus. '
  'Rendimento CDI creditado manualmente como tipo=rendimento. '
  'Saldo nunca fica negativo (GREATEST(0,...) na view bonus_fund_saldo).';

COMMENT ON COLUMN bonus_fund.tipo IS
  'entrada: 10% do setup de cada restaurante | '
  'bonus: saque para pagar bônus de afiliado | '
  'rendimento: crédito manual de CDI (gestão financeira)';
