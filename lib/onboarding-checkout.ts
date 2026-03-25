export const AFFILIATE_REF_CODE_PATTERN = /^[a-z0-9_-]{3,30}$/i

export interface BuildOnboardingOrderMetadataInput {
  templateSlug: string
  planSlug: string
  subscriptionPlanSlug: string
  customerName: string
  customerEmail: string
  customerPhone: string
  restaurantName: string
  restaurantSlugBase: string
  ownerUserId: string
  onboardingStatus: 'awaiting_payment' | 'checkout_creation_failed'
  affRef?: string | null
  mpPreferenceId?: string | null
  checkoutSessionSyncFailed?: boolean
}

export function createCheckoutNumber() {
  return `CHK-${crypto.randomUUID().replace(/-/g, '').toUpperCase()}`
}

export function sanitizeAffiliateRef(value: string | null | undefined) {
  const normalized = value?.trim() || ''
  return AFFILIATE_REF_CODE_PATTERN.test(normalized) ? normalized : null
}

export function buildOnboardingOrderMetadata({
  templateSlug,
  planSlug,
  subscriptionPlanSlug,
  customerName,
  customerEmail,
  customerPhone,
  restaurantName,
  restaurantSlugBase,
  ownerUserId,
  onboardingStatus,
  affRef = null,
  mpPreferenceId = null,
  checkoutSessionSyncFailed = false,
}: BuildOnboardingOrderMetadataInput) {
  return {
    checkout_type: 'restaurant_onboarding',
    template_slug: templateSlug,
    plan_slug: planSlug,
    subscription_plan_slug: subscriptionPlanSlug,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    restaurant_name: restaurantName,
    restaurant_slug_base: restaurantSlugBase,
    onboarding_status: onboardingStatus,
    activation_url: null,
    provisioned_restaurant_id: null,
    provisioned_restaurant_slug: null,
    owner_user_id: ownerUserId,
    mp_preference_id: mpPreferenceId,
    aff_ref: affRef,
    checkout_session_sync_failed: checkoutSessionSyncFailed,
  }
}
