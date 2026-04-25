import test from 'node:test'
import assert from 'node:assert/strict'
import {
  AFFILIATE_REF_CODE_PATTERN,
  buildOnboardingContractHash,
  buildOnboardingOrderMetadata,
  createCheckoutNumber,
  sanitizeAffiliateRef,
} from '@/lib/domains/core/onboarding-checkout'
import { OnboardingCheckoutSchema } from '@/lib/domains/core/schemas'
import { resolveRestaurantTemplateSlug } from '@/lib/domains/core/restaurant-customization'

test('sanitizeAffiliateRef accepts only safe affiliate codes', () => {
  assert.equal(sanitizeAffiliateRef(' vendedor_01 '), 'vendedor_01')
  assert.equal(sanitizeAffiliateRef('ab'), null)
  assert.equal(sanitizeAffiliateRef('codigo invalido'), null)
  assert.ok(AFFILIATE_REF_CODE_PATTERN.test('ABC-123'))
})

test('createCheckoutNumber returns a collision-resistant uppercase token', () => {
  const checkout = createCheckoutNumber()

  assert.match(checkout, /^CHK-[A-F0-9]{32}$/)
})

test('buildOnboardingOrderMetadata centralizes checkout metadata fields', () => {
  const metadata = buildOnboardingOrderMetadata({
    templateSlug: 'restaurante',
    planSlug: 'self-service',
    capacityPlanSlug: 'pro',
    subscriptionPlanSlug: 'basico',
    customerName: 'Tiago',
    customerEmail: 'tiago@example.com',
    customerPhone: '5511999999999',
    customerDocument: '61699939000180',
    restaurantName: 'Delivery Centro',
    restaurantSlugBase: 'delivery-centro',
    ownerUserId: 'user-1',
    onboardingStatus: 'awaiting_payment',
    affRef: 'vendedor_01',
    mpPreferenceId: 'pref-123',
    billingModel: 'legacy_billing',
    billingState: 'legacy_billing',
    contractedInitialAmount: 297,
    contractedMonthlyAmount: 197,
    contractHash: 'hash-123',
    checkoutSessionSyncFailed: true,
  })

  assert.equal(metadata.checkout_type, 'restaurant_onboarding')
  assert.equal(metadata.billing_model, 'legacy_billing')
  assert.equal(metadata.billing_state, 'legacy_billing')
  assert.equal(metadata.capacity_plan_slug, 'pro')
  assert.equal(metadata.aff_ref, 'vendedor_01')
  assert.equal(metadata.mp_preference_id, 'pref-123')
  assert.equal(metadata.checkout_session_sync_failed, true)
  assert.equal(metadata.customer_document, '61699939000180')
  assert.equal(metadata.contracted_monthly_amount, 197)
  assert.equal(metadata.contract_hash, 'hash-123')
})

test('OnboardingCheckoutSchema rejects invalid template slug', () => {
  const parsed = OnboardingCheckoutSchema.safeParse({
    templateSlug: 'template-invalido-xyz',
    capacityPlanSlug: 'basico',
    onboardingPlan: 'self-service',
    paymentMethod: 'pix',
    customerData: {
      restaurantName: 'Delivery Centro',
      customerName: 'Tiago',
      phone: '11999999999',
    },
    acceptedTerms: true,
    acceptedTermsVersion: '2026-04-06.v1',
  })

  assert.equal(parsed.success, false)
})

test('buildOnboardingContractHash is deterministic and changes with contract drift', () => {
  const baseInput = {
    templateSlug: 'restaurante',
    capacityPlanSlug: 'pro',
    onboardingPlanSlug: 'feito-pra-voce',
    paymentMethod: 'card',
    initialChargeAmount: 717,
    monthlyChargeAmount: 197,
  }

  assert.equal(buildOnboardingContractHash(baseInput), buildOnboardingContractHash(baseInput))
  assert.notEqual(
    buildOnboardingContractHash(baseInput),
    buildOnboardingContractHash({ ...baseInput, capacityPlanSlug: 'premium' })
  )
})

test('resolveRestaurantTemplateSlug returns null for unknown slugs', () => {
  assert.equal(resolveRestaurantTemplateSlug('template-invalido-xyz'), null)
})

