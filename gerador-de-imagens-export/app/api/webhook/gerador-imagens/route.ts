import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createMercadoPagoPaymentClient } from '@/lib/mercadopago'
import { validateMercadoPagoWebhookSignature } from '@/lib/mercadopago-webhook'

function getAdmin() {
  return createAdminClient()
}

function extractDataId(body: Record<string, unknown>): string | null {
  if (body.data && typeof body.data === 'object' && 'id' in body.data) {
    return String((body.data as Record<string, unknown>).id)
  }
  return null
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // Validar assinatura do webhook (quando configurado)
  const webhookSecret = process.env.MP_WEBHOOK_SECRET
  if (webhookSecret) {
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')
    const dataId = extractDataId(body) ?? ''

    const isValid = validateMercadoPagoWebhookSignature(
      xSignature,
      xRequestId,
      dataId,
      webhookSecret
    )

    if (!isValid) {
      console.warn('[gerador-imagens webhook] Assinatura inválida')
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
    }
  }

  const eventType = body.type
  const dataId = extractDataId(body)

  // Só processa notificações de pagamento
  if (eventType !== 'payment' || !dataId) {
    return NextResponse.json({ received: true })
  }

  try {
    // Buscar dados do pagamento no Mercado Pago
    const mpPaymentClient = createMercadoPagoPaymentClient()
    const payment = await mpPaymentClient.get({ id: dataId })

    if (!payment?.id) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }

    const externalReference = payment.external_reference
    if (!externalReference || !externalReference.startsWith('ai-img-')) {
      // Não é um pagamento do gerador de imagens, ignorar
      return NextResponse.json({ received: true, skipped: true })
    }

    const admin = getAdmin()

    // Verificar idempotência: já processamos este pagamento?
    const { data: existingOrder } = await admin
      .from('ai_image_orders')
      .select('id, status, user_id, credits_amount, pack_slug')
      .eq('mp_external_reference', externalReference)
      .single()

    if (!existingOrder) {
      console.error('[gerador-imagens webhook] Pedido não encontrado:', externalReference)
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    if (existingOrder.status === 'approved') {
      // Já processado com sucesso — idempotência
      return NextResponse.json({ received: true, alreadyProcessed: true })
    }

    const mpStatus = payment.status // approved | rejected | cancelled | pending

    // Atualizar status do pedido
    await admin
      .from('ai_image_orders')
      .update({
        mp_payment_id: String(payment.id),
        status: mpStatus ?? 'pending',
        amount_paid: payment.transaction_amount ?? null,
        payment_method: payment.payment_type_id ?? null,
        approved_at: mpStatus === 'approved' ? (payment.date_approved ?? new Date().toISOString()) : null,
        metadata: {
          mp_status_detail: payment.status_detail,
          mp_payment_method_id: payment.payment_method_id,
        },
      })
      .eq('id', existingOrder.id)

    // Se aprovado: adicionar créditos ao usuário
    if (mpStatus === 'approved' && existingOrder.user_id) {
      const { error: creditError } = await admin.rpc('add_ai_image_credits', {
        p_user_id: existingOrder.user_id,
        p_credits: existingOrder.credits_amount,
      })

      if (creditError) {
        console.error('[gerador-imagens webhook] Erro ao adicionar créditos:', creditError)
        return NextResponse.json({ error: 'Erro ao creditar' }, { status: 500 })
      }

      console.log(
        `[gerador-imagens webhook] ✅ ${existingOrder.credits_amount} créditos adicionados para ${existingOrder.user_id}`
      )
    }

    return NextResponse.json({ received: true, status: mpStatus })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    console.error('[gerador-imagens webhook] Erro:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET para verificação do Mercado Pago
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'ai-image-generator-webhook' })
}
