-- =====================================================
-- 076: Guard rail de idempotência para affiliate_commission_payments
--
-- Objetivo:
-- - impedir pagamento duplicado de comissão por afiliado/mês de referência
-- - transformar corrida de aplicação em conflito estrutural controlado
-- - manter compatibilidade com pagamentos históricos sem referencia_mes
--
-- Observação:
-- - se existir duplicidade histórica em (affiliate_id, referencia_mes),
--   a criação do índice falhará até a deduplicação prévia.
-- =====================================================
CREATE UNIQUE INDEX IF NOT EXISTS uniq_affiliate_commission_payments_affiliate_month ON public.affiliate_commission_payments (affiliate_id, referencia_mes)
WHERE referencia_mes IS NOT NULL;
COMMENT ON INDEX public.uniq_affiliate_commission_payments_affiliate_month IS 'Guarda de idempotência para impedir mais de um pagamento de comissão por afiliado e mês de referência';