-- =====================================================
-- AFILIADOS v4 — avatar_url + cidade/estado
-- Permite mostrar foto de perfil e mapa por cidade
-- =====================================================

-- 1. Adiciona campos de perfil ao afiliado
ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS avatar_url  TEXT,
  ADD COLUMN IF NOT EXISTS cidade      TEXT,
  ADD COLUMN IF NOT EXISTS estado      TEXT,
  ADD COLUMN IF NOT EXISTS bio         TEXT;

-- Índice para consultas de mapa por estado/cidade
CREATE INDEX IF NOT EXISTS idx_affiliates_estado  ON affiliates(estado) WHERE status = 'ativo';
CREATE INDEX IF NOT EXISTS idx_affiliates_cidade  ON affiliates(cidade) WHERE status = 'ativo';

-- 2. Recria a view affiliate_ranking incluindo avatar_url e localização
DROP VIEW IF EXISTS affiliate_ranking;

CREATE OR REPLACE VIEW affiliate_ranking AS
WITH
  direto AS (
    SELECT
      r.affiliate_id,
      COUNT(*)                        AS total_indicados,
      COALESCE(SUM(r.comissao), 0)    AS mrr_direto
    FROM affiliate_referrals r
    WHERE r.status IN ('pendente', 'aprovado')
    GROUP BY r.affiliate_id
  ),
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
  a.avatar_url,
  a.cidade,
  a.estado,
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
LEFT JOIN direto d      ON d.affiliate_id = a.id
LEFT JOIN rede re       ON re.lider_id    = a.id
LEFT JOIN recrutados rc ON rc.lider_id    = a.id
WHERE a.status = 'ativo';

GRANT SELECT ON affiliate_ranking TO anon, authenticated;

-- 3. View pública de afiliados por cidade (para a página /afiliados/mapa)
CREATE OR REPLACE VIEW affiliate_city_map AS
SELECT
  COALESCE(a.estado, 'Não informado')  AS estado,
  COALESCE(a.cidade, 'Não informado')  AS cidade,
  COUNT(DISTINCT a.id)                 AS total_afiliados,
  COUNT(DISTINCT r.tenant_id)          AS total_restaurantes
FROM affiliates a
LEFT JOIN affiliate_referrals r
  ON r.affiliate_id = a.id
  AND r.status IN ('aprovado', 'pago')
WHERE a.status = 'ativo'
GROUP BY a.estado, a.cidade
ORDER BY total_restaurantes DESC, total_afiliados DESC;

GRANT SELECT ON affiliate_city_map TO anon, authenticated;
