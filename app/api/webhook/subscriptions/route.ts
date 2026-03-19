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

// ── Log estruturado (JSON → stdout) ───────────────────────────────────────
type SLogLevel = 'info' | 'warn' | 'error'
function logSubEvent(level: SLogLevel, event: string, data: Record<string, unknown>) {
  const entry = JSON.stringify({
    level,
    event,
    ...data,
    timestamp: new Date().toISOString(),
    service: 'webhook/subscriptions',
  })
  if (level === 'error') console.error(entry)
  else if (level === 'warn') console.warn(entry)
  else console.log(entry)
}

// Marca notificação como processada na tabela de idempotência
async function markSubscriptionWebhookProcessed(
  admin: ReturnType<typeof getSupabaseAdmin>,
  eventId: string
) {
  if (!eventId) return
  await admin
    .from('webhook_events')
    .update({ status: 'processed', processed_at: new Date().toISOString() })
    .eq('provider', 'mercadopago_subscription')
    .eq('event_id', eventId)
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

    logSubEvent('info', 'subscription_webhook_received', { type, action, data_id: data?.id })

    const supabaseAdmin = getSupabaseAdmin()
    const preApproval = getMercadoPagoClient()

    // Notificação de assinatura
    if (type === 'subscription_preapproval' || type === 'preapproval') {
      const preapprovalId = data?.id

      if (!preapprovalId) {
        return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })
      }

      // ── Idempotência ─────────────────────────────────────────
      const eventId = `sub_${preapprovalId}_${action || type}`
      const { error: idempErr } = await supabaseAdmin.from('webhook_events').insert({
        provider: 'mercadopago_subscription',
        event_id: eventId,
        event_type: type,
        status: 'received',
        payload: body,
      })
      if (idempErr?.code === '23505') {
        logSubEvent('info', 'subscription_webhook_duplicate_skipped', { event_id: eventId })
        return NextResponse.json({ received: true, duplicate: true })
      }

      const webhookSecret = process.env.MP_WEBHOOK_SECRET
      if (!webhookSecret) {
        logSubEvent('error', 'subscription_webhook_secret_missing', {
          preapproval_id: preapprovalId,
        })
        return NextResponse.json({ error: 'Configuração de segurança ausente' }, { status: 500 })
      }

      const isValid = validateMercadoPagoWebhookSignature(
        xSignature,
        xRequestId,
        preapprovalId.toString(),
        webhookSecret
      )

      if (!isValid) {
        logSubEvent('warn', 'subscription_webhook_signature_invalid', {
          preapproval_id: preapprovalId,
        })
        return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
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
        logSubEvent('error', 'subscription_update_failed', {
          preapproval_id: preapprovalId,
          error: subError.message,
        })
      }

      // Suspender ou reativar restaurante
      if (subscription?.restaurant_id) {
        if (shouldSuspend) {
          await supabaseAdmin.rpc('suspend_restaurant_for_nonpayment', {
            p_restaurant_id: subscription.restaurant_id,
          })
          logSubEvent('info', 'subscription_restaurant_suspended', {
            restaurant_id: subscription.restaurant_id,
          })
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
          logSubEvent('info', 'subscription_restaurant_reactivated', {
            restaurant_id: subscription.restaurant_id,
          })

          // ── Auto-aprovar comissão de afiliado ──────────────────────────
          // Quando a assinatura é reativada/renovada, aprova automaticamente
          // a comissão do afiliado (vendedor 30% + líder 10%)
          // GUARD: vendas diretas do admin NÃO geram comissão
          try {
            const { data: restaurant } = await supabaseAdmin
              .from('restaurants')
              .select('tenant_id, origin_sale')
              .eq('id', subscription.restaurant_id)
              .single()

            console.log(`[webhook-sub] SALE_TYPE: ${restaurant?.origin_sale || 'unknown'} | restaurant_id: ${subscription.restaurant_id}`)

            // Venda direta do admin → 100% receita para a empresa, sem comissão
            if (restaurant?.origin_sale === 'admin_direct') {
              logSubEvent('info', 'subscription_affiliate_commission_skipped_admin_direct', {
                restaurant_id: subscription.restaurant_id,
              })
            } else {
              const { data: sub } = await supabaseAdmin
                .from('subscriptions')
                .select('price_brl')
                .eq('restaurant_id', subscription.restaurant_id)
                .single()

              const tenantId = restaurant?.tenant_id ?? subscription.restaurant_id
              const priceBrl = sub?.price_brl ?? 0

              if (tenantId && priceBrl > 0) {
                await supabaseAdmin.rpc('approve_affiliate_commission', {
                  p_tenant_id: tenantId,
                  p_valor_assinatura: priceBrl,
                })
                logSubEvent('info', 'subscription_affiliate_commission_approved', {
                  tenant_id: tenantId,
                })
              } else {
                logSubEvent('warn', 'subscription_affiliate_commission_skipped', {
                  tenantId,
                  priceBrl,
                })
              }
            }
          } catch (commErr) {
            logSubEvent('warn', 'subscription_affiliate_commission_error', {
              error: String(commErr),
            })
          }
        }
      }

      await markSubscriptionWebhookProcessed(supabaseAdmin, eventId)
      return NextResponse.json({ success: true, status: ourStatus })
    }

    // Notificação de pagamento de assinatura
    if (type === 'subscription_authorized_payment') {
      const paymentId = data?.id
      logSubEvent('info', 'subscription_payment_received', { payment_id: paymentId })
      return NextResponse.json({ success: true, payment_id: paymentId })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logSubEvent('error', 'subscription_webhook_error', { error: String(error) })
    return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 500 })
  }
}

// GET para verificação do Mercado Pago
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'subscription-webhook' })
}
