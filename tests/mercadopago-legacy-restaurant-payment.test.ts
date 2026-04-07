import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildLegacyRestaurantPaymentUpdateData,
  shouldNotifyLegacyRejectedPayment,
} from '@/lib/domains/core/mercadopago-legacy-restaurant-payment'

test('buildLegacyRestaurantPaymentUpdateData ativa delivery com plano atual no approved', () => {
  const result = buildLegacyRestaurantPaymentUpdateData({
    status: 'approved',
    currentPlan: 'premium',
    transactionAmount: 149,
    paidAt: '2026-04-06T10:00:00.000Z',
  })

  assert.equal(result.mappedStatus.paymentStatus, 'approved')
  assert.equal(result.updateData.status_pagamento, 'ativo')
  assert.equal(result.updateData.ativo, true)
  assert.equal(result.updateData.plano, 'premium')
  assert.equal(result.updateData.valor_pago, 149)
  assert.equal(result.updateData.data_pagamento, '2026-04-06T10:00:00.000Z')
})

test('buildLegacyRestaurantPaymentUpdateData usa timestamp atual apenas quando paidAt não vier', () => {
  const before = Date.now()
  const result = buildLegacyRestaurantPaymentUpdateData({
    status: 'approved',
    currentPlan: 'premium',
    transactionAmount: 149,
  })
  const after = Date.now()

  assert.equal(result.updateData.status_pagamento, 'ativo')
  assert.equal(result.updateData.ativo, true)
  assert.ok(typeof result.updateData.data_pagamento === 'string')

  const paidAt = Date.parse(String(result.updateData.data_pagamento))
  assert.ok(Number.isFinite(paidAt))
  assert.ok(paidAt >= before)
  assert.ok(paidAt <= after)
})

test('buildLegacyRestaurantPaymentUpdateData desativa delivery em pagamento rejeitado', () => {
  const result = buildLegacyRestaurantPaymentUpdateData({
    status: 'rejected',
    currentPlan: 'self-service',
  })

  assert.equal(result.mappedStatus.paymentStatus, 'rejected')
  assert.equal(result.updateData.status_pagamento, 'cancelado')
  assert.equal(result.updateData.ativo, false)
})

test('shouldNotifyLegacyRejectedPayment só notifica rejected ou cancelled', () => {
  assert.equal(shouldNotifyLegacyRejectedPayment('approved'), false)
  assert.equal(shouldNotifyLegacyRejectedPayment('pending'), false)
  assert.equal(shouldNotifyLegacyRejectedPayment('rejected'), true)
  assert.equal(shouldNotifyLegacyRejectedPayment('cancelled'), true)
})
