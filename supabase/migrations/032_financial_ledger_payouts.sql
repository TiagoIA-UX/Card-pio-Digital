-- ============================================================================
-- Migration 032: Financial Ledger + Payout System
-- Sistema financeiro completo com ledger, batches de pagamento quinzenal,
-- e cálculo de CDI diário.
-- ============================================================================

-- ─── 1) Ledger financeiro ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_ledger (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo          VARCHAR(30) NOT NULL
                CHECK (tipo IN (
                  'entrada_assinatura',   -- restaurante pagou assinatura
                  'entrada_setup',        -- restaurante pagou taxa de setup
                  'reserva_afiliado',     -- 30% reservado para vendedor
                  'reserva_lider',        -- 10% reservado para líder
                  'pagamento_afiliado',   -- PIX enviado ao vendedor
                  'pagamento_lider',      -- PIX enviado ao líder
                  'rendimento_cdi',       -- juros CDI diários
                  'bonus_afiliado',       -- bônus de tier milestone
                  'estorno'               -- estorno/correção
                )),
  valor         NUMERIC(12,2) NOT NULL,
  saldo_apos    NUMERIC(12,2),           -- saldo total após esta operação
  referencia    VARCHAR(20),             -- ex: '2026-03-Q1' (quinzena 1)
  affiliate_id  UUID REFERENCES affiliates(id) ON DELETE SET NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  payout_id     UUID,                    -- referência ao batch (FK depois)
  descricao     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_tipo ON financial_ledger(tipo);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON financial_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_affiliate ON financial_ledger(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_ledger_referencia ON financial_ledger(referencia);

-- ─── 2) Batches de pagamento (quinzenal) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS payout_batches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referencia    VARCHAR(20) NOT NULL UNIQUE, -- '2026-03-Q1' ou '2026-03-Q2'
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  status        VARCHAR(15) NOT NULL DEFAULT 'pendente'
                CHECK (status IN ('pendente', 'aprovado', 'pago', 'cancelado')),
  total_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  items_count   INT NOT NULL DEFAULT 0,
  approved_at   TIMESTAMPTZ,
  paid_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3) Itens individuais de cada batch ────────────────────────────────────
CREATE TABLE IF NOT EXISTS payout_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id      UUID NOT NULL REFERENCES payout_batches(id) ON DELETE CASCADE,
  affiliate_id  UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  tipo          VARCHAR(15) NOT NULL CHECK (tipo IN ('vendedor', 'lider', 'bonus')),
  valor         NUMERIC(12,2) NOT NULL,
  chave_pix     TEXT,                    -- snapshot da chave PIX no momento
  status        VARCHAR(15) NOT NULL DEFAULT 'pendente'
                CHECK (status IN ('pendente', 'pago', 'ignorado')),
  paid_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_items_batch ON payout_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_payout_items_affiliate ON payout_items(affiliate_id);

-- ─── 4) Configuração CDI ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cdi_config (
  id            SERIAL PRIMARY KEY,
  taxa_anual    NUMERIC(6,4) NOT NULL DEFAULT 13.1500, -- 13.15% a.a. (Mercado Pago 100% CDI)
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO cdi_config (taxa_anual) VALUES (13.1500)
ON CONFLICT DO NOTHING;

-- ─── 5) FK na ledger para payout_batches ───────────────────────────────────
ALTER TABLE financial_ledger
  ADD CONSTRAINT fk_ledger_payout
  FOREIGN KEY (payout_id) REFERENCES payout_batches(id) ON DELETE SET NULL;

-- ─── 6) View resumo financeiro ─────────────────────────────────────────────
CREATE OR REPLACE VIEW financial_summary AS
SELECT
  COALESCE(SUM(CASE WHEN tipo IN ('entrada_assinatura', 'entrada_setup') THEN valor ELSE 0 END), 0) AS total_entradas,
  COALESCE(SUM(CASE WHEN tipo IN ('reserva_afiliado', 'reserva_lider') THEN valor ELSE 0 END), 0) AS total_reservado,
  COALESCE(SUM(CASE WHEN tipo IN ('pagamento_afiliado', 'pagamento_lider', 'bonus_afiliado') THEN valor ELSE 0 END), 0) AS total_pago,
  COALESCE(SUM(CASE WHEN tipo = 'rendimento_cdi' THEN valor ELSE 0 END), 0) AS total_rendimento_cdi,
  COALESCE(SUM(CASE WHEN tipo = 'estorno' THEN valor ELSE 0 END), 0) AS total_estornos,
  COALESCE(SUM(CASE WHEN tipo IN ('entrada_assinatura', 'entrada_setup', 'rendimento_cdi') THEN valor ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN tipo IN ('pagamento_afiliado', 'pagamento_lider', 'bonus_afiliado') THEN valor ELSE 0 END), 0)
    + COALESCE(SUM(CASE WHEN tipo = 'estorno' THEN valor ELSE 0 END), 0)
  AS saldo_total,
  COALESCE(SUM(CASE WHEN tipo IN ('entrada_assinatura', 'entrada_setup', 'rendimento_cdi') THEN valor ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN tipo IN ('reserva_afiliado', 'reserva_lider') THEN valor ELSE 0 END), 0)
    + COALESCE(SUM(CASE WHEN tipo IN ('pagamento_afiliado', 'pagamento_lider', 'bonus_afiliado') THEN valor ELSE 0 END), 0)
    + COALESCE(SUM(CASE WHEN tipo = 'estorno' THEN valor ELSE 0 END), 0)
  AS saldo_disponivel
FROM financial_ledger;

-- ─── 7) RLS — apenas service_role ──────────────────────────────────────────
ALTER TABLE financial_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cdi_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_ledger" ON financial_ledger
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_batches" ON payout_batches
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_items" ON payout_items
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_cdi" ON cdi_config
  FOR ALL USING (auth.role() = 'service_role');
