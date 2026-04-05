-- ============================================================
-- 048 — Domain Logs: tabela de logs estruturados por domínio
-- Criado em: 2026-04-05
-- Fase 3 do Plano de Isolamento de Domínios
-- ============================================================

CREATE TABLE IF NOT EXISTS domain_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain      TEXT NOT NULL CHECK (
        domain IN ('core', 'image', 'affiliate', 'zaea', 'auth', 'marketing', 'shared')
    ),
    level       TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error')),
    message     TEXT NOT NULL,
    stack       TEXT,
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Índices para consulta rápida ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_domain_logs_domain
    ON domain_logs (domain);

CREATE INDEX IF NOT EXISTS idx_domain_logs_level
    ON domain_logs (level);

CREATE INDEX IF NOT EXISTS idx_domain_logs_created
    ON domain_logs (created_at DESC);

-- Índice composto para filtro mais comum: "erros recentes do domínio X"
CREATE INDEX IF NOT EXISTS idx_domain_logs_domain_level_created
    ON domain_logs (domain, level, created_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE domain_logs ENABLE ROW LEVEL SECURITY;

-- Somente service_role pode inserir (backend)
DROP POLICY IF EXISTS "domain_logs_insert_service" ON domain_logs;
CREATE POLICY "domain_logs_insert_service" ON domain_logs
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Somente service_role pode ler (admin dashboard)
DROP POLICY IF EXISTS "domain_logs_select_service" ON domain_logs;
CREATE POLICY "domain_logs_select_service" ON domain_logs
    FOR SELECT
    TO service_role
    USING (true);

-- ── Limpeza automática (opcional: manter só 30 dias) ─────────────────────
-- Pode ser ativado via cron job:
-- DELETE FROM domain_logs WHERE created_at < NOW() - INTERVAL '30 days';
