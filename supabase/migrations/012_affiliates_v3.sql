-- =====================================================
-- AFILIADOS v3 — Sistema de 2 níveis sem pirâmide
--
-- Nível 1: Vendedor → 30% recorrente (quem vende ao restaurante)
-- Nível 2: Líder    → 10% da rede (quem recrutou o vendedor)
-- Empresa           → 60% sempre
--
-- Título "Líder Zairyx": 5+ vendedores ativos na rede
-- =====================================================

-- 1. Migra coluna tier para novo modelo (vendedor/lider)
ALTER TABLE affiliates
  DROP CONSTRAINT IF EXISTS affiliates_tier_check;
ALTER TABLE affiliates
  ALTER COLUMN tier SET DEFAULT 'vendedor';
ALTER TABLE affiliates
  ADD CONSTRAINT affiliates_tier_check
    CHECK (tier IN ('vendedor', 'lider'));
-- Garante que registros antigos usem o novo valor
UPDATE affiliates SET tier = 'vendedor' WHERE tier IN ('afiliado', 'parceiro');

-- 2. Link de hierarquia: quem recrutou este afiliado?
ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS lider_id UUID REFERENCES affiliates(id);
CREATE INDEX IF NOT EXISTS idx_affiliates_lider_id ON affiliates(lider_id);

-- 3. Comissão do líder por referral
ALTER TABLE affiliate_referrals
  ADD COLUMN IF NOT EXISTS lider_id UUID REFERENCES affiliates(id),
  ADD COLUMN IF NOT EXISTS lider_comissao DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS lider_status TEXT DEFAULT 'pendente'
    CHECK (lider_status IN ('pendente', 'aprovado', 'pago'));
CREATE INDEX IF NOT EXISTS idx_referrals_lider_id ON affiliate_referrals(lider_id);

-- 4. View de ranking com 2 níveis — substitui a de 011
DROP VIEW IF EXISTS affiliate_ranking;

CREATE OR REPLACE VIEW affiliate_ranking AS
WITH
  -- Comissões diretas (30%)
  direto AS (
    SELECT
      r.affiliate_id,
      COUNT(*)                        AS total_indicados,
      COALESCE(SUM(r.comissao), 0)    AS mrr_direto
    FROM affiliate_referrals r
    WHERE r.status IN ('pendente', 'aprovado')
    GROUP BY r.affiliate_id
  ),
  -- Comissões de rede (10%)
  rede AS (
    SELECT
      r.lider_id,
      COUNT(*)                             AS rede_indicados,
      COALESCE(SUM(r.lider_comissao), 0)  AS mrr_rede
    FROM affiliate_referrals r
    WHERE r.lider_id IS NOT NULL
      AND r.lider_status IN ('pendente', 'aprovado')
    GROUP BY r.lider_id
  ),
  -- Vendedores recrutados (para título Líder)
  recrutados AS (
    SELECT
      lider_id,
      COUNT(*) AS total_vendedores
    FROM affiliates
    WHERE lider_id IS NOT NULL AND status = 'ativo'
    GROUP BY lider_id
  )
SELECT
  a.id,
  -- Nome anonimizado: "João S."
  CASE
    WHEN position(' ' IN a.nome) > 0
    THEN split_part(a.nome, ' ', 1) || ' ' || left(split_part(a.nome, ' ', 2), 1) || '.'
    ELSE a.nome
  END                                                       AS nome_publico,
  COALESCE(rc.total_vendedores, 0)                         AS total_vendedores,
  COALESCE(rc.total_vendedores, 0) >= 5                    AS is_lider,
  COALESCE(d.total_indicados, 0)                           AS total_indicados,
  COALESCE(re.rede_indicados, 0)                           AS rede_indicados,
  COALESCE(d.mrr_direto, 0)                                AS mrr_direto,
  COALESCE(re.mrr_rede, 0)                                 AS mrr_rede,
  COALESCE(d.mrr_direto, 0) + COALESCE(re.mrr_rede, 0)    AS mrr_estimado,
  RANK() OVER (
    ORDER BY (COALESCE(d.mrr_direto, 0) + COALESCE(re.mrr_rede, 0)) DESC
  )                                                         AS posicao
FROM affiliates a
LEFT JOIN direto d    ON d.affiliate_id = a.id
LEFT JOIN rede re     ON re.lider_id    = a.id
LEFT JOIN recrutados rc ON rc.lider_id  = a.id
WHERE a.status = 'ativo';

GRANT SELECT ON affiliate_ranking TO anon, authenticated;
