-- ============================================================
-- 064 — Hardening do Platform Monitor
-- Corrige tabelas com RLS sem policy explícita e policies ainda públicas.
-- ============================================================
-- ── agent_tasks ──────────────────────────────────────────────
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
        AND c.relname = 'agent_tasks'
        AND c.relkind = 'r'
) THEN EXECUTE 'ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY';
EXECUTE 'DROP POLICY IF EXISTS "agent_tasks_service_role" ON public.agent_tasks';
EXECUTE '
            CREATE POLICY "agent_tasks_service_role"
            ON public.agent_tasks
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true)
        ';
END IF;
END $$;
-- ── agent_knowledge ──────────────────────────────────────────
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
        AND c.relname = 'agent_knowledge'
        AND c.relkind = 'r'
) THEN EXECUTE 'ALTER TABLE public.agent_knowledge ENABLE ROW LEVEL SECURITY';
EXECUTE 'DROP POLICY IF EXISTS "agent_knowledge_service_role" ON public.agent_knowledge';
EXECUTE '
            CREATE POLICY "agent_knowledge_service_role"
            ON public.agent_knowledge
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true)
        ';
END IF;
END $$;
-- ── health_checks ────────────────────────────────────────────
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
        AND c.relname = 'health_checks'
        AND c.relkind = 'r'
) THEN EXECUTE 'ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY';
EXECUTE 'DROP POLICY IF EXISTS "health_checks_service_role" ON public.health_checks';
EXECUTE '
            CREATE POLICY "health_checks_service_role"
            ON public.health_checks
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true)
        ';
END IF;
END $$;
-- ── order_number_sequences ───────────────────────────────────
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
        AND c.relname = 'order_number_sequences'
        AND c.relkind = 'r'
) THEN EXECUTE 'ALTER TABLE public.order_number_sequences ENABLE ROW LEVEL SECURITY';
EXECUTE 'DROP POLICY IF EXISTS "order_number_sequences_service_role" ON public.order_number_sequences';
EXECUTE '
            CREATE POLICY "order_number_sequences_service_role"
            ON public.order_number_sequences
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true)
        ';
END IF;
END $$;
-- ── system_alerts ────────────────────────────────────────────
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
        AND c.relname = 'system_alerts'
        AND c.relkind = 'r'
) THEN EXECUTE 'ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY';
EXECUTE 'DROP POLICY IF EXISTS "system_alerts_service_role" ON public.system_alerts';
EXECUTE '
            CREATE POLICY "system_alerts_service_role"
            ON public.system_alerts
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true)
        ';
END IF;
END $$;
-- ── Policies ainda públicas em produção ─────────────────────
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
        AND c.relname = 'audit_logs'
        AND c.relkind = 'r'
) THEN EXECUTE 'DROP POLICY IF EXISTS "System audit_logs admin" ON public.audit_logs';
EXECUTE '
            CREATE POLICY "System audit_logs admin"
            ON public.audit_logs
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true)
        ';
END IF;
END $$;
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
        AND c.relname = 'cobrancas_pix'
        AND c.relkind = 'r'
) THEN EXECUTE 'DROP POLICY IF EXISTS "System cobrancas_pix admin" ON public.cobrancas_pix';
EXECUTE '
            CREATE POLICY "System cobrancas_pix admin"
            ON public.cobrancas_pix
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true)
        ';
END IF;
END $$;