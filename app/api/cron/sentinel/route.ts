import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'

const CRON_SECRET = process.env.CRON_SECRET
const GROQ_API_KEY = process.env.GROQ_API_KEY
const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP ?? '5512996887993'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zairyx.com.br'

// ── Types ───────────────────────────────────────────────────────────────────

interface ScanIssue {
  source: string
  level: 'critical' | 'warning' | 'info'
  title: string
  detail: string
  fix?: string
}

interface ScanMetrics {
  db_size_mb: number
  db_usage_pct: number
  active_connections: number
  slow_queries: number
}

// ── Coleta de dados ─────────────────────────────────────────────────────────

async function collectPlatformData(supabase: ReturnType<typeof createAdminClient>) {
  const issues: ScanIssue[] = []
  const metrics: ScanMetrics = { db_size_mb: 0, db_usage_pct: 0, active_connections: 0, slow_queries: 0 }

  // 1. RPC platform_health_check
  try {
    const { data, error } = await supabase.rpc('platform_health_check')
    if (!error && data) {
      const h = data as Record<string, unknown>

      // Métricas
      const dbMb = Number(h.db_size_mb ?? 0)
      metrics.db_size_mb = dbMb
      metrics.db_usage_pct = Math.round((dbMb / 500) * 100 * 10) / 10
      metrics.active_connections = Number(h.active_connections ?? 0)
      metrics.slow_queries = Number(h.slow_queries ?? 0)

      // Security issues
      const noRls = h.tables_no_rls as { table: string }[] | undefined
      if (noRls?.length) {
        issues.push({
          source: 'no-rls', level: 'critical',
          title: `${noRls.length} tabelas SEM RLS`,
          detail: noRls.map(t => t.table).join(', '),
          fix: 'ALTER TABLE <name> ENABLE ROW LEVEL SECURITY',
        })
      }

      const noPolicy = h.rls_no_policy as { table: string }[] | undefined
      if (noPolicy?.length) {
        issues.push({
          source: 'rls-no-policy', level: 'warning',
          title: `${noPolicy.length} tabelas RLS sem policies`,
          detail: noPolicy.map(t => t.table).join(', '),
        })
      }

      const permissive = h.permissive_policies as { table: string; policy: string }[] | undefined
      for (const p of (permissive ?? []).slice(0, 5)) {
        issues.push({
          source: 'permissive-policy', level: 'warning',
          title: `Policy permissiva: ${p.policy}`,
          detail: p.table,
        })
      }

      const definer = h.definer_views as { view: string }[] | undefined
      if (definer?.length) {
        issues.push({
          source: 'security-definer', level: 'critical',
          title: `${definer.length} views SECURITY DEFINER`,
          detail: definer.map(v => v.view).join(', '),
          fix: 'ALTER VIEW SET (security_invoker = true)',
        })
      }

      if (metrics.db_usage_pct >= 90) {
        issues.push({ source: 'db-size', level: 'critical', title: `Banco ${metrics.db_usage_pct}% cheio`, detail: `${dbMb}MB/500MB` })
      } else if (metrics.db_usage_pct >= 70) {
        issues.push({ source: 'db-size', level: 'warning', title: `Banco ${metrics.db_usage_pct}%`, detail: `${dbMb}MB/500MB` })
      }
      if (metrics.active_connections > 50) {
        issues.push({ source: 'connections', level: 'critical', title: `${metrics.active_connections}/60 conexões`, detail: 'Próximo do limite' })
      }
      if (metrics.slow_queries > 0) {
        issues.push({ source: 'slow-queries', level: 'warning', title: `${metrics.slow_queries} queries lentas`, detail: '>10s' })
      }
    }
  } catch {
    issues.push({ source: 'rpc', level: 'warning', title: 'RPC indisponível', detail: 'Executar migration 050' })
  }

  // 2. Domain errors (24h)
  try {
    const since = new Date(Date.now() - 24 * 3600_000).toISOString()
    const { data } = await supabase.from('domain_logs').select('domain').eq('level', 'error').gte('created_at', since)
    if (data?.length) {
      const grouped: Record<string, number> = {}
      for (const r of data) grouped[r.domain] = (grouped[r.domain] ?? 0) + 1
      for (const [domain, count] of Object.entries(grouped)) {
        issues.push({ source: 'domain-logs', level: count >= 10 ? 'critical' : 'warning', title: `${count} erros em '${domain}'`, detail: '24h' })
      }
    }
  } catch { /* skip */ }

  // 3. Unread alerts
  try {
    const { count } = await supabase.from('system_alerts').select('id', { count: 'exact', head: true }).eq('read', false)
    if (count && count >= 20) {
      issues.push({ source: 'alerts-backlog', level: count >= 50 ? 'critical' : 'warning', title: `${count} alertas não lidos`, detail: 'Acumulação sem revisão' })
    }
  } catch { /* skip */ }

  // 4. Health check stale
  try {
    const { data } = await supabase.from('health_checks').select('status,created_at').order('created_at', { ascending: false }).limit(1)
    if (data?.[0]) {
      const ageH = (Date.now() - new Date(data[0].created_at).getTime()) / 3600_000
      if (ageH > 25) issues.push({ source: 'health-stale', level: 'warning', title: `Health check ${Math.round(ageH)}h atrás`, detail: 'Cron pode estar falhando' })
      if (data[0].status === 'down' || data[0].status === 'degraded') {
        issues.push({ source: 'health', level: data[0].status === 'down' ? 'critical' : 'warning', title: `Health: ${data[0].status.toUpperCase()}`, detail: 'Último check' })
      }
    }
  } catch { /* skip */ }

  // 5. Agent failures (24h)
  try {
    const since = new Date(Date.now() - 24 * 3600_000).toISOString()
    const { data } = await supabase.from('agent_tasks').select('agent_name').eq('status', 'failed').gte('created_at', since)
    if (data?.length) {
      const grouped: Record<string, number> = {}
      for (const r of data) grouped[r.agent_name] = (grouped[r.agent_name] ?? 0) + 1
      for (const [agent, count] of Object.entries(grouped)) {
        issues.push({ source: 'agent-failure', level: count >= 5 ? 'critical' : 'warning', title: `Agente '${agent}' falhou ${count}x`, detail: '24h' })
      }
    }
  } catch { /* skip */ }

  return { issues, metrics }
}

