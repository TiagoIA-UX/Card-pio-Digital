import { getValidatedMercadoPagoAccessToken } from '@/lib/domains/core/mercadopago'

export const STATE_PRIORITY = {
  rejected: 0,
  canceled: 1,
  pending: 2,
  trial: 3,
  past_due: 4,
  active: 5,
} as const

export type SubscriptionState = 'pending' | 'trial' | 'active' | 'past_due' | 'canceled'

export interface ExternalReferenceDiagnostic {
  kind: 'missing' | 'short' | 'json' | 'invalid'
  raw: string | null
  orderId: string | null
  contractHash: string | null
  legacyRestaurantId: string | null
  legacyUserId: string | null
  legacyPlanSlug: string | null
}

export interface FinancialConsistencyInput {
  currencyId: string | null
  mpAmount: number | null
  contractedAmount: number | null
  tolerance?: number
}

export interface MercadoPagoPreapprovalSnapshot {
  id: string
  status: string
  externalReference: string | null
  lastModified: string | null
  nextPaymentDate: string | null
  autoRecurring: {
    currencyId: string | null
    transactionAmount: number | null
    freeTrialEndDate: string | null
    startDate: string | null
  }
  raw: unknown
}

export function parseExternalReferenceDiagnostic(raw: string | null): ExternalReferenceDiagnostic {
  if (!raw) {
    return {
      kind: 'missing',
      raw,
      orderId: null,
      contractHash: null,
      legacyRestaurantId: null,
      legacyUserId: null,
      legacyPlanSlug: null,
    }
  }

  if (raw.startsWith('onb:')) {
    const [, orderId, contractHash] = raw.split(':')
    return {
      kind: 'short',
      raw,
      orderId: orderId || null,
      contractHash: contractHash || null,
      legacyRestaurantId: null,
      legacyUserId: null,
      legacyPlanSlug: null,
    }
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return {
      kind: 'json',
      raw,
      orderId: typeof parsed.order_id === 'string' ? parsed.order_id : null,
      contractHash: typeof parsed.contract_hash === 'string' ? parsed.contract_hash : null,
      legacyRestaurantId: typeof parsed.restaurant_id === 'string' ? parsed.restaurant_id : null,
      legacyUserId: typeof parsed.user_id === 'string' ? parsed.user_id : null,
      legacyPlanSlug: typeof parsed.plan_slug === 'string' ? parsed.plan_slug : null,
    }
  } catch {
    return {
      kind: 'invalid',
      raw,
      orderId: null,
      contractHash: null,
      legacyRestaurantId: null,
      legacyUserId: null,
      legacyPlanSlug: null,
    }
  }
}

export function validatePreapprovalOwnership(
  externalReference: string | null,
  billingModel: string | null
) {
  if (billingModel === 'subscription_preapproval') {
    if (!externalReference?.startsWith('onb:')) {
      throw new Error('preapproval_not_owned_by_system')
    }

    return { kind: 'shadow_onboarding' as const }
  }

  if (externalReference?.startsWith('onb:')) {
    return { kind: 'shadow_onboarding' as const }
  }

  const diagnostic = parseExternalReferenceDiagnostic(externalReference)
  if (
    diagnostic.kind === 'json' &&
    diagnostic.legacyRestaurantId &&
    diagnostic.legacyUserId &&
    diagnostic.legacyPlanSlug
  ) {
    return { kind: 'legacy_json' as const }
  }

  throw new Error('preapproval_not_owned_by_system')
}

export function validatePreapprovalFinancialConsistency(input: FinancialConsistencyInput) {
  const tolerance = input.tolerance ?? 0.01

  if (input.currencyId !== 'BRL') {
    return { ok: false as const, reason: 'invalid_currency' }
  }

  if (input.mpAmount == null || input.contractedAmount == null) {
    return { ok: false as const, reason: 'missing_amount' }
  }

  if (Math.abs(input.mpAmount - input.contractedAmount) > tolerance) {
    return { ok: false as const, reason: 'amount_mismatch' }
  }

  return { ok: true as const }
}

export function mapMercadoPagoSubscriptionStatus(input: {
  mpStatus: string
  freeTrialEndDate?: string | null
  startDate?: string | null
  now?: Date
}): { status: SubscriptionState; rank: number } {
  const now = input.now ?? new Date()

  switch (input.mpStatus) {
    case 'authorized':
      return { status: 'active', rank: STATE_PRIORITY.active }
    case 'paused':
      return { status: 'past_due', rank: STATE_PRIORITY.past_due }
    case 'cancelled':
      return { status: 'canceled', rank: STATE_PRIORITY.canceled }
    case 'pending': {
      const freeTrialEndDate = input.freeTrialEndDate ? new Date(input.freeTrialEndDate) : null
      const startDate = input.startDate ? new Date(input.startDate) : null
      const isTrial =
        Boolean(freeTrialEndDate && freeTrialEndDate > now) || Boolean(startDate && startDate > now)

      if (isTrial) {
        return { status: 'trial', rank: STATE_PRIORITY.trial }
      }

      return { status: 'pending', rank: STATE_PRIORITY.pending }
    }
    default:
      throw new Error(`unsupported_mp_status:${input.mpStatus}`)
  }
}

export async function fetchPreapprovalWithTimeoutAndRetry(
  preapprovalId: string,
  timeoutMs = 8000
): Promise<MercadoPagoPreapprovalSnapshot> {
  let lastError: unknown

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const accessToken = await getValidatedMercadoPagoAccessToken()
      const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`mercadopago_preapproval_fetch_failed:${errorText}`)
      }

      const data = (await response.json()) as Record<string, any>
      if (!data?.id || typeof data.status !== 'string') {
        throw new Error('mercadopago_preapproval_invalid_payload')
      }

      return {
        id: String(data.id),
        status: String(data.status),
        externalReference:
          typeof data.external_reference === 'string' ? data.external_reference : null,
        lastModified: typeof data.last_modified === 'string' ? data.last_modified : null,
        nextPaymentDate: typeof data.next_payment_date === 'string' ? data.next_payment_date : null,
        autoRecurring: {
          currencyId:
            typeof data.auto_recurring?.currency_id === 'string'
              ? data.auto_recurring.currency_id
              : null,
          transactionAmount:
            typeof data.auto_recurring?.transaction_amount === 'number'
              ? data.auto_recurring.transaction_amount
              : typeof data.auto_recurring?.transaction_amount === 'string'
                ? Number(data.auto_recurring.transaction_amount)
                : null,
          freeTrialEndDate:
            typeof data.auto_recurring?.free_trial_end_date === 'string'
              ? data.auto_recurring.free_trial_end_date
              : null,
          startDate:
            typeof data.auto_recurring?.start_date === 'string'
              ? data.auto_recurring.start_date
              : null,
        },
        raw: data,
      }
    } catch (error) {
      clearTimeout(timeout)
      lastError = error
      if (attempt === 1) {
        break
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('mercadopago_preapproval_fetch_failed')
}
import {
  TEMPLATE_PRESETS,
  type RestaurantTemplateSlug,
} from '@/lib/domains/core/restaurant-customization'

export function safeParseMercadoPagoWebhookBody(rawBody: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(rawBody) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }

    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

export function resolveKnownTemplateSlug(
  value: string | null | undefined
): RestaurantTemplateSlug | null {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!normalized) {
    return null
  }

  return normalized in TEMPLATE_PRESETS ? (normalized as RestaurantTemplateSlug) : null
}

export function resolvePaymentTimestamp(
  approvedAt: string | null | undefined,
  fallback = new Date()
): string {
  if (!approvedAt) {
    return fallback.toISOString()
  }

  const parsed = new Date(approvedAt)
  return Number.isNaN(parsed.getTime()) ? fallback.toISOString() : parsed.toISOString()
}

export function maskAffiliateRef(value: unknown): string {
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (!normalized) {
    return 'none'
  }

  if (normalized.length <= 4) {
    return '***'
  }

  return `${normalized.slice(0, 2)}***${normalized.slice(-2)}`
}

export function withCheckoutSessionSyncState(
  metadata: Record<string, unknown>,
  errorMessage: string | null
) {
  return {
    ...metadata,
    checkout_session_sync_failed: !!errorMessage,
    checkout_session_sync_error: errorMessage,
  }
}
