-- ============================================================
-- 050 — RPC para Platform Monitor: coleta métricas de saúde
-- Chamado pelo cron /api/cron/platform-monitor
-- Retorna JSON com todas as verificações de segurança e limites
-- ============================================================

CREATE OR REPLACE FUNCTION public.platform_health_check()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB := '{}';
  rls_no_policy JSONB;
  permissive_policies JSONB;
  definer_views JSONB;
  db_size_bytes BIGINT;
  active_connections INT;
  slow_queries INT;
  tables_no_rls JSONB;
BEGIN
  -- 1. Tabelas SEM RLS habilitado
  SELECT COALESCE(jsonb_agg(jsonb_build_object('table', t.tablename)), '[]'::jsonb)
  INTO tables_no_rls
  FROM pg_tables t
  WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT LIKE '_prisma%'
    AND NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = t.tablename
        AND c.relrowsecurity = true
    );

  -- 2. Tabelas com RLS habilitado MAS sem policies
  SELECT COALESCE(jsonb_agg(jsonb_build_object('table', c.relname)), '[]'::jsonb)
  INTO rls_no_policy
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = true
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = 'public' AND p.tablename = c.relname
    );

  -- 3. Policies permissivas (USING(true) para ALL/UPDATE/DELETE/INSERT)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'table', p.tablename,
    'policy', p.policyname,
    'command', p.cmd,
    'roles', p.roles
  )), '[]'::jsonb)
  INTO permissive_policies
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.cmd IN ('ALL', 'UPDATE', 'DELETE', 'INSERT')
    AND p.qual = 'true';

  -- 4. Views com SECURITY DEFINER (sem security_invoker)
  SELECT COALESCE(jsonb_agg(jsonb_build_object('view', v.viewname)), '[]'::jsonb)
  INTO definer_views
  FROM pg_views v
  JOIN pg_class c ON c.relname = v.viewname
  JOIN pg_namespace ns ON ns.oid = c.relnamespace AND ns.nspname = 'public'
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

  -- Montar resultado
  result := jsonb_build_object(
    'tables_no_rls', tables_no_rls,
    'rls_no_policy', rls_no_policy,
    'permissive_policies', permissive_policies,
    'definer_views', definer_views,
    'db_size_bytes', db_size_bytes,
    'db_size_mb', round(db_size_bytes / (1024.0 * 1024.0), 2),
    'active_connections', active_connections,
    'slow_queries', slow_queries,
    'checked_at', now()
  );

  RETURN result;
END;
$$;

-- Apenas service_role pode chamar
REVOKE ALL ON FUNCTION public.platform_health_check() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.platform_health_check() TO service_role;
