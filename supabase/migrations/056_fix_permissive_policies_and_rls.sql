-- ============================================================
-- 056 — Corrige policies permissivas e tabelas sem policies
-- Problemas detectados pelo Sentinel em 07/04/2026:
--   • System cobrancas_pix admin  → sem restrição de role
--   • System audit_logs admin     → sem restrição de role
--   • org_admin_all / promo_admin_all / org_members_admin → sem restrição de role
--   • webhook_events, agent_tasks, agent_knowledge, system_alerts
--     → RLS habilitado mas sem policy explícita (comportamento correto mas
--       gera alarme no health check)
-- Também:
--   • Adiciona coluna source em system_alerts
--   • Adiciona status 'rejected' em onboarding_submissions
-- ============================================================
-- ── 1. system_alerts: adicionar coluna source ─────────────────────────────
ALTER TABLE system_alerts
ADD COLUMN IF NOT EXISTS source TEXT;
-- ── 2. onboarding_submissions: ampliar CHECK de status ───────────────────
ALTER TABLE onboarding_submissions DROP CONSTRAINT IF EXISTS onboarding_submissions_status_check;
ALTER TABLE onboarding_submissions
ADD CONSTRAINT onboarding_submissions_status_check CHECK (
    status IN (
      'pending',
      'in_production',
      'completed',
      'rejected'
    )
  );
-- ── 3. Corrigir "System cobrancas_pix admin" → restringir a service_role ──
DROP POLICY IF EXISTS "System cobrancas_pix admin" ON public.cobrancas_pix;
CREATE POLICY "System cobrancas_pix admin" ON public.cobrancas_pix FOR ALL TO service_role USING (true) WITH CHECK (true);
-- ── 4. Corrigir "System audit_logs admin" → restringir a service_role ─────
DROP POLICY IF EXISTS "System audit_logs admin" ON public.audit_logs;
CREATE POLICY "System audit_logs admin" ON public.audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
-- ── 5. Corrigir policies permissivas sem role (criadas diretamente no banco)
-- org_admin_all (organizations ou org_members)
DO $$
DECLARE tbl TEXT;
BEGIN -- Descobre em qual tabela a policy existe
SELECT tablename INTO tbl
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname = 'org_admin_all'
LIMIT 1;
IF tbl IS NOT NULL THEN EXECUTE format(
  'DROP POLICY IF EXISTS "org_admin_all" ON public.%I',
  tbl
);
EXECUTE format(
  '
      CREATE POLICY "org_admin_all" ON public.%I
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)',
  tbl
);
END IF;
END $$;
-- promo_admin_all (promotions ou tabela relacionada)
DO $$
DECLARE tbl TEXT;
BEGIN
SELECT tablename INTO tbl
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname = 'promo_admin_all'
LIMIT 1;
IF tbl IS NOT NULL THEN EXECUTE format(
  'DROP POLICY IF EXISTS "promo_admin_all" ON public.%I',
  tbl
);
EXECUTE format(
  '
      CREATE POLICY "promo_admin_all" ON public.%I
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)',
  tbl
);
END IF;
END $$;
-- org_members_admin
DO $$
DECLARE tbl TEXT;
BEGIN
SELECT tablename INTO tbl
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname = 'org_members_admin'
LIMIT 1;
IF tbl IS NOT NULL THEN EXECUTE format(
  'DROP POLICY IF EXISTS "org_members_admin" ON public.%I',
  tbl
);
EXECUTE format(
  '
      CREATE POLICY "org_members_admin" ON public.%I
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)',
  tbl
);
END IF;
END $$;
-- ── 6. Adicionar policy explícita de service_role nas tabelas "sem policy" ──
-- webhook_events
DROP POLICY IF EXISTS "webhook_events_service_role" ON public.webhook_events;
CREATE POLICY "webhook_events_service_role" ON public.webhook_events FOR ALL TO service_role USING (true) WITH CHECK (true);
-- agent_tasks
DROP POLICY IF EXISTS "agent_tasks_service_role" ON public.agent_tasks;
CREATE POLICY "agent_tasks_service_role" ON public.agent_tasks FOR ALL TO service_role USING (true) WITH CHECK (true);
-- agent_knowledge
DROP POLICY IF EXISTS "agent_knowledge_service_role" ON public.agent_knowledge;
CREATE POLICY "agent_knowledge_service_role" ON public.agent_knowledge FOR ALL TO service_role USING (true) WITH CHECK (true);
-- system_alerts
DROP POLICY IF EXISTS "system_alerts_service_role" ON public.system_alerts;
CREATE POLICY "system_alerts_service_role" ON public.system_alerts FOR ALL TO service_role USING (true) WITH CHECK (true);
-- ── 7. Atualizar RPC platform_health_check: excluir service_role do alarme ─
CREATE OR REPLACE FUNCTION public.platform_health_check() RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE result JSONB := '{}';
rls_no_policy JSONB;
permissive_policies JSONB;
definer_views JSONB;
db_size_bytes BIGINT;
active_connections INT;
slow_queries INT;
tables_no_rls JSONB;
BEGIN -- 1. Tabelas SEM RLS habilitado
SELECT COALESCE(
    jsonb_agg(jsonb_build_object('table', t.tablename)),
    '[]'::jsonb
  ) INTO tables_no_rls
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT LIKE '_prisma%'
  AND NOT EXISTS (
    SELECT 1
    FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = t.tablename
      AND c.relrowsecurity = true
  );
