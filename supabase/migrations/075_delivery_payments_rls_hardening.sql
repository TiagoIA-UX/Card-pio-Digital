-- =====================================================
-- 075: Hardening de RLS para delivery_payments
--
-- Objetivo:
-- - remover a policy permissiva "System delivery_payments admin"
-- - restringir escrita sistêmica à role service_role
-- - preservar leitura já existente para admin/owner autenticado
--
-- Contexto:
-- - a migration 042 criou uma policy FOR ALL USING (true),
--   que é funcional para webhook/cron, mas excessivamente permissiva
--   para padrões atuais de auditoria do platform monitor.
-- - esta migration não altera contratos nem a semântica de leitura.
-- =====================================================
ALTER TABLE public.delivery_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "System delivery_payments admin" ON public.delivery_payments;
CREATE POLICY "System delivery_payments admin" ON public.delivery_payments FOR ALL TO service_role USING (true) WITH CHECK (true);
COMMENT ON POLICY "System delivery_payments admin" ON public.delivery_payments IS 'Permite operacoes sistemicas apenas para service_role em delivery_payments.';