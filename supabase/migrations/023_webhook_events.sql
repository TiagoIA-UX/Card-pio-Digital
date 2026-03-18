-- Tabela de idempotência para webhooks externos
-- Garante que cada notificação seja processada exatamente uma vez,
-- mesmo em casos de retry do Mercado Pago ou falha transiente.

CREATE TABLE IF NOT EXISTS webhook_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider      TEXT        NOT NULL DEFAULT 'mercadopago',
  event_id      TEXT        NOT NULL,          -- body.id (notification_id) do webhook
  event_type    TEXT        NOT NULL DEFAULT 'unknown',  -- body.type: payment, subscription, …
  status        TEXT        NOT NULL DEFAULT 'received'
                            CHECK (status IN ('received', 'processed', 'failed', 'skipped')),
  payload       JSONB       NOT NULL DEFAULT '{}',
  error_message TEXT,
  processed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Garante que a mesma notificação não seja inserida duas vezes
  CONSTRAINT webhook_events_provider_event_id_key UNIQUE (provider, event_id)
);

-- Índice para lookup de idempotência (hot path em cada webhook recebido)
CREATE INDEX IF NOT EXISTS idx_webhook_events_lookup
  ON webhook_events (provider, event_id);

-- Índice auxiliar para monitoramento (listar falhas, eventos recentes)
CREATE INDEX IF NOT EXISTS idx_webhook_events_status_created
  ON webhook_events (status, created_at DESC);

-- RLS: somente service_role (backend) pode ler/escrever
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Sem políticas públicas intencionalmente — acesso via SUPABASE_SERVICE_ROLE_KEY apenas
COMMENT ON TABLE webhook_events IS
  'Registro de idempotência para webhooks externos. Cada notificação é inserida como received e atualizada para processed/failed.';