-- 2. Tabelas com RLS habilitado MAS sem policies
SELECT COALESCE(
    jsonb_agg(jsonb_build_object('table', c.relname)),
    '[]'::jsonb
  ) INTO rls_no_policy
FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true
  AND NOT EXISTS (
    SELECT 1
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = c.relname
  );
-- 3. Policies permissivas (USING(true) para ALL/UPDATE/DELETE/INSERT)
--    Exclui service_role: essa role tem BYPASSRLS e usa a policy
--    intencionalmente para acesso de backend.
SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'table',
        p.tablename,
        'policy',
        p.policyname,
        'command',
        p.cmd,
        'roles',
        p.roles
      )
    ),
    '[]'::jsonb
  ) INTO permissive_policies
FROM pg_policies p
WHERE p.schemaname = 'public'
  AND p.cmd IN ('ALL', 'UPDATE', 'DELETE', 'INSERT')
  AND p.qual = 'true' -- excluir policies exclusivas de service_role (acesso de backend intencional)
  AND NOT (
    array_length(p.roles, 1) = 1
    AND p.roles [1] = 'service_role'
  );
-- 4. Views com SECURITY DEFINER (sem security_invoker)
SELECT COALESCE(
    jsonb_agg(jsonb_build_object('view', v.viewname)),
    '[]'::jsonb
  ) INTO definer_views
FROM pg_views v
  JOIN pg_class c ON c.relname = v.viewname
  JOIN pg_namespace ns ON ns.oid = c.relnamespace
  AND ns.nspname = 'public'
WHERE v.schemaname = 'public'
  AND c.relkind = 'v'
  AND NOT EXISTS (
    SELECT 1
    FROM unnest(c.reloptions) opt
    WHERE opt = 'security_invoker=true'
  );
-- 5. Tamanho do banco
SELECT pg_database_size(current_database()) INTO db_size_bytes;
-- 6. Conexões ativas
SELECT count(*)::int INTO active_connections
FROM pg_stat_activity
WHERE state = 'active';
-- 7. Queries lentas (>10s)
SELECT count(*)::int INTO slow_queries
FROM pg_stat_activity
WHERE state = 'active'
  AND query_start < now() - interval '10 seconds'
  AND query NOT LIKE '%pg_stat%'
  AND query NOT LIKE '%platform_health_check%';
result := jsonb_build_object(
  'tables_no_rls',
  tables_no_rls,
  'rls_no_policy',
  rls_no_policy,
  'permissive_policies',
  permissive_policies,
  'definer_views',
  definer_views,
  'db_size_bytes',
  db_size_bytes,
  'db_size_mb',
  round(db_size_bytes / (1024.0 * 1024.0), 2),
  'active_connections',
  active_connections,
  'slow_queries',
  slow_queries,
  'checked_at',
  now()
);
RETURN result;
END;
$$;
-- Apenas service_role pode chamar
REVOKE ALL ON FUNCTION public.platform_health_check()
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.platform_health_check() TO service_role;
-- ── 8. Limpar alertas informativos antigos (>7 dias) silenciando backlog ──
UPDATE system_alerts
SET read = true
WHERE read = false
  AND severity = 'info'
  AND created_at < NOW() - INTERVAL '7 days';