// ── Groq AI ─────────────────────────────────────────────────────────────────

async function analyzeWithAI(issues: ScanIssue[], metrics: ScanMetrics): Promise<string> {
  if (!GROQ_API_KEY) return fallbackSummary(issues, metrics)

  const issuesText = issues.slice(0, 15).map(i => `- [${i.level.toUpperCase()}] ${i.title}: ${i.detail}`).join('\n')
  const metricsText = `DB: ${metrics.db_size_mb}MB (${metrics.db_usage_pct}%), Conexões: ${metrics.active_connections}/60, Queries lentas: ${metrics.slow_queries}`

  const critCount = issues.filter(i => i.level === 'critical').length
  const warnCount = issues.filter(i => i.level === 'warning').length

  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Você é o Zai Sentinel, assistente DevOps da Zairyx (SaaS de cardápio digital). Analise o relatório e gere resumo CURTO (máx 400 chars) em PT-BR. Priorize: 1) Ações imediatas se crítico 2) Tendências se warning 3) "Tudo OK" se limpo. Emojis moderados. Texto plano para WhatsApp.',
          },
          {
            role: 'user',
            content: `Issues (${critCount} críticos, ${warnCount} avisos):\n${issuesText || 'Nenhum.'}\n\nMétricas: ${metricsText}\n\nGere 1 parágrafo + lista de ações. Máx 400 chars.`,
          },
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(15_000),
    })

    if (resp.ok) {
      const data = await resp.json()
      return data.choices?.[0]?.message?.content?.trim() ?? fallbackSummary(issues, metrics)
    }
  } catch { /* fallback */ }

  return fallbackSummary(issues, metrics)
}

function fallbackSummary(issues: ScanIssue[], metrics: ScanMetrics): string {
  const crit = issues.filter(i => i.level === 'critical').length
  const warn = issues.filter(i => i.level === 'warning').length
  if (crit === 0 && warn === 0) return `✅ Plataforma OK. Banco: ${metrics.db_size_mb}MB. Sem problemas.`
  const parts: string[] = []
  if (crit) parts.push(`🔴 ${crit} críticos`)
  if (warn) parts.push(`🟡 ${warn} avisos`)
  if (issues[0]) parts.push(`Principal: ${issues[0].title}`)
  return parts.join(' | ')
}

// ── Formatação ──────────────────────────────────────────────────────────────

function buildWhatsAppLink(text: string): string {
  const phone = ADMIN_WHATSAPP.replace(/\D/g, '').replace(/^(?!55)/, '55')
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
}

function formatWhatsApp(issues: ScanIssue[], metrics: ScanMetrics, aiSummary: string): string {
  const ts = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const crit = issues.filter(i => i.level === 'critical').length
  const warn = issues.filter(i => i.level === 'warning').length

  const lines: string[] = [
    '🛡️ *Zai Sentinel — Relatório*',
    `📅 ${ts}`,
    '',
    crit > 0 ? `🔴 *${crit} CRÍTICOS* | 🟡 ${warn} avisos` : warn > 0 ? `🟡 *${warn} AVISOS*` : '✅ *Tudo limpo!*',
    '',
  ]

  for (const issue of issues.slice(0, 8)) {
    const icon = issue.level === 'critical' ? '🔴' : issue.level === 'warning' ? '🟡' : 'ℹ️'
    lines.push(`${icon} ${issue.title}`)
    if (issue.fix) lines.push(`   💡 ${issue.fix}`)
  }

  lines.push('', '📊 *Métricas*')
  lines.push(`  • Banco: ${metrics.db_size_mb}MB (${metrics.db_usage_pct}%)`)
  lines.push(`  • Conexões: ${metrics.active_connections}/60`)

  lines.push('', '🤖 *Análise IA*', aiSummary.slice(0, 500))
  lines.push('', `_Zai Sentinel v2 · ${SITE_URL}_`)

  return lines.join('\n')
}

