-- Compatibilidade para as RPCs de lock financeiro de delivery payments.
-- Não altera a migration 071 existente; recria as funções com assinatura
-- compatível com o executor SQL do Supabase Management API.
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
GRANT EXECUTE ON FUNCTION public.acquire_delivery_payment_lock(UUID) TO authenticated,
    service_role;
GRANT EXECUTE ON FUNCTION public.release_delivery_payment_lock(UUID) TO authenticated,
    service_role;