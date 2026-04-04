-- 040_system_alerts_notified_python.sql
-- Adiciona coluna para o agente Python rastrear alertas já notificados,
-- evitando disparos duplicados via Telegram / WhatsApp.
ALTER TABLE system_alerts
ADD COLUMN IF NOT EXISTS notified_python BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_system_alerts_notified_python ON system_alerts (notified_python)
WHERE notified_python = false;
COMMENT ON COLUMN system_alerts.notified_python IS 'true quando o backend/server.py já enviou notificação via Telegram ou WhatsApp.';