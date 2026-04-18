-- Lock atômico por linha para finalização de pagamentos delivery.
-- Evita janela de corrida entre webhook e cron sem regravar metadata inteira.
CREATE OR REPLACE FUNCTION public.acquire_delivery_payment_lock(p_payment_id UUID) RETURNS SETOF public.delivery_payments LANGUAGE sql SECURITY DEFINER
SET search_path = public AS $$
UPDATE public.delivery_payments
SET metadata = jsonb_set(
        metadata,
        '{finalizing}',
        'true'::jsonb,
        false
    )
WHERE id = p_payment_id
    AND metadata IS NOT NULL
    AND metadata ? 'finalizing'
    AND metadata->>'finalizing' = 'false'
RETURNING *;
$$;
CREATE OR REPLACE FUNCTION public.release_delivery_payment_lock(p_payment_id UUID) RETURNS SETOF public.delivery_payments LANGUAGE sql SECURITY DEFINER
SET search_path = public AS $$
UPDATE public.delivery_payments
SET metadata = jsonb_set(
        metadata,
        '{finalizing}',
        'false'::jsonb,
        false
    )
WHERE id = p_payment_id
    AND metadata IS NOT NULL
    AND metadata ? 'finalizing'
    AND metadata->>'finalizing' = 'true'
RETURNING *;
$$;
GRANT EXECUTE ON FUNCTION public.acquire_delivery_payment_lock(UUID) TO authenticated,
    service_role;
GRANT EXECUTE ON FUNCTION public.release_delivery_payment_lock(UUID) TO authenticated,
    service_role;