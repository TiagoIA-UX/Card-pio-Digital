-- ===== Zero Bug Fase 1: Versionamento de Publicacao =====
-- Base minima para rascunho, release publicada e ponteiro ativo.
-- Escopo intencionalmente enxuto:
-- - draft_versions
-- - release_versions
-- - current_version
BEGIN;
CREATE TABLE IF NOT EXISTS public.delivery_draft_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'editing' CHECK (
        status IN (
            'editing',
            'saved',
            'validated',
            'invalid',
            'ready_to_publish'
        )
    ),
    created_by UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT delivery_draft_versions_delivery_version_unique UNIQUE (delivery_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_delivery_draft_versions_delivery_status_updated_at ON public.delivery_draft_versions (delivery_id, status, updated_at DESC);
DROP TRIGGER IF EXISTS trg_delivery_draft_versions_updated_at ON public.delivery_draft_versions;
CREATE TRIGGER trg_delivery_draft_versions_updated_at BEFORE
UPDATE ON public.delivery_draft_versions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TABLE IF NOT EXISTS public.delivery_release_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'candidate' CHECK (
        status IN (
            'candidate',
            'published',
            'failed',
            'rolled_back'
        )
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    CONSTRAINT delivery_release_versions_delivery_version_unique UNIQUE (delivery_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_delivery_release_versions_delivery_status_created_at ON public.delivery_release_versions (delivery_id, status, created_at DESC);
CREATE TABLE IF NOT EXISTS public.delivery_current_version (
    delivery_id UUID PRIMARY KEY REFERENCES public.restaurants(id) ON DELETE CASCADE,
    release_version_id UUID NOT NULL REFERENCES public.delivery_release_versions(id) ON DELETE RESTRICT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_delivery_current_version_updated_at ON public.delivery_current_version;
CREATE TRIGGER trg_delivery_current_version_updated_at BEFORE
UPDATE ON public.delivery_current_version FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
COMMIT;