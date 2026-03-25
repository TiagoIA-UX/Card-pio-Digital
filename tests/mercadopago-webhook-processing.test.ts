import test from 'node:test'
import assert from 'node:assert/strict'
import {
  maskAffiliateRef,
  resolveKnownTemplateSlug,
  resolvePaymentTimestamp,
  safeParseMercadoPagoWebhookBody,
  withCheckoutSessionSyncState,
} from '@/lib/mercadopago-webhook-processing'

test('safeParseMercadoPagoWebhookBody accepts valid json objects only', () => {
  assert.deepEqual(safeParseMercadoPagoWebhookBody('{"type":"payment","data":{"id":"123"}}'), {
    type: 'payment',
    data: { id: '123' },
  })
  assert.equal(safeParseMercadoPagoWebhookBody('not-json'), null)
  assert.equal(safeParseMercadoPagoWebhookBody('[]'), null)
})

test('resolveKnownTemplateSlug blocks unknown slugs', () => {
  assert.equal(resolveKnownTemplateSlug('pizzaria'), 'pizzaria')
  assert.equal(resolveKnownTemplateSlug('slug-malicioso'), null)
  assert.equal(resolveKnownTemplateSlug(''), null)
})

test('resolvePaymentTimestamp prefers approved date and falls back safely', () => {
  assert.equal(resolvePaymentTimestamp('2026-03-24T10:00:00.000Z'), '2026-03-24T10:00:00.000Z')

  const fallback = new Date('2026-03-25T12:00:00.000Z')
  assert.equal(resolvePaymentTimestamp('data-invalida', fallback), fallback.toISOString())
  assert.equal(resolvePaymentTimestamp(null, fallback), fallback.toISOString())
})

test('maskAffiliateRef avoids logging the full affiliate code', () => {
  assert.equal(maskAffiliateRef('vendedor_1234'), 've***34')
  assert.equal(maskAffiliateRef('abc'), '***')
  assert.equal(maskAffiliateRef(null), 'none')
})

test('withCheckoutSessionSyncState records explicit sync failure state', () => {
  assert.deepEqual(withCheckoutSessionSyncState({ foo: 'bar' }, null), {
    foo: 'bar',
    checkout_session_sync_failed: false,
    checkout_session_sync_error: null,
  })

  assert.deepEqual(withCheckoutSessionSyncState({ foo: 'bar' }, 'timeout'), {
    foo: 'bar',
    checkout_session_sync_failed: true,
    checkout_session_sync_error: 'timeout',
  })
})
