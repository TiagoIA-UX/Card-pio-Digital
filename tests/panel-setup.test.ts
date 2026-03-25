import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getDashboardSetupChecklist,
  getDashboardSetupProgress,
  getNextDashboardSetupStep,
} from '@/lib/panel-setup'

test('panel setup checklist starts with product registration as next action after delivery creation', () => {
  const steps = getDashboardSetupChecklist({
    hasRestaurant: true,
    totalProducts: 0,
    recentOrdersCount: 0,
    activationEvents: [],
  })

  assert.equal(steps[0]?.done, true)
  assert.equal(getNextDashboardSetupStep(steps)?.key, 'added_products')
  assert.equal(getDashboardSetupProgress(steps), 25)
})

test('panel setup checklist marks test order done when there is at least one order', () => {
  const steps = getDashboardSetupChecklist({
    hasRestaurant: true,
    totalProducts: 6,
    recentOrdersCount: 1,
    activationEvents: [],
  })

  assert.equal(steps[2]?.done, true)
  assert.equal(getNextDashboardSetupStep(steps)?.key, 'received_first_order')
})

test('panel setup checklist reaches 100 percent after first real order event', () => {
  const steps = getDashboardSetupChecklist({
    hasRestaurant: true,
    totalProducts: 8,
    recentOrdersCount: 3,
    activationEvents: ['received_first_order'],
  })

  assert.equal(getNextDashboardSetupStep(steps), null)
  assert.equal(getDashboardSetupProgress(steps), 100)
})
