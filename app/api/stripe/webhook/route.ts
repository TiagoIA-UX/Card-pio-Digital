import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/shared/supabase/admin'

// Desabilitar body parsing automático do Next.js — Stripe precisa do raw body
export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
})

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!

// Mapeamento de status Stripe → status interno
const SUBSCRIPTION_STATUS_MAP: Record<string, string> = {
  active: 'active',
  trialing: 'trialing',
  past_due: 'past_due',
  canceled: 'canceled',
  unpaid: 'past_due',
  incomplete: 'pending',
  incomplete_expired: 'canceled',
  paused: 'paused',
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Validar assinatura do webhook
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Assinatura ausente' }, { status: 400 })
  }

  if (!WEBHOOK_SECRET || WEBHOOK_SECRET === 'whsec_PREENCHER_DEPOIS') {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET não configurado')
    return NextResponse.json({ error: 'Webhook secret não configurado' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Assinatura inválida'
    console.error('[stripe/webhook] Falha na validação da assinatura:', message)
    return NextResponse.json({ error: `Assinatura inválida: ${message}` }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 2. Idempotência: verificar se o evento já foi processado
  const { data: existingEvent } = await supabase
    .from('webhook_events')
    .select('id, status')
    .eq('provider', 'stripe')
    .eq('event_id', event.id)
    .maybeSingle()

  if (existingEvent?.status === 'processed') {
    return NextResponse.json({ received: true, skipped: true, reason: 'duplicate' })
  }

  // 3. Registrar evento como recebido
  await supabase
    .from('webhook_events')
    .upsert(
      {
        provider: 'stripe',
        event_id: event.id,
        event_type: event.type,
        status: 'received',
        payload: event as unknown as Record<string, unknown>,
        origin: 'stripe',
      },
      { onConflict: 'provider,event_id' }
    )
    .select('id')
    .maybeSingle()

  try {
    // 4. Processar evento
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(supabase, event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(supabase, event.data.object as Stripe.Invoice)
        break

      case 'invoice.paid':
        await handleInvoicePaid(supabase, event.data.object as Stripe.Invoice)
        break

      default:
        // Evento não tratado — registrar como skipped
        await supabase
          .from('webhook_events')
          .update({ status: 'skipped', ignored_reason: 'event_type_not_handled' })
          .eq('provider', 'stripe')
          .eq('event_id', event.id)

        return NextResponse.json({ received: true, skipped: true, reason: 'event_type_not_handled' })
    }

    // 5. Marcar como processado
    await supabase
      .from('webhook_events')
      .update({ status: 'processed', processed_at: new Date().toISOString(), applied_at: new Date().toISOString() })
      .eq('provider', 'stripe')
      .eq('event_id', event.id)

    return NextResponse.json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error(`[stripe/webhook] Erro ao processar evento ${event.type}:`, message)

    await supabase
      .from('webhook_events')
      .update({ status: 'failed', error_message: message })
      .eq('provider', 'stripe')
      .eq('event_id', event.id)

    return NextResponse.json({ error: 'Erro interno ao processar evento' }, { status: 500 })
  }
}

// -------------------------------------------------------
// Handlers de eventos
// -------------------------------------------------------

/**
 * checkout.session.completed
 * Disparado quando o cliente conclui o checkout.
 * Vincula o stripe_customer_id ao tenant e registra a assinatura.
 */
async function handleCheckoutSessionCompleted(
  supabase: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session
): Promise<void> {
  const tenantId = session.metadata?.tenant_id
  if (!tenantId) {
    console.warn('[stripe/webhook] checkout.session.completed sem tenant_id no metadata', {
      sessionId: session.id,
    })
    return
  }

  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null

  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id ?? null

  if (!customerId) {
    console.warn('[stripe/webhook] checkout.session.completed sem customer_id', {
      sessionId: session.id,
      tenantId,
    })
    return
  }

  // Atualizar restaurant com stripe_customer_id
  const { error: restaurantError } = await supabase
    .from('restaurants')
    .update({
      stripe_customer_id: customerId,
      ...(subscriptionId && { stripe_subscription_id: subscriptionId }),
    })
    .eq('id', tenantId)

  if (restaurantError) {
    throw new Error(
      `Falha ao atualizar restaurant com stripe_customer_id: ${restaurantError.message}`
    )
  }

  // Se há assinatura, buscar detalhes e persistir
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    await upsertSubscriptionRecord(supabase, tenantId, customerId, subscription)
  }

  console.info('[stripe/webhook] checkout.session.completed processado', {
    tenantId,
    customerId,
    subscriptionId,
  })
}

/**
 * customer.subscription.created / customer.subscription.updated
 * Sincroniza o status da assinatura no banco.
 */
async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
): Promise<void> {
  const tenantId = subscription.metadata?.tenant_id

  // Buscar tenant pelo stripe_customer_id se não tiver no metadata
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id

  let resolvedTenantId = tenantId

  if (!resolvedTenantId) {
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()

    resolvedTenantId = restaurant?.id ?? null
  }

  if (!resolvedTenantId) {
    console.warn('[stripe/webhook] subscription.updated: tenant não encontrado', {
      subscriptionId: subscription.id,
      customerId,
    })
    return
  }

  await upsertSubscriptionRecord(supabase, resolvedTenantId, customerId, subscription)

  console.info('[stripe/webhook] subscription.updated processado', {
    tenantId: resolvedTenantId,
    subscriptionId: subscription.id,
    status: subscription.status,
  })
}

/**
 * customer.subscription.deleted
 * Marca a assinatura como cancelada.
 */
async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (!restaurant?.id) {
    console.warn('[stripe/webhook] subscription.deleted: tenant não encontrado', {
      subscriptionId: subscription.id,
      customerId,
    })
    return
  }

  // Atualizar restaurant
  await supabase
    .from('restaurants')
    .update({
      stripe_subscription_status: 'canceled',
    })
    .eq('id', restaurant.id)

  // Atualizar subscriptions
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      stripe_subscription_status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  console.info('[stripe/webhook] subscription.deleted processado', {
    tenantId: restaurant.id,
    subscriptionId: subscription.id,
  })
}

/**
 * invoice.payment_failed
 * Marca a assinatura como past_due.
 * No Stripe v22, o subscription_id fica em invoice.parent.subscription_details.subscription
 */
async function handleInvoicePaymentFailed(
  supabase: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
): Promise<void> {
  const customerId =
    typeof invoice.customer === 'string' ? invoice.customer : null

  if (!customerId) return

  const subscriptionId = getSubscriptionIdFromInvoice(invoice)

  await supabase
    .from('restaurants')
    .update({ stripe_subscription_status: 'past_due' })
    .eq('stripe_customer_id', customerId)

  if (subscriptionId) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        stripe_subscription_status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId)
  }

  console.info('[stripe/webhook] invoice.payment_failed processado', { customerId, subscriptionId })
}

/**
 * invoice.paid
 * Confirma que o pagamento foi realizado — garante status active.
 * No Stripe v22, o subscription_id fica em invoice.parent.subscription_details.subscription
 */
async function handleInvoicePaid(
  supabase: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
): Promise<void> {
  const customerId =
    typeof invoice.customer === 'string' ? invoice.customer : null

  if (!customerId) return

  const subscriptionId = getSubscriptionIdFromInvoice(invoice)

  if (!subscriptionId) return

  // Buscar detalhes atualizados da assinatura
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (!restaurant?.id) return

  await upsertSubscriptionRecord(supabase, restaurant.id, customerId, subscription)

  console.info('[stripe/webhook] invoice.paid processado', { customerId, subscriptionId })
}

/**
 * Extrai o subscription_id de um Invoice no Stripe v22.
 * No Stripe v22, subscription foi movido para invoice.parent.subscription_details.subscription
 */
function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent
  if (!parent) return null
  if (parent.type !== 'subscription_details') return null
  const sub = parent.subscription_details?.subscription
  if (!sub) return null
  return typeof sub === 'string' ? sub : sub.id
}

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

/**
 * Persiste/atualiza o registro de assinatura Stripe no banco.
 */
async function upsertSubscriptionRecord(
  supabase: ReturnType<typeof createAdminClient>,
  tenantId: string,
  customerId: string,
  subscription: Stripe.Subscription
): Promise<void> {
  const priceId = subscription.items.data[0]?.price?.id ?? null
  const currentPeriodEnd = (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : null
  const internalStatus = SUBSCRIPTION_STATUS_MAP[subscription.status] ?? subscription.status

  // Atualizar restaurants
  await supabase
    .from('restaurants')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_subscription_status: subscription.status,
      stripe_price_id: priceId,
      stripe_current_period_end: currentPeriodEnd,
    })
    .eq('id', tenantId)

  // Upsert em subscriptions
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  const subPayload = {
    user_id: null as string | null,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_subscription_status: subscription.status,
    stripe_price_id: priceId,
    stripe_current_period_end: currentPeriodEnd,
    stripe_cancel_at_period_end: subscription.cancel_at_period_end,
    status: internalStatus,
    payment_gateway: 'stripe',
    billing_model: 'stripe_subscription',
    updated_at: new Date().toISOString(),
  }

  // Buscar user_id pelo tenant
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('owner_id')
    .eq('id', tenantId)
    .maybeSingle()

  const userId = restaurant?.owner_id ?? null

  if (existingSub?.id) {
    await supabase
      .from('subscriptions')
      .update({ ...subPayload, user_id: userId })
      .eq('id', existingSub.id)
  } else {
    await supabase.from('subscriptions').insert({
      ...subPayload,
      user_id: userId,
      restaurant_id: tenantId,
      created_at: new Date().toISOString(),
    })
  }
}


