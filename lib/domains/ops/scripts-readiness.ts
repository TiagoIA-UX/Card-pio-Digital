import { createAdminClient } from '@/lib/shared/supabase/admin'
import { resolveForgeOpsWebhookConfig } from '@/lib/shared/forgeops/config'
import crypto from 'node:crypto'

export type ScriptsReadinessItem = {
  id: string
  label: string
  ok: boolean
  detail: string
  impact: 'critical' | 'operational' | 'optional'
}

export type ScriptsReadinessCategory = {
  key: string
  title: string
  items: ScriptsReadinessItem[]
}

export type ScriptsReadinessReport = {
  generatedAt: string
  summary: {
    total: number
    healthy: number
    attention: number
    actionable: number
    critical: number
    operational: number
    optional: number
  }
  categories: ScriptsReadinessCategory[]
}

export type ScriptsReadinessSeverity = 'info' | 'warning' | 'critical'
export type ScriptsReadinessStatus = 'ok' | 'degraded' | 'critical'

function getImpactForItem(id: string): ScriptsReadinessItem['impact'] {
  if (['admin-secret', 'cron-secret', 'mp-access', 'mp-webhook-secret'].includes(id)) {
    return 'critical'
  }

  if (['alert-webhook-url'].includes(id)) {
    return 'operational'
  }

  return 'optional'
}

function isConfigured(value?: string | null): boolean {
  return Boolean(value && value.trim().length > 0)
}

export function getForgeOpsWebhookReadinessItem(): ScriptsReadinessItem {
  const forgeOpsConfig = resolveForgeOpsWebhookConfig()

  return {
    id: 'alert-webhook-url',
    label: 'ALERT_WEBHOOK_URL (ForgeOps webhook)',
    ok: Boolean(forgeOpsConfig.alertWebhookUrl),
    detail: forgeOpsConfig.alertWebhookUrl
      ? `Configurada via ${forgeOpsConfig.source}`
      : 'Nao configurada (fallback em system_alerts/console/Telegram direto, se disponivel)',
    impact: getImpactForItem('alert-webhook-url'),
  }
}

async function countWhere(options: {
  table: string
  eq?: Array<{ column: string; value: string }>
  is?: Array<{ column: string; value: null }>
}) {
  const db = createAdminClient()
  let query = db.from(options.table).select('id', { count: 'exact', head: true })

  for (const item of options.eq ?? []) {
    query = query.eq(item.column, item.value)
  }

  for (const item of options.is ?? []) {
    query = query.is(item.column, item.value)
  }

  const { count, error } = await query
  if (error) {
    return { ok: false as const, count: 0, error: error.message }
  }

  return { ok: true as const, count: count ?? 0, error: '' }
}

export async function getScriptsReadinessReport(): Promise<ScriptsReadinessReport> {
  const contactsCount = await countWhere({
    table: 'marketing_contacts',
    is: [{ column: 'unsubscribed_at', value: null }],
  })

  const campaignsScheduledCount = await countWhere({
    table: 'marketing_campaigns',
    eq: [{ column: 'status', value: 'scheduled' }],
  })

  const campaignsFailedCount = await countWhere({
    table: 'marketing_campaigns',
    eq: [{ column: 'status', value: 'failed' }],
  })

  const categories: ScriptsReadinessCategory[] = [
    {
      key: 'seguranca',
      title: 'Seguranca e acesso',
      items: [
        {
          id: 'admin-secret',
          label: 'ADMIN_SECRET_KEY',
          ok: isConfigured(process.env.ADMIN_SECRET_KEY),
          detail: isConfigured(process.env.ADMIN_SECRET_KEY) ? 'Configurada' : 'Nao configurada',
          impact: getImpactForItem('admin-secret'),
        },
        {
          id: 'cron-secret',
          label: 'CRON_SECRET',
          ok: isConfigured(process.env.CRON_SECRET),
          detail: isConfigured(process.env.CRON_SECRET) ? 'Configurada' : 'Nao configurada',
          impact: getImpactForItem('cron-secret'),
        },
        {
          ...getForgeOpsWebhookReadinessItem(),
        },
      ],
    },
    {
      key: 'pagamentos',
      title: 'Pagamentos e webhook',
      items: [
        {
          id: 'mp-access',
          label: 'MERCADO_PAGO_ACCESS_TOKEN ou MP_ACCESS_TOKEN',
          ok:
            isConfigured(process.env.MERCADO_PAGO_ACCESS_TOKEN) ||
            isConfigured(process.env.MP_ACCESS_TOKEN),
          detail:
            isConfigured(process.env.MERCADO_PAGO_ACCESS_TOKEN) ||
            isConfigured(process.env.MP_ACCESS_TOKEN)
              ? 'Token de pagamento configurado'
              : 'Token de pagamento ausente',
          impact: getImpactForItem('mp-access'),
        },
        {
          id: 'mp-webhook-secret',
          label: 'MP_WEBHOOK_SECRET',
          ok: isConfigured(process.env.MP_WEBHOOK_SECRET),
          detail: isConfigured(process.env.MP_WEBHOOK_SECRET)
            ? 'Webhook protegido com secret'
            : 'Webhook sem secret configurado',
          impact: getImpactForItem('mp-webhook-secret'),
        },
      ],
    },
    {
      key: 'marketing',
      title: 'Marketing e newsletter',
      items: [
        {
          id: 'resend-api-key',
          label: 'RESEND_API_KEY',
          ok: isConfigured(process.env.RESEND_API_KEY),
          detail: isConfigured(process.env.RESEND_API_KEY)
            ? 'Envio de email habilitado'
            : 'Envio de email desabilitado',
          impact: getImpactForItem('resend-api-key'),
        },
        {
          id: 'contacts-subscribed',
          label: 'Contatos inscritos ativos',
          ok: contactsCount.ok,
          detail: contactsCount.ok
            ? `${contactsCount.count} contato(s) ativo(s)`
            : `Falha ao consultar: ${contactsCount.error}`,
          impact: getImpactForItem('contacts-subscribed'),
        },
        {
          id: 'campaigns-scheduled',
          label: 'Campanhas agendadas',
          ok: campaignsScheduledCount.ok,
          detail: campaignsScheduledCount.ok
            ? `${campaignsScheduledCount.count} campanha(s) agendada(s)`
            : `Falha ao consultar: ${campaignsScheduledCount.error}`,
          impact: getImpactForItem('campaigns-scheduled'),
        },
        {
          id: 'campaigns-failed',
          label: 'Campanhas com falha',
          ok: campaignsFailedCount.ok && campaignsFailedCount.count === 0,
          detail: campaignsFailedCount.ok
            ? `${campaignsFailedCount.count} campanha(s) com status failed`
            : `Falha ao consultar: ${campaignsFailedCount.error}`,
          impact: getImpactForItem('campaigns-failed'),
        },
      ],
    },
  ]

  const total = categories.reduce((acc, category) => acc + category.items.length, 0)
  const healthy = categories.reduce(
    (acc, category) => acc + category.items.filter((item) => item.ok).length,
    0
  )
  const attentionItems = categories.flatMap((category) => category.items.filter((item) => !item.ok))
  const actionable = attentionItems.filter((item) => item.impact !== 'optional').length
  const critical = attentionItems.filter((item) => item.impact === 'critical').length
  const operational = attentionItems.filter((item) => item.impact === 'operational').length
  const optional = attentionItems.filter((item) => item.impact === 'optional').length

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      total,
      healthy,
      attention: total - healthy,
      actionable,
      critical,
      operational,
      optional,
    },
    categories,
  }
}

