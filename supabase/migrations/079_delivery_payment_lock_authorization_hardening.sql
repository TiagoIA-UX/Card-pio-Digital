-- =====================================================
-- 079: hardening de autorizacao para locks de delivery_payments
--
-- Objetivo:
-- - preservar o contrato compativel das RPCs de lock financeiro
-- - restringir execucao para service_role apenas
-- - impedir uso por usuarios autenticados comuns
--
-- Contexto:
-- - 071 introduziu as funcoes de lock com SECURITY DEFINER
-- - 073 ajustou o shape de retorno para compatibilidade com a app
-- - esta migration nao reescreve historico: aplica o shape compativel
--   e endurece a autorizacao em uma nova etapa idempotente
-- =====================================================

CREATE OR REPLACE FUNCTION public.acquire_delivery_payment_lock(p_payment_id UUID) RETURNS TABLE (
        id UUID,
        restaurant_id UUID,
        order_id UUID,
        amount NUMERIC,
        status TEXT,
        mp_preference_id TEXT,
        mp_payment_id TEXT,
        payment_method_used TEXT,
        paid_at TIMESTAMPTZ,
        whatsapp_sent BOOLEAN,
        metadata JSONB
    ) LANGUAGE sql SECURITY DEFINER
SET search_path = public AS $$
UPDATE public.delivery_payments
SET metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{finalizing}',
        'true'::jsonb,
        true
    )
WHERE id = p_payment_id
    AND COALESCE(metadata->>'finalizing', 'false') <> 'true'
RETURNING delivery_payments.id,
    delivery_payments.restaurant_id,
    delivery_payments.order_id,
    delivery_payments.amount,
    delivery_payments.status,
    delivery_payments.mp_preference_id,
    delivery_payments.mp_payment_id,
    delivery_payments.payment_method_used,
    delivery_payments.paid_at,
    delivery_payments.whatsapp_sent,
    delivery_payments.metadata;
$$;

CREATE OR REPLACE FUNCTION public.release_delivery_payment_lock(p_payment_id UUID) RETURNS TABLE (
        id UUID,
        restaurant_id UUID,
        order_id UUID,
        amount NUMERIC,
        status TEXT,
        mp_preference_id TEXT,
        mp_payment_id TEXT,
        payment_method_used TEXT,
        paid_at TIMESTAMPTZ,
        whatsapp_sent BOOLEAN,
        metadata JSONB
    ) LANGUAGE sql SECURITY DEFINER
SET search_path = public AS $$
UPDATE public.delivery_payments
SET metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{finalizing}',
        'false'::jsonb,
        true
    )
WHERE id = p_payment_id
RETURNING delivery_payments.id,
    delivery_payments.restaurant_id,
    delivery_payments.order_id,
    delivery_payments.amount,
    delivery_payments.status,
    delivery_payments.mp_preference_id,
    delivery_payments.mp_payment_id,
    delivery_payments.payment_method_used,
    delivery_payments.paid_at,
    delivery_payments.whatsapp_sent,
    delivery_payments.metadata;
$$;

REVOKE ALL ON FUNCTION public.acquire_delivery_payment_lock(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_delivery_payment_lock(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.acquire_delivery_payment_lock(UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.release_delivery_payment_lock(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_delivery_payment_lock(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_delivery_payment_lock(UUID) TO service_role;

COMMENT ON FUNCTION public.acquire_delivery_payment_lock(UUID) IS 'Lock financeiro de delivery_payments restrito a service_role.';
COMMENT ON FUNCTION public.release_delivery_payment_lock(UUID) IS 'Unlock financeiro de delivery_payments restrito a service_role.';