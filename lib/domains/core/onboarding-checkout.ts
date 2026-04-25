import { createHash } from 'node:crypto'

export const AFFILIATE_REF_CODE_PATTERN = /^[a-z0-9_-]{3,30}$/i

export type OnboardingBillingModel = 'legacy_billing' | 'subscription_preapproval'

export interface OnboardingContractHashInput {
  templateSlug: string
  capacityPlanSlug: string
  onboardingPlanSlug: string
  paymentMethod: string
  initialChargeAmount: number
  monthlyChargeAmount: number
}

export interface BuildOnboardingOrderMetadataInput {
  templateSlug: string
  planSlug: string
  capacityPlanSlug: string
  subscriptionPlanSlug: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerDocument?: string | null
  restaurantName: string
  restaurantSlugBase: string
  ownerUserId: string
  onboardingStatus: 'awaiting_payment' | 'checkout_creation_failed'
  affRef?: string | null
  mpPreferenceId?: string | null
  mpPreapprovalId?: string | null
  billingModel?: OnboardingBillingModel
  billingState?: string | null
  contractedInitialAmount?: number | null
  contractedMonthlyAmount?: number | null
  contractHash?: string | null
  checkoutSessionSyncFailed?: boolean
  acceptedTermsVersion?: string | null
  acceptedTermsAt?: string | null
  contractSummary?: Record<string, unknown> | null
}

export function createCheckoutNumber() {
  return `CHK-${crypto.randomUUID().replace(/-/g, '').toUpperCase()}`
}

export function sanitizeAffiliateRef(value: string | null | undefined) {
  const normalized = value?.trim() || ''
  return AFFILIATE_REF_CODE_PATTERN.test(normalized) ? normalized : null
}

export function buildOnboardingContractHash({
  templateSlug,
  capacityPlanSlug,
  onboardingPlanSlug,
  paymentMethod,
  initialChargeAmount,
  monthlyChargeAmount,
}: OnboardingContractHashInput) {
  return createHash('sha256')
    .update(
      JSON.stringify({
        template_slug: templateSlug,
        capacity_plan_slug: capacityPlanSlug,
        onboarding_plan_slug: onboardingPlanSlug,
        payment_method: paymentMethod,
        initial_charge_amount: Number(initialChargeAmount.toFixed(2)),
        monthly_charge_amount: Number(monthlyChargeAmount.toFixed(2)),
      })
    )
    .digest('hex')
}

export function isNewBillingEnabled() {
  return process.env.USE_NEW_BILLING === 'true'
}

export function isShadowPreapprovalEnabled() {
  return process.env.ENABLE_PREAPPROVAL_SHADOW_WRITE === 'true'
}

export function buildOnboardingShadowExternalReference(orderId: string, contractHash: string) {
  return `onb:${orderId}:${contractHash}`
}

export function buildOnboardingOrderMetadata({
  templateSlug,
  planSlug,
  capacityPlanSlug,
  subscriptionPlanSlug,
  customerName,
  customerEmail,
  customerPhone,
  customerDocument = null,
  restaurantName,
  restaurantSlugBase,
  ownerUserId,
  onboardingStatus,
  affRef = null,
  mpPreferenceId = null,
  mpPreapprovalId = null,
  billingModel = 'legacy_billing',
  billingState = 'legacy_billing',
  contractedInitialAmount = null,
  contractedMonthlyAmount = null,
  contractHash = null,
  checkoutSessionSyncFailed = false,
  acceptedTermsVersion = null,
  acceptedTermsAt = null,
  contractSummary = null,
}: BuildOnboardingOrderMetadataInput) {
  return {
    checkout_type: 'restaurant_onboarding',
    checkout_flow_version: '2026-04-contract-v2',
    billing_model: billingModel,
    billing_state: billingState,
    template_slug: templateSlug,
    plan_slug: planSlug,
    onboarding_plan_slug: planSlug,
    capacity_plan_slug: capacityPlanSlug,
    subscription_plan_slug: subscriptionPlanSlug,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    customer_document: customerDocument,
    restaurant_name: restaurantName,
    restaurant_slug_base: restaurantSlugBase,
    onboarding_status: onboardingStatus,
    activation_url: null,
    provisioned_restaurant_id: null,
    provisioned_restaurant_slug: null,
    owner_user_id: ownerUserId,
    mp_preference_id: mpPreferenceId,
    mp_preapproval_id: mpPreapprovalId,
    contracted_initial_amount: contractedInitialAmount,
    contracted_monthly_amount: contractedMonthlyAmount,
    contract_hash: contractHash,
    aff_ref: affRef,
    checkout_session_sync_failed: checkoutSessionSyncFailed,
    accepted_terms_version: acceptedTermsVersion,
    accepted_terms_at: acceptedTermsAt,
    contract_summary: contractSummary,
  }
}

