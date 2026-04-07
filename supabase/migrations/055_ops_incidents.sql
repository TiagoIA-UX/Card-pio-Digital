-- ===== Incidentes Operacionais Correlacionados =====
-- Persiste o estado operacional dos incidentes agregados pelo backend Python
-- para sobreviver a restart do processo e permitir consulta administrativa.

CREATE TABLE IF NOT EXISTS public.ops_incidents (
  incident_key TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  first_seen TIMESTAMPTZ NOT NULL,
  last_seen TIMESTAMPTZ NOT NULL,
  occurrences INTEGER NOT NULL DEFAULT 1,
  suppressed_duplicates INTEGER NOT NULL DEFAULT 0,
  notification_count INTEGER NOT NULL DEFAULT 0,
  last_notification_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ops_incidents_status_last_seen
  ON public.ops_incidents (status, last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_ops_incidents_category_last_seen
  ON public.ops_incidents (category, last_seen DESC);

DROP TRIGGER IF EXISTS trg_ops_incidents_updated_at ON public.ops_incidents;
CREATE TRIGGER trg_ops_incidents_updated_at
  BEFORE UPDATE ON public.ops_incidents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.ops_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read ops incidents" ON public.ops_incidents;
CREATE POLICY "Admins can read ops incidents" ON public.ops_incidents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE public.admin_users.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can update ops incidents" ON public.ops_incidents;
CREATE POLICY "Admins can update ops incidents" ON public.ops_incidents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE public.admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE public.admin_users.user_id = auth.uid()
    )
  );