import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createMercadoPagoPreApprovalClient } from '@/lib/domains/core/mercadopago'
import { validateMercadoPagoWebhookSignature } from '@/lib/domains/core/mercadopago-webhook'
import { SubscriptionWebhookSchema, zodErrorResponse } from '@/lib/domains/core/schemas'

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

export async function POST(request: NextRequest) {
  try {
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')
    const body = await request.json()

    // Validar estrutura do payload
    const parsed = SubscriptionWebhookSchema.safeParse(body)
    if (!parsed.success) {
      return zodErrorResponse(parsed.error)
    }

    // Mercado Pago envia diferentes tipos de notificação
    const { type, data, action } = parsed.data

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

          // ── Comissão de afiliado respeita janela real de aprovação ─────
          // O webhook não aprova comissão. A liberação acontece no cron
          // diário após 30 dias completos da indicação.
          try {
            const { data: restaurant } = await supabaseAdmin
              .from('restaurants')
              .select('tenant_id, origin_sale')
              .eq('id', subscription.restaurant_id)
              .single()

            console.log(
              `[webhook-sub] SALE_TYPE: ${restaurant?.origin_sale || 'unknown'} | restaurant_id: ${subscription.restaurant_id}`
            )

            // Venda direta do admin → 100% receita para a empresa, sem comissão
            if (restaurant?.origin_sale === 'admin_direct') {
              logSubEvent('info', 'subscription_affiliate_commission_skipped_admin_direct', {
                restaurant_id: subscription.restaurant_id,
              })
            } else {
              const tenantId = restaurant?.tenant_id ?? subscription.restaurant_id
              if (tenantId) {
                logSubEvent('info', 'subscription_affiliate_commission_waiting_window', {
                  tenant_id: tenantId,
                  approval_window_days: 30,
                })
              } else {
                logSubEvent('warn', 'subscription_affiliate_commission_skipped', { tenantId })
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

      // Atualizar last_payment_date e garantir status ativo
      if (paymentId) {
        try {
          // Buscar a subscription que recebeu pagamento (via resource_id = preapproval_id)
          const resourceId = body.resource_id || body.data?.id
          if (resourceId) {
            const { data: sub } = await supabaseAdmin
              .from('subscriptions')
              .select('id, restaurant_id')
              .eq('mp_preapproval_id', String(resourceId))
              .single()

            if (sub) {
              await supabaseAdmin
                .from('subscriptions')
                .update({
                  status: 'active',
                  last_payment_date: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', sub.id)

              // Garantir que restaurante está ativo e não suspenso
              await supabaseAdmin
                .from('restaurants')
                .update({ status_pagamento: 'ativo', suspended: false })
                .eq('id', sub.restaurant_id)

              logSubEvent('info', 'subscription_payment_processed', {
                subscription_id: sub.id,
                restaurant_id: sub.restaurant_id,
              })
            }
          }
        } catch (payErr) {
          logSubEvent('warn', 'subscription_payment_processing_error', {
            error: String(payErr),
            payment_id: paymentId,
          })
        }
      }

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
