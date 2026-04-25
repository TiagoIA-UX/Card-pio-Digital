-- =====================================================
-- Migration 097: checkout shadow preapproval columns
-- Fase 2 do billing novo: persistencia forte, sem ativar corte
-- =====================================================
ALTER TABLE checkout_sessions
ADD COLUMN IF NOT EXISTS billing_model TEXT DEFAULT 'legacy_billing',
    ADD COLUMN IF NOT EXISTS capacity_plan_slug TEXT,
    ADD COLUMN IF NOT EXISTS contracted_initial_amount DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS contracted_monthly_amount DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS contract_hash TEXT,
    ADD COLUMN IF NOT EXISTS mp_preapproval_id TEXT,
    ADD COLUMN IF NOT EXISTS mp_preapproval_status TEXT,
    ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS shadow_preapproval_created_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS shadow_preapproval_error TEXT,
    ADD COLUMN IF NOT EXISTS shadow_preapproval_attempts INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_contract_hash ON checkout_sessions(contract_hash);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_mp_preapproval_id ON checkout_sessions(mp_preapproval_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_billing_model ON checkout_sessions(billing_model);