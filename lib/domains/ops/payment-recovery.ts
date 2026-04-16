import { createHash } from 'node:crypto'

import { getQuickOrderWhatsAppUrl } from '@/lib/domains/core/whatsapp'
import { notify, type AlertSeverity } from '@/lib/shared/notifications'
import { createAdminClient } from '@/lib/shared/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

type TemplateOrderRow = {
  id: string
  order_number: string | null
  user_id: string | null
  status: string | null
  payment_status: string | null
  payment_method: string | null
  total: number | null
  payment_id: string | null
  created_at: string | null
  updated_at: string | null
  metadata: string | Record<string, unknown> | null
}

type CheckoutSessionRow = {
  id: string
  order_id: string
  user_id: string | null
  status: string | null
  init_point: string | null
  sandbox_init_point: string | null
  mp_preference_id: string | null
  created_at: string | null
  updated_at: string | null
  last_recovery_action_at: string | null
  last_recovery_action_type: string | null
  metadata: string | Record<string, unknown> | null
}

type SystemLogRow = {
  id?: string | null
  action?: string | null
  created_at?: string | null
  metadata?: string | Record<string, unknown> | null
}

type OrderStatusRow = {
  id: string
  payment_status: string | null
  updated_at: string | null
}

type PaymentRecoveryActionType =
  | 'resend_payment_link'
  | 'mark_waiting_customer'
  | 'register_manual_review'

export interface RecoverablePaymentRow {
  order_id: string
  order_number: string | null
  user_id: string | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  restaurant_name: string | null
  template_slug: string | null
  plan_slug: string | null
  payment_method: string | null
  total: number | null
  created_at: string | null
  updated_at: string | null
  payment_status: string | null
  onboarding_status: string | null
  checkout_session_id: string
  checkout_url: string
  checkout_updated_at: string | null
  last_recovery_action_at: string | null
  last_recovery_action_type: string | null
  cooldown_active: boolean
  classification: 'payment_failed_recoverable'
}

export interface RecoverablePaymentReport {
  lookback_days: number
  cooldown_hours: number
  scanned_rejected_orders: number
  flagged_count: number
  rows: RecoverablePaymentRow[]
}

export interface RecoverablePaymentAlertAction {
  id: string
  label: string
  endpoint: string
  method: 'POST'
  tone: 'primary' | 'warning' | 'neutral'
  payload: {
    action: PaymentRecoveryActionType
    order_id: string
    note: string
  }
}

export interface PaymentRecoveryMetrics {
  window_days: number
  scans_total: number
  scans_with_cases: number
  flagged_total: number
  latest_scan_at: string | null
  actions_total: number
  resend_actions: number
  waiting_actions: number
  manual_review_actions: number
  conversions_after_action: number
}

function parseRecord(value: string | Record<string, unknown> | null) {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Record<string, unknown>
    } catch {
      return null
    }
  }
  return value
}

function toTimestamp(value: string | null | undefined) {
  if (!value) return Number.NaN
  return new Date(value).getTime()
}

function isRecent(dateIso: string | null, hours: number) {
  if (!dateIso) return false
  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) return false
  return Date.now() - date.getTime() < hours * 60 * 60 * 1000
}

function isValidCheckoutUrl(value: string | null) {
  return Boolean(value && /^https?:\/\//i.test(value))
}

function hasProvisioning(metadata: Record<string, unknown> | null, order: TemplateOrderRow) {
  return Boolean(
    order.status === 'completed' ||
    order.payment_status === 'approved' ||
    order.payment_id ||
    metadata?.provisioned_restaurant_id ||
    metadata?.activation_url ||
    metadata?.provisioned_at ||
    metadata?.onboarding_status === 'ready'
  )
}

function sanitizePhone(phone: string | null | undefined) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return null
  return digits.startsWith('55') ? digits : `55${digits}`
}

export function buildRecoverablePaymentMessage(row: RecoverablePaymentRow) {
  const customerName = row.customer_name?.trim() || 'Olá'
  return [
    `${customerName}, identificamos que o pagamento não foi concluído.`,
    'Use o link abaixo para finalizar e liberar seu delivery.',
    '',
    row.checkout_url,
  ].join('\n')
}

