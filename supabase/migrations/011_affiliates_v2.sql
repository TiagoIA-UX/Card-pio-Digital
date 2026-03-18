-- =====================================================
-- AFILIADOS v2 — Tier único (sem empilhamento), 
-- Bônus por volume, Ranking público
-- =====================================================

-- 1. Adicionar campo tier em affiliates
--    'afiliado'  → 30% recorrente
--    'parceiro'  → 40% recorrente (nunca acumulam)
ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'afiliado'
    CHECK (tier IN ('afiliado', 'parceiro'));

-- 2. Tabela de bônus por volume
CREATE TABLE IF NOT EXISTS affiliate_bonuses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id    UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  nivel           INTEGER NOT NULL,          -- 10, 30, 50 restaurantes
  valor_bonus     DECIMAL(10,2) NOT NULL,    -- 200, 500, 1000
  status          TEXT NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente', 'pago')),
  referencia_mes  TEXT NOT NULL,             -- '2026-03'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bonuses_affiliate_id_idx ON affiliate_bonuses(affiliate_id);

-- RLS para bonuses
ALTER TABLE affiliate_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bonus_select_own" ON affiliate_bonuses
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY "bonuses_service_all" ON affiliate_bonuses
  FOR ALL USING (auth.role() = 'service_role');

-- 3. View de ranking público (sem dados pessoais sensíveis)
--    Ordena por total de restaurantes indicados ativos
CREATE OR REPLACE VIEW affiliate_ranking AS
SELECT
  a.id,
  -- Primeiro nome + inicial do sobrenome (ex: "João S.")
  CASE
    WHEN position(' ' IN a.nome) > 0
    THEN split_part(a.nome, ' ', 1) || ' ' || left(split_part(a.nome, ' ', 2), 1) || '.'
    ELSE a.nome
  END AS nome_publico,
  a.tier,
  COUNT(r.id)                   AS total_indicados,
  COALESCE(SUM(r.comissao), 0)  AS mrr_estimado,
  RANK() OVER (
    ORDER BY COUNT(r.id) DESC, COALESCE(SUM(r.comissao), 0) DESC
  )                             AS posicao
FROM affiliates a
LEFT JOIN affiliate_referrals r
  ON r.affiliate_id = a.id
 AND r.status IN ('pendente', 'aprovado')
WHERE a.status = 'ativo'
GROUP BY a.id, a.nome, a.tier;

-- View acessível para todos (apenas dados públicos)
GRANT SELECT ON affiliate_ranking TO anon, authenticated;
