import { createHash } from 'node:crypto'

import { notify, type AlertSeverity } from '@/lib/shared/notifications'
import { createAdminClient } from '@/lib/shared/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

type RestaurantRow = {
  id: string
  slug: string | null
  nome: string | null
  user_id: string | null
  created_at: string | null
  updated_at: string | null
  ativo: boolean | null
  suspended: boolean | null
  status_pagamento: string | null
  origin_sale: string | null
  plan_slug: string | null
  plano: string | null
  valor_pago: number | string | null
  data_pagamento: string | null
}

type SubscriptionRow = {
  restaurant_id: string | null
  status: string | null
  mp_subscription_status: string | null
  last_payment_date: string | null
  mp_preapproval_id: string | null
  created_at: string | null
}

type SystemLogRow = {
  details: string | Record<string, unknown> | null
}

export interface OperationalGhostRow {
  tenant_id: string
  slug: string | null
  nome: string | null
  created_at: string | null
  status_pagamento: string | null
  origin_sale: string | null
  plan_slug: string | null
  plano: string | null
  valor_pago: number | string | null
  data_pagamento: string | null
  subscription_status: string | null
  mp_subscription_status: string | null
  last_payment_date: string | null
  mp_preapproval_id: string | null
  classification: 'operational_ghost'
}

export interface OperationalGhostReport {
  scanned_active_restaurants: number
  hours_threshold: number
  flagged_count: number
  rows: OperationalGhostRow[]
}

export interface OperationalGhostAlertAction {
  id: string
  label: string
  endpoint: string
  method: 'POST'
  tone: 'primary' | 'warning' | 'neutral'
  payload: {
    action: 'start_trial' | 'block_until_payment' | 'register_manual_review'
    tenant_id: string
    days?: number
    note: string
  }
}

export function getOperationalGhostSeverity(flaggedCount: number): AlertSeverity {
  if (flaggedCount >= 3) return 'critical'
  if (flaggedCount > 0) return 'warning'
  return 'info'
}

export function buildOperationalGhostFingerprint(report: OperationalGhostReport): string {
  const ids = report.rows
    .map((row) => row.tenant_id)
    .sort()
    .join('|')

  return createHash('sha256')
    .update(`${report.hours_threshold}:${report.flagged_count}:${ids}`)
    .digest('hex')
}

export function buildOperationalGhostAlertBody(report: OperationalGhostReport): string {
  if (report.flagged_count === 0) {
    return `Nenhum delivery ativo sem lastro financeiro foi encontrado nas ultimas ${report.hours_threshold}h.`
  }

  const preview = report.rows
    .slice(0, 10)
    .map((row) => {
      const name = row.nome || row.slug || row.tenant_id
      return [
        `- ${name}`,
        row.slug ? `slug=${row.slug}` : null,
        row.status_pagamento ? `status=${row.status_pagamento}` : null,
        row.origin_sale ? `origem=${row.origin_sale}` : null,
        row.created_at ? `criado_em=${row.created_at}` : null,
      ]
        .filter(Boolean)
        .join(' | ')
    })
    .join('\n')

  return [
    `Foram detectados ${report.flagged_count} deliverys ativos sem assinatura, sem evidencia de pagamento e com status financeiro pendente.`,
    `Janela analisada: ultimas ${report.hours_threshold}h.`,
    'Acao recomendada: revisar os casos no mesmo dia e decidir entre trial explicito, bloqueio ate regularizacao ou ajuste manual auditado.',
    'Casos:',
    preview,
    report.flagged_count > 10 ? `... e mais ${report.flagged_count - 10} caso(s).` : '',
    'Passos imediatos:',
    '1. Conferir se houve pagamento real fora do fluxo esperado.',
    '2. Se nao houve, decidir a regularizacao sem promover para pago automaticamente.',
    '3. Confirmar que nenhum novo canal nasceu pelo fluxo legado.',
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildOperationalGhostAlertActions(
  report: OperationalGhostReport
): OperationalGhostAlertAction[] {
  return report.rows.slice(0, 10).flatMap((row) => {
    const labelBase = row.nome || row.slug || row.tenant_id

    return [
      {
        id: `${row.tenant_id}:start_trial`,
        label: `Trial: ${labelBase}`,
        endpoint: '/api/admin/operational-ghosts/regularize',
        method: 'POST' as const,
        tone: 'primary' as const,
        payload: {
          action: 'start_trial' as const,
          tenant_id: row.tenant_id,
          days: 7,
          note: 'Regularizacao de operational ghost via alerta: conversao para trial curto.',
        },
      },
      {
        id: `${row.tenant_id}:block_until_payment`,
        label: `Bloquear: ${labelBase}`,
        endpoint: '/api/admin/operational-ghosts/regularize',
        method: 'POST' as const,
        tone: 'warning' as const,
        payload: {
          action: 'block_until_payment' as const,
          tenant_id: row.tenant_id,
          note: 'Regularizacao de operational ghost via alerta: bloqueio ate pagamento.',
        },
      },
      {
        id: `${row.tenant_id}:register_manual_review`,
        label: `Registrar analise: ${labelBase}`,
        endpoint: '/api/admin/operational-ghosts/regularize',
        method: 'POST' as const,
        tone: 'neutral' as const,
        payload: {
          action: 'register_manual_review' as const,
          tenant_id: row.tenant_id,
          note: 'Regularizacao de operational ghost via alerta: caso assumido para analise manual auditada.',
        },
      },
    ]
  })
}

function parseSystemLogDetails(details: string | Record<string, unknown> | null) {
  if (!details) return null
  if (typeof details === 'string') {
    try {
      return JSON.parse(details) as Record<string, unknown>
    } catch {
      return null
    }
  }
  return details
}

export async function getOperationalGhostReport(
  admin: AdminClient,
  options?: { hours?: number }
): Promise<OperationalGhostReport> {
  const hours = options?.hours && options.hours > 0 ? options.hours : 24
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

  const [
    { data: restaurants, error: restaurantsError },
    { data: subscriptions, error: subscriptionsError },
  ] = await Promise.all([
    admin
      .from('restaurants')
      .select(
        'id, slug, nome, user_id, created_at, updated_at, ativo, suspended, status_pagamento, origin_sale, plan_slug, plano, valor_pago, data_pagamento'
      )
      .eq('ativo', true)
      .eq('suspended', false)
      .lte('created_at', cutoff)
      .order('created_at', { ascending: true })
      .returns<RestaurantRow[]>(),
    admin
      .from('subscriptions')
      .select(
        'restaurant_id, status, mp_subscription_status, last_payment_date, mp_preapproval_id, created_at'
      )
      .order('created_at', { ascending: false })
      .returns<SubscriptionRow[]>(),
  ])

  if (restaurantsError) {
    throw new Error(`Falha ao listar deliverys ativos: ${restaurantsError.message}`)
  }

  if (subscriptionsError) {
    throw new Error(`Falha ao listar subscriptions: ${subscriptionsError.message}`)
  }

  const subscriptionByRestaurantId = new Map<string, SubscriptionRow>()
  for (const subscription of subscriptions ?? []) {
    if (!subscription.restaurant_id || subscriptionByRestaurantId.has(subscription.restaurant_id)) {
      continue
    }
    subscriptionByRestaurantId.set(subscription.restaurant_id, subscription)
  }

  const rows = (restaurants ?? [])
    .map((restaurant) => {
      const subscription = subscriptionByRestaurantId.get(restaurant.id) ?? null
      const hasFinancialSubscription = Boolean(subscription)
      const hasPaymentEvidence =
        Boolean(subscription?.last_payment_date) ||
        Boolean(subscription?.mp_preapproval_id) ||
        Number(restaurant.valor_pago ?? 0) > 0 ||
        Boolean(restaurant.data_pagamento)

      const isOperationalGhost =
        restaurant.status_pagamento === 'pendente' &&
        !hasFinancialSubscription &&
        !hasPaymentEvidence

      if (!isOperationalGhost) {
        return null
      }

      return {
        tenant_id: restaurant.id,
        slug: restaurant.slug,
        nome: restaurant.nome,
        created_at: restaurant.created_at,
        status_pagamento: restaurant.status_pagamento,
        origin_sale: restaurant.origin_sale,
        plan_slug: restaurant.plan_slug,
        plano: restaurant.plano,
        valor_pago: restaurant.valor_pago,
        data_pagamento: restaurant.data_pagamento,
        subscription_status: subscription?.status ?? null,
        mp_subscription_status: subscription?.mp_subscription_status ?? null,
        last_payment_date: subscription?.last_payment_date ?? null,
        mp_preapproval_id: subscription?.mp_preapproval_id ?? null,
        classification: 'operational_ghost' as const,
      }
    })
    .filter((row): row is OperationalGhostRow => Boolean(row))

  return {
    scanned_active_restaurants: (restaurants ?? []).length,
    hours_threshold: hours,
    flagged_count: rows.length,
    rows,
  }
}

export async function saveOperationalGhostSnapshot(
  admin: AdminClient,
  input: {
    report: OperationalGhostReport
    severity: AlertSeverity
    fingerprint: string
    source: string
    notified: boolean
    actorId?: string | null
  }
) {
  await admin.from('system_logs').insert({
    action: 'operational_ghosts_scan',
    details: JSON.stringify({
      timestamp: new Date().toISOString(),
      source: input.source,
      severity: input.severity,
      fingerprint: input.fingerprint,
      notified: input.notified,
      actor_id: input.actorId ?? null,
      report: input.report,
    }),
    created_by: input.actorId ?? 'system',
  })
}

export async function hasRecentOperationalGhostFingerprint(
  admin: AdminClient,
  fingerprint: string,
  lookbackHours = 36
) {
  const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString()
  const { data, error } = await admin
    .from('system_logs')
    .select('details')
    .eq('action', 'operational_ghosts_scan')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(20)
    .returns<SystemLogRow[]>()

  if (error) {
    throw new Error(`Falha ao verificar snapshots recentes: ${error.message}`)
  }

  return (data ?? []).some((row) => parseSystemLogDetails(row.details)?.fingerprint === fingerprint)
}

export async function runOperationalGhostScan(input?: {
  admin?: AdminClient
  hours?: number
  source?: string
  actorId?: string | null
  forceNotify?: boolean
}) {
  const admin = input?.admin ?? createAdminClient()
  const report = await getOperationalGhostReport(admin, { hours: input?.hours })
  const severity = getOperationalGhostSeverity(report.flagged_count)
  const fingerprint = buildOperationalGhostFingerprint(report)
  const source = input?.source ?? 'manual'

  let notified = false
  let suppressedDuplicate = false

  if (report.flagged_count > 0) {
    const alreadySeen = input?.forceNotify
      ? false
      : await hasRecentOperationalGhostFingerprint(admin, fingerprint)

    if (!alreadySeen) {
      await notify({
        severity,
        channel: 'system',
        title:
          severity === 'critical'
            ? 'Deliverys ativos sem lastro financeiro'
            : 'Novo caso de delivery sem lastro financeiro',
        body: buildOperationalGhostAlertBody(report),
        metadata: {
          source: `operational-ghosts/${source}`,
          fingerprint,
          report,
          actions: buildOperationalGhostAlertActions(report),
          admin_path: '/admin/alertas?channel=system&unread=true',
          actorId: input?.actorId ?? null,
        },
        emailAdmin: true,
      })
      notified = true
    } else {
      suppressedDuplicate = true
    }
  }

  await saveOperationalGhostSnapshot(admin, {
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

