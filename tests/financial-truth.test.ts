import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildFinancialTruthReason,
  deriveFinancialTruthStatus,
} from '@/lib/domains/core/financial-truth'

test('verdade financeira prioriza chargeback acima de sinais aprovados', () => {
  assert.equal(
    deriveFinancialTruthStatus({
      paymentStatus: 'charged_back',
      subscriptionStatus: 'active',
      restaurantPaymentStatus: 'ativo',
    }),
    'chargeback'
  )
})

test('verdade financeira prioriza refund acima de cancelamento e aprovação', () => {
  assert.equal(
    deriveFinancialTruthStatus({
      paymentStatus: 'refunded',
      subscriptionStatus: 'canceled',
      restaurantPaymentStatus: 'ativo',
    }),
    'refunded'
  )
})

test('verdade financeira trata cancelamento como mais forte que aprovação indireta', () => {
  assert.equal(
    deriveFinancialTruthStatus({
      subscriptionStatus: 'canceled',
      restaurantPaymentStatus: 'ativo',
    }),
    'canceled'
  )
})

test('verdade financeira aprova quando subscription ou pagamento aprovado sustentam o tenant', () => {
  assert.equal(
    deriveFinancialTruthStatus({
      subscriptionStatus: 'active',
      restaurantPaymentStatus: 'ativo',
    }),
    'approved'
  )

  assert.equal(
    deriveFinancialTruthStatus({
      paymentStatus: 'approved',
      restaurantPaymentStatus: 'aguardando',
    }),
    'approved'
  )
})

test('verdade financeira permanece pendente sem sinal econômico conclusivo', () => {
  assert.equal(
    deriveFinancialTruthStatus({
      subscriptionStatus: 'pending',
      restaurantPaymentStatus: 'aguardando',
    }),
    'pending'
  )
})

test('reason financeira agrega sinais auditáveis', () => {
  assert.equal(
    buildFinancialTruthReason({
      paymentStatus: 'approved',
      subscriptionStatus: 'active',
      restaurantPaymentStatus: 'ativo',
    }),
    'payment=approved | subscription=active | restaurant=ativo'
  )
})
