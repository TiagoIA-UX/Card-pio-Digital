-- 033_system_alerts.sql
-- Sistema de alertas para produção: registra todo evento crítico
-- para que o admin tenha visibilidade total.
-- Tabela de alertas do sistema
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    channel TEXT NOT NULL DEFAULT 'system',
    title TEXT NOT NULL,
    body TEXT,
    metadata JSONB DEFAULT '{}',
    whatsapp_link TEXT,
    read BOOLEAN DEFAULT false,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- Índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts (severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_channel ON system_alerts (channel);
CREATE INDEX IF NOT EXISTS idx_system_alerts_read ON system_alerts (read)
WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts (created_at DESC);
-- RLS: apenas service_role acessa
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
-- View rápida para o dashboard
CREATE OR REPLACE VIEW alerts_summary AS
SELECT COUNT(*) FILTER (
        WHERE read = false
    ) AS unread_total,
    COUNT(*) FILTER (
        WHERE read = false
            AND severity = 'critical'
    ) AS unread_critical,
    COUNT(*) FILTER (
        WHERE read = false
            AND severity = 'warning'
    ) AS unread_warning,
    COUNT(*) FILTER (
        WHERE read = false
            AND severity = 'info'
    ) AS unread_info,
    COUNT(*) FILTER (
        WHERE created_at > now() - INTERVAL '24 hours'
    ) AS last_24h,
    COUNT(*) FILTER (
        WHERE created_at > now() - INTERVAL '7 days'
    ) AS last_7d
FROM system_alerts;