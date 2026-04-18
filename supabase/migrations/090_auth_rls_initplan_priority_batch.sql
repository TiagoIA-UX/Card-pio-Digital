-- ============================================================================
-- Migration 090: auth_rls_initplan (priority batch)
-- Escopo: restaurants, products, freelancers, org_members
-- Regra: sem alterar logica de acesso, apenas otimiza avaliacao de auth.*
-- ============================================================================
BEGIN;
-- --------------------------------------------------------------------------
-- freelancers
-- --------------------------------------------------------------------------
ALTER POLICY "freelancer_select_own" ON public.freelancers USING (
    user_id = (
        select auth.uid()
    )
);
-- --------------------------------------------------------------------------
-- org_members
-- --------------------------------------------------------------------------
ALTER POLICY "org_members_select" ON public.org_members USING (
    (
        user_id = (
            select auth.uid()
        )
    )
    OR (
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
                AND om.role = ANY (ARRAY ['owner'::text, 'admin'::text])
        )
    )
);
-- --------------------------------------------------------------------------
-- products
-- --------------------------------------------------------------------------
ALTER POLICY "Dono pode criar produtos" ON public.products WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.restaurants
        WHERE restaurants.id = products.restaurant_id
            AND restaurants.user_id = (
                select auth.uid()
            )
    )
);
ALTER POLICY "Dono pode editar produtos" ON public.products USING (
    EXISTS (
        SELECT 1
        FROM public.restaurants
        WHERE restaurants.id = products.restaurant_id
            AND restaurants.user_id = (
                select auth.uid()
            )
    )
);
ALTER POLICY "Dono pode deletar produtos" ON public.products USING (
    EXISTS (
        SELECT 1
        FROM public.restaurants
        WHERE restaurants.id = products.restaurant_id
            AND restaurants.user_id = (
                select auth.uid()
            )
    )
);
ALTER POLICY "products_select_owner_or_active" ON public.products USING (
    EXISTS (
        SELECT 1
        FROM public.restaurants
        WHERE restaurants.id = products.restaurant_id
            AND restaurants.user_id = (
                select auth.uid()
            )
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
-- restaurants
-- --------------------------------------------------------------------------
ALTER POLICY "Usuário autenticado pode criar restaurante" ON public.restaurants WITH CHECK (
    (
        select auth.uid()
    ) = user_id
);
ALTER POLICY "Dono pode editar seu restaurante" ON public.restaurants USING (
    (
        select auth.uid()
    ) = user_id
);
ALTER POLICY "restaurants_select_owner_or_active" ON public.restaurants USING (
    (
        (
            select auth.uid()
        ) = user_id
    )
    OR (ativo = true)
);
COMMIT;