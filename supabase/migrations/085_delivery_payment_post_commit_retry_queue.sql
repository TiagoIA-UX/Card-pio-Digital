-- =====================================================
-- 085: Fila persistida de retry para efeitos pós-commit
-- de delivery_payments
--
-- Objetivo:
-- - retirar retry do fluxo principal de finalização financeira
-- - reprocessar efeitos secundários sem afetar a verdade econômica
-- - preservar trilha auditável e WhatsApp pós-pagamento com cron dedicado
-- =====================================================
CREATE TABLE IF NOT EXISTS public.delivery_payment_post_commit_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES public.delivery_payments(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL CHECK (
        task_type IN (
            'audit_log_finalize',
            'audit_log_reconciliation_failed',
            'whatsapp_post_payment'
        )
    ),
    dedupe_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'completed', 'failed')
    ),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    retry_attempts INTEGER NOT NULL DEFAULT 0 CHECK (retry_attempts >= 0),
    max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts >= 1),
    next_retry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_attempt_at TIMESTAMPTZ,
    last_error TEXT,
    escalated_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT delivery_payment_post_commit_queue_dedupe_key_key UNIQUE (dedupe_key)
);
CREATE INDEX IF NOT EXISTS idx_delivery_payment_post_commit_queue_status_retry ON public.delivery_payment_post_commit_queue (status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_delivery_payment_post_commit_queue_payment_id ON public.delivery_payment_post_commit_queue (payment_id);
DROP TRIGGER IF EXISTS set_delivery_payment_post_commit_queue_updated_at ON public.delivery_payment_post_commit_queue;
CREATE TRIGGER set_delivery_payment_post_commit_queue_updated_at BEFORE
UPDATE ON public.delivery_payment_post_commit_queue FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.delivery_payment_post_commit_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "System delivery_payment_post_commit_queue admin" ON public.delivery_payment_post_commit_queue;
CREATE POLICY "System delivery_payment_post_commit_queue admin" ON public.delivery_payment_post_commit_queue FOR ALL TO service_role USING (true) WITH CHECK (true);
COMMENT ON TABLE public.delivery_payment_post_commit_queue IS 'Fila persistida de retry para efeitos secundários pós-commit de delivery_payments';
COMMENT ON COLUMN public.delivery_payment_post_commit_queue.task_type IS 'Tipo da ação secundária a reprocessar';
COMMENT ON COLUMN public.delivery_payment_post_commit_queue.dedupe_key IS 'Chave determinística para impedir duplicação lógica do mesmo efeito pós-commit';
COMMENT ON COLUMN public.delivery_payment_post_commit_queue.status IS 'Estado do retry: pending, completed ou failed';