import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildRecoverablePaymentAlertActions,
  buildRecoverablePaymentWhatsAppUrl,
  type RecoverablePaymentReport,
} from '@/lib/domains/ops/payment-recovery'

function buildReport(overrides?: Partial<RecoverablePaymentReport>): RecoverablePaymentReport {
  return {
    lookback_days: 7,
    cooldown_hours: 24,
    scanned_rejected_orders: 1,
    flagged_count: 1,
    rows: [
      {
        order_id: 'order-1',
        order_number: 'CHK-001',
        user_id: 'user-1',
        customer_name: 'Tiago',
        customer_email: 'tiago@example.com',
        customer_phone: '12999998888',
        restaurant_name: 'Pizza Centro',
        template_slug: 'pizzaria',
        plan_slug: 'self-service',
        payment_method: 'card',
        total: 97,
        created_at: '2026-04-15T00:00:00.000Z',
        updated_at: '2026-04-15T00:05:00.000Z',
        payment_status: 'rejected',
        onboarding_status: 'payment_rejected',
        checkout_session_id: 'session-1',
        checkout_url: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=abc',
        checkout_updated_at: '2026-04-15T00:05:00.000Z',
        last_recovery_action_at: null,
        last_recovery_action_type: null,
        cooldown_active: false,
        classification: 'payment_failed_recoverable',
      },
    ],
    ...overrides,
  }
}

test('payment recovery actions criam atalhos seguros para recuperação', () => {
  const actions = buildRecoverablePaymentAlertActions(buildReport())

  assert.equal(actions.length, 3)
  assert.equal(actions[0]?.endpoint, '/api/admin/payment-recovery')
  assert.equal(actions[0]?.payload.action, 'resend_payment_link')
  assert.equal(actions[1]?.payload.action, 'mark_waiting_customer')
  assert.equal(actions[2]?.payload.action, 'register_manual_review')
})

test('payment recovery actions escondem reenvio quando cooldown está ativo', () => {
  const actions = buildRecoverablePaymentAlertActions(
    buildReport({
      rows: [
        {
          ...buildReport().rows[0],
          cooldown_active: true,
        },
      ],
    })
  )

  assert.equal(actions.length, 2)
  assert.equal(actions[0]?.payload.action, 'mark_waiting_customer')
})

test('payment recovery whatsapp url só existe com telefone válido', () => {
  assert.match(
    String(buildRecoverablePaymentWhatsAppUrl(buildReport().rows[0])),
    /api\.whatsapp\.com/i
  )
  assert.equal(
    buildRecoverablePaymentWhatsAppUrl({
      ...buildReport().rows[0],
      customer_phone: null,
    }),
    null
  )
})
