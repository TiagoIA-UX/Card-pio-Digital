import test from 'node:test'
import assert from 'node:assert/strict'
import { resolvePanelCapabilities } from '@/lib/panel/capabilities'

test('panel capabilities require purchase or approved order for commercial access', () => {
  const noAccess = resolvePanelCapabilities({
    activePurchasesCount: 0,
    approvedOrdersCount: 0,
    restaurantsCount: 0,
  })

  assert.equal(noAccess.hasCommercialAccess, false)
  assert.equal(noAccess.canCreateRestaurant, false)

  const purchaseAccess = resolvePanelCapabilities({
    activePurchasesCount: 1,
    approvedOrdersCount: 0,
    restaurantsCount: 0,
  })

  assert.equal(purchaseAccess.hasCommercialAccess, true)
  assert.equal(purchaseAccess.canCreateRestaurant, true)

  const orderAccess = resolvePanelCapabilities({
    activePurchasesCount: 0,
    approvedOrdersCount: 1,
    restaurantsCount: 0,
  })

  assert.equal(orderAccess.hasCommercialAccess, true)
  assert.equal(orderAccess.canCreateRestaurant, true)
})

test('panel capabilities only unlock managed surfaces when the user has a restaurant', () => {
  const withoutRestaurant = resolvePanelCapabilities({
    activePurchasesCount: 1,
    approvedOrdersCount: 0,
    restaurantsCount: 0,
  })

  assert.equal(withoutRestaurant.hasRestaurant, false)
  assert.equal(withoutRestaurant.canAccessDashboard, false)
  assert.equal(withoutRestaurant.canAccessVisualEditor, false)
  assert.equal(withoutRestaurant.canManageCatalog, false)

  const withRestaurant = resolvePanelCapabilities({
    activePurchasesCount: 1,
    approvedOrdersCount: 0,
    restaurantsCount: 2,
  })

  assert.equal(withRestaurant.hasRestaurant, true)
  assert.equal(withRestaurant.canAccessDashboard, true)
  assert.equal(withRestaurant.canAccessVisualEditor, true)
  assert.equal(withRestaurant.canManageCatalog, true)
  assert.equal(withRestaurant.canSwitchRestaurant, true)
})
