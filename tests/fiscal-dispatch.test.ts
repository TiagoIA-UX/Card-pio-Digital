import test from 'node:test'
import assert from 'node:assert/strict'
import { dispatchFiscalInvoice } from '@/lib/domains/core/fiscal-dispatch'
import { prepareFiscalInvoiceMetadata } from '@/lib/domains/core/fiscal'

function createTestEnv(overrides: Partial<NodeJS.ProcessEnv> = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'test',
    ...overrides,
  }
}

function createReadyFiscalMetadata(overrides: Partial<NodeJS.ProcessEnv> = {}) {
  return prepareFiscalInvoiceMetadata(
    {
      orderId: 'order_123',
      paymentId: 'pay_123',
      paymentAmount: 147,
      approvedAt: '2026-04-03T10:00:00.000Z',
      customerName: 'Tiago Rocha',
      customerEmail: 'tiago@example.com',
      customerPhone: '12996887993',
      customerDocument: '61699939000180',
      restaurantName: 'Delivery Exemplo',
      restaurantId: 'rest_123',
      restaurantSlug: 'delivery-exemplo',
    },
    createTestEnv({
      FISCAL_AUTOMATION_ENABLED: 'true',
      FISCAL_PROVIDER: 'focusnfe',
      FISCAL_DOCUMENT_KIND: 'nfse',
      FISCAL_MUNICIPAL_REGISTRATION: '123456',
      FISCAL_SERVICE_CODE: '1.05',
      FOCUSNFE_API_KEY: 'secret',
      ...overrides,
    })
  )
}

test('fiscal dispatch stays blocked when fiscal metadata is not ready', async () => {
  const fiscal = prepareFiscalInvoiceMetadata(
    {
      orderId: 'order_999',
      paymentId: 'pay_999',
      paymentAmount: 0,
      approvedAt: null,
      customerName: null,
      customerEmail: null,
      customerPhone: null,
      restaurantName: 'Delivery Exemplo',
    },
    createTestEnv({
      FISCAL_AUTOMATION_ENABLED: 'true',
    })
  )

  const result = await dispatchFiscalInvoice({ orderId: 'order_999', fiscal })

  assert.equal(result.status, 'blocked')
  assert.equal(result.provider_reference, null)
})

test('fiscal dispatch returns dry_run when fiscal flow is intentionally safe', async () => {
  const fiscal = createReadyFiscalMetadata({ FISCAL_AUTOMATION_DRY_RUN: 'true' })

  const result = await dispatchFiscalInvoice({ orderId: 'order_123', fiscal })

  assert.equal(result.status, 'dry_run')
  assert.equal(result.payload_preview.order_id, 'order_123')
  assert.equal(result.payload_preview.customer.document, '61699939000180')
})

test('fiscal dispatch submits payload to configured bridge when ready', async () => {
  const fiscal = createReadyFiscalMetadata({ FISCAL_AUTOMATION_DRY_RUN: 'false' })
  const originalFetch = globalThis.fetch

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ reference: 'bridge-123', accepted: true }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    })

  try {
    const result = await dispatchFiscalInvoice(
      { orderId: 'order_123', fiscal },
      createTestEnv({
        FISCAL_DISPATCH_WEBHOOK_URL: 'https://fiscal.example.com/webhook',
        FISCAL_DISPATCH_WEBHOOK_SECRET: 'secret',
      })
    )

    assert.equal(result.status, 'submitted')
    assert.equal(result.provider_reference, 'bridge-123')
    assert.equal(result.http_status, 202)
  } finally {
    globalThis.fetch = originalFetch
  }
})

