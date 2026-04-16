-- =====================================================
-- 081: hardening de acesso da view financial_anomalies
--
-- Objetivo:
-- - restringir leitura de anomalias financeiras a service_role
-- - remover exposicao ampla para usuarios autenticados comuns
-- - preservar a view existente e seu contrato de leitura backend
--
-- Contexto:
-- - 072 criou a view com security_invoker e concedeu SELECT a authenticated
-- - o consumo identificado no codebase ocorre via admin client backend
-- - esta migration nao altera a view, apenas endurece o acesso
-- =====================================================

REVOKE ALL ON public.financial_anomalies FROM PUBLIC;
REVOKE SELECT ON public.financial_anomalies FROM authenticated;
GRANT SELECT ON public.financial_anomalies TO service_role;