import { dispatchTask } from '@/lib/domains/zaea/orchestrator'
import { notify } from '@/lib/shared/notifications'

export interface MercadoPagoWebhookIncidentInput {
  eventId?: string | null
  eventType?: string | null
  paymentId?: string | number | null
  externalReference?: string | null
  requestId?: string | null
  stage?: string | null
  errorMessage: string
  stack?: string | null
}

export interface MercadoPagoWebhookIncidentPayload {
  title: string
  body: string
  metadata: Record<string, unknown>
  taskType: string
  taskInput: Record<string, unknown>
}

export function buildMercadoPagoWebhookIncidentPayload(
  input: MercadoPagoWebhookIncidentInput
): MercadoPagoWebhookIncidentPayload {
  const correlationId = [
    input.eventId || 'event:none',
    input.paymentId ? `payment:${input.paymentId}` : 'payment:none',
    input.requestId || 'request:none',
    input.stage || 'stage:none',
  ].join('|')

  const metadata = {
    event_id: input.eventId || null,
    event_type: input.eventType || null,
    payment_id: input.paymentId?.toString() || null,
    external_reference: input.externalReference || null,
    request_id: input.requestId || null,
    stage: input.stage || null,
    correlation_id: correlationId,
    error_message: input.errorMessage,
    stack: input.stack || null,
  }

  const body = [
    `Falha detectada no webhook Mercado Pago.`,
    input.stage ? `Etapa: ${input.stage}` : null,
    input.eventType ? `Tipo do evento: ${input.eventType}` : null,
    input.eventId ? `Evento: ${input.eventId}` : null,
    input.paymentId ? `Pagamento: ${input.paymentId}` : null,
    input.externalReference ? `Referência externa: ${input.externalReference}` : null,
    input.requestId ? `Request ID: ${input.requestId}` : null,
    `Correlation ID: ${correlationId}`,
    `Erro: ${input.errorMessage}`,
  ]
    .filter(Boolean)
    .join('\n')

  return {
    title: 'Falha crítica no webhook Mercado Pago',
    body,
    metadata,
    taskType: 'investigate-payment-webhook-failure',
    taskInput: {
      source: 'mercadopago-webhook',
      priority_hint: 'p1',
      ...metadata,
    },
  }
}

export async function reportMercadoPagoWebhookIncident(
  input: MercadoPagoWebhookIncidentInput
): Promise<void> {
  const incident = buildMercadoPagoWebhookIncidentPayload(input)

  await notify({
    severity: 'critical',
    channel: 'payment',
    title: incident.title,
    body: incident.body,
    metadata: incident.metadata,
    emailAdmin: true,
  }).catch((error) => {
    console.error('[mercadopago-webhook-monitoring] Falha ao emitir alerta:', error)
  })

  await dispatchTask({
    agent: 'sentinel',
    taskType: incident.taskType,
    input: incident.taskInput,
    priority: 'p1',
    triggeredBy: 'mercadopago-webhook',
  }).catch((error) => {
    console.error('[mercadopago-webhook-monitoring] Falha ao despachar tarefa ZAEA:', error)
  })
}
