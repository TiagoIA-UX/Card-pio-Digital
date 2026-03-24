import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  canTransition,
  LIFECYCLE_STATE_LABELS,
  LIFECYCLE_TRANSITIONS,
  lifecycleStateToDbFields,
  ORDER_LIFECYCLE_STATES,
  resolveOrderLifecycleState,
  type OrderLifecycleState,
} from '../lib/lifecycle/template-lifecycle'

describe('template-lifecycle', () => {
  it('defines 7 lifecycle states', () => {
    assert.strictEqual(ORDER_LIFECYCLE_STATES.length, 7)
  })

  it('every state has a transition entry', () => {
    for (const state of ORDER_LIFECYCLE_STATES) {
      assert.ok(
        Array.isArray(LIFECYCLE_TRANSITIONS[state]),
        `Missing transition entry for ${state}`
      )
    }
  })

  it('every state has a label', () => {
    for (const state of ORDER_LIFECYCLE_STATES) {
      assert.ok(LIFECYCLE_STATE_LABELS[state], `Missing label for ${state}`)
    }
  })

  it('ready and cancelled are terminal states', () => {
    assert.deepStrictEqual(LIFECYCLE_TRANSITIONS.ready, [])
    assert.deepStrictEqual(LIFECYCLE_TRANSITIONS.cancelled, [])
  })

  describe('canTransition', () => {
    it('allows awaiting_payment → payment_processing', () => {
      assert.ok(canTransition('awaiting_payment', 'payment_processing'))
    })

    it('allows payment_processing → provisioning', () => {
      assert.ok(canTransition('payment_processing', 'provisioning'))
    })

    it('allows provisioning → ready', () => {
      assert.ok(canTransition('provisioning', 'ready'))
    })

    it('disallows ready → any', () => {
      for (const state of ORDER_LIFECYCLE_STATES) {
        assert.strictEqual(canTransition('ready', state), false, `ready → ${state} should be false`)
      }
    })

    it('disallows going backwards from ready to awaiting_payment', () => {
      assert.strictEqual(canTransition('ready', 'awaiting_payment'), false)
    })

    it('allows payment_rejected → awaiting_payment (retry)', () => {
      assert.ok(canTransition('payment_rejected', 'awaiting_payment'))
    })
  })

  describe('resolveOrderLifecycleState', () => {
    it('resolves fresh order to checkout_created', () => {
      const state = resolveOrderLifecycleState({
        status: 'pending',
        payment_status: 'pending',
        metadata: null,
      })
      assert.strictEqual(state, 'checkout_created')
    })

    it('resolves awaiting_payment from onboarding_status', () => {
      const state = resolveOrderLifecycleState({
        status: 'pending',
        payment_status: 'pending',
        metadata: { onboarding_status: 'awaiting_payment' },
      })
      assert.strictEqual(state, 'awaiting_payment')
    })

    it('resolves payment_processing from atomic claim', () => {
      const state = resolveOrderLifecycleState({
        status: 'processing',
        payment_status: 'processing',
        metadata: { onboarding_status: 'provisioning' },
      })
      assert.strictEqual(state, 'payment_processing')
    })

    it('resolves ready when restaurant is provisioned', () => {
      const state = resolveOrderLifecycleState({
        status: 'completed',
        payment_status: 'approved',
        metadata: {
          onboarding_status: 'ready',
          provisioned_restaurant_id: 'r-123',
        },
      })
      assert.strictEqual(state, 'ready')
    })

    it('resolves payment_rejected', () => {
      const state = resolveOrderLifecycleState({
        status: 'cancelled',
        payment_status: 'rejected',
        metadata: { onboarding_status: 'payment_rejected' },
      })
      assert.strictEqual(state, 'payment_rejected')
    })

    it('resolves cancelled from order status', () => {
      const state = resolveOrderLifecycleState({
        status: 'cancelled',
        payment_status: 'pending',
        metadata: {},
      })
      assert.strictEqual(state, 'cancelled')
    })

    it('treats provisioning with restaurant as ready (recovery)', () => {
      const state = resolveOrderLifecycleState({
        status: 'processing',
        payment_status: 'approved',
        metadata: {
          onboarding_status: 'provisioning',
          provisioned_restaurant_id: 'r-123',
        },
      })
      assert.strictEqual(state, 'ready')
    })
  })

  describe('lifecycleStateToDbFields', () => {
    it('maps ready to completed/approved/ready', () => {
      const fields = lifecycleStateToDbFields('ready')
      assert.strictEqual(fields.status, 'completed')
      assert.strictEqual(fields.payment_status, 'approved')
      assert.strictEqual(fields.onboarding_status, 'ready')
    })

    it('maps every state to valid DB fields', () => {
      for (const state of ORDER_LIFECYCLE_STATES) {
        const fields = lifecycleStateToDbFields(state)
        assert.ok(fields.status, `Missing status for ${state}`)
        assert.ok(fields.payment_status, `Missing payment_status for ${state}`)
        assert.ok(fields.onboarding_status, `Missing onboarding_status for ${state}`)
      }
    })

    it('roundtrips: resolve(toDbFields(state)) returns compatible state', () => {
      // States that should roundtrip perfectly
      const roundtripStates: OrderLifecycleState[] = [
        'awaiting_payment',
        'payment_processing',
        'ready',
        'payment_rejected',
      ]
      for (const state of roundtripStates) {
        const fields = lifecycleStateToDbFields(state)
        const resolved = resolveOrderLifecycleState({
          status: fields.status,
          payment_status: fields.payment_status,
          metadata: {
            onboarding_status: fields.onboarding_status,
            provisioned_restaurant_id: state === 'ready' ? 'r-1' : null,
          },
        })
        assert.strictEqual(resolved, state, `Roundtrip failed for ${state}`)
      }
    })
  })
})
