-- ============================================================================
-- Migration 087: Fix Supabase Advisors WARNs (multiple permissive policies + duplicate index)
-- Objetivo: reduzir overhead de RLS sem alterar semantica de acesso existente.
-- ============================================================================
BEGIN;
-- --------------------------------------------------------------------------
-- 1) Duplicate Index (organizations.slug)
-- Mantemos organizations_slug_key (constraint index) e removemos indice duplicado.
-- --------------------------------------------------------------------------
DROP INDEX IF EXISTS public.idx_organizations_slug;
-- --------------------------------------------------------------------------
-- 2) activation_events: duas policies SELECT equivalentes
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Owners can view own activation events" ON public.activation_events;
DROP POLICY IF EXISTS "Usuários veem próprios eventos" ON public.activation_events;
CREATE POLICY "activation_events_select_own" ON public.activation_events FOR
SELECT USING (auth.uid() = user_id);
-- --------------------------------------------------------------------------
-- 3) products: unifica owner + public active em uma unica SELECT policy
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Dono pode ver todos seus produtos" ON public.products;
DROP POLICY IF EXISTS "Produtos de restaurantes ativos são visíveis" ON public.products;
CREATE POLICY "products_select_owner_or_active" ON public.products FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.restaurants
            WHERE restaurants.id = products.restaurant_id
                AND restaurants.user_id = auth.uid()
        )
        OR (
            products.ativo = true
            AND EXISTS (
                SELECT 1
                FROM public.restaurants
                WHERE restaurants.id = products.restaurant_id
                    AND restaurants.ativo = true
            )
        )
    );
-- --------------------------------------------------------------------------
-- 4) restaurants: unifica owner + public active em uma unica SELECT policy
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Dono pode ver seu restaurante" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurantes públicos são visíveis" ON public.restaurants;
CREATE POLICY "restaurants_select_owner_or_active" ON public.restaurants FOR
SELECT USING (
        auth.uid() = user_id
        OR ativo = true
    );
-- --------------------------------------------------------------------------
-- 5) support_messages: unifica customer + affiliate em uma unica SELECT policy
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "messages_affiliate_own" ON public.support_messages;
DROP POLICY IF EXISTS "messages_customer_own" ON public.support_messages;
CREATE POLICY "messages_related_ticket_select" ON public.support_messages FOR
SELECT USING (
        ticket_id IN (
            SELECT st.id
            FROM public.support_tickets st
            WHERE st.assigned_to = auth.uid()
                OR st.opened_by = auth.uid()
        )
    );
-- --------------------------------------------------------------------------
-- 6) support_tickets: unifica customer + affiliate em uma unica SELECT policy
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "tickets_affiliate_own" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_customer_own" ON public.support_tickets;
CREATE POLICY "tickets_related_user_select" ON public.support_tickets FOR
SELECT USING (
        assigned_to = auth.uid()
        OR opened_by = auth.uid()
    );
-- --------------------------------------------------------------------------
-- 7) cobrancas_pix: unifica admin + owner em uma unica SELECT policy
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin cobrancas_pix select" ON public.cobrancas_pix;
DROP POLICY IF EXISTS "Owner cobrancas_pix select" ON public.cobrancas_pix;
CREATE POLICY "cobrancas_pix_select_admin_or_owner" ON public.cobrancas_pix FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.admin_users au
            WHERE au.user_id = auth.uid()
                AND au.role = ANY (ARRAY ['admin'::text, 'owner'::text])
        )
        OR EXISTS (
            SELECT 1
            FROM public.restaurants r
            WHERE r.id = cobrancas_pix.restaurant_id
                AND r.user_id = auth.uid()
        )
    );
-- --------------------------------------------------------------------------
-- 8) delivery_payments: unifica admin + owner em uma unica SELECT policy
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin delivery_payments select" ON public.delivery_payments;
DROP POLICY IF EXISTS "Owner delivery_payments select" ON public.delivery_payments;
CREATE POLICY "delivery_payments_select_admin_or_owner" ON public.delivery_payments FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.admin_users au
            WHERE au.user_id = auth.uid()
                AND au.role = ANY (ARRAY ['admin'::text, 'owner'::text])
        )
        OR EXISTS (
            SELECT 1
            FROM public.restaurants r
            WHERE r.id = delivery_payments.restaurant_id
                AND r.user_id = auth.uid()
        )
    );
COMMIT;