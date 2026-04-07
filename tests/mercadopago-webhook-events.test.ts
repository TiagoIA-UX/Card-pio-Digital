import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildMercadoPagoWebhookEventId,
  finishMercadoPagoWebhookEvent,
  MERCADO_PAGO_WEBHOOK_PROVIDER,
  startMercadoPagoWebhookEvent,
} from '@/lib/domains/core/mercadopago-webhook-events'

function createWebhookEventsAdminMock(options?: {
  insertResult?: { error: { code?: string } | null }
  singleResult?: { data: { status: string } | null; error: Error | null }
  retrySelectResult?: { data: Array<{ event_id: string }> | null; error: Error | null }
  updateResult?: { error: Error | null }
}) {
  const state = {
    insertPayload: null as Record<string, unknown> | null,
    updateCalls: [] as Array<{
      payload: Record<string, unknown>
      filters: Record<string, unknown>
      selection: string | null
    }>,
  }

  const admin = {
    from(table: string) {
      assert.equal(table, 'webhook_events')

      return {
        insert(payload: Record<string, unknown>) {
          state.insertPayload = payload
          return Promise.resolve(options?.insertResult ?? { error: null })
        },
        select(selection: string) {
          const filters: Record<string, unknown> = { __selection: selection }

          const chain = {
            eq(key: string, value: unknown) {
              filters[key] = value
              return chain
            },
            single() {
              return Promise.resolve(options?.singleResult ?? { data: null, error: null })
            },
          }

          return chain
        },
        update(payload: Record<string, unknown>) {
          const filters: Record<string, unknown> = {}

          const chain = {
            eq(key: string, value: unknown) {
              filters[key] = value
              return chain
            },
            select(selection: string) {
              state.updateCalls.push({
                payload,
                filters: { ...filters },
                selection,
              })

              return Promise.resolve(
                options?.retrySelectResult ?? {
                  data: null,
                  error: null,
                }
              )
            },
            then(
              resolve: (value: { error: Error | null }) => unknown,
              reject?: (reason: unknown) => unknown
            ) {
              state.updateCalls.push({
                payload,
                filters: { ...filters },
                selection: null,
              })

              return Promise.resolve(options?.updateResult ?? { error: null }).then(resolve, reject)
            },
          }

          return chain
        },
      }
    },
  }

  return { admin: admin as never, state }
}

test('buildMercadoPagoWebhookEventId usa action quando disponível e cai para o tipo do evento', () => {
  assert.equal(
    buildMercadoPagoWebhookEventId({
      paymentId: 123,
      action: 'payment.updated',
      eventType: 'payment',
    }),
    'payment_123_payment.updated'
  )

  assert.equal(
    buildMercadoPagoWebhookEventId({
      paymentId: '456',
      action: null,
      eventType: 'payment',
    }),
    'payment_456_payment'
  )

  assert.equal(
    buildMercadoPagoWebhookEventId({
      paymentId: null,
      action: 'payment.updated',
      eventType: 'payment',
    }),
    null
  )

  assert.equal(
    buildMercadoPagoWebhookEventId({
      paymentId: '789',
      action: { invalid: true },
      eventType: 'payment',
    }),
    'payment_789_payment'
  )
})

test('startMercadoPagoWebhookEvent inicia evento novo', async () => {
  const { admin, state } = createWebhookEventsAdminMock()

  const result = await startMercadoPagoWebhookEvent(admin, {
    eventId: 'payment_123_payment',
    eventType: 'payment',
    payload: { foo: 'bar' },
  })

  assert.deepEqual(result, { shouldProcess: true, duplicate: false })
  assert.equal(state.insertPayload?.provider, MERCADO_PAGO_WEBHOOK_PROVIDER)
  assert.equal(state.insertPayload?.event_id, 'payment_123_payment')
})

test('startMercadoPagoWebhookEvent ignora duplicado já processado', async () => {
  const { admin } = createWebhookEventsAdminMock({
    insertResult: { error: { code: '23505' } },
    singleResult: { data: { status: 'processed' }, error: null },
  })

  const result = await startMercadoPagoWebhookEvent(admin, {
    eventId: 'payment_123_payment',
    eventType: 'payment',
    payload: { foo: 'bar' },
  })

  assert.deepEqual(result, { shouldProcess: false, duplicate: true })
})

test('startMercadoPagoWebhookEvent reativa evento falho para retry', async () => {
  const { admin, state } = createWebhookEventsAdminMock({
    insertResult: { error: { code: '23505' } },
    singleResult: { data: { status: 'failed' }, error: null },
    retrySelectResult: { data: [{ event_id: 'payment_123_payment' }], error: null },
  })

  const result = await startMercadoPagoWebhookEvent(admin, {
    eventId: 'payment_123_payment',
    eventType: 'payment',
    payload: { foo: 'bar' },
  })

  assert.deepEqual(result, { shouldProcess: true, duplicate: false })
  assert.equal(state.updateCalls[0]?.payload.status, 'received')
  assert.equal(state.updateCalls[0]?.filters.provider, MERCADO_PAGO_WEBHOOK_PROVIDER)
  assert.equal(state.updateCalls[0]?.filters.status, 'failed')
})

test('finishMercadoPagoWebhookEvent registra processed_at apenas para status finalizáveis', async () => {
  const { admin, state } = createWebhookEventsAdminMock()

  await finishMercadoPagoWebhookEvent(admin, {
    eventId: 'payment_123_payment',
    status: 'processed',
  })

  assert.equal(state.updateCalls.length, 1)
  assert.equal(state.updateCalls[0]?.payload.status, 'processed')
  assert.equal(state.updateCalls[0]?.filters.provider, MERCADO_PAGO_WEBHOOK_PROVIDER)
  assert.equal(state.updateCalls[0]?.filters.event_id, 'payment_123_payment')
  assert.match(String(state.updateCalls[0]?.payload.processed_at), /^\d{4}-\d{2}-\d{2}T/)
})
