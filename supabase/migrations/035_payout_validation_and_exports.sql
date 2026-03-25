-- ============================================================================
-- Migration 035: Payout validation, snapshots and source mapping
-- Endurece o fluxo financeiro com validação de lote, snapshots e auditoria.
-- ============================================================================
ALTER TABLE payout_batches
ADD COLUMN IF NOT EXISTS validation_status VARCHAR(15) NOT NULL DEFAULT 'pendente' CHECK (
        validation_status IN ('pendente', 'pronto', 'bloqueado')
    ),
    ADD COLUMN IF NOT EXISTS validation_summary JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE payout_items
ADD COLUMN IF NOT EXISTS affiliate_nome_snapshot TEXT,
    ADD COLUMN IF NOT EXISTS validation_status VARCHAR(15) NOT NULL DEFAULT 'pendente' CHECK (
        validation_status IN ('pendente', 'pronto', 'bloqueado')
    ),
    ADD COLUMN IF NOT EXISTS validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb;
CREATE TABLE IF NOT EXISTS payout_item_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payout_item_id UUID NOT NULL REFERENCES payout_items(id) ON DELETE CASCADE,
    source_type VARCHAR(20) NOT NULL CHECK (
        source_type IN ('referral_direct', 'referral_leader', 'bonus')
    ),
    source_id UUID NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (payout_item_id, source_type, source_id)
);
CREATE INDEX IF NOT EXISTS idx_payout_item_sources_item ON payout_item_sources(payout_item_id);
CREATE INDEX IF NOT EXISTS idx_payout_item_sources_lookup ON payout_item_sources(source_type, source_id);
ALTER TABLE payout_item_sources ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'payout_item_sources'
        AND policyname = 'service_role_item_sources'
) THEN CREATE POLICY "service_role_item_sources" ON payout_item_sources FOR ALL USING (auth.role() = 'service_role');
END IF;
END $$;