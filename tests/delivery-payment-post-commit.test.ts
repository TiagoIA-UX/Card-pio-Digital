import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DELIVERY_PAYMENT_POST_COMMIT_MAX_ATTEMPTS,
  shouldRetryDeliveryPaymentPostCommitTask,
} from '@/lib/domains/payments/delivery-payment-post-commit'

test('retry pós-commit respeita status pending e janela de backoff', () => {
  assert.equal(
    shouldRetryDeliveryPaymentPostCommitTask({
      status: 'pending',
      retryAttempts: 0,
      maxAttempts: DELIVERY_PAYMENT_POST_COMMIT_MAX_ATTEMPTS,
      nextRetryAt: null,
    }),
    true
  )

  assert.equal(
    shouldRetryDeliveryPaymentPostCommitTask({
      status: 'completed',
      retryAttempts: 0,
      maxAttempts: DELIVERY_PAYMENT_POST_COMMIT_MAX_ATTEMPTS,
      nextRetryAt: null,
    }),
    false
  )

  assert.equal(
    shouldRetryDeliveryPaymentPostCommitTask({
      status: 'pending',
      retryAttempts: DELIVERY_PAYMENT_POST_COMMIT_MAX_ATTEMPTS,
      maxAttempts: DELIVERY_PAYMENT_POST_COMMIT_MAX_ATTEMPTS,
      nextRetryAt: null,
    }),
    false
  )

  assert.equal(
    shouldRetryDeliveryPaymentPostCommitTask({
      status: 'pending',
      retryAttempts: 1,
      maxAttempts: DELIVERY_PAYMENT_POST_COMMIT_MAX_ATTEMPTS,
      nextRetryAt: '2099-01-01T00:00:00.000Z',
      now: '2026-04-16T10:00:00.000Z',
    }),
    false
  )

  assert.equal(
    shouldRetryDeliveryPaymentPostCommitTask({
      status: 'pending',
      retryAttempts: 1,
      maxAttempts: DELIVERY_PAYMENT_POST_COMMIT_MAX_ATTEMPTS,
      nextRetryAt: '2026-04-16T09:00:00.000Z',
      now: '2026-04-16T10:00:00.000Z',
    }),
    true
  )
})