export function buildReadinessAlertBody(report: ScriptsReadinessReport): string {
  const actionableAttention = getActionableAttentionItems(report)
  const lines = [
    `Status operacional: ${getReadinessStatus(report)}`,
    `Total de checks: ${report.summary.total}`,
    `Saudaveis: ${report.summary.healthy}`,
    `Com atencao: ${report.summary.attention}`,
    `Pendencias acionaveis: ${report.summary.actionable}`,
    `Pendencias criticas: ${report.summary.critical}`,
    `Pendencias operacionais: ${report.summary.operational}`,
    `Pendencias opcionais: ${report.summary.optional}`,
    '',
  ]

  for (const category of report.categories) {
    lines.push(`${category.title}:`)

    for (const item of category.items.filter((entry) => !entry.ok)) {
      lines.push(`- ${item.label}: ${item.detail}`)
    }

    if (!category.items.some((entry) => !entry.ok)) {
      lines.push('- sem pendencias')
    }

    lines.push('')
  }

  return lines.join('\n').trim()
}

export function getAttentionItems(report: ScriptsReadinessReport): ScriptsReadinessItem[] {
  return report.categories.flatMap((category) => category.items.filter((item) => !item.ok))
}

export function getActionableAttentionItems(
  report: ScriptsReadinessReport
): ScriptsReadinessItem[] {
  return getAttentionItems(report).filter((item) => item.impact !== 'optional')
}

export function getReadinessStatus(report: ScriptsReadinessReport): ScriptsReadinessStatus {
  const actionableItems = getActionableAttentionItems(report)

  if (actionableItems.length === 0) return 'ok'
  if (actionableItems.some((item) => item.impact === 'critical')) return 'critical'
  return 'degraded'
}

export function buildReadinessFingerprint(report: ScriptsReadinessReport): string {
  const fingerprintItems = getActionableAttentionItems(report)
  const effectiveItems = fingerprintItems.length > 0 ? fingerprintItems : getAttentionItems(report)
  const attention = effectiveItems
    .map((item) => `${item.id}:${item.detail}`)
    .sort((a, b) => a.localeCompare(b))
    .join('|')

  const raw = `${report.summary.total}|${report.summary.healthy}|${report.summary.attention}|${report.summary.actionable}|${report.summary.optional}|${attention}`
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export function getReadinessSeverity(
  report: ScriptsReadinessReport,
  recentAttentionSnapshots = 0
): ScriptsReadinessSeverity {
  void recentAttentionSnapshots

  const status = getReadinessStatus(report)
  if (status === 'critical') return 'critical'
  if (status === 'degraded') return 'warning'
  return 'info'
}

export async function saveReadinessSnapshot(options: {
  report: ScriptsReadinessReport
  severity: ScriptsReadinessSeverity
  fingerprint: string
  source: 'cron' | 'admin'
}) {
  const db = createAdminClient()
  const attentionItems = getAttentionItems(options.report).map((item) => ({
    id: item.id,
    label: item.label,
    detail: item.detail,
    impact: item.impact,
  }))

  await db.from('scripts_readiness_snapshots').insert({
    generated_at: options.report.generatedAt,
    total_checks: options.report.summary.total,
    healthy_checks: options.report.summary.healthy,
    attention_checks: options.report.summary.attention,
    severity: options.severity,
    fingerprint: options.fingerprint,
    categories: options.report.categories,
    attention_items: attentionItems,
    source: options.source,
  })
}

export async function countRecentAttentionSnapshots(hours = 72): Promise<number> {
  const db = createAdminClient()
  const since = new Date(Date.now() - hours * 3600_000).toISOString()

  const { count, error } = await db
    .from('scripts_readiness_snapshots')
    .select('id', { count: 'exact', head: true })
    .gt('attention_checks', 0)
    .gte('generated_at', since)

  if (error) return 0
  return count ?? 0
}
