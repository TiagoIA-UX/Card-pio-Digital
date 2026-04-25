-- =====================================================
-- 099: reconciliar webhook_events ausente no remoto
--
-- Corrige drift onde a migration 023 aparece no histórico,
-- mas a tabela public.webhook_events não existe de fato.
-- Mantém tudo idempotente para não impactar ambientes íntegros.
-- =====================================================
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL DEFAULT 'mercadopago',
    event_id TEXT NOT NULL,
    event_type TEXT NOT NULL DEFAULT 'unknown',
    status TEXT NOT NULL DEFAULT 'received' CHECK (
        status IN ('received', 'processed', 'failed', 'skipped')
    ),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    origin TEXT CHECK (
        origin IN (
            'mercadopago',
            'stripe',
            'asaas',
            'system',
            'admin',
            'test'
        )
    ) DEFAULT 'system'
);
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'webhook_events_provider_event_id_key'
        AND conrelid = 'public.webhook_events'::regclass
) THEN
ALTER TABLE public.webhook_events
ADD CONSTRAINT webhook_events_provider_event_id_key UNIQUE (provider, event_id);
END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_webhook_events_lookup ON public.webhook_events (provider, event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status_created ON public.webhook_events (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_origin ON public.webhook_events (origin);
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "webhook_events_service_role" ON public.webhook_events;
CREATE POLICY "webhook_events_service_role" ON public.webhook_events FOR ALL TO service_role USING (true) WITH CHECK (true);
COMMENT ON TABLE public.webhook_events IS 'Registro de idempotência para webhooks externos. Cada notificação é inserida como received e atualizada para processed/failed.';