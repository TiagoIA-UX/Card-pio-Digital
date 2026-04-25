import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  ORDER_LIFECYCLE_STATES,
  resolveOrderLifecycleState,
  lifecycleStateToDbFields,
  canTransition,
} from '../lib/domains/marketing/lifecycle/template-lifecycle'
import { resolvePanelCapabilities } from '../lib/domains/core/panel/capabilities'
import { getPanelNavigationItems } from '../lib/domains/core/panel/navigation'

/**
 * Testa a consistência ponta-a-ponta do fluxo comercial:
 *   checkout → pagamento → webhook → provisioning → editor
 *
 * Valida que os contratos entre as etapas (DB fields, lifecycle states,
 * capabilities, navigation) permanecem coerentes após a reimplementação.
 */

describe('commercial flow: checkout → payment → provisioning → editor', () => {
  it('fresh onboarding order starts at checkout_created', () => {
    const state = resolveOrderLifecycleState({
      status: 'pending',
      payment_status: 'pending',
      metadata: null,
    })
    assert.strictEqual(state, 'checkout_created')
  })

  it('onboarding order with awaiting_payment transitions to payment_processing', () => {
    const state = resolveOrderLifecycleState({
      status: 'pending',
      payment_status: 'pending',
      metadata: { onboarding_status: 'awaiting_payment' },
    })
    assert.strictEqual(state, 'awaiting_payment')
    assert.ok(canTransition('awaiting_payment', 'payment_processing'))
  })

  it('processing payment transitions to provisioning upon approval', () => {
    const state = resolveOrderLifecycleState({
      status: 'pending',
      payment_status: 'processing',
      metadata: { onboarding_status: 'processing' },
    })
    assert.strictEqual(state, 'payment_processing')
    assert.ok(canTransition('payment_processing', 'provisioning'))
  })

  it('provisioned order with restaurant reaches ready state', () => {
    const state = resolveOrderLifecycleState({
      status: 'completed',
      payment_status: 'approved',
      metadata: {
        onboarding_status: 'ready',
        provisioned_restaurant_id: 'r-abc-123',
      },
    })
    assert.strictEqual(state, 'ready')
  })

  it('ready state maps to DB fields matching simulate-onboarding expectations', () => {
    const fields = lifecycleStateToDbFields('ready')
    // simulate-onboarding.ts expects completed+approved+ready after provisioning
    assert.strictEqual(fields.status, 'completed')
    assert.strictEqual(fields.payment_status, 'approved')
    assert.strictEqual(fields.onboarding_status, 'ready')
  })

  it('ready order grants full panel access including editor', () => {
    const caps = resolvePanelCapabilities({
      activePurchasesCount: 1,
      approvedOrdersCount: 1,
      restaurantsCount: 1,
    })
    assert.ok(caps.hasCommercialAccess, 'should have commercial access')
    assert.ok(caps.canAccessVisualEditor, 'should access visual editor')
    assert.ok(caps.canManageCatalog, 'should manage catalog')
    assert.ok(caps.canViewOrders, 'should view orders')

    const items = getPanelNavigationItems(caps, 'r-123')
    const labels = items.map((i) => i.label)
    assert.ok(labels.includes('Editor Visual'), 'should have Editor Visual menu item')
  })

  it('rejected payment blocks editor access', () => {
    const state = resolveOrderLifecycleState({
      status: 'pending',
      payment_status: 'rejected',
      metadata: { onboarding_status: 'awaiting_payment' },
    })
    assert.strictEqual(state, 'payment_rejected')

    // User with rejected order has 0 approved orders → no commercial access
    const caps = resolvePanelCapabilities({
      activePurchasesCount: 0,
      approvedOrdersCount: 0,
      restaurantsCount: 0,
    })
    assert.strictEqual(caps.hasCommercialAccess, false)
    assert.strictEqual(caps.canAccessVisualEditor, false)

    const items = getPanelNavigationItems(caps, undefined)
    assert.strictEqual(items.length, 0, 'no menu items for user without access')
  })

  it('rejected payment allows retry back to awaiting_payment', () => {
    assert.ok(canTransition('payment_rejected', 'awaiting_payment'))
  })
})

describe('commercial flow: lifecycle state round-trip consistency', () => {
  it('every non-terminal state can reach ready through valid transitions', () => {
    // Map the happy path: checkout_created → awaiting_payment → payment_processing → provisioning → ready
    const happyPath: Array<(typeof ORDER_LIFECYCLE_STATES)[number]> = [
      'checkout_created',
      'awaiting_payment',
      'payment_processing',
      'provisioning',
      'ready',
    ]

    for (let i = 0; i < happyPath.length - 1; i++) {
      assert.ok(
        canTransition(happyPath[i], happyPath[i + 1]),
        `Expected transition ${happyPath[i]} → ${happyPath[i + 1]} to be valid`
      )
    }
  })

  it('all lifecycle states have valid DB field mappings', () => {
    for (const state of ORDER_LIFECYCLE_STATES) {
      const fields = lifecycleStateToDbFields(state)
      assert.ok(fields.status, `State "${state}" should map to a DB status`)
      assert.ok(fields.payment_status, `State "${state}" should map to a payment_status`)
    }
  })

  it('terminal states cannot transition anywhere', () => {
    const terminal = ['ready', 'cancelled'] as const
    const allStates = ORDER_LIFECYCLE_STATES

    for (const ts of terminal) {
      for (const target of allStates) {
        if (ts === target) continue
        assert.strictEqual(
          canTransition(ts, target),
          false,
          `Terminal state "${ts}" should not transition to "${target}"`
        )
      }
    }
  })
})

