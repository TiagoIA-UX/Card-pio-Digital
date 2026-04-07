import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import { notify } from '@/lib/shared/notifications'

const CRON_SECRET = process.env.CRON_SECRET

// ── Supabase project info (extraído da URL) ────────────────────────────────
function getProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const match = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)
  return match?.[1] ?? null
}

// ── Types ───────────────────────────────────────────────────────────────────
interface PlatformIssue {
  source: string
  level: 'info' | 'warning' | 'critical'
  title: string
  detail: string
  remediation?: string
}

interface HealthRpcResult {
  tables_no_rls: { table: string }[]
  rls_no_policy: { table: string }[]
  permissive_policies: { table: string; policy: string; command: string; roles: string[] }[]
  definer_views: { view: string }[]
  db_size_bytes: number
  db_size_mb: number
  active_connections: number
  slow_queries: number
  checked_at: string
}

// ── Processar resultado da RPC ──────────────────────────────────────────────

function processSecurityChecks(health: HealthRpcResult): PlatformIssue[] {
  const issues: PlatformIssue[] = []

  // Tabelas sem RLS
  if (health.tables_no_rls.length > 0) {
    const names = health.tables_no_rls.map((t) => t.table).join(', ')
    issues.push({
      source: 'supabase-no-rls',
      level: 'critical',
      title: `${health.tables_no_rls.length} tabelas SEM RLS`,
      detail: names,
      remediation: 'ALTER TABLE <name> ENABLE ROW LEVEL SECURITY',
    })
  }

  // RLS sem policies
  if (health.rls_no_policy.length > 0) {
    const names = health.rls_no_policy.map((t) => t.table).join(', ')
    issues.push({
      source: 'supabase-rls-no-policy',
      level: 'warning',
      title: `${health.rls_no_policy.length} tabelas com RLS sem policies`,
      detail: names,
      remediation: 'Adicionar policies ou restringir a service_role',
    })
  }

  // Policies permissivas
  for (const p of health.permissive_policies) {
    issues.push({
      source: 'supabase-permissive-rls',
      level: 'warning',
      title: `Policy permissiva: ${p.policy}`,
      detail: `${p.table} — "${p.policy}" (${p.command}) USING(true)`,
      remediation: 'Restringir a service_role ou auth.uid()',
    })
  }

  // SECURITY DEFINER views
  if (health.definer_views.length > 0) {
    const names = health.definer_views.map((v) => v.view).join(', ')
    issues.push({
      source: 'supabase-security-definer',
      level: 'critical',
      title: `${health.definer_views.length} views SECURITY DEFINER`,
      detail: names,
      remediation: 'ALTER VIEW SET (security_invoker = true)',
    })
  }

  return issues
}

function processUsageLimits(health: HealthRpcResult): PlatformIssue[] {
  const issues: PlatformIssue[] = []
  const limitMB = 500 // Free plan
  const usagePercent = (health.db_size_mb / limitMB) * 100

  if (usagePercent >= 90) {
    issues.push({
      source: 'supabase-db-size',
      level: 'critical',
      title: `⚠️ Banco quase cheio: ${health.db_size_mb.toFixed(0)}MB / ${limitMB}MB (${usagePercent.toFixed(0)}%)`,
      detail: `${(health.db_size_mb / 1024).toFixed(2)}GB usado`,
      remediation: 'Upgrade do plano ou limpar dados antigos',
    })
  } else if (usagePercent >= 70) {
    issues.push({
      source: 'supabase-db-size',
      level: 'warning',
      title: `Banco ${usagePercent.toFixed(0)}% usado: ${health.db_size_mb.toFixed(0)}MB / ${limitMB}MB`,
      detail: `${(health.db_size_mb / 1024).toFixed(2)}GB usado`,
      remediation: 'Monitorar crescimento. Considerar cleanup de domain_logs > 30 dias',
    })
  } else {
    issues.push({
      source: 'supabase-db-size',
      level: 'info',
      title: `Banco OK: ${health.db_size_mb.toFixed(0)}MB / ${limitMB}MB (${usagePercent.toFixed(0)}%)`,
      detail: `${(health.db_size_mb / 1024).toFixed(2)}GB usado`,
    })
  }

  // Conexões
  if (health.active_connections > 50) {
    issues.push({
      source: 'supabase-connections',
      level: 'critical',
      title: `🔌 ${health.active_connections}/60 conexões ativas`,
      detail: 'Próximo do limite. Risco de rejeição',
      remediation: 'Verificar connection pooling ou queries lentas',
    })
  } else if (health.active_connections > 30) {
    issues.push({
      source: 'supabase-connections',
      level: 'warning',
      title: `${health.active_connections}/60 conexões ativas`,
      detail: 'Uso moderado de conexões',
    })
  }

  // Queries lentas
  if (health.slow_queries > 0) {
    issues.push({
      source: 'supabase-slow-queries',
      level: 'warning',
      title: `🐢 ${health.slow_queries} queries lentas (>10s)`,
      detail: 'Queries rodando há mais de 10 segundos',
      remediation: 'Verificar pg_stat_activity e adicionar índices',
    })
  }

  return issues
}

