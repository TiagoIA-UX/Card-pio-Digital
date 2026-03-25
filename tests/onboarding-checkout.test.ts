import test from 'node:test'
import assert from 'node:assert/strict'
import {
  AFFILIATE_REF_CODE_PATTERN,
  buildOnboardingOrderMetadata,
  createCheckoutNumber,
  sanitizeAffiliateRef,
} from '@/lib/onboarding-checkout'

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
    subscriptionPlanSlug: 'basico',
    customerName: 'Tiago',
    customerEmail: 'tiago@example.com',
    customerPhone: '5511999999999',
    restaurantName: 'Delivery Centro',
    restaurantSlugBase: 'delivery-centro',
    ownerUserId: 'user-1',
    onboardingStatus: 'awaiting_payment',
    affRef: 'vendedor_01',
    mpPreferenceId: 'pref-123',
    checkoutSessionSyncFailed: true,
  })

  assert.equal(metadata.checkout_type, 'restaurant_onboarding')
  assert.equal(metadata.aff_ref, 'vendedor_01')
  assert.equal(metadata.mp_preference_id, 'pref-123')
  assert.equal(metadata.checkout_session_sync_failed, true)
})
