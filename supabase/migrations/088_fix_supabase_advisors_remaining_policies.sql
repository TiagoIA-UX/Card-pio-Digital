-- ============================================================================
-- Migration 088: Fix remaining Supabase Advisors warnings (multiple permissive policies)
-- Estrategia:
-- 1) Restringir policies *_service_all para TO service_role (mesma semantica efetiva)
-- 2) Eliminar conflitos de SELECT em org_members e trial_events sem reduzir permissoes
-- ============================================================================
BEGIN;
-- --------------------------------------------------------------------------
-- 1) service_all policies: role scope correto
-- --------------------------------------------------------------------------
ALTER POLICY "affiliates_service_all" ON public.affiliates TO service_role;
ALTER POLICY "access_service_all" ON public.freelancer_access TO service_role;
ALTER POLICY "jobs_service_all" ON public.freelancer_jobs TO service_role;
ALTER POLICY "freelancers_service_all" ON public.freelancers TO service_role;
ALTER POLICY "messages_service_all" ON public.support_messages TO service_role;
ALTER POLICY "tickets_service_all" ON public.support_tickets TO service_role;
-- --------------------------------------------------------------------------
-- 2) org_members: remover sobreposicao de SELECT
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "org_members_manage" ON public.org_members;
CREATE POLICY "org_members_manage_insert" ON public.org_members FOR
INSERT TO authenticated WITH CHECK (
        (
            org_id IN (
                SELECT organizations.id
                FROM public.organizations
                WHERE organizations.owner_id = auth.uid()
            )
        )
        OR (
            org_id IN (
                SELECT om.org_id
                FROM public.org_members om
                WHERE om.user_id = auth.uid()
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
                WHERE organizations.owner_id = auth.uid()
            )
        )
        OR (
            org_id IN (
                SELECT om.org_id
                FROM public.org_members om
                WHERE om.user_id = auth.uid()
                    AND om.role = 'owner'
            )
        )
    ) WITH CHECK (
        (
            org_id IN (
                SELECT organizations.id
                FROM public.organizations
                WHERE organizations.owner_id = auth.uid()
            )
        )
        OR (
            org_id IN (
                SELECT om.org_id
                FROM public.org_members om
                WHERE om.user_id = auth.uid()
                    AND om.role = 'owner'
            )
        )
    );
CREATE POLICY "org_members_manage_delete" ON public.org_members FOR DELETE TO authenticated USING (
    (
        org_id IN (
            SELECT organizations.id
            FROM public.organizations
            WHERE organizations.owner_id = auth.uid()
        )
    )
    OR (
        org_id IN (
            SELECT om.org_id
            FROM public.org_members om
            WHERE om.user_id = auth.uid()
                AND om.role = 'owner'
        )
    )
);
-- --------------------------------------------------------------------------
-- 3) trial_events: consolidar SELECT e separar escrita admin
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "trial_events_admin" ON public.trial_events;
DROP POLICY IF EXISTS "trial_events_own" ON public.trial_events;
CREATE POLICY "trial_events_select_admin_or_own" ON public.trial_events FOR
SELECT USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1
            FROM public.admin_users au
            WHERE au.user_id = auth.uid()
        )
    );
CREATE POLICY "trial_events_admin_insert" ON public.trial_events FOR
INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.admin_users au
            WHERE au.user_id = auth.uid()
        )
    );
CREATE POLICY "trial_events_admin_update" ON public.trial_events FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.admin_users au
            WHERE au.user_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.admin_users au
            WHERE au.user_id = auth.uid()
        )
    );
CREATE POLICY "trial_events_admin_delete" ON public.trial_events FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.admin_users au
        WHERE au.user_id = auth.uid()
    )
);
COMMIT;