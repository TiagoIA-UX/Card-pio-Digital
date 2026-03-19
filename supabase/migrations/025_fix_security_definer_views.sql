-- =====================================================
-- 025: Fix SECURITY DEFINER views → SECURITY INVOKER
--
-- O Supabase Linter alerta que views com SECURITY DEFINER
-- ignoram RLS do usuário que faz a query. Corrigimos para
-- SECURITY INVOKER, onde as policies do caller são respeitadas.
--
-- Views afetadas:
--   1. affiliate_ranking   (pública, SELECT para anon/auth)
--   2. affiliate_city_map  (pública, SELECT para anon/auth)
--   3. affiliate_balances  (admin, SELECT para authenticated)
--   4. bonus_fund_saldo    (admin, SELECT via service_role)
-- =====================================================

-- 1. affiliate_ranking
DROP VIEW IF EXISTS affiliate_ranking;

CREATE VIEW affiliate_ranking
WITH (security_invoker = true)
AS
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


-- 2. affiliate_city_map
DROP VIEW IF EXISTS affiliate_city_map;

CREATE VIEW affiliate_city_map
WITH (security_invoker = true)
AS
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


-- 3. affiliate_balances
DROP VIEW IF EXISTS affiliate_balances;

CREATE VIEW affiliate_balances
WITH (security_invoker = true)
AS
SELECT
  a.id,
  a.nome,
  a.code,
  a.chave_pix,
  a.cidade,
  a.estado,
  a.status,
  COALESCE(
    (SELECT SUM(r.comissao)
       FROM affiliate_referrals r
      WHERE r.affiliate_id = a.id AND r.status = 'aprovado'), 0
  ) +
  COALESCE(
    (SELECT SUM(r.lider_comissao)
       FROM affiliate_referrals r
      WHERE r.lider_id = a.id AND r.lider_status = 'aprovado'), 0
  ) AS saldo_aprovado,
  COALESCE(
    (SELECT SUM(p.valor)
       FROM affiliate_commission_payments p
      WHERE p.affiliate_id = a.id), 0
  ) AS total_pago,
  (SELECT MAX(p.created_at)
     FROM affiliate_commission_payments p
    WHERE p.affiliate_id = a.id) AS ultimo_pagamento
FROM affiliates a
WHERE a.status = 'ativo';

GRANT SELECT ON affiliate_balances TO authenticated;


-- 4. bonus_fund_saldo
DROP VIEW IF EXISTS bonus_fund_saldo;

CREATE VIEW bonus_fund_saldo
WITH (security_invoker = true)
AS
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

-- Sem GRANT para bonus_fund_saldo: acessível apenas via service_role (admin API)
