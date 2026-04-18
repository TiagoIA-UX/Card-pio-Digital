-- ============================================================================
-- Migration 093: hardening de RLS em order_feedbacks (feedbacks_insert_public)
-- Objetivo: remover WITH CHECK (true) e exigir consistencia order_id/restaurant_id
-- ============================================================================
BEGIN;
DROP POLICY IF EXISTS "feedbacks_insert_public" ON public.order_feedbacks;
CREATE POLICY "feedbacks_insert_public" ON public.order_feedbacks FOR
INSERT TO anon,
    authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.orders o
            WHERE o.id = order_feedbacks.order_id
                AND o.restaurant_id = order_feedbacks.restaurant_id
        )
    );
COMMIT;