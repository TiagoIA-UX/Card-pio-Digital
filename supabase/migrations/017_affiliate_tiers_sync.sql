-- =====================================================
-- Migration 017 — Tiers hierárquicos reais em affiliates
--
-- Substitui o modelo binário (vendedor/lider) pelos 6 tiers
-- corporativos definidos em lib/affiliate-tiers.ts:
--   trainee → analista → coordenador → gerente → diretor → socio
--
-- Adiciona commission_rate para persistir o % real de cada afiliado.
-- =====================================================

-- 1. Remove constraint antiga para aceitar novos valores durante migração
ALTER TABLE affiliates DROP CONSTRAINT IF EXISTS affiliates_tier_check;

-- 2. Adiciona coluna commission_rate (% direto; base 30%, +2% diretor, +5% sócio)
ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) NOT NULL DEFAULT 30.00;

-- 3. Backfill tier baseado em total de restaurantes indicados (qualquer status)
UPDATE affiliates a
SET tier = CASE
  WHEN COALESCE(ref_counts.total, 0) >= 100 THEN 'socio'
  WHEN COALESCE(ref_counts.total, 0) >= 50  THEN 'diretor'
  WHEN COALESCE(ref_counts.total, 0) >= 25  THEN 'gerente'
  WHEN COALESCE(ref_counts.total, 0) >= 10  THEN 'coordenador'
  WHEN COALESCE(ref_counts.total, 0) >= 3   THEN 'analista'
  ELSE 'trainee'
END
FROM (
  SELECT affiliate_id, COUNT(*) AS total
  FROM affiliate_referrals
  WHERE status IN ('pendente', 'aprovado', 'pago')
  GROUP BY affiliate_id
) ref_counts
WHERE a.id = ref_counts.affiliate_id;

-- Afiliados sem indicações com tier legado ('vendedor'/'lider') → trainee
UPDATE affiliates
  SET tier = 'trainee'
  WHERE tier IN ('vendedor', 'lider');

-- 4. Adiciona nova constraint com os 6 slugs corporativos
ALTER TABLE affiliates
  ADD CONSTRAINT affiliates_tier_check
    CHECK (tier IN ('trainee', 'analista', 'coordenador', 'gerente', 'diretor', 'socio'));

-- 5. Padrão correto
ALTER TABLE affiliates ALTER COLUMN tier SET DEFAULT 'trainee';

-- 6. Backfill commission_rate baseado no tier
UPDATE affiliates
SET commission_rate = CASE tier
  WHEN 'socio'   THEN 35.00
  WHEN 'diretor' THEN 32.00
  ELSE 30.00
END;

-- 7. Índice para consultas por tier
CREATE INDEX IF NOT EXISTS idx_affiliates_tier ON affiliates(tier);

COMMENT ON COLUMN affiliates.tier IS
  'Tier de carreira: trainee→analista→coordenador→gerente→diretor→socio. '
  'FONTE DA VERDADE: lib/affiliate-tiers.ts';

COMMENT ON COLUMN affiliates.commission_rate IS
  'Percentual de comissão direta (ex: 30.00, 32.00, 35.00). '
  'Atualizado automaticamente a cada nova indicação registrada.';