/** Verifica domain_logs recentes por erros acumulados */
async function checkDomainErrors(
  supabase: ReturnType<typeof createAdminClient>
): Promise<PlatformIssue[]> {
  const issues: PlatformIssue[] = []

  try {
    const { data } = await supabase
      .from('domain_logs')
      .select('domain')
      .eq('level', 'error')
      .gte('created_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString())

    if (data && data.length > 0) {
      const grouped: Record<string, number> = {}
      for (const row of data) {
        grouped[row.domain] = (grouped[row.domain] ?? 0) + 1
      }
      for (const [domain, count] of Object.entries(grouped)) {
        issues.push({
          source: 'domain-logs',
          level: count >= 10 ? 'critical' : 'warning',
          title: `${count} erros no domínio "${domain}" (24h)`,
          detail: `Domínio ${domain} teve ${count} erros nas últimas 24 horas`,
          remediation: 'Consultar domain_logs para stack traces',
        })
      }
    }
  } catch {
    // Tabela pode não existir ainda
  }

  return issues
}

/** Verifica system_alerts não lidos acumulados */
async function checkUnreadAlerts(
  supabase: ReturnType<typeof createAdminClient>
): Promise<PlatformIssue[]> {
  const issues: PlatformIssue[] = []

  try {
    const { count } = await supabase
      .from('system_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('read', false)

    if (count && count >= 20) {
      issues.push({
        source: 'system-alerts-backlog',
        level: count >= 50 ? 'critical' : 'warning',
        title: `📬 ${count} alertas não lidos`,
        detail: `Acumulação de ${count} alertas sem leitura no painel admin`,
        remediation: 'Revisar em /painel/alertas ou responder /status no Telegram',
      })
    }
  } catch {
    // skip
  }

  return issues
}

/** Verifica health_checks recentes */
async function checkRecentHealth(
  supabase: ReturnType<typeof createAdminClient>
): Promise<PlatformIssue[]> {
  const issues: PlatformIssue[] = []

  try {
    const { data } = await supabase
      .from('health_checks')
      .select('status, created_at')
      .order('created_at', { ascending: false })
      .limit(1)

    if (data?.[0]) {
      const last = data[0]
      const age = Date.now() - new Date(last.created_at).getTime()
      const ageHours = age / (1000 * 3600)

      if (ageHours > 25) {
        issues.push({
          source: 'health-stale',
          level: 'warning',
          title: `Health check desatualizado (${ageHours.toFixed(0)}h atrás)`,
          detail: 'O cron /api/cron/health pode estar falhando',
        })
      }
      if (last.status === 'down' || last.status === 'degraded') {
        issues.push({
          source: 'health-degraded',
          level: last.status === 'down' ? 'critical' : 'warning',
          title: `Último health check: ${last.status.toUpperCase()}`,
          detail: 'Status detectado no health check mais recente',
        })
      }
    }
  } catch {
    // skip
  }

  return issues
}

// ── Formatar mensagem Telegram ──────────────────────────────────────────────
function formatTelegramReport(issues: PlatformIssue[], projectRef: string | null): string {
  const ts = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

  const criticals = issues.filter((i) => i.level === 'critical')
  const warnings = issues.filter((i) => i.level === 'warning')
  const infos = issues.filter((i) => i.level === 'info')

  const lines: string[] = []
  lines.push('🛡️ <b>Platform Monitor — Zairyx</b>')
  lines.push(`<i>🕐 ${ts}</i>`)
  if (projectRef) lines.push(`<code>Projeto: ${projectRef}</code>`)
  lines.push('')

  if (criticals.length === 0 && warnings.length === 0) {
    lines.push('✅ <b>Tudo limpo!</b> Nenhum problema encontrado.')
    if (infos.length > 0) {
      lines.push('')
      for (const i of infos) {
        lines.push(`ℹ️ ${i.title}`)
      }
    }
    return lines.join('\n')
  }

  if (criticals.length > 0) {
    lines.push(`🔴 <b>${criticals.length} CRÍTICO${criticals.length > 1 ? 'S' : ''}</b>`)
    for (const c of criticals) {
      lines.push(`  • ${c.title}`)
      if (c.remediation) lines.push(`    💡 ${c.remediation}`)
    }
    lines.push('')
  }

  if (warnings.length > 0) {
    lines.push(`🟡 <b>${warnings.length} AVISO${warnings.length > 1 ? 'S' : ''}</b>`)
    for (const w of warnings) {
      lines.push(`  • ${w.title}`)
      if (w.remediation) lines.push(`    💡 ${w.remediation}`)
    }
    lines.push('')
  }

  if (infos.length > 0) {
    lines.push('ℹ️ <b>Info</b>')
    for (const i of infos) {
      lines.push(`  • ${i.title}`)
    }
  }

  lines.push('')
  lines.push(`<i>Total: ${issues.length} items · Fonte: /api/cron/platform-monitor</i>`)

  return lines.join('\n')
}

// ── Route Handler ───────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const projectRef = getProjectRef()
  const start = Date.now()

  const allIssues: PlatformIssue[] = []

  // 1. Chamar RPC de health check (security + limites)
  try {
    const { data, error } = await supabase.rpc('platform_health_check')
    if (!error && data) {
      const health = data as unknown as HealthRpcResult
      allIssues.push(...processSecurityChecks(health))
      allIssues.push(...processUsageLimits(health))
    }
  } catch {
    allIssues.push({
      source: 'rpc-unavailable',
      level: 'warning',
      title: 'RPC platform_health_check indisponível',
      detail: 'Executar migration 050 no Supabase SQL Editor',
    })
  }

  // 2. Checks via REST API (não precisam de RPC)
  const restResults = await Promise.allSettled([
    checkDomainErrors(supabase),
    checkUnreadAlerts(supabase),
    checkRecentHealth(supabase),
  ])

  for (const r of restResults) {
    if (r.status === 'fulfilled') allIssues.push(...r.value)
  }

  // 3. Automação de resposta: detecção de spam + escalação de críticos não ACK
  await Promise.allSettled([
    supabase.rpc('process_spam_detection'),
    supabase.rpc('escalate_unacknowledged_criticals'),
  ])

  const duration = Date.now() - start

  // Notificar se houver problemas
  const hasCritical = allIssues.some((i) => i.level === 'critical')
  const hasWarning = allIssues.some((i) => i.level === 'warning')

  if (hasCritical || hasWarning) {
    await notify({
      severity: hasCritical ? 'critical' : 'warning',
      channel: 'security',
      title: `Platform Monitor: ${allIssues.filter((i) => i.level === 'critical').length} críticos, ${allIssues.filter((i) => i.level === 'warning').length} avisos`,
      body: formatTelegramReport(allIssues, projectRef),
      metadata: {
        issues: allIssues,
        duration_ms: duration,
        checked_at: new Date().toISOString(),
      },
    })
  }

  // Sempre enviar relatório completo pro Telegram
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (token && chatId) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: formatTelegramReport(allIssues, projectRef),
          parse_mode: 'HTML',
        }),
        signal: AbortSignal.timeout(5000),
      })
    } catch {
      // Telegram indisponível
    }
  }

  return NextResponse.json({
    ok: !hasCritical,
    duration_ms: duration,
    summary: {
      critical: allIssues.filter((i) => i.level === 'critical').length,
      warning: allIssues.filter((i) => i.level === 'warning').length,
      info: allIssues.filter((i) => i.level === 'info').length,
    },
    issues: allIssues,
  })
}
