-- ============================================================================
-- Migration 092: auth_rls_initplan (orders, order_feedbacks, activation_events)
-- Regra: somente refatoracao de expressao auth.* -> (select auth.*)
-- ============================================================================
BEGIN;
-- activation_events
ALTER POLICY "Usuários criam próprios eventos" ON public.activation_events WITH CHECK (
    (
        select auth.uid()
    ) = user_id
);
ALTER POLICY "activation_events_select_own" ON public.activation_events USING (
    (
        select auth.uid()
    ) = user_id
);
-- order_feedbacks
ALTER POLICY "feedbacks_select_owner" ON public.order_feedbacks USING (
    restaurant_id IN (
        SELECT r.id
        FROM public.restaurants r
        WHERE r.user_id = (
                select auth.uid()
            )
    )
);
-- orders
ALTER POLICY "Dono pode ver pedidos do restaurante" ON public.orders USING (
    EXISTS (
        SELECT 1
        FROM public.restaurants r
        WHERE r.id = orders.restaurant_id
            AND r.user_id = (
                select auth.uid()
            )
    )
);
ALTER POLICY "Dono pode atualizar pedidos" ON public.orders USING (
    EXISTS (
        SELECT 1
        FROM public.restaurants r
        WHERE r.id = orders.restaurant_id
            AND r.user_id = (
                select auth.uid()
            )
    )
);
COMMIT;