export function buildRecoverablePaymentWhatsAppUrl(row: RecoverablePaymentRow) {
  const phone = sanitizePhone(row.customer_phone)
  if (!phone) return null
  return getQuickOrderWhatsAppUrl(phone, buildRecoverablePaymentMessage(row))
}

export function getRecoverablePaymentSeverity(flaggedCount: number): AlertSeverity {
  if (flaggedCount >= 3) return 'critical'
  if (flaggedCount > 0) return 'warning'
  return 'info'
}

export function buildRecoverablePaymentFingerprint(report: RecoverablePaymentReport): string {
  const ids = report.rows
    .map((row) => row.order_id)
    .sort()
    .join('|')

  return createHash('sha256')
    .update(`${report.lookback_days}:${report.cooldown_hours}:${report.flagged_count}:${ids}`)
    .digest('hex')
}

export function buildRecoverablePaymentAlertBody(report: RecoverablePaymentReport): string {
  if (report.flagged_count === 0) {
    return `Nenhum pagamento recusado recuperável foi encontrado nos últimos ${report.lookback_days} dias.`
  }

  const preview = report.rows
    .slice(0, 10)
    .map((row) => {
      const label = row.restaurant_name || row.customer_name || row.order_number || row.order_id
      const cooldown = row.cooldown_active ? 'cooldown=ativo' : 'cooldown=livre'

      return [
        `- ${label}`,
        row.order_number ? `checkout=${row.order_number}` : null,
        row.payment_method ? `metodo=${row.payment_method}` : null,
        row.created_at ? `criado_em=${row.created_at}` : null,
        cooldown,
      ]
        .filter(Boolean)
        .join(' | ')
    })
    .join('\n')

  return [
    `Foram detectados ${report.flagged_count} pagamentos recusados com link reaproveitável e sem provisionamento concluído.`,
    `Janela analisada: últimos ${report.lookback_days} dias. Cooldown operacional: ${report.cooldown_hours}h.`,
    'Ação recomendada: reenviar o link válido mais recente quando o cooldown estiver livre e registrar acompanhamento no mesmo atendimento.',
    'Casos:',
    preview,
    report.flagged_count > 10 ? `... e mais ${report.flagged_count - 10} caso(s).` : '',
    'Passos imediatos:',
    '1. Revalidar que o status continua recusado antes de acionar o cliente.',
    '2. Usar sempre o checkout mais recente válido, sem recriar pagamento.',
    '3. Registrar espera do cliente ou análise manual quando o reenvio não couber.',
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildRecoverablePaymentAlertActions(
  report: RecoverablePaymentReport
): RecoverablePaymentAlertAction[] {
  return report.rows.slice(0, 10).flatMap((row) => {
    const labelBase = row.restaurant_name || row.customer_name || row.order_number || row.order_id
    const actions: RecoverablePaymentAlertAction[] = []

    if (!row.cooldown_active && buildRecoverablePaymentWhatsAppUrl(row)) {
      actions.push({
        id: `${row.order_id}:resend_payment_link`,
        label: `Reenviar link: ${labelBase}`,
        endpoint: '/api/admin/payment-recovery',
        method: 'POST',
        tone: 'primary',
        payload: {
          action: 'resend_payment_link',
          order_id: row.order_id,
          note: 'Recuperação via alerta: link existente reenviado ao cliente sem recriar checkout.',
        },
      })
    }

    actions.push(
      {
        id: `${row.order_id}:mark_waiting_customer`,
        label: `Aguardando cliente: ${labelBase}`,
        endpoint: '/api/admin/payment-recovery',
        method: 'POST',
        tone: 'warning',
        payload: {
          action: 'mark_waiting_customer',
          order_id: row.order_id,
          note: 'Recuperação via alerta: cliente orientado a concluir o pagamento.',
        },
      },
      {
        id: `${row.order_id}:register_manual_review`,
        label: `Registrar análise: ${labelBase}`,
        endpoint: '/api/admin/payment-recovery',
        method: 'POST',
        tone: 'neutral',
        payload: {
          action: 'register_manual_review',
          order_id: row.order_id,
          note: 'Recuperação via alerta: caso assumido para análise manual auditada.',
        },
      }
    )

    return actions
  })
}

function pickLatestValidCheckoutSession(sessions: CheckoutSessionRow[]) {
  return sessions
    .filter((session) => isValidCheckoutUrl(session.init_point))
    .sort((left, right) => {
      const rightTs = new Date(right.updated_at || right.created_at || 0).getTime()
      const leftTs = new Date(left.updated_at || left.created_at || 0).getTime()
      return rightTs - leftTs
    })[0]
}

export async function getRecoverablePaymentReport(
  admin: AdminClient,
  options?: { lookbackDays?: number; cooldownHours?: number }
): Promise<RecoverablePaymentReport> {
  const lookbackDays = options?.lookbackDays && options.lookbackDays > 0 ? options.lookbackDays : 7
  const cooldownHours =
    options?.cooldownHours && options.cooldownHours > 0 ? options.cooldownHours : 24
  const cutoff = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString()

  const { data: orders, error: ordersError } = await admin
    .from('template_orders')
    .select(
      'id, order_number, user_id, status, payment_status, payment_method, total, payment_id, created_at, updated_at, metadata'
    )
    .eq('payment_status', 'rejected')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })
    .returns<TemplateOrderRow[]>()

  if (ordersError) {
    throw new Error(`Falha ao listar template_orders rejeitados: ${ordersError.message}`)
  }

  const orderIds = (orders ?? []).map((order) => order.id)
  if (orderIds.length === 0) {
    return {
      lookback_days: lookbackDays,
      cooldown_hours: cooldownHours,
      scanned_rejected_orders: 0,
      flagged_count: 0,
      rows: [],
    }
  }

  const { data: sessions, error: sessionsError } = await admin
    .from('checkout_sessions')
    .select(
      'id, order_id, user_id, status, init_point, sandbox_init_point, mp_preference_id, created_at, updated_at, last_recovery_action_at, last_recovery_action_type, metadata'
    )
    .in('order_id', orderIds)
    .order('updated_at', { ascending: false })
    .returns<CheckoutSessionRow[]>()

  if (sessionsError) {
    throw new Error(`Falha ao listar checkout_sessions: ${sessionsError.message}`)
  }

  const sessionsByOrder = new Map<string, CheckoutSessionRow[]>()
  for (const session of sessions ?? []) {
    const bucket = sessionsByOrder.get(session.order_id) ?? []
    bucket.push(session)
    sessionsByOrder.set(session.order_id, bucket)
  }

  const rows = (orders ?? [])
    .map((order) => {
      const metadata = parseRecord(order.metadata)
      if (hasProvisioning(metadata, order)) {
        return null
      }

      const latestValidSession = pickLatestValidCheckoutSession(sessionsByOrder.get(order.id) ?? [])
      if (!latestValidSession?.init_point) {
        return null
      }

      const cooldownActive = isRecent(latestValidSession.last_recovery_action_at, cooldownHours)
      if (cooldownActive) {
        return null
      }

      return {
        order_id: order.id,
        order_number: order.order_number,
        user_id: order.user_id,
        customer_name: typeof metadata?.customer_name === 'string' ? metadata.customer_name : null,
        customer_email:
          typeof metadata?.customer_email === 'string' ? metadata.customer_email : null,
        customer_phone:
          typeof metadata?.customer_phone === 'string' ? metadata.customer_phone : null,
        restaurant_name:
          typeof metadata?.restaurant_name === 'string' ? metadata.restaurant_name : null,
        template_slug: typeof metadata?.template_slug === 'string' ? metadata.template_slug : null,
        plan_slug: typeof metadata?.plan_slug === 'string' ? metadata.plan_slug : null,
        payment_method: order.payment_method,
        total: order.total,
        created_at: order.created_at,
        updated_at: order.updated_at,
        payment_status: order.payment_status,
        onboarding_status:
          typeof metadata?.onboarding_status === 'string' ? metadata.onboarding_status : null,
        checkout_session_id: latestValidSession.id,
        checkout_url: latestValidSession.init_point,
        checkout_updated_at: latestValidSession.updated_at,
        last_recovery_action_at: latestValidSession.last_recovery_action_at,
        last_recovery_action_type: latestValidSession.last_recovery_action_type,
        cooldown_active: false,
        classification: 'payment_failed_recoverable' as const,
      }
    })
    .filter((row): row is RecoverablePaymentRow => Boolean(row))

  return {
    lookback_days: lookbackDays,
    cooldown_hours: cooldownHours,
    scanned_rejected_orders: (orders ?? []).length,
    flagged_count: rows.length,
    rows,
  }
}

async function saveRecoverablePaymentSnapshot(
  admin: AdminClient,
  input: {
    report: RecoverablePaymentReport
    severity: AlertSeverity
    fingerprint: string
    source: string
    notified: boolean
    actorId?: string | null
  }
) {
  const normalizedActorId =
    input.actorId && input.actorId !== 'cron' && input.actorId !== 'system' && input.actorId !== 'service-account'
      ? input.actorId
      : null
  const normalizedActorType = input.actorId === 'cron' ? 'cron' : 'system'

  await admin.from('system_logs').insert({
    actor_id: normalizedActorId,
    actor_type: normalizedActorType,
    action: 'payment_recovery_scan',
    entity: 'payment_recovery',
    entity_id: null,
    metadata: {
      timestamp: new Date().toISOString(),
      source: input.source,
      severity: input.severity,
      fingerprint: input.fingerprint,
      notified: input.notified,
      actor_id: input.actorId ?? null,
      report: input.report,
    },
  })
}

export async function hasRecentRecoverablePaymentFingerprint(
  admin: AdminClient,
  fingerprint: string,
  lookbackHours = 36
) {
  const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString()
  const { data, error } = await admin
    .from('system_logs')
    .select('id, action, created_at, metadata')
    .eq('action', 'payment_recovery_scan')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(20)
    .returns<SystemLogRow[]>()

  if (error) {
    throw new Error(`Falha ao verificar snapshots recentes de recuperação: ${error.message}`)
  }

  return (data ?? []).some((row) => parseRecord(row.metadata ?? null)?.fingerprint === fingerprint)
}

export async function runRecoverablePaymentScan(input?: {
  admin?: AdminClient
  lookbackDays?: number
  cooldownHours?: number
  source?: string
  actorId?: string | null
  forceNotify?: boolean
}) {
  const admin = input?.admin ?? createAdminClient()
  const report = await getRecoverablePaymentReport(admin, {
    lookbackDays: input?.lookbackDays,
    cooldownHours: input?.cooldownHours,
  })
  const severity = getRecoverablePaymentSeverity(report.flagged_count)
  const fingerprint = buildRecoverablePaymentFingerprint(report)
  const source = input?.source ?? 'manual'

  let notified = false
  let suppressedDuplicate = false

  if (report.flagged_count > 0) {
    const alreadySeen = input?.forceNotify
      ? false
      : await hasRecentRecoverablePaymentFingerprint(admin, fingerprint)

    if (!alreadySeen) {
      await notify({
        severity,
        channel: 'payment',
        title:
          severity === 'critical'
            ? 'Pagamentos recusados recuperáveis em aberto'
            : 'Novo pagamento recusado recuperável',
        body: buildRecoverablePaymentAlertBody(report),
        metadata: {
          source: `payment-recovery/${source}`,
          fingerprint,
          report,
          actions: buildRecoverablePaymentAlertActions(report),
          admin_path: '/admin/alertas?channel=payment&unread=true',
          actorId: input?.actorId ?? null,
        },
        emailAdmin: true,
      })
      notified = true
    } else {
      suppressedDuplicate = true
    }
  }

  await saveRecoverablePaymentSnapshot(admin, {
    report,
    severity,
    fingerprint,
    source,
    notified,
    actorId: input?.actorId ?? null,
  })

  return {
    report,
    severity,
    fingerprint,
    notified,
    suppressedDuplicate,
  }
}

export function buildPaymentRecoveryMetrics(input: {
  windowDays: number
  logs: SystemLogRow[]
  orders: OrderStatusRow[]
}): PaymentRecoveryMetrics {
  const scans = input.logs.filter((row) => row.action === 'payment_recovery_scan')
  const actions = input.logs.filter((row) => row.action === 'payment_recovery_action')
  const ordersById = new Map(input.orders.map((order) => [order.id, order]))
  const latestActionAtByOrder = new Map<string, number>()

  let scansWithCases = 0
  let flaggedTotal = 0
  let latestScanAt: string | null = null
  let resendActions = 0
  let waitingActions = 0
  let manualReviewActions = 0

  for (const scan of scans) {
    const details = parseRecord(scan.metadata ?? null)
    const report = parseRecord(details?.report as string | Record<string, unknown> | null)
    const flaggedCount = Number(report?.flagged_count ?? 0)
    flaggedTotal += Number.isFinite(flaggedCount) ? flaggedCount : 0
    if (flaggedCount > 0) {
      scansWithCases += 1
    }

    const createdAt = scan.created_at ?? (typeof details?.timestamp === 'string' ? details.timestamp : null)
    if (!latestScanAt || toTimestamp(createdAt) > toTimestamp(latestScanAt)) {
      latestScanAt = createdAt
    }
  }

  for (const actionRow of actions) {
    const details = parseRecord(actionRow.metadata ?? null)
    const action = typeof details?.action === 'string' ? details.action : null
    const orderId = typeof details?.order_id === 'string' ? details.order_id : null
    const actionAt =
      typeof details?.timestamp === 'string'
        ? details.timestamp
        : actionRow.created_at ?? null

    if (action === 'resend_payment_link') resendActions += 1
    if (action === 'mark_waiting_customer') waitingActions += 1
    if (action === 'register_manual_review') manualReviewActions += 1

    if (orderId && actionAt) {
      const actionTs = toTimestamp(actionAt)
      const current = latestActionAtByOrder.get(orderId)
      if (!current || actionTs > current) {
        latestActionAtByOrder.set(orderId, actionTs)
      }
    }
  }

  let conversionsAfterAction = 0
  for (const [orderId, actionTs] of latestActionAtByOrder.entries()) {
    const order = ordersById.get(orderId)
    if (!order || order.payment_status !== 'approved') {
      continue
    }

    const updatedAt = toTimestamp(order.updated_at)
    if (Number.isFinite(updatedAt) && updatedAt >= actionTs) {
      conversionsAfterAction += 1
    }
  }

  return {
    window_days: input.windowDays,
    scans_total: scans.length,
    scans_with_cases: scansWithCases,
    flagged_total: flaggedTotal,
    latest_scan_at: latestScanAt,
    actions_total: actions.length,
    resend_actions: resendActions,
    waiting_actions: waitingActions,
    manual_review_actions: manualReviewActions,
    conversions_after_action: conversionsAfterAction,
  }
}

export async function getPaymentRecoveryMetrics(
  admin: AdminClient,
  options?: { windowDays?: number }
): Promise<PaymentRecoveryMetrics> {
  const windowDays = options?.windowDays && options.windowDays > 0 ? options.windowDays : 30
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString()

  const { data: logs, error: logsError } = await admin
    .from('system_logs')
    .select('id, action, created_at, metadata')
    .in('action', ['payment_recovery_scan', 'payment_recovery_action'])
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .returns<SystemLogRow[]>()

  if (logsError) {
    throw new Error(`Falha ao listar logs de recovery: ${logsError.message}`)
  }

  const actionOrderIds = Array.from(
    new Set(
      (logs ?? [])
        .filter((row) => row.action === 'payment_recovery_action')
        .map((row) => parseRecord(row.metadata ?? null)?.order_id)
        .filter((value): value is string => typeof value === 'string')
    )
  )

  let orders: OrderStatusRow[] = []
  if (actionOrderIds.length > 0) {
    const { data: orderRows, error: ordersError } = await admin
      .from('template_orders')
      .select('id, payment_status, updated_at')
      .in('id', actionOrderIds)
      .returns<OrderStatusRow[]>()

    if (ordersError) {
      throw new Error(`Falha ao listar template_orders para métricas: ${ordersError.message}`)
    }

    orders = orderRows ?? []
  }

  return buildPaymentRecoveryMetrics({
    windowDays,
    logs: logs ?? [],
    orders,
  })
}
