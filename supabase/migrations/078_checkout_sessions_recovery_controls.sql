-- =====================================================
-- CONTROLES OPERACIONAIS DE RECUPERACAO DE PAGAMENTO
-- Evita reenvio duplicado e registra a ultima acao operacional
-- =====================================================
ALTER TABLE checkout_sessions
ADD COLUMN IF NOT EXISTS last_recovery_action_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_recovery_action_type TEXT,
    ADD COLUMN IF NOT EXISTS last_recovery_action_note TEXT;
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_last_recovery_action_at ON checkout_sessions(last_recovery_action_at DESC)
WHERE last_recovery_action_at IS NOT NULL;