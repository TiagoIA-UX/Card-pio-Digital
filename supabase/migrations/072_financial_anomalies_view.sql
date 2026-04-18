-- =====================================================
-- 072: financial_anomalies view
--
-- Fonte única de verdade para auditoria operacional do fluxo financeiro
-- de delivery payments. A view consolida anomalias em formato padronizado
-- para uso manual, painel, health check e automações futuras.
-- =====================================================
DROP VIEW IF EXISTS public.financial_anomalies;
CREATE VIEW public.financial_anomalies WITH (security_invoker = true) AS -- 1. Pagamento preso em finalização
SELECT 'PAYMENT_STUCK_FINALIZING'::text AS anomaly_type,
    'critical'::text AS severity,
    dp.id::text AS reference_id,
    dp.order_id,
    jsonb_build_object(
        'payment_status',
        dp.status,
        'finalizing',
        dp.metadata->>'finalizing',
        'updated_at',
        dp.updated_at,
        'created_at',
        dp.created_at
    ) AS details,
    NOW() AS detected_at
FROM public.delivery_payments dp
WHERE dp.metadata->>'finalizing' = 'true'
UNION ALL
-- 2. Pagamento aprovado com pedido inconsistente
SELECT 'APPROVED_PAYMENT_INCONSISTENT_ORDER'::text AS anomaly_type,
    'critical'::text AS severity,
    dp.id::text AS reference_id,
    dp.order_id,
    jsonb_build_object(
        'payment_status',
        dp.status,
        'order_status',
        o.status,
        'mp_payment_id',
        dp.mp_payment_id,
        'paid_at',
        dp.paid_at,
        'updated_at',
        dp.updated_at
    ) AS details,
    NOW() AS detected_at
FROM public.delivery_payments dp
    JOIN public.orders o ON o.id = dp.order_id
WHERE dp.status = 'approved'
    AND o.status <> 'confirmed'
UNION ALL
-- 3. Metadata financeira obrigatória ausente
SELECT 'MISSING_REQUIRED_METADATA'::text AS anomaly_type,
    'warning'::text AS severity,
    dp.id::text AS reference_id,
    dp.order_id,
    jsonb_build_object(
        'payment_status',
        dp.status,
        'mp_status',
        dp.metadata->>'mp_status',
        'finalize_source',
        dp.metadata->>'finalize_source',
        'finalize_last_run_at',
        dp.metadata->>'finalize_last_run_at',
        'metadata',
        dp.metadata
    ) AS details,
    NOW() AS detected_at
FROM public.delivery_payments dp
WHERE dp.status = 'approved'
    AND (
        dp.metadata->>'mp_status' IS NULL
        OR dp.metadata->>'finalize_source' IS NULL
        OR dp.metadata->>'finalize_last_run_at' IS NULL
    )
UNION ALL
-- 4. Status interno pendente, mas MP já aprovado
SELECT 'PENDING_BUT_MP_APPROVED'::text AS anomaly_type,
    'critical'::text AS severity,
    dp.id::text AS reference_id,
    dp.order_id,
    jsonb_build_object(
        'internal_status',
        dp.status,
        'mp_status',
        dp.metadata->>'mp_status',
        'updated_at',
        dp.updated_at
    ) AS details,
    NOW() AS detected_at
FROM public.delivery_payments dp
WHERE dp.status = 'pending'
    AND dp.metadata->>'mp_status' = 'approved'
UNION ALL
-- 5. Pagamento aprovado sem paid_at
SELECT 'APPROVED_WITHOUT_PAID_AT'::text AS anomaly_type,
    'critical'::text AS severity,
    dp.id::text AS reference_id,
    dp.order_id,
    jsonb_build_object(
        'payment_status',
        dp.status,
        'created_at',
        dp.created_at,
        'paid_at',
        dp.paid_at,
        'updated_at',
        dp.updated_at
    ) AS details,
    NOW() AS detected_at
FROM public.delivery_payments dp
WHERE dp.status = 'approved'
    AND dp.paid_at IS NULL
UNION ALL
-- 6. Inconsistência temporal de metadata e timestamps
SELECT 'TEMPORAL_METADATA_INCONSISTENCY'::text AS anomaly_type,
    'warning'::text AS severity,
    dp.id::text AS reference_id,
    dp.order_id,
    jsonb_build_object(
        'payment_status',
        dp.status,
        'created_at',
        dp.created_at,
        'paid_at',
        dp.paid_at,
        'finalize_last_run_at',
        dp.metadata->>'finalize_last_run_at',
        'updated_at',
        dp.updated_at
    ) AS details,
    NOW() AS detected_at
FROM public.delivery_payments dp
WHERE (
        dp.paid_at IS NOT NULL
        AND dp.paid_at < dp.created_at
    )
    OR (
        dp.metadata->>'finalize_last_run_at' IS NOT NULL
        AND NULLIF(dp.metadata->>'finalize_last_run_at', '')::timestamptz < dp.created_at
    )
UNION ALL
-- 7. Duplicidade lógica inesperada por order_id
SELECT 'DUPLICATE_ORDER_PAYMENT'::text AS anomaly_type,
    'critical'::text AS severity,
    dp.order_id::text AS reference_id,
    dp.order_id,
    jsonb_build_object(
        'total_registros',
        COUNT(*)::int,
        'primeiro_registro',
        MIN(dp.created_at),
        'ultimo_registro',
        MAX(dp.created_at)
    ) AS details,
    NOW() AS detected_at
FROM public.delivery_payments dp
GROUP BY dp.order_id
HAVING COUNT(*) > 1
UNION ALL
-- 8. Pagamento aprovado sem mp_payment_id
SELECT 'APPROVED_WITHOUT_MP_PAYMENT_ID'::text AS anomaly_type,
    'critical'::text AS severity,
    dp.id::text AS reference_id,
    dp.order_id,
    jsonb_build_object(
        'payment_status',
        dp.status,
        'mp_payment_id',
        dp.mp_payment_id,
        'mp_status',
        dp.metadata->>'mp_status',
        'updated_at',
        dp.updated_at
    ) AS details,
    NOW() AS detected_at
FROM public.delivery_payments dp
WHERE dp.status = 'approved'
    AND (
        dp.mp_payment_id IS NULL
        OR btrim(dp.mp_payment_id) = ''
    )
UNION ALL
-- 9. Pedido confirmado sem pagamento aprovado
SELECT 'CONFIRMED_ORDER_WITHOUT_APPROVED_PAYMENT'::text AS anomaly_type,
    'critical'::text AS severity,
    dp.id::text AS reference_id,
    dp.order_id,
    jsonb_build_object(
        'payment_status',
        dp.status,
        'order_status',
        o.status,
        'updated_at',
        dp.updated_at
    ) AS details,
    NOW() AS detected_at
FROM public.delivery_payments dp
    JOIN public.orders o ON o.id = dp.order_id
WHERE o.status = 'confirmed'
    AND dp.status <> 'approved';
COMMENT ON VIEW public.financial_anomalies IS 'View operacional de anomalias financeiras do fluxo de delivery payments';
GRANT SELECT ON public.financial_anomalies TO authenticated;