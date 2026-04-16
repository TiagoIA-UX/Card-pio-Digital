-- =====================================================
-- 082: estado canônico de reconciliação para delivery_payments
--
-- Objetivo:
-- - persistir estado operacional de reconciliação no próprio aggregate
-- - separar estado principal, retry e anomalia sem criar nova tabela
-- - permitir reprocessamento determinístico por cron e webhook
-- =====================================================

ALTER TABLE public.delivery_payments
ADD COLUMN IF NOT EXISTS reconciliation_status TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS reconciliation_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_reconciliation_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_reconciliation_error TEXT,
    ADD COLUMN IF NOT EXISTS last_external_status_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS anomaly_flag BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS anomaly_code TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'delivery_payments_reconciliation_status_check'
    ) THEN
        ALTER TABLE public.delivery_payments
        ADD CONSTRAINT delivery_payments_reconciliation_status_check
        CHECK (reconciliation_status IN ('pending', 'synced', 'failed'));
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_delivery_payments_reconciliation_status
    ON public.delivery_payments(reconciliation_status);

CREATE INDEX IF NOT EXISTS idx_delivery_payments_anomaly_flag
    ON public.delivery_payments(anomaly_flag)
    WHERE anomaly_flag = true;

CREATE INDEX IF NOT EXISTS idx_delivery_payments_last_reconciliation_at
    ON public.delivery_payments(last_reconciliation_at DESC)
    WHERE last_reconciliation_at IS NOT NULL;