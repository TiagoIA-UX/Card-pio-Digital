import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createMercadoPagoPreApprovalClient } from '@/lib/mercadopago'
import { validateMercadoPagoWebhookSignature } from '@/lib/mercadopago-webhook'

function getSupabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function getMercadoPagoClient() {
  return createMercadoPagoPreApprovalClient(10000)
}

// Dias de tolerância antes de suspender
const DAYS_TOLERANCE = 7

export async function POST(request: NextRequest) {
  try {
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')
    const body = await request.json()

    // Mercado Pago envia diferentes tipos de notificação
    const { type, data, action } = body

    console.log('Webhook subscription recebido:', { type, action, data })

    const supabaseAdmin = getSupabaseAdmin()
    const preApproval = getMercadoPagoClient()

    // Notificação de assinatura
    if (type === 'subscription_preapproval' || type === 'preapproval') {
      const preapprovalId = data?.id

      if (!preapprovalId) {
        return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })
      }

      const webhookSecret = process.env.MP_WEBHOOK_SECRET
      if (webhookSecret) {
        const isValid = validateMercadoPagoWebhookSignature(
          xSignature,
          xRequestId,
          preapprovalId.toString(),
          webhookSecret
        )

        if (!isValid) {
          console.error('❌ Assinatura inválida no webhook de assinatura')
          return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
        }
      }

      // Buscar detalhes da assinatura no Mercado Pago
      const preapprovalData = await preApproval.get({ id: preapprovalId })

      if (!preapprovalData) {
        return NextResponse.json({ error: 'Assinatura não encontrada no MP' }, { status: 404 })
      }

      // Extrair referência externa
      let externalRef: { restaurant_id?: string; user_id?: string; plan_slug?: string } = {}
      try {
        externalRef = JSON.parse(preapprovalData.external_reference || '{}')
      } catch {
        console.warn('Não foi possível parsear external_reference')
      }

      const mpStatus = preapprovalData.status // authorized | paused | cancelled | pending

      // Mapear status do MP para nosso status
      let ourStatus = 'pending'
      let shouldSuspend = false
      let shouldReactivate = false

      switch (mpStatus) {
        case 'authorized':
          ourStatus = 'active'
          shouldReactivate = true
          break
        case 'paused':
          ourStatus = 'paused'
          break
        case 'cancelled':
          ourStatus = 'canceled'
          shouldSuspend = true
          break
        case 'pending':
          ourStatus = 'pending'
          break
      }

      // Atualizar assinatura no banco
      const { data: subscription, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          mp_subscription_status: mpStatus,
          status: ourStatus,
          mp_payer_id: preapprovalData.payer_id?.toString(),
          last_payment_date: preapprovalData.last_modified
            ? new Date(preapprovalData.last_modified)
            : null,
          next_payment_date: preapprovalData.next_payment_date
            ? new Date(preapprovalData.next_payment_date)
            : null,
          ...(mpStatus === 'cancelled' ? { canceled_at: new Date() } : {}),
        })
        .eq('mp_preapproval_id', preapprovalId)
        .select('restaurant_id')
        .single()

      if (subError) {
        console.error('Erro ao atualizar subscription:', subError)
      }

      // Suspender ou reativar restaurante
      if (subscription?.restaurant_id) {
        if (shouldSuspend) {
          await supabaseAdmin.rpc('suspend_restaurant_for_nonpayment', {
            p_restaurant_id: subscription.restaurant_id,
          })
          console.log('Restaurante suspenso:', subscription.restaurant_id)
        } else if (shouldReactivate) {
          if (externalRef.plan_slug) {
            await supabaseAdmin
              .from('restaurants')
              .update({ plan_slug: externalRef.plan_slug })
              .eq('id', subscription.restaurant_id)
          }

          await supabaseAdmin.rpc('reactivate_restaurant', {
            p_restaurant_id: subscription.restaurant_id,
          })
          console.log('Restaurante reativado:', subscription.restaurant_id)
        }
      }

      return NextResponse.json({ success: true, status: ourStatus })
    }

    // Notificação de pagamento de assinatura
    if (type === 'subscription_authorized_payment') {
      const paymentId = data?.id

      // Registrar pagamento
      // Buscar assinatura pelo payment
      // Isso requer uma chamada adicional ao MP para obter detalhes do pagamento

      console.log('Pagamento de assinatura recebido:', paymentId)

      return NextResponse.json({ success: true, payment_id: paymentId })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro no webhook de subscription:', error)
    return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 500 })
  }
}

// GET para verificação do Mercado Pago
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'subscription-webhook' })
}
