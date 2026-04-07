import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildOnboardingPaymentBaseMetadata,
  formatTemplateNameFromSlug,
} from '@/lib/domains/core/mercadopago-onboarding-payment'

test('formatTemplateNameFromSlug converte slug em rótulo legível', () => {
  assert.equal(formatTemplateNameFromSlug('feito-pra-voce'), 'Feito Pra Voce')
  assert.equal(formatTemplateNameFromSlug('pizzaria'), 'Pizzaria')
})

test('buildOnboardingPaymentBaseMetadata marca approved como provisioning', () => {
  const result = buildOnboardingPaymentBaseMetadata(
    { customer_email: 'teste@zairyx.com' },
    { status: 'approved', status_detail: 'accredited', payment_type_id: 'credit_card' }
  )

  assert.equal(result['customer_email'], 'teste@zairyx.com')
  assert.equal(result.mp_status, 'approved')
  assert.equal(result.mp_status_detail, 'accredited')
  assert.equal(result.mp_payment_type, 'credit_card')
  assert.equal(result.onboarding_status, 'provisioning')
})

test('buildOnboardingPaymentBaseMetadata marca pending e rejected corretamente', () => {
  const pendingResult = buildOnboardingPaymentBaseMetadata({}, { status: 'pending' })
  const rejectedResult = buildOnboardingPaymentBaseMetadata({}, { status: 'rejected' })

  assert.equal(pendingResult.onboarding_status, 'awaiting_payment')
  assert.equal(rejectedResult.onboarding_status, 'payment_rejected')
})