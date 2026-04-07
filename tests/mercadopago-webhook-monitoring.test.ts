import test from 'node:test'
import assert from 'node:assert/strict'
import { buildMercadoPagoWebhookIncidentPayload } from '@/lib/domains/core/mercadopago-webhook-monitoring'

test('buildMercadoPagoWebhookIncidentPayload gera título, corpo e metadata rastreáveis', () => {
  const payload = buildMercadoPagoWebhookIncidentPayload({
    eventId: 'payment_123_payment',
    eventType: 'payment',
    paymentId: 123,
    externalReference: 'onboarding:order-1',
    requestId: 'req-abc',
    stage: 'process_onboarding_payment',
    errorMessage: 'Falha ao provisionar delivery',
  })

  assert.equal(payload.title, 'Falha crítica no webhook Mercado Pago')
  assert.equal(payload.taskType, 'investigate-payment-webhook-failure')
  assert.equal(payload.metadata.event_id, 'payment_123_payment')
  assert.equal(payload.metadata.payment_id, '123')
  assert.equal(payload.metadata.stage, 'process_onboarding_payment')
  assert.match(payload.body, /Falha detectada no webhook Mercado Pago\./)
  assert.match(payload.body, /Erro: Falha ao provisionar delivery/)
  assert.equal(payload.taskInput.source, 'mercadopago-webhook')
})

test('buildMercadoPagoWebhookIncidentPayload tolera campos opcionais ausentes', () => {
  const payload = buildMercadoPagoWebhookIncidentPayload({
    errorMessage: 'Erro desconhecido no processamento',
  })

  assert.equal(payload.metadata.event_id, null)
  assert.equal(payload.metadata.payment_id, null)
  assert.equal(payload.metadata.stage, null)
  assert.match(payload.body, /Erro: Erro desconhecido no processamento/)
})