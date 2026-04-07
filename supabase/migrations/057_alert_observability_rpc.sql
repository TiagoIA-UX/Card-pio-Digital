-- ============================================================
-- 057 — Observabilidade de alertas + RPC health check melhorado
-- Baseado em análise externa de segurança 07/04/2026:
--   • platform_health_check: classificar risco de policies por role
--     (public/anon = critical, authenticated = high, outros = medium)
--   • Nova RPC get_alert_stats: top sources, frequência/hora, breakdown
--     para "radar de operação" no painel admin
-- ============================================================
-- ── 1. RPC get_alert_stats: radar de operação ─────────────────────────────
CREATE OR REPLACE FUNCTION public.get_alert_stats() RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE top_sources JSONB;
hourly_freq JSONB;
severity_break JSONB;
spam_suspects JSONB;
BEGIN -- Top 5 fontes por volume nos últimos 7 dias
SELECT COALESCE(
        jsonb_agg(
            row
            ORDER BY row->>'total' DESC
        ),
        '[]'::jsonb
    ) INTO top_sources
FROM (
        SELECT jsonb_build_object(
                'source',
                COALESCE(source, channel, 'unknown'),
                'total',
                COUNT(*),
                'critical',
                COUNT(*) FILTER (
                    WHERE severity = 'critical'
                ),
                'warning',
                COUNT(*) FILTER (
                    WHERE severity = 'warning'
                ),
                'info',
                COUNT(*) FILTER (
                    WHERE severity = 'info'
                )
            ) AS row
        FROM system_alerts
        WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY COALESCE(source, channel, 'unknown')
        ORDER BY COUNT(*) DESC
        LIMIT 5
    ) t;
-- Frequência por hora nas últimas 24h
SELECT COALESCE(
        jsonb_agg(
            row
            ORDER BY row->>'hour'
        ),
        '[]'::jsonb
    ) INTO hourly_freq
FROM (
        SELECT jsonb_build_object(
                'hour',
                to_char(date_trunc('hour', created_at), 'HH24:MI'),
                'total',
                COUNT(*),
                'critical',
                COUNT(*) FILTER (
                    WHERE severity = 'critical'
                )
            ) AS row
        FROM system_alerts
        WHERE created_at > NOW() - INTERVAL '24 hours'
        GROUP BY date_trunc('hour', created_at)
        ORDER BY date_trunc('hour', created_at)
    ) t;
-- Breakdown de severidade últimos 7 dias
SELECT jsonb_build_object(
        'total',
        COALESCE(SUM(cnt), 0),
        'critical',
        COALESCE(
            SUM(cnt) FILTER (
                WHERE severity = 'critical'
            ),
            0
        ),
        'warning',
        COALESCE(
            SUM(cnt) FILTER (
                WHERE severity = 'warning'
            ),
            0
        ),
        'info',
        COALESCE(
            SUM(cnt) FILTER (
                WHERE severity = 'info'
            ),
            0
        ),
        'pct_critical',
        ROUND(
            100.0 * COALESCE(
                SUM(cnt) FILTER (
                    WHERE severity = 'critical'
                ),
                0
            ) / NULLIF(SUM(cnt), 0),
            1
        )
    ) INTO severity_break
FROM (
        SELECT severity,
            COUNT(*) AS cnt
        FROM system_alerts
        WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY severity
    ) t;
-- Suspeitas de spam: sources com >15 alertas na última hora
SELECT COALESCE(
        jsonb_agg(
            row
            ORDER BY row->>'count_1h' DESC
        ),
        '[]'::jsonb
    ) INTO spam_suspects
FROM (
        SELECT jsonb_build_object(
                'source',
                COALESCE(source, channel, 'unknown'),
                'count_1h',
                COUNT(*),
                'first_seen',
                MIN(created_at)
            ) AS row
        FROM system_alerts
        WHERE created_at > NOW() - INTERVAL '1 hour'
        GROUP BY COALESCE(source, channel, 'unknown')
        HAVING COUNT(*) > 15
    ) t;
RETURN jsonb_build_object(
    'top_sources',
    top_sources,
    'hourly_freq',
    hourly_freq,
    'severity',
    severity_break,
    'spam_suspects',
    spam_suspects,
    'generated_at',
    NOW()
);
END;
$$;
REVOKE ALL ON FUNCTION public.get_alert_stats()
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_alert_stats() TO service_role;
-- ── 2. Melhorar platform_health_check: risk_level por role ────────────────
-- Classifica policies permissivas por risco real:
--   • critical → public, anon ou roles vazio (qualquer acesso)
--   • high     → authenticated (qualquer usuário logado)
--   • medium   → outra role não-service_role
--   service_role continua excluído (backend intencional)
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
-- 3. Policies permissivas com classificação de risco
--    service_role = excluído (acesso de backend, intencional)
--    public / anon / roles vazio = CRITICAL (acesso irrestrito)
--    authenticated = HIGH (qualquer usuário logado)
--    outros = MEDIUM
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
                p.roles,
                'risk_level',
                CASE
                    WHEN p.roles = '{}'
                    OR 'public' = ANY(p.roles)
                    OR 'anon' = ANY(p.roles) THEN 'critical'
                    WHEN 'authenticated' = ANY(p.roles) THEN 'high'
                    ELSE 'medium'
                END
            )
        ),
        '[]'::jsonb
    ) INTO permissive_policies
FROM pg_policies p
WHERE p.schemaname = 'public'
    AND p.cmd IN ('ALL', 'UPDATE', 'DELETE', 'INSERT')
    AND p.qual = 'true' -- excluir policies exclusivas de service_role (backend intencional)
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
REVOKE ALL ON FUNCTION public.platform_health_check()
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.platform_health_check() TO service_role;