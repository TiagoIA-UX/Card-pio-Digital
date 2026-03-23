-- =====================================================
-- Migration 028 — Sistema de Feedback Pós-Pedido
-- Feedback com classificação IA + fidelização
-- =====================================================

-- ── Tabela principal de feedbacks ─────────────────────
CREATE TABLE IF NOT EXISTS order_feedbacks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

  -- Avaliação do cliente (emoji-based: 1-4)
  rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 4),
  comment         TEXT DEFAULT '',

  -- Classificação IA (preenchido via API)
  sentimento      TEXT CHECK (sentimento IN ('positivo', 'neutro', 'negativo')),
  categoria       TEXT CHECK (categoria IN ('produto', 'entrega', 'atendimento', 'app', 'elogio', 'geral')),
  prioridade      TEXT CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')),
  resumo_ia       TEXT,
  acao_sugerida   TEXT,

  -- Fidelização
  cupom_gerado    TEXT,
  compartilhou    BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Índices ───────────────────────────────────────────
CREATE INDEX idx_feedbacks_restaurant   ON order_feedbacks(restaurant_id);
CREATE INDEX idx_feedbacks_order        ON order_feedbacks(order_id);
CREATE INDEX idx_feedbacks_rating       ON order_feedbacks(rating);
CREATE INDEX idx_feedbacks_sentimento   ON order_feedbacks(sentimento) WHERE sentimento IS NOT NULL;
CREATE INDEX idx_feedbacks_created      ON order_feedbacks(created_at DESC);

-- ── Trigger updated_at ────────────────────────────────
CREATE TRIGGER order_feedbacks_updated_at
  BEFORE UPDATE ON order_feedbacks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Único feedback por pedido ─────────────────────────
CREATE UNIQUE INDEX idx_feedbacks_unique_order ON order_feedbacks(order_id);

-- ── RLS ───────────────────────────────────────────────
ALTER TABLE order_feedbacks ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode inserir (link público pós-pedido, sem auth)
DROP POLICY IF EXISTS "feedbacks_insert_public" ON order_feedbacks;
CREATE POLICY "feedbacks_insert_public" ON order_feedbacks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Dono do restaurante pode ver seus feedbacks
DROP POLICY IF EXISTS "feedbacks_select_owner" ON order_feedbacks;
CREATE POLICY "feedbacks_select_owner" ON order_feedbacks
  FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

-- Admin service role pode tudo (via createAdminClient)
DROP POLICY IF EXISTS "feedbacks_admin_all" ON order_feedbacks;
CREATE POLICY "feedbacks_admin_all" ON order_feedbacks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Campo feedback_sent no orders ─────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS feedback_enviado BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS feedback_enviado_at TIMESTAMPTZ;
