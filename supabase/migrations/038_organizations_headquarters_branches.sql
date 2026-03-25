-- ============================================================================
-- Migration 038: Organizations, headquarters and branches
-- Introduz a camada de rede sem quebrar o fluxo atual baseado em restaurant_id.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        nome TEXT NOT NULL,
        slug TEXT UNIQUE,
        settings JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_user_id ON public.organizations(owner_user_id);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'organizations'
        AND policyname = 'organizations_service_role_all'
) THEN CREATE POLICY "organizations_service_role_all" ON public.organizations FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
END IF;
END $$;
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS organization_id UUID,
    ADD COLUMN IF NOT EXISTS unit_type TEXT NOT NULL DEFAULT 'headquarters' CHECK (unit_type IN ('headquarters', 'branch')),
    ADD COLUMN IF NOT EXISTS parent_restaurant_id UUID,
    ADD COLUMN IF NOT EXISTS unit_label TEXT,
    ADD COLUMN IF NOT EXISTS inheritance_settings JSONB NOT NULL DEFAULT '{
    "inherit_visual": true,
    "inherit_catalog": true,
    "allow_local_overrides": true,
    "local_fields": ["telefone", "endereco_texto", "google_maps_url"]
  }'::jsonb,
    ADD COLUMN IF NOT EXISTS local_overrides JSONB NOT NULL DEFAULT '{}'::jsonb;
INSERT INTO public.organizations (
        id,
        owner_user_id,
        nome,
        slug,
        settings,
        created_at,
        updated_at
    )
SELECT restaurants.id,
    restaurants.user_id,
    restaurants.nome,
    CONCAT(restaurants.slug, '-org'),
    jsonb_build_object(
        'origin',
        'backfill_migration_038',
        'default_unit_label',
        COALESCE(NULLIF(restaurants.nome, ''), 'Matriz')
    ),
    COALESCE(restaurants.created_at, NOW()),
    COALESCE(restaurants.updated_at, NOW())
FROM public.restaurants
WHERE NOT EXISTS (
        SELECT 1
        FROM public.organizations
        WHERE organizations.id = restaurants.id
    );
UPDATE public.restaurants
SET organization_id = COALESCE(organization_id, id),
    unit_type = COALESCE(unit_type, 'headquarters'),
    parent_restaurant_id = CASE
        WHEN COALESCE(unit_type, 'headquarters') = 'headquarters' THEN NULL
        ELSE parent_restaurant_id
    END,
    unit_label = COALESCE(NULLIF(unit_label, ''), nome)
WHERE organization_id IS NULL
    OR unit_label IS NULL;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'restaurants_organization_id_fkey'
) THEN
ALTER TABLE public.restaurants
ADD CONSTRAINT restaurants_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'restaurants_parent_restaurant_id_fkey'
) THEN
ALTER TABLE public.restaurants
ADD CONSTRAINT restaurants_parent_restaurant_id_fkey FOREIGN KEY (parent_restaurant_id) REFERENCES public.restaurants(id) ON DELETE
SET NULL;
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'restaurants_branch_parent_check'
) THEN
ALTER TABLE public.restaurants
ADD CONSTRAINT restaurants_branch_parent_check CHECK (
        (
            unit_type = 'headquarters'
            AND parent_restaurant_id IS NULL
        )
        OR (
            unit_type = 'branch'
            AND parent_restaurant_id IS NOT NULL
        )
    );
END IF;
END $$;
ALTER TABLE public.restaurants
ALTER COLUMN organization_id
SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_restaurants_organization_id ON public.restaurants(organization_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_organization_unit_type ON public.restaurants(organization_id, unit_type);
CREATE INDEX IF NOT EXISTS idx_restaurants_parent_restaurant_id ON public.restaurants(parent_restaurant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_single_headquarters_per_organization ON public.restaurants(organization_id)
WHERE unit_type = 'headquarters';
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'organizations'
        AND policyname = 'organizations_select_member'
) THEN CREATE POLICY "organizations_select_member" ON public.organizations FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.restaurants
            WHERE restaurants.organization_id = organizations.id
                AND restaurants.user_id = auth.uid()
        )
    );
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'organizations_updated_at'
) THEN CREATE TRIGGER organizations_updated_at BEFORE
UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
END IF;
END $$;