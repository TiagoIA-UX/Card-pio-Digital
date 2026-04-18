import { NextRequest, NextResponse } from 'next/server'
import { createMercadoPagoPaymentClient } from '@/lib/domains/core/mercadopago'
import { processOnboardingPayment } from '@/lib/domains/core/mercadopago-onboarding-payment'
import { processLegacyRestaurantPayment } from '@/lib/domains/core/mercadopago-legacy-restaurant-payment'
import {
  buildMercadoPagoWebhookEventId,
  finishMercadoPagoWebhookEvent,
  startMercadoPagoWebhookEvent,
} from '@/lib/domains/core/mercadopago-webhook-events'
import { validateMercadoPagoWebhookSignature } from '@/lib/domains/core/mercadopago-webhook'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import { getRequestSiteUrl } from '@/lib/shared/site-url'
import { finalizeDeliveryPayment } from '@/lib/domains/payments/finalize-delivery-payment'
import { safeParseMercadoPagoWebhookBody } from '@/lib/domains/core/mercadopago-webhook-processing'
import { reportMercadoPagoWebhookIncident } from '@/lib/domains/core/mercadopago-webhook-monitoring'
import { syncFinancialTruthForTenant } from '@/lib/domains/core/financial-truth'

function getSupabase() {
  return createAdminClient()
}

function getMetadata(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {} as Record<string, unknown>
  }

  return value as Record<string, unknown>
}

export async function POST(request: NextRequest) {
  const siteUrl = getRequestSiteUrl(request)
  const supabase = getSupabase()
  const mercadopago = createMercadoPagoPaymentClient()
  let webhookEventId: string | null = null
  let webhookEventType: string | null = null
  let webhookPaymentId: string | number | null = null
  let webhookExternalReference: string | null = null
  let webhookRequestId: string | null = null
  try {
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')
    webhookRequestId = xRequestId
    const rawBody = await request.text()
    const body = safeParseMercadoPagoWebhookBody(rawBody)

    if (!body) {
      console.warn('Webhook ignorado: payload JSON inválido')
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    // Validação de assinatura HMAC deve ocorrer ANTES de qualquer processamento
    const webhookSecret = process.env.MP_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('❌ MP_WEBHOOK_SECRET não configurado — webhook rejeitado por segurança')
      return NextResponse.json({ error: 'Configuração de segurança ausente' }, { status: 500 })
    }

    const bodyData = getMetadata(body.data)
    const dataId = String(bodyData.id || '')
    if (!dataId) {
      console.warn('Webhook ignorado: payload sem data.id')
      return NextResponse.json({ received: true, ignored: 'missing_data_id' })
    }

    const isValid = validateMercadoPagoWebhookSignature(
      xSignature,
      xRequestId,
      dataId,
      webhookSecret
    )

    if (!isValid) {
      console.error('❌ Assinatura inválida no webhook do Mercado Pago')
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
    }

    // Mercado Pago envia diferentes tipos de notificação
    if (body.type === 'payment') {
      webhookEventType = body.type
      const paymentId =
        typeof bodyData.id === 'string' || typeof bodyData.id === 'number' ? bodyData.id : null
      webhookPaymentId = paymentId

      if (!paymentId) {
        return NextResponse.json({ received: true })
      }

      webhookEventId = buildMercadoPagoWebhookEventId({
        paymentId,
        action: body.action,
        eventType: body.type,
      })

      if (!webhookEventId) {
        return NextResponse.json({ received: true })
      }

      const webhookEvent = await startMercadoPagoWebhookEvent(supabase, {
        eventId: webhookEventId,
        eventType: body.type,
        payload: body as Record<string, unknown>,
      })

      if (!webhookEvent.shouldProcess) {
        return NextResponse.json({ received: true, duplicate: true })
      }

      // Buscar detalhes do pagamento
      const payment = await mercadopago.get({ id: paymentId })

      const externalReference = payment.external_reference
      webhookExternalReference =
        typeof externalReference === 'string' ? externalReference : String(externalReference || '')
      const status = payment.status

      if (!externalReference) {
        await finishMercadoPagoWebhookEvent(supabase, {
          eventId: webhookEventId,
          status: 'skipped',
          errorMessage: 'Pagamento sem external_reference',
        })
        return NextResponse.json({ received: true })
      }

      if (typeof externalReference === 'string' && externalReference.startsWith('onboarding:')) {
        await processOnboardingPayment(
          supabase,
          externalReference.replace('onboarding:', ''),
          {
            id: payment.id,
            status,
            status_detail: payment.status_detail,
            transaction_amount: payment.transaction_amount,
            payment_method_id: payment.payment_method_id,
            payment_type_id: payment.payment_type_id,
            date_approved: payment.date_approved,
          },
          siteUrl
        )

        await finishMercadoPagoWebhookEvent(supabase, {
          eventId: webhookEventId,
          status: 'processed',
        })

        return NextResponse.json({ received: true })
      }

      // ── Pagamento de pedido de delivery ──────────────────────────
      if (typeof externalReference === 'string' && externalReference.startsWith('delivery:')) {
        const deliveryOrderId = externalReference.replace('delivery:', '')

        await finalizeDeliveryPayment({
          orderId: deliveryOrderId,
          payment: {
            id: payment.id,
            status,
            status_detail: payment.status_detail,
            transaction_amount: payment.transaction_amount,
            payment_method_id: payment.payment_method_id,
            payment_type_id: payment.payment_type_id,
            date_approved: payment.date_approved,
            payer: payment.payer,
            external_reference: externalReference,
          },
          siteUrl,
          source: 'webhook',
        })

        await finishMercadoPagoWebhookEvent(supabase, {
          eventId: webhookEventId,
          status: 'processed',
        })

        return NextResponse.json({ received: true })
      }

      await processLegacyRestaurantPayment(supabase, String(externalReference), {
        id: payment.id,
        status,
        status_detail: payment.status_detail,
        transaction_amount: payment.transaction_amount,
        date_approved: payment.date_approved,
        payer: payment.payer,
      })

      await syncFinancialTruthForTenant(supabase, {
        tenantId: String(externalReference),
        source: 'payment',
        sourceId: String(payment.id),
        lastEventAt: payment.date_approved || new Date().toISOString(),
        rawSnapshot: {
          webhook_type: body.type,
          payment_id: payment.id,
          payment_status: status,
        },
      })

      await finishMercadoPagoWebhookEvent(supabase, {
        eventId: webhookEventId,
        status: 'processed',
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    if (webhookEventId) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido no processamento'
      await finishMercadoPagoWebhookEvent(supabase, {
        eventId: webhookEventId,
        status: 'failed',
        errorMessage: message.slice(0, 500),
      }).catch(() => undefined)
    }

    await reportMercadoPagoWebhookIncident({
      eventId: webhookEventId,
      eventType: webhookEventType,
      paymentId: webhookPaymentId,
      externalReference: webhookExternalReference,
      requestId: webhookRequestId,
      stage: 'mercadopago-webhook-post',
      errorMessage: error instanceof Error ? error.message : 'Erro desconhecido no processamento',
      stack: error instanceof Error ? error.stack || null : null,
    }).catch(() => undefined)

    console.error('Erro no webhook:', error)
    return NextResponse.json(
      { received: false, error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}

// Mercado Pago também pode enviar GET para verificar
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
