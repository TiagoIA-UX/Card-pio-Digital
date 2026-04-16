import test from 'node:test'
import assert from 'node:assert/strict'

import {
  shouldRetryDeliveryPaymentRow,
  DELIVERY_PAYMENT_MAX_RECONCILIATION_ATTEMPTS,
} from '@/lib/domains/payments/finalize-delivery-payment'

test('reconciliação reprocessa pagamentos pendentes mesmo sem falha anterior', () => {
  assert.equal(
    shouldRetryDeliveryPaymentRow({
      status: 'pending',
      reconciliationStatus: 'synced',
      anomalyCode: null,
      reconciliationAttempts: 0,
      lastReconciliationAt: null,
    }),
    true
  )
})

test('reconciliação ignora estado synced já consistente', () => {
  assert.equal(
    shouldRetryDeliveryPaymentRow({
      status: 'approved',
      reconciliationStatus: 'synced',
      anomalyCode: null,
      reconciliationAttempts: 1,
      lastReconciliationAt: new Date().toISOString(),
    }),
    false
  )
})

test('reconciliação reprocessa falha retryable após backoff', () => {
  assert.equal(
    shouldRetryDeliveryPaymentRow({
      status: 'approved',
      reconciliationStatus: 'failed',
      anomalyCode: 'order_update_failed',
      reconciliationAttempts: 1,
      lastReconciliationAt: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
    }),
    true
  )
})

test('reconciliação não reprocessa falha retryable antes do backoff', () => {
  assert.equal(
    shouldRetryDeliveryPaymentRow({
      status: 'approved',
      reconciliationStatus: 'failed',
      anomalyCode: 'gateway_fetch_failed',
      reconciliationAttempts: 1,
      lastReconciliationAt: new Date().toISOString(),
    }),
    false
  )
})

test('reconciliação não reprocessa falha terminal', () => {
  assert.equal(
    shouldRetryDeliveryPaymentRow({
      status: 'approved',
      reconciliationStatus: 'failed',
      anomalyCode: 'amount_mismatch',
      reconciliationAttempts: 1,
      lastReconciliationAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    }),
    false
  )
})

test('reconciliação não reprocessa quando estoura o máximo de tentativas', () => {
  assert.equal(
    shouldRetryDeliveryPaymentRow({
      status: 'approved',
      reconciliationStatus: 'failed',
      anomalyCode: 'order_update_failed',
      reconciliationAttempts: DELIVERY_PAYMENT_MAX_RECONCILIATION_ATTEMPTS,
      lastReconciliationAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    }),
    false
  )
})