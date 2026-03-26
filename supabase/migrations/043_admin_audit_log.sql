-- =====================================================================
-- 043 — Admin Audit Log — Rastreabilidade de ações administrativas
-- =====================================================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id    UUID NOT NULL REFERENCES auth.users(id),
  admin_email TEXT NOT NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   TEXT,
  details     JSONB DEFAULT '{}',
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas frequentes
CREATE INDEX idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX idx_admin_audit_log_entity ON admin_audit_log(entity_type, entity_id);
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);

-- RLS: Somente admins podem ler logs
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_audit_log_select_admin"
  ON admin_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "admin_audit_log_insert_admin"
  ON admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Comentários
COMMENT ON TABLE admin_audit_log IS 'Registro de todas as ações administrativas para auditoria';
COMMENT ON COLUMN admin_audit_log.action IS 'Ação executada: create, update, delete, login, export, etc.';
COMMENT ON COLUMN admin_audit_log.entity_type IS 'Tipo de entidade afetada: restaurant, user, order, subscription, etc.';
COMMENT ON COLUMN admin_audit_log.entity_id IS 'ID da entidade afetada';
COMMENT ON COLUMN admin_audit_log.details IS 'Detalhes adicionais em JSON (valores antigos/novos, etc.)';
