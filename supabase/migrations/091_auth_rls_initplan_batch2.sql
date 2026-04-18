-- ============================================================================
-- Migration 091: auth_rls_initplan (batch 2)
-- Escopo: profiles, organizations, affiliates/affiliate_*, mass_promotions, ops_incidents
-- Regra: somente refatoracao de expressao (sem mudanca de semantica de acesso)
-- ============================================================================
BEGIN;
-- --------------------------------------------------------------------------
-- profiles
-- --------------------------------------------------------------------------
ALTER POLICY "profiles_insert" ON public.profiles WITH CHECK (
    (
        select auth.uid()
    ) = id
);
ALTER POLICY "profiles_update" ON public.profiles USING (
    (
        select auth.uid()
    ) = id
);
-- --------------------------------------------------------------------------
-- organizations
-- --------------------------------------------------------------------------
ALTER POLICY "org_insert_owner" ON public.organizations WITH CHECK (
    owner_id = (
        select auth.uid()
    )
);
ALTER POLICY "org_select_owner" ON public.organizations USING (
    owner_id = (
        select auth.uid()
    )
);
ALTER POLICY "org_update_owner" ON public.organizations USING (
    owner_id = (
        select auth.uid()
    )
) WITH CHECK (
    owner_id = (
        select auth.uid()
    )
);
-- --------------------------------------------------------------------------
-- affiliates and affiliate_*
-- --------------------------------------------------------------------------
ALTER POLICY "affiliates_service_all" ON public.affiliates USING (
    (
        select auth.role()
    ) = 'service_role'::text
);
ALTER POLICY "afiliado_insert_own" ON public.affiliates WITH CHECK (
    user_id = (
        select auth.uid()
    )
);
ALTER POLICY "afiliado_select_own" ON public.affiliates USING (
    user_id = (
        select auth.uid()
    )
);
ALTER POLICY "afiliado_update_own" ON public.affiliates USING (
    user_id = (
        select auth.uid()
    )
) WITH CHECK (
    user_id = (
        select auth.uid()
    )
);
ALTER POLICY "bonus_select_own" ON public.affiliate_bonuses USING (
    affiliate_id IN (
        SELECT a.id
        FROM public.affiliates a
        WHERE a.user_id = (
                select auth.uid()
            )
    )
);
ALTER POLICY "acp_select_own" ON public.affiliate_commission_payments USING (
    affiliate_id IN (
        SELECT a.id
        FROM public.affiliates a
        WHERE a.user_id = (
                select auth.uid()
            )
    )
);
ALTER POLICY "penalties_affiliate_own" ON public.affiliate_penalties USING (
    affiliate_id IN (
        SELECT a.id
        FROM public.affiliates a
        WHERE a.user_id = (
                select auth.uid()
            )
    )
);
ALTER POLICY "referral_select_own" ON public.affiliate_referrals USING (
    affiliate_id IN (
        SELECT a.id
        FROM public.affiliates a
        WHERE a.user_id = (
                select auth.uid()
            )
    )
);
-- --------------------------------------------------------------------------
-- mass_promotions
-- --------------------------------------------------------------------------
ALTER POLICY "promo_insert_org_owner" ON public.mass_promotions WITH CHECK (
    organization_id IN (
        SELECT o.id
        FROM public.organizations o
        WHERE o.owner_id = (
                select auth.uid()
            )
    )
);
ALTER POLICY "promo_select_org_owner" ON public.mass_promotions USING (
    organization_id IN (
        SELECT o.id
        FROM public.organizations o
        WHERE o.owner_id = (
                select auth.uid()
            )
    )
);
ALTER POLICY "promo_update_org_owner" ON public.mass_promotions USING (
    organization_id IN (
        SELECT o.id
        FROM public.organizations o
        WHERE o.owner_id = (
                select auth.uid()
            )
    )
);
-- --------------------------------------------------------------------------
-- ops_incidents
-- --------------------------------------------------------------------------
ALTER POLICY "Admins can read ops incidents" ON public.ops_incidents USING (
    EXISTS (
        SELECT 1
        FROM public.admin_users au
        WHERE au.user_id = (
                select auth.uid()
            )
    )
);
ALTER POLICY "Admins can update ops incidents" ON public.ops_incidents USING (
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
COMMIT;