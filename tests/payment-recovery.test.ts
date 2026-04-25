import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildPaymentRecoveryMetrics,
  buildRecoverablePaymentAlertBody,
  buildRecoverablePaymentFingerprint,
  buildRecoverablePaymentMessage,
  getRecoverablePaymentSeverity,
  type RecoverablePaymentReport,
} from '@/lib/domains/ops/payment-recovery'

function buildReport(overrides?: Partial<RecoverablePaymentReport>): RecoverablePaymentReport {
  return {
    lookback_days: 7,
    cooldown_hours: 24,
    scanned_rejected_orders: 2,
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

test('payment recovery severity escala com a quantidade de casos', () => {
  assert.equal(getRecoverablePaymentSeverity(0), 'info')
  assert.equal(getRecoverablePaymentSeverity(1), 'warning')
  assert.equal(getRecoverablePaymentSeverity(3), 'critical')
})

test('payment recovery fingerprint muda quando muda a lista de pedidos', () => {
  const base = buildReport()
  const changed = buildReport({
    flagged_count: 2,
    rows: [
      ...base.rows,
      {
        ...base.rows[0],
        order_id: 'order-2',
        order_number: 'CHK-002',
      },
    ],
  })

  assert.notEqual(
    buildRecoverablePaymentFingerprint(base),
    buildRecoverablePaymentFingerprint(changed)
  )
})

test('payment recovery alert body resume os casos encontrados', () => {
  const body = buildRecoverablePaymentAlertBody(buildReport())

  assert.match(body, /1 pagamentos recusados/i)
  assert.match(body, /pizza centro/i)
  assert.match(body, /checkout=CHK-001/i)
  assert.match(body, /sempre o checkout mais recente válido/i)
})

test('payment recovery message usa texto direto e inclui o link existente', () => {
  const message = buildRecoverablePaymentMessage(buildReport().rows[0])

  assert.match(message, /pagamento não foi concluído/i)
  assert.match(message, /liberar seu delivery/i)
  assert.match(message, /mercadopago/i)
})

test('payment recovery metrics resumem scans, ações e conversões', () => {
  const metrics = buildPaymentRecoveryMetrics({
    windowDays: 30,
    logs: [
      {
        action: 'payment_recovery_scan',
        created_at: '2026-04-15T10:00:00.000Z',
        metadata: {
          timestamp: '2026-04-15T10:00:00.000Z',
          report: { flagged_count: 2 },
        },
      },
      {
        action: 'payment_recovery_scan',
        created_at: '2026-04-16T10:00:00.000Z',
        metadata: {
          timestamp: '2026-04-16T10:00:00.000Z',
          report: { flagged_count: 0 },
        },
      },
      {
        action: 'payment_recovery_action',
        created_at: '2026-04-15T11:00:00.000Z',
        metadata: {
          timestamp: '2026-04-15T11:00:00.000Z',
          action: 'resend_payment_link',
          order_id: 'order-1',
        },
      },
      {
        action: 'payment_recovery_action',
        created_at: '2026-04-15T12:00:00.000Z',
        metadata: {
          timestamp: '2026-04-15T12:00:00.000Z',
          action: 'mark_waiting_customer',
          order_id: 'order-2',
        },
      },
    ],
    orders: [
      {
        id: 'order-1',
        payment_status: 'approved',
        updated_at: '2026-04-15T13:00:00.000Z',
      },
      {
        id: 'order-2',
        payment_status: 'rejected',
        updated_at: '2026-04-15T13:00:00.000Z',
      },
    ],
  })

  assert.equal(metrics.scans_total, 2)
  assert.equal(metrics.scans_with_cases, 1)
  assert.equal(metrics.flagged_total, 2)
  assert.equal(metrics.actions_total, 2)
  assert.equal(metrics.resend_actions, 1)
  assert.equal(metrics.waiting_actions, 1)
  assert.equal(metrics.conversions_after_action, 1)
  assert.equal(metrics.latest_scan_at, '2026-04-16T10:00:00.000Z')
})

