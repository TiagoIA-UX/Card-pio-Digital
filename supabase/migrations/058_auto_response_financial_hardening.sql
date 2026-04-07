-- ============================================================
-- 058 — Automação de resposta a alertas + blindagem financeira
-- Baseado em análise de segurança 07/04/2026:
--   • RPC process_spam_detection(): detecta spike e cria alerta crítico
--   • RPC escalate_unacknowledged_criticals(): re-escalona críticos sem ACK
--   • webhook_events: coluna origin + constraint
--   • cobrancas_pix: coluna origin + constraint
--   • subscriptions / orders: policy de quem pode escrever
-- ============================================================
-- ── 1. RPC process_spam_detection ─────────────────────────────────────────
-- Detecta fontes com >20 alertas/hora e cria alerta crítico se ainda não
-- houver um alerta de spam para essa fonte na última hora.
-- Chamado pelo cron platform-monitor a cada execução.
CREATE OR REPLACE FUNCTION public.process_spam_detection() RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE rec RECORD;
spam_found INT := 0;
already_alerted BOOLEAN;
BEGIN FOR rec IN
SELECT COALESCE(source, channel, 'unknown') AS src,
    COUNT(*) AS cnt
FROM system_alerts
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY COALESCE(source, channel, 'unknown')
HAVING COUNT(*) > 20 LOOP -- Verifica se já existe alerta de spam para essa fonte na última hora
SELECT EXISTS (
        SELECT 1
        FROM system_alerts
        WHERE source = 'system-spam-detection'
            AND title ILIKE '%' || rec.src || '%'
            AND created_at > NOW() - INTERVAL '1 hour'
    ) INTO already_alerted;
IF NOT already_alerted THEN
INSERT INTO system_alerts (
        severity,
        source,
        channel,
        title,
        body,
        read,
        notified_python
    )
VALUES (
        'critical',
        'system-spam-detection',
        'system',
        '🚨 Spam detectado: ' || rec.src || ' (' || rec.cnt || ' alertas/hora)',
        'A fonte "' || rec.src || '" gerou ' || rec.cnt || ' alertas na última hora.' || chr(10) || 'Ação: verificar se é retry loop, webhook duplicado ou bug de inserção.' || chr(10) || 'Sugestão: investigar origin da fonte e aplicar throttle se necessário.',
        false,
        false
    );
spam_found := spam_found + 1;
END IF;
END LOOP;
RETURN jsonb_build_object(
    'spam_sources_detected',
    spam_found,
    'checked_at',
    NOW()
);
END;
$$;
REVOKE ALL ON FUNCTION public.process_spam_detection()
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_spam_detection() TO service_role;
-- ── 2. RPC escalate_unacknowledged_criticals ──────────────────────────────
-- Detecta alertas críticos mais velhos que 30min e ainda não lidos/resolvidos.
-- Se encontrar, cria alerta de escalação (1x por alerta, evita loop).
CREATE OR REPLACE FUNCTION public.escalate_unacknowledged_criticals() RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE rec RECORD;
escalation_key TEXT;
already_escalated BOOLEAN;
escalated_count INT := 0;
BEGIN FOR rec IN
SELECT id,
    title,
    source,
    created_at
FROM system_alerts
WHERE severity = 'critical'
    AND read = false
    AND resolved = false
    AND source != 'system-escalation' -- evitar loop de escalação
    AND created_at < NOW() - INTERVAL '30 minutes'
    AND created_at > NOW() - INTERVAL '24 hours' -- não re-escalar muito antigo
ORDER BY created_at ASC
LIMIT 5 LOOP escalation_key := 'escalation::' || rec.id::text;
SELECT EXISTS (
        SELECT 1
        FROM system_alerts
        WHERE source = 'system-escalation'
            AND body ILIKE '%' || rec.id::text || '%'
            AND created_at > NOW() - INTERVAL '4 hours'
    ) INTO already_escalated;
IF NOT already_escalated THEN
INSERT INTO system_alerts (
        severity,
        source,
        channel,
        title,
        body,
        read,
        notified_python
    )
VALUES (
        'critical',
        'system-escalation',
        'system',
        '🔺 Escalação: crítico sem ACK há 30min+',
        'Alerta crítico não reconhecido: ' || chr(10) || '• ID: ' || rec.id::text || chr(10) || '• Título: ' || rec.title || chr(10) || '• Fonte: ' || COALESCE(rec.source, 'unknown') || chr(10) || '• Criado em: ' || to_char(
            rec.created_at AT TIME ZONE 'America/Sao_Paulo',
            'DD/MM HH24:MI'
        ) || chr(10) || 'Ação: revisar em /admin/alertas ou responder /status no Telegram.',
        false,
        false
    );
escalated_count := escalated_count + 1;
END IF;
END LOOP;
RETURN jsonb_build_object(
    'escalated',
    escalated_count,
    'checked_at',
    NOW()
);
END;
$$;
REVOKE ALL ON FUNCTION public.escalate_unacknowledged_criticals()
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.escalate_unacknowledged_criticals() TO service_role;
-- ── 3. webhook_events: coluna origin + constraint ────────────────────────
ALTER TABLE webhook_events
ADD COLUMN IF NOT EXISTS origin TEXT CHECK (
        origin IN (
            'mercadopago',
            'stripe',
            'asaas',
            'system',
            'admin',
            'test'
        )
    ) DEFAULT 'system';
CREATE INDEX IF NOT EXISTS idx_webhook_events_origin ON webhook_events (origin);
-- ── 4. cobrancas_pix: coluna origin + constraint ─────────────────────────
ALTER TABLE cobrancas_pix
ADD COLUMN IF NOT EXISTS origin TEXT CHECK (origin IN ('system', 'admin', 'webhook', 'cron')) DEFAULT 'system';
CREATE INDEX IF NOT EXISTS idx_cobrancas_pix_origin ON cobrancas_pix (origin);
-- ── 5. Garantir que subscriptions só recebe escrita via service_role ──────
-- A tabela já tem RLS, mas precisamos garantir que não há policy de escrita
-- para authenticated sem restrição de tenant_id
DROP POLICY IF EXISTS "subscriptions_write_guard" ON public.subscriptions;
CREATE POLICY "subscriptions_write_guard" ON public.subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);
-- Política de leitura para o owner do tenant (somente leitura, sem escrita)
DROP POLICY IF EXISTS "subscriptions_tenant_read" ON public.subscriptions;
CREATE POLICY "subscriptions_tenant_read" ON public.subscriptions FOR
SELECT TO authenticated USING (
        tenant_id IN (
            SELECT tenant_id
            FROM users
            WHERE id = auth.uid()
        )
    );
-- ── 6. orders: garantir isolamento por tenant em leitura ─────────────────
-- Escrita apenas via service_role; leitura autenticada restrita por tenant
DROP POLICY IF EXISTS "orders_write_guard" ON public.orders;
CREATE POLICY "orders_write_guard" ON public.orders FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "orders_tenant_read" ON public.orders;
CREATE POLICY "orders_tenant_read" ON public.orders FOR
SELECT TO authenticated USING (
        tenant_id IN (
            SELECT tenant_id
            FROM users
            WHERE id = auth.uid()
        )
    );