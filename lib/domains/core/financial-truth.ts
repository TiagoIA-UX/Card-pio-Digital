import { createAdminClient } from '@/lib/shared/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

export type FinancialTruthStatus = 'pending' | 'approved' | 'canceled' | 'refunded' | 'chargeback'

export type FinancialTruthSource = 'subscription' | 'payment' | 'reconciliation'

export interface FinancialTruthStatusSignals {
  paymentStatus?: string | null
  subscriptionStatus?: string | null
  mpSubscriptionStatus?: string | null
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

function normalizeStatus(value: string | null | undefined) {
  return (value || '').trim().toLowerCase()
}

export function deriveFinancialTruthStatus(
  signals: FinancialTruthStatusSignals
): FinancialTruthStatus {
  const paymentStatus = normalizeStatus(signals.paymentStatus)
  const subscriptionStatus = normalizeStatus(signals.subscriptionStatus)
  const mpSubscriptionStatus = normalizeStatus(signals.mpSubscriptionStatus)
  const restaurantPaymentStatus = normalizeStatus(signals.restaurantPaymentStatus)

  if (paymentStatus === 'charged_back' || paymentStatus === 'chargeback') {
    return 'chargeback'
  }

  if (paymentStatus === 'refunded' || paymentStatus === 'refund') {
    return 'refunded'
  }

  if (
    subscriptionStatus === 'canceled' ||
    subscriptionStatus === 'cancelled' ||
    subscriptionStatus === 'expired' ||
    mpSubscriptionStatus === 'cancelled' ||
    restaurantPaymentStatus === 'cancelado' ||
    restaurantPaymentStatus === 'expirado'
  ) {
    return 'canceled'
  }

  if (
    paymentStatus === 'approved' ||
    paymentStatus === 'authorized' ||
    subscriptionStatus === 'active' ||
    mpSubscriptionStatus === 'authorized' ||
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

  if (signals.mpSubscriptionStatus) {
    parts.push(`mp_subscription=${normalizeStatus(signals.mpSubscriptionStatus)}`)
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
      .select(
        'id, status, mp_preapproval_id, mp_subscription_status, last_payment_date, canceled_at, updated_at, created_at'
      )
      .eq('restaurant_id', input.tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (restaurantError) {
    throw restaurantError
  }

  if (subscriptionError) {
    throw subscriptionError
  }

  if (!restaurant) {
    return null
  }

  return {
    paymentStatus:
      typeof input.rawSnapshot?.payment_status === 'string'
        ? input.rawSnapshot.payment_status
        : null,
    subscriptionStatus: subscription?.status ?? null,
    mpSubscriptionStatus: subscription?.mp_subscription_status ?? null,
    restaurantPaymentStatus: restaurant.status_pagamento ?? null,
    sourceId: input.sourceId ?? subscription?.mp_preapproval_id ?? null,
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
      mp_subscription_status: subscription?.mp_subscription_status ?? null,
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
  if (!signals) {
    return null
  }

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

export async function syncFinancialTruthForTenant(
  admin: AdminClient,
  input: SyncFinancialTruthInput
) {
  const computed = await computeFinancialTruthForTenant(admin, input)
  if (!computed) {
    return null
  }

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

  if (error) {
    throw error
  }

  return {
    tenantId: computed.tenantId,
    status: computed.status,
    reason: computed.reason,
    lastEventAt: computed.lastEventAt,
  }
}