function formatTelegram(issues: ScanIssue[], metrics: ScanMetrics, aiSummary: string, waLink: string): string {
  const ts = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const crit = issues.filter(i => i.level === 'critical').length
  const warn = issues.filter(i => i.level === 'warning').length

  const lines: string[] = [
    '🛡️ <b>Zai Sentinel — Relatório</b>',
    `<i>📅 ${ts}</i>`,
    '',
    crit > 0 ? `🔴 <b>${crit} CRÍTICOS</b> · 🟡 ${warn} avisos` : warn > 0 ? `🟡 <b>${warn} AVISOS</b>` : '✅ <b>Tudo limpo!</b>',
    '',
  ]

  for (const issue of issues.slice(0, 8)) {
    const icon = issue.level === 'critical' ? '🔴' : issue.level === 'warning' ? '🟡' : 'ℹ️'
    lines.push(`${icon} ${issue.title}`)
    if (issue.fix) lines.push(`    💡 <i>${issue.fix}</i>`)
  }

  lines.push('', `📊 Banco: ${metrics.db_size_mb}MB (${metrics.db_usage_pct}%) · Conexões: ${metrics.active_connections}/60`)
  lines.push('', `🤖 <b>IA:</b> ${aiSummary.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c] ?? c).slice(0, 600)}`)
  lines.push('', `📱 <a href="${waLink}">Abrir no WhatsApp</a>`)

  return lines.join('\n')
}

// ── Envio ───────────────────────────────────────────────────────────────────

async function sendTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return false

  try {
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    })
    return resp.ok
  } catch {
    return false
  }
}

async function saveLearning(supabase: ReturnType<typeof createAdminClient>, issues: ScanIssue[]) {
  for (const issue of issues.filter(i => i.level === 'critical' && i.fix)) {
    try {
      const pattern = `${issue.source}: ${issue.title}`
      const { data: existing } = await supabase
        .from('agent_knowledge')
        .select('id,occurrences')
        .eq('pattern', pattern)
        .limit(1)

      if (existing?.[0]) {
        await supabase
          .from('agent_knowledge')
          .update({ occurrences: (existing[0].occurrences ?? 1) + 1, last_seen_at: new Date().toISOString() })
          .eq('id', existing[0].id)
      } else {
        await supabase.from('agent_knowledge').insert({
          pattern,
          root_cause: issue.detail.slice(0, 200),
          solution: issue.fix,
          confidence: 30,
          outcome: 'partial',
          occurrences: 1,
          files_changed: [],
        })
      }
    } catch { /* skip */ }
  }
}

// ── Route Handler ───────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!CRON_SECRET) return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = createAdminClient()
  const start = Date.now()

  // 1. Coleta
  const { issues, metrics } = await collectPlatformData(supabase)

  // 2. AI analysis
  const aiSummary = await analyzeWithAI(issues, metrics)

  // 3. Formato e links
  const waText = formatWhatsApp(issues, metrics, aiSummary)
  const waLink = buildWhatsAppLink(waText)
  const tgText = formatTelegram(issues, metrics, aiSummary, waLink)

  // 4. Envia Telegram + link WhatsApp
  const tgOk = await sendTelegram(tgText)

  // 5. Save learning
  await saveLearning(supabase, issues)

  // 6. Log scan
  try {
    await supabase.from('domain_logs').insert({
      domain: 'shared',
      level: 'info',
      message: `Sentinel scan: ${issues.filter(i => i.level === 'critical').length}🔴 ${issues.filter(i => i.level === 'warning').length}🟡`,
      metadata: {
        scan_type: 'sentinel_cron',
        has_ai: !!GROQ_API_KEY,
        issues_count: issues.length,
        duration_ms: Date.now() - start,
      },
    })
  } catch { /* skip */ }

  const crit = issues.filter(i => i.level === 'critical').length

  return NextResponse.json({
    ok: crit === 0,
    severity: crit > 0 ? 'critical' : issues.some(i => i.level === 'warning') ? 'warning' : 'ok',
    duration_ms: Date.now() - start,
    summary: {
      critical: crit,
      warning: issues.filter(i => i.level === 'warning').length,
      info: issues.filter(i => i.level === 'info').length,
    },
    ai_summary: aiSummary,
    whatsapp_link: waLink,
    telegram_sent: tgOk,
    issues,
  })
}
