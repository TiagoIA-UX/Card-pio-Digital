import { createAdminClient } from '@/lib/shared/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

export type FinancialTruthStatus = 'pending' | 'approved' | 'canceled' | 'refunded' | 'chargeback'
export type FinancialTruthSyncState = 'synced' | 'pending_sync'
export type FinancialTruthSource = 'subscription' | 'payment' | 'reconciliation'

export const FINANCIAL_TRUTH_SYNC_MAX_ATTEMPTS = 3
export const FINANCIAL_TRUTH_SYNC_BACKOFF_MINUTES = 15

export interface FinancialTruthStatusSignals {
  paymentStatus?: string | null
  subscriptionStatus?: string | null
  restaurantPaymentStatus?: string | null
}

interface SyncFinancialTruthInput {
  tenantId: string
  source: FinancialTruthSource
  sourceId?: string | null
  lastEventAt?: string | null
  rawSnapshot?: Record<string, unknown>
}

export interface FinancialTruthComputedRow {
  tenantId: string
  status: FinancialTruthStatus
  reason: string
  source: FinancialTruthSource
  sourceId: string | null
  lastEventAt: string
  rawSnapshot: Record<string, unknown>
}

interface FinancialTruthSyncQueueRow {
  tenant_id: string
  status: 'pending_sync' | 'synced' | 'failed'
  retry_attempts: number
  max_attempts: number
  next_retry_at: string
  escalated_at: string | null
}

export interface SyncFinancialTruthResult {
  tenantId: string
  status: FinancialTruthStatus
  reason: string
  lastEventAt: string
  syncState: FinancialTruthSyncState
  retryAttempts: number
  nextRetryAt: string | null
  manualReviewRequired: boolean
}

function normalizeStatus(value: string | null | undefined) {
  return (value || '').trim().toLowerCase()
}

function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

export function buildFinancialTruthSyncNextRetryAt(retryAttempts: number, baseDate = new Date()) {
  const effectiveAttempts = Math.max(retryAttempts, 1)
  return new Date(
    baseDate.getTime() + effectiveAttempts * FINANCIAL_TRUTH_SYNC_BACKOFF_MINUTES * 60 * 1000
  ).toISOString()
}

export function shouldRetryFinancialTruthSyncJob(params: {
  status: 'pending_sync' | 'synced' | 'failed' | null | undefined
  retryAttempts: number
  maxAttempts?: number | null
  nextRetryAt?: string | null
  now?: Date | string
}) {
  if (params.status !== 'pending_sync') return false

  const maxAttempts = params.maxAttempts ?? FINANCIAL_TRUTH_SYNC_MAX_ATTEMPTS
  if (params.retryAttempts >= maxAttempts) return false
  if (!params.nextRetryAt) return true

  const now =
    params.now instanceof Date ? params.now.getTime() : new Date(params.now ?? Date.now()).getTime()
  return new Date(params.nextRetryAt).getTime() <= now
}

export function deriveFinancialTruthStatus(
  signals: FinancialTruthStatusSignals
): FinancialTruthStatus {
  const paymentStatus = normalizeStatus(signals.paymentStatus)
  const subscriptionStatus = normalizeStatus(signals.subscriptionStatus)
  const restaurantPaymentStatus = normalizeStatus(signals.restaurantPaymentStatus)

  if (paymentStatus === 'charged_back' || paymentStatus === 'chargeback') return 'chargeback'
  if (paymentStatus === 'refunded' || paymentStatus === 'refund') return 'refunded'

  if (
    subscriptionStatus === 'canceled' ||
    subscriptionStatus === 'cancelled' ||
    subscriptionStatus === 'expired' ||
    restaurantPaymentStatus === 'cancelado' ||
    restaurantPaymentStatus === 'expirado'
  ) {
    return 'canceled'
  }

  if (
    paymentStatus === 'approved' ||
    paymentStatus === 'authorized' ||
    subscriptionStatus === 'active' ||
    restaurantPaymentStatus === 'ativo'
  ) {
    return 'approved'
  }

  return 'pending'
}

export function buildFinancialTruthReason(signals: FinancialTruthStatusSignals) {
  const parts: string[] = []

  if (signals.paymentStatus) {
    parts.push(`payment=${normalizeStatus(signals.paymentStatus)}`)
  }
  if (signals.subscriptionStatus) {
    parts.push(`subscription=${normalizeStatus(signals.subscriptionStatus)}`)
  }
  if (signals.restaurantPaymentStatus) {
    parts.push(`restaurant=${normalizeStatus(signals.restaurantPaymentStatus)}`)
  }

  return parts.length > 0 ? parts.join(' | ') : 'sem sinais financeiros conclusivos'
}

async function collectTenantFinancialTruthSignals(
  admin: AdminClient,
  input: SyncFinancialTruthInput
) {
  const [
    { data: restaurant, error: restaurantError },
    { data: subscription, error: subscriptionError },
  ] = await Promise.all([
    admin
      .from('restaurants')
      .select('id, status_pagamento, updated_at')
      .eq('id', input.tenantId)
      .maybeSingle(),
    admin
      .from('subscriptions')
      .select('id, status, last_payment_date, canceled_at, updated_at, created_at')
      .eq('restaurant_id', input.tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (restaurantError) throw restaurantError
  if (subscriptionError) throw subscriptionError
  if (!restaurant) return null

  return {
    paymentStatus:
      typeof input.rawSnapshot?.payment_status === 'string'
        ? input.rawSnapshot.payment_status
        : null,
    subscriptionStatus: subscription?.status ?? null,
    restaurantPaymentStatus: restaurant.status_pagamento ?? null,
    sourceId: input.sourceId ?? null,
    lastEventAt:
      input.lastEventAt ??
      subscription?.last_payment_date ??
      subscription?.canceled_at ??
      subscription?.updated_at ??
      restaurant.updated_at ??
      new Date().toISOString(),
    rawSnapshot: {
      ...(input.rawSnapshot ?? {}),
      restaurant_status_pagamento: restaurant.status_pagamento ?? null,
      subscription_status: subscription?.status ?? null,
      subscription_last_payment_date: subscription?.last_payment_date ?? null,
      subscription_canceled_at: subscription?.canceled_at ?? null,
    },
  }
}

export async function computeFinancialTruthForTenant(
  admin: AdminClient,
  input: SyncFinancialTruthInput
): Promise<FinancialTruthComputedRow | null> {
  const signals = await collectTenantFinancialTruthSignals(admin, input)
  if (!signals) return null

  const status = deriveFinancialTruthStatus(signals)
  const reason = buildFinancialTruthReason(signals)

  return {
    tenantId: input.tenantId,
    status,
    reason,
    source: input.source,
    sourceId: signals.sourceId,
    lastEventAt: signals.lastEventAt,
    rawSnapshot: signals.rawSnapshot,
  }
}

async function markFinancialTruthSyncAsResolved(
  admin: AdminClient,
  input: SyncFinancialTruthInput,
  computed: FinancialTruthComputedRow
) {
  const nowIso = new Date().toISOString()

  const { error } = await admin.from('financial_truth_sync_queue').upsert(
    {
      tenant_id: input.tenantId,
      status: 'synced',
      source: input.source,
      source_id: computed.sourceId,
      retry_attempts: 0,
      max_attempts: FINANCIAL_TRUTH_SYNC_MAX_ATTEMPTS,
      next_retry_at: nowIso,
      last_attempt_at: nowIso,
      last_error: null,
      raw_snapshot: computed.rawSnapshot,
      escalated_at: null,
      resolved_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: 'tenant_id', ignoreDuplicates: false }
  )

  if (error) throw error
}

async function registerFinancialTruthSyncRetry(
  admin: AdminClient,
  input: SyncFinancialTruthInput,
  computed: FinancialTruthComputedRow | null,
  error: unknown
): Promise<SyncFinancialTruthResult> {
  const now = new Date()
  const nowIso = now.toISOString()
  const errorMessage = normalizeErrorMessage(error)

  const { data: existingRow, error: existingRowError } = await admin
    .from('financial_truth_sync_queue')
    .select('tenant_id, status, retry_attempts, max_attempts, next_retry_at, escalated_at')
    .eq('tenant_id', input.tenantId)
    .maybeSingle<FinancialTruthSyncQueueRow>()

  if (existingRowError) throw existingRowError

  const maxAttempts = existingRow?.max_attempts ?? FINANCIAL_TRUTH_SYNC_MAX_ATTEMPTS
  const retryAttempts = Math.min((existingRow?.retry_attempts ?? 0) + 1, maxAttempts)
  const manualReviewRequired = retryAttempts >= maxAttempts
  const nextRetryAt = manualReviewRequired
    ? nowIso
    : buildFinancialTruthSyncNextRetryAt(retryAttempts, now)

  const { error: queueError } = await admin.from('financial_truth_sync_queue').upsert(
    {
      tenant_id: input.tenantId,
      status: manualReviewRequired ? 'failed' : 'pending_sync',
      source: input.source,
      source_id: input.sourceId ?? computed?.sourceId ?? null,
      retry_attempts: retryAttempts,
      max_attempts: maxAttempts,
      next_retry_at: nextRetryAt,
      last_attempt_at: nowIso,
      last_error: errorMessage,
      raw_snapshot: {
        ...(computed?.rawSnapshot ?? input.rawSnapshot ?? {}),
        sync_error: errorMessage,
        sync_source: input.source,
        retry_registered_at: nowIso,
      },
      escalated_at:
        manualReviewRequired && !existingRow?.escalated_at
          ? nowIso
          : (existingRow?.escalated_at ?? null),
      resolved_at: null,
      updated_at: nowIso,
    },
    { onConflict: 'tenant_id', ignoreDuplicates: false }
  )

  if (queueError) throw queueError

  if (manualReviewRequired && !existingRow?.escalated_at) {
    const { error: alertError } = await admin.from('system_alerts').insert({
      severity: 'critical',
      channel: 'financial_truth_sync',
      title: 'Retry de financial_truth esgotado',
      body: `Tenant ${input.tenantId} esgotou ${maxAttempts} tentativas de sincronização financeira.`,
      metadata: {
        tenant_id: input.tenantId,
        source: input.source,
        source_id: input.sourceId ?? computed?.sourceId ?? null,
        retry_attempts: retryAttempts,
        last_error: errorMessage,
      },
    })

    if (alertError) throw alertError
  }

  return {
    tenantId: input.tenantId,
    status: computed?.status ?? 'pending',
    reason: computed?.reason ?? 'financial_truth_sync_pending',
    lastEventAt: computed?.lastEventAt ?? input.lastEventAt ?? nowIso,
    syncState: 'pending_sync',
    retryAttempts,
    nextRetryAt,
    manualReviewRequired,
  }
}

export async function syncFinancialTruthForTenant(
  admin: AdminClient,
  input: SyncFinancialTruthInput
) {
  let computed: FinancialTruthComputedRow | null = null

  try {
    computed = await computeFinancialTruthForTenant(admin, input)
    if (!computed) return null

    const { error } = await admin.from('financial_truth').upsert(
      {
        tenant_id: input.tenantId,
        status: computed.status,
        source: computed.source,
        source_id: computed.sourceId,
        last_event_at: computed.lastEventAt,
        updated_at: new Date().toISOString(),
        reason: computed.reason,
        raw_snapshot: computed.rawSnapshot,
      },
      { onConflict: 'tenant_id', ignoreDuplicates: false }
    )

    if (error) throw error

    await markFinancialTruthSyncAsResolved(admin, input, computed)

    return {
      tenantId: computed.tenantId,
      status: computed.status,
      reason: computed.reason,
      lastEventAt: computed.lastEventAt,
      syncState: 'synced' as const,
      retryAttempts: 0,
      nextRetryAt: null,
      manualReviewRequired: false,
    }
  } catch (error) {
    return registerFinancialTruthSyncRetry(admin, input, computed, error)
  }
}

