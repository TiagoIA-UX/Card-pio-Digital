import { TEMPLATE_PRESETS, type RestaurantTemplateSlug } from '@/lib/restaurant-customization'

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
