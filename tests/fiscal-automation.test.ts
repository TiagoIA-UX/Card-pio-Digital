import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareFiscalInvoiceMetadata, resolveFiscalAutomationConfig } from '@/lib/domains/core/fiscal'

function createTestEnv(overrides: Partial<NodeJS.ProcessEnv> = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'test',
    ...overrides,
  }
}

test('fiscal automation stays disabled and safe by default', () => {
  const config = resolveFiscalAutomationConfig(createTestEnv())

  assert.equal(config.enabled, false)
  assert.equal(config.dryRun, true)
  assert.equal(config.provider, null)
  assert.equal(config.documentKind, 'nfse')
})

test('fiscal preparation reports missing configuration when enabled without provider data', () => {
  const metadata = prepareFiscalInvoiceMetadata(
    {
      orderId: 'order_123',
      paymentId: 'pay_123',
      paymentAmount: 147,
      approvedAt: '2026-04-03T10:00:00.000Z',
      customerName: 'Tiago Rocha',
      customerEmail: 'tiago@example.com',
      customerPhone: '12996887993',
      restaurantName: 'Delivery Exemplo',
    },
    createTestEnv({
      FISCAL_AUTOMATION_ENABLED: 'true',
    })
  )

  assert.equal(metadata.status, 'needs_manual_review')
  assert.ok(metadata.missing_fields.includes('fiscal_municipal_registration'))
  assert.ok(metadata.missing_fields.includes('fiscal_service_code'))
})

test('fiscal preparation becomes dry-run ready when the minimum setup is present', () => {
  const metadata = prepareFiscalInvoiceMetadata(
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
      FISCAL_AUTOMATION_DRY_RUN: 'true',
      FISCAL_PROVIDER: 'focusnfe',
      FISCAL_DOCUMENT_KIND: 'nfse',
      FISCAL_MUNICIPAL_REGISTRATION: '123456',
      FISCAL_SERVICE_CODE: '1.05',
      FOCUSNFE_API_KEY: 'secret',
    })
  )

  assert.equal(metadata.status, 'dry_run_ready')
  assert.equal(metadata.provider, 'focusnfe')
  assert.equal(metadata.service.service_code, '1.05')
  assert.equal(metadata.restaurant.slug, 'delivery-exemplo')
  assert.equal(metadata.customer.document, '61699939000180')
  assert.equal(metadata.customer.document_type, 'cnpj')
})

test('fiscal preparation can require customer document when fiscal rule is enabled', () => {
  const metadata = prepareFiscalInvoiceMetadata(
    {
      orderId: 'order_456',
      paymentId: 'pay_456',
      paymentAmount: 197,
      approvedAt: '2026-04-03T12:00:00.000Z',
      customerName: 'Tiago Rocha',
      customerEmail: 'tiago@example.com',
      customerPhone: '12996887993',
      restaurantName: 'Delivery Exemplo',
    },
    createTestEnv({
      FISCAL_AUTOMATION_ENABLED: 'true',
      FISCAL_AUTOMATION_DRY_RUN: 'true',
      FISCAL_PROVIDER: 'focusnfe',
      FISCAL_DOCUMENT_KIND: 'nfse',
      FISCAL_MUNICIPAL_REGISTRATION: '123456',
      FISCAL_SERVICE_CODE: '1.05',
      FISCAL_REQUIRE_CUSTOMER_TAX_ID: 'true',
      FOCUSNFE_API_KEY: 'secret',
    })
  )

  assert.equal(metadata.status, 'needs_manual_review')
  assert.ok(metadata.missing_fields.includes('customer_document'))
})
