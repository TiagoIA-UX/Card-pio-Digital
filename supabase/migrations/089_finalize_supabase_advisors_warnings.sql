-- ============================================================================
-- Migration 089: Finalize Supabase Advisors warnings
-- - Resolve remaining multiple_permissive_policies
-- - Resolve auth_rls_initplan by avoiding per-row auth.* evaluation
-- ============================================================================
BEGIN;
-- --------------------------------------------------------------------------
-- A) Service policies (use role scoping + true predicate)
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "access_service_all" ON public.freelancer_access;
CREATE POLICY "access_service_all" ON public.freelancer_access FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "jobs_service_all" ON public.freelancer_jobs;
CREATE POLICY "jobs_service_all" ON public.freelancer_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "freelancers_service_all" ON public.freelancers;
CREATE POLICY "freelancers_service_all" ON public.freelancers FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "messages_service_all" ON public.support_messages;
CREATE POLICY "messages_service_all" ON public.support_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "tickets_service_all" ON public.support_tickets;
CREATE POLICY "tickets_service_all" ON public.support_tickets FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "bonuses_service_all" ON public.affiliate_bonuses;
CREATE POLICY "bonuses_service_all" ON public.affiliate_bonuses FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "penalties_service_all" ON public.affiliate_penalties;
CREATE POLICY "penalties_service_all" ON public.affiliate_penalties FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "referrals_service_all" ON public.affiliate_referrals;
CREATE POLICY "referrals_service_all" ON public.affiliate_referrals FOR ALL TO service_role USING (true) WITH CHECK (true);
-- --------------------------------------------------------------------------
-- B) support_tickets related select optimized
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "tickets_related_user_select" ON public.support_tickets;
CREATE POLICY "tickets_related_user_select" ON public.support_tickets FOR
SELECT USING (
        assigned_to = (
            select auth.uid()
        )
        OR opened_by = (
            select auth.uid()
        )
    );
-- --------------------------------------------------------------------------
-- C) cobrancas_pix + delivery_payments auth initplan optimization
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "cobrancas_pix_select_admin_or_owner" ON public.cobrancas_pix;
CREATE POLICY "cobrancas_pix_select_admin_or_owner" ON public.cobrancas_pix FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.admin_users au
            WHERE au.user_id = (
                    select auth.uid()
                )
                AND au.role = ANY (ARRAY ['admin'::text, 'owner'::text])
        )
        OR EXISTS (
            SELECT 1
            FROM public.restaurants r
            WHERE r.id = cobrancas_pix.restaurant_id
                AND r.user_id = (
                    select auth.uid()
                )
        )
    );
DROP POLICY IF EXISTS "delivery_payments_select_admin_or_owner" ON public.delivery_payments;
CREATE POLICY "delivery_payments_select_admin_or_owner" ON public.delivery_payments FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.admin_users au
            WHERE au.user_id = (
                    select auth.uid()
                )
                AND au.role = ANY (ARRAY ['admin'::text, 'owner'::text])
        )
        OR EXISTS (
            SELECT 1
            FROM public.restaurants r
            WHERE r.id = delivery_payments.restaurant_id
                AND r.user_id = (
                    select auth.uid()
                )
        )
    );
-- --------------------------------------------------------------------------
-- D) org_members manage policies optimized (same semantics)
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "org_members_manage_insert" ON public.org_members;
DROP POLICY IF EXISTS "org_members_manage_update" ON public.org_members;
DROP POLICY IF EXISTS "org_members_manage_delete" ON public.org_members;
CREATE POLICY "org_members_manage_insert" ON public.org_members FOR
INSERT TO authenticated WITH CHECK (
        (
            org_id IN (
                SELECT organizations.id
                FROM public.organizations
                WHERE organizations.owner_id = (
                        select auth.uid()
                    )
            )
        )
        OR (
            org_id IN (
                SELECT om.org_id
                FROM public.org_members om
                WHERE om.user_id = (
                        select auth.uid()
                    )
                    AND om.role = 'owner'
            )
        )
    );
