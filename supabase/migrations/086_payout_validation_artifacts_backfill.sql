-- ============================================================================
-- 086: Backfill dos artefatos de validacao de payout ausentes no remoto
--
-- Motivo:
-- - historico local possui duas migrations 035
-- - no remoto apenas uma versao 035 foi registrada/aplicada
-- - este arquivo repoe, de forma idempotente, o que faltou do bloco de payout
--
-- Regra:
-- - nao altera migrations historicas existentes
-- - apenas adiciona objetos/campos faltantes
-- ============================================================================
ALTER TABLE IF EXISTS public.payout_batches
ADD COLUMN IF NOT EXISTS validation_status VARCHAR(15) NOT NULL DEFAULT 'pendente' CHECK (
        validation_status IN ('pendente', 'pronto', 'bloqueado')
    ),
    ADD COLUMN IF NOT EXISTS validation_summary JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.payout_items
ADD COLUMN IF NOT EXISTS affiliate_nome_snapshot TEXT,
    ADD COLUMN IF NOT EXISTS validation_status VARCHAR(15) NOT NULL DEFAULT 'pendente' CHECK (
        validation_status IN ('pendente', 'pronto', 'bloqueado')
    ),
    ADD COLUMN IF NOT EXISTS validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb;
CREATE TABLE IF NOT EXISTS public.payout_item_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payout_item_id UUID NOT NULL REFERENCES public.payout_items(id) ON DELETE CASCADE,
    source_type VARCHAR(20) NOT NULL CHECK (
        source_type IN ('referral_direct', 'referral_leader', 'bonus')
    ),
    source_id UUID NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (payout_item_id, source_type, source_id)
);
CREATE INDEX IF NOT EXISTS idx_payout_item_sources_item ON public.payout_item_sources(payout_item_id);
CREATE INDEX IF NOT EXISTS idx_payout_item_sources_lookup ON public.payout_item_sources(source_type, source_id);
ALTER TABLE public.payout_item_sources ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'payout_item_sources'
        AND policyname = 'service_role_item_sources'
) THEN CREATE POLICY "service_role_item_sources" ON public.payout_item_sources FOR ALL USING (auth.role() = 'service_role');
END IF;
END $$;