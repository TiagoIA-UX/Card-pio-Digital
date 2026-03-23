-- ============================================================================
-- Migration 034: Janela real de aprovação para afiliados
-- Aprova após 30 dias e usa approved_at/lider_approved_at para batches 1 e 15.
-- ============================================================================

ALTER TABLE affiliate_referrals
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lider_approved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS referrals_approved_at_idx
  ON affiliate_referrals(approved_at DESC);

CREATE INDEX IF NOT EXISTS referrals_lider_approved_at_idx
  ON affiliate_referrals(lider_approved_at DESC);

UPDATE affiliate_referrals
SET approved_at = COALESCE(approved_at, created_at)
WHERE status IN ('aprovado', 'pago');

UPDATE affiliate_referrals
SET lider_approved_at = COALESCE(lider_approved_at, created_at)
WHERE lider_status IN ('aprovado', 'pago');
