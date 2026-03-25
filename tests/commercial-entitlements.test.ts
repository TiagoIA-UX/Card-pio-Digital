import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveRestaurantCreationEntitlements } from '@/lib/commercial-entitlements'

test('restaurant creation entitlements allow one restaurant per approved onboarding purchase', () => {
  const entitlements = resolveRestaurantCreationEntitlements({
    activePurchasesCount: 1,
    approvedOrderRows: [{ metadata: { checkout_type: 'restaurant_onboarding' } }],
    restaurantsCount: 0,
  })

  assert.equal(entitlements.totalCredits, 1)
  assert.equal(entitlements.remainingCredits, 1)
  assert.equal(entitlements.canCreateRestaurant, true)
})

test('restaurant creation entitlements block new restaurants when all credits are consumed', () => {
  const entitlements = resolveRestaurantCreationEntitlements({
    activePurchasesCount: 1,
    approvedOrderRows: [{ metadata: { checkout_type: 'restaurant_onboarding' } }],
    restaurantsCount: 1,
  })

  assert.equal(entitlements.remainingCredits, 0)
  assert.equal(entitlements.canCreateRestaurant, false)
})

test('restaurant creation entitlements include extra units from network expansion orders', () => {
  const entitlements = resolveRestaurantCreationEntitlements({
    activePurchasesCount: 1,
    approvedOrderRows: [
      { metadata: { checkout_type: 'restaurant_onboarding' } },
      { metadata: { checkout_type: 'restaurant_network_expansion', network_extra_units: 2 } },
    ],
    restaurantsCount: 1,
  })

  assert.equal(entitlements.networkExtraUnits, 2)
  assert.equal(entitlements.totalCredits, 3)
  assert.equal(entitlements.remainingCredits, 2)
  assert.equal(entitlements.canCreateRestaurant, true)
})

test('restaurant creation entitlements treat legacy approved orders as onboarding credits', () => {
  const entitlements = resolveRestaurantCreationEntitlements({
    activePurchasesCount: 0,
    approvedOrderRows: [{ metadata: null }],
    restaurantsCount: 0,
  })

  assert.equal(entitlements.approvedOnboardingOrdersCount, 1)
  assert.equal(entitlements.totalCredits, 1)
})