CREATE POLICY "org_members_manage_update" ON public.org_members FOR
UPDATE TO authenticated USING (
        (
            org_id IN (
                SELECT organizations.id
                FROM public.organizations
                WHERE organizations.owner_id = (
                        select auth.uid()
                    )
            )
        )
        OR (
            org_id IN (
                SELECT om.org_id
                FROM public.org_members om
                WHERE om.user_id = (
                        select auth.uid()
                    )
                    AND om.role = 'owner'
            )
        )
    ) WITH CHECK (
        (
            org_id IN (
                SELECT organizations.id
                FROM public.organizations
                WHERE organizations.owner_id = (
                        select auth.uid()
                    )
            )
        )
        OR (
            org_id IN (
                SELECT om.org_id
                FROM public.org_members om
                WHERE om.user_id = (
                        select auth.uid()
                    )
                    AND om.role = 'owner'
            )
        )
    );
CREATE POLICY "org_members_manage_delete" ON public.org_members FOR DELETE TO authenticated USING (
    (
        org_id IN (
            SELECT organizations.id
            FROM public.organizations
            WHERE organizations.owner_id = (
                    select auth.uid()
                )
        )
    )
    OR (
        org_id IN (
            SELECT om.org_id
            FROM public.org_members om
            WHERE om.user_id = (
                    select auth.uid()
                )
                AND om.role = 'owner'
        )
    )
);
-- --------------------------------------------------------------------------
-- E) trial_events: keep semantics, optimize auth usage
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "trial_events_select_admin_or_own" ON public.trial_events;
DROP POLICY IF EXISTS "trial_events_admin_insert" ON public.trial_events;
DROP POLICY IF EXISTS "trial_events_admin_update" ON public.trial_events;
DROP POLICY IF EXISTS "trial_events_admin_delete" ON public.trial_events;
CREATE POLICY "trial_events_select_admin_or_own" ON public.trial_events FOR
SELECT USING (
        (
            select auth.uid()
        ) = user_id
        OR EXISTS (
            SELECT 1
            FROM public.admin_users au
            WHERE au.user_id = (
                    select auth.uid()
                )
        )
    );
CREATE POLICY "trial_events_admin_insert" ON public.trial_events FOR
INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.admin_users au
            WHERE au.user_id = (
                    select auth.uid()
                )
        )
    );
CREATE POLICY "trial_events_admin_update" ON public.trial_events FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.admin_users au
            WHERE au.user_id = (
                    select auth.uid()
                )
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.admin_users au
            WHERE au.user_id = (
                    select auth.uid()
                )
        )
    );
CREATE POLICY "trial_events_admin_delete" ON public.trial_events FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.admin_users au
        WHERE au.user_id = (
                select auth.uid()
            )
    )
);
-- --------------------------------------------------------------------------
-- F) affiliate_conversions: remove select overlap + optimize auth usage
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "aconv_admin" ON public.affiliate_conversions;
DROP POLICY IF EXISTS "aconv_own" ON public.affiliate_conversions;
CREATE POLICY "aconv_select_admin_or_own" ON public.affiliate_conversions FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.admin_users au
            WHERE au.user_id = (
                    select auth.uid()
                )
        )
        OR EXISTS (
            SELECT 1
            FROM public.affiliates a
            WHERE a.user_id = (
                    select auth.uid()
                )
                AND a.code = affiliate_conversions.aff_ref
        )
    );
CREATE POLICY "aconv_admin_insert" ON public.affiliate_conversions FOR
INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.admin_users au
            WHERE au.user_id = (
                    select auth.uid()
                )
        )
    );
CREATE POLICY "aconv_admin_update" ON public.affiliate_conversions FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.admin_users au
            WHERE au.user_id = (
                    select auth.uid()
                )
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.admin_users au
            WHERE au.user_id = (
                    select auth.uid()
                )
        )
    );
CREATE POLICY "aconv_admin_delete" ON public.affiliate_conversions FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.admin_users au
        WHERE au.user_id = (
                select auth.uid()
            )
    )
);
COMMIT;