-- =====================================================
-- 074: Guard rail de idempotência para affiliate_referrals
--
-- Objetivo:
-- - evitar comissão duplicada para o mesmo tenant no mesmo mês
-- - manter compatibilidade com o modelo atual baseado em referencia_mes
-- - não alterar migrations antigas nem contratos existentes
--
-- Observação:
-- - se existir duplicidade histórica por (tenant_id, referencia_mes),
--   esta migration vai falhar na criação do índice único.
-- - rode antes o script scripts/audit-affiliate-referrals-idempotency.ts
--   para validar o ambiente alvo.
-- =====================================================
-- Backfill defensivo para linhas antigas sem referência de mês.
UPDATE public.affiliate_referrals
SET referencia_mes = to_char(created_at, 'YYYY-MM')
WHERE tenant_id IS NOT NULL
    AND referencia_mes IS NULL;
-- Trava estrutural: uma comissão por tenant por mês.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_affiliate_referrals_tenant_month ON public.affiliate_referrals (tenant_id, referencia_mes)
WHERE tenant_id IS NOT NULL;
COMMENT ON INDEX public.uniq_affiliate_referrals_tenant_month IS 'Guarda de idempotência para impedir mais de uma affiliate_referral por tenant no mesmo mês de referência.';