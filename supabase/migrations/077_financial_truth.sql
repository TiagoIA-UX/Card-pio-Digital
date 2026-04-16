-- =====================================================
-- 077: Camada canônica incremental de verdade financeira
--
-- Objetivo:
-- - consolidar o estado financeiro do tenant em um único ponto de leitura
-- - permitir decisão determinística em cron e webhooks sem depender de timing
-- - manter adoção incremental sem quebrar os fluxos já estabilizados
-- =====================================================
CREATE TABLE IF NOT EXISTS public.financial_truth (
    tenant_id UUID PRIMARY KEY REFERENCES public.restaurants(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (
        status IN (
            'pending',
            'approved',
            'canceled',
            'refunded',
            'chargeback'
        )
    ),
    source TEXT NOT NULL CHECK (
        source IN ('subscription', 'payment', 'reconciliation')
    ),
    source_id TEXT,
    last_event_at TIMESTAMPTZ NOT NULL,
    reason TEXT,
    raw_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_financial_truth_status ON public.financial_truth (status);
CREATE INDEX IF NOT EXISTS idx_financial_truth_last_event_at ON public.financial_truth (last_event_at DESC);
DROP TRIGGER IF EXISTS set_financial_truth_updated_at ON public.financial_truth;
CREATE TRIGGER set_financial_truth_updated_at BEFORE
UPDATE ON public.financial_truth FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.financial_truth ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "System financial_truth admin" ON public.financial_truth;
CREATE POLICY "System financial_truth admin" ON public.financial_truth FOR ALL TO service_role USING (true) WITH CHECK (true);
COMMENT ON TABLE public.financial_truth IS 'Camada canônica incremental de verdade financeira por tenant';
COMMENT ON COLUMN public.financial_truth.reason IS 'Motivo auditável usado para derivar o status financeiro';