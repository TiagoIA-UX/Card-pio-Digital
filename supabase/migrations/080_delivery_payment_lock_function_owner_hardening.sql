-- =====================================================
-- 080: hardening de owner das funcoes de lock financeiro
--
-- Objetivo:
-- - explicitar owner seguro para as funcoes SECURITY DEFINER
-- - evitar dependencia implicita do estado do banco na execucao
-- - complementar o hardening de autorizacao da migration 079
--
-- Estrategia:
-- - preferir owner postgres quando a role existir
-- - fallback para supabase_admin quando essa for a role disponivel
-- - manter comportamento idempotente e sem alterar assinatura das funcoes
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
        EXECUTE 'ALTER FUNCTION public.acquire_delivery_payment_lock(UUID) OWNER TO postgres';
        EXECUTE 'ALTER FUNCTION public.release_delivery_payment_lock(UUID) OWNER TO postgres';
    ELSIF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
        EXECUTE 'ALTER FUNCTION public.acquire_delivery_payment_lock(UUID) OWNER TO supabase_admin';
        EXECUTE 'ALTER FUNCTION public.release_delivery_payment_lock(UUID) OWNER TO supabase_admin';
    END IF;
END;
$$;

COMMENT ON FUNCTION public.acquire_delivery_payment_lock(UUID) IS 'Lock financeiro de delivery_payments com owner seguro e execucao restrita a service_role.';
COMMENT ON FUNCTION public.release_delivery_payment_lock(UUID) IS 'Unlock financeiro de delivery_payments com owner seguro e execucao restrita a service_role.';