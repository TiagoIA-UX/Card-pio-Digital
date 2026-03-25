export const ONBOARDING_STALE_PROVISIONING_MS = 15 * 60 * 1000

export type OnboardingProvisioningDecision =
  | 'fresh-claim'
  | 'stale-recovery'
  | 'already-ready'
  | 'active-processing'
  | 'not-applicable'

export type ManualProvisioningResultStatus =
  | 'provisioned'
  | 'recovered'
  | 'already-ready'
  | 'still-processing'
  | 'not-applicable'

interface OnboardingProvisioningMetadata {
  onboarding_status?: string | null
  provisioned_restaurant_id?: string | null
}

export interface OnboardingProvisioningSnapshot {
  status: string
  payment_status: string
  updated_at?: string | null
  metadata?: OnboardingProvisioningMetadata | null
}

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) {
    return null
  }

  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? null : timestamp
}

export function isStaleProvisioningTimestamp(
  updatedAt: string | null | undefined,
  now = Date.now(),
  staleAfterMs = ONBOARDING_STALE_PROVISIONING_MS
): boolean {
  const parsed = parseTimestamp(updatedAt)
  if (parsed === null) {
    return true
  }

  return now - parsed >= staleAfterMs
}

export function resolveOnboardingProvisioningDecision(
  order: OnboardingProvisioningSnapshot,
  now = Date.now(),
  staleAfterMs = ONBOARDING_STALE_PROVISIONING_MS
): OnboardingProvisioningDecision {
  const metadata = order.metadata || {}
  const onboardingStatus = metadata.onboarding_status || null
  const hasRestaurant = !!metadata.provisioned_restaurant_id

  if (hasRestaurant || onboardingStatus === 'ready') {
    return 'already-ready'
  }

  if (order.payment_status === 'pending' || order.payment_status === 'awaiting_payment') {
    return 'fresh-claim'
  }

  const inProvisioningWindow =
    order.payment_status === 'processing' ||
    onboardingStatus === 'provisioning' ||
    (order.payment_status === 'approved' && onboardingStatus !== 'ready')

  if (!inProvisioningWindow) {
    return 'not-applicable'
  }

  return isStaleProvisioningTimestamp(order.updated_at, now, staleAfterMs)
    ? 'stale-recovery'
    : 'active-processing'
}

export function resolveManualProvisioningResultStatus(
  decision: OnboardingProvisioningDecision,
  hasProvisionedRestaurant: boolean
): ManualProvisioningResultStatus {
  if (hasProvisionedRestaurant) {
    if (decision === 'stale-recovery') {
      return 'recovered'
    }

    if (decision === 'already-ready') {
      return 'already-ready'
    }

    return 'provisioned'
  }

  if (decision === 'active-processing') {
    return 'still-processing'
  }

  if (decision === 'already-ready') {
    return 'already-ready'
  }

  return 'not-applicable'
}
