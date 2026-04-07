import { createAdminClient } from '@/lib/shared/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

export const MERCADO_PAGO_WEBHOOK_PROVIDER = 'mercadopago_payment'

export function buildMercadoPagoWebhookEventId(params: {
  paymentId?: string | number | null
  action?: unknown
  eventType: string
}) {
  if (typeof params.paymentId !== 'string' && typeof params.paymentId !== 'number') {
    return null
  }

  const actionOrType =
    typeof params.action === 'string' && params.action.trim() ? params.action : params.eventType
  return `payment_${params.paymentId}_${actionOrType}`
}

interface MercadoPagoWebhookEventStartPayload {
  eventId: string
  eventType: string
  payload: Record<string, unknown>
}

interface MercadoPagoWebhookEventFinishPayload {
  eventId: string
  status: 'processed' | 'failed' | 'skipped'
  errorMessage?: string | null
}

export async function startMercadoPagoWebhookEvent(
  admin: AdminClient,
  payload: MercadoPagoWebhookEventStartPayload
) {
  const { error } = await admin.from('webhook_events').insert({
    provider: MERCADO_PAGO_WEBHOOK_PROVIDER,
    event_id: payload.eventId,
    event_type: payload.eventType,
    status: 'received',
    payload: payload.payload,
    error_message: null,
    processed_at: null,
  })

  if (!error) {
    return { shouldProcess: true as const, duplicate: false as const }
  }

  if (error.code !== '23505') {
    throw error
  }

  const { data: existingEvent, error: existingEventError } = await admin
    .from('webhook_events')
    .select('status')
    .eq('provider', MERCADO_PAGO_WEBHOOK_PROVIDER)
    .eq('event_id', payload.eventId)
    .single()

  if (existingEventError || !existingEvent) {
    throw existingEventError || new Error('Não foi possível reler webhook duplicado')
  }

  if (existingEvent.status === 'processed' || existingEvent.status === 'skipped') {
    return { shouldProcess: false as const, duplicate: true as const }
  }

  if (existingEvent.status === 'received') {
    return { shouldProcess: false as const, duplicate: true as const }
  }

  const { data: retriedEvent, error: retryError } = await admin
    .from('webhook_events')
    .update({
      status: 'received',
      payload: payload.payload,
      error_message: null,
      processed_at: null,
    })
    .eq('provider', MERCADO_PAGO_WEBHOOK_PROVIDER)
    .eq('event_id', payload.eventId)
    .eq('status', 'failed')
    .select('event_id')

  if (retryError) {
    throw retryError
  }

  if (!retriedEvent || retriedEvent.length === 0) {
    return { shouldProcess: false as const, duplicate: true as const }
  }

  return { shouldProcess: true as const, duplicate: false as const }
}

export async function finishMercadoPagoWebhookEvent(
  admin: AdminClient,
  payload: MercadoPagoWebhookEventFinishPayload
) {
  await admin
    .from('webhook_events')
    .update({
      status: payload.status,
      error_message: payload.errorMessage || null,
      processed_at:
        payload.status === 'processed' || payload.status === 'skipped'
          ? new Date().toISOString()
          : null,
    })
    .eq('provider', MERCADO_PAGO_WEBHOOK_PROVIDER)
    .eq('event_id', payload.eventId)
}
