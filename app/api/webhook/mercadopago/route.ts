import { NextRequest, NextResponse } from 'next/server'
import { createMercadoPagoPaymentClient } from '@/lib/mercadopago'
import { validateMercadoPagoWebhookSignature } from '@/lib/mercadopago-webhook'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestSiteUrl } from '@/lib/site-url'
import { mapMercadoPagoStatus } from '@/lib/payment-status'
import {
  buildRestaurantInstallation,
  normalizePhone,
  ONBOARDING_PLAN_CONFIG,
  slugifyRestaurantName,
} from '@/lib/restaurant-onboarding'
import { normalizeTemplateSlug } from '@/lib/restaurant-customization'

// ── Log estruturado (JSON → stdout) ───────────────────────────────────────
// Cada linha é um objeto JSON — filtrável com: vercel logs | grep webhook_
type WLogLevel = 'info' | 'warn' | 'error'
type WebhookEvent =
  | 'webhook_received'
  | 'webhook_signature_invalid'
  | 'webhook_duplicate_skipped'
  | 'webhook_payment_processed'
  | 'webhook_onboarding_fulfilled'
  | 'webhook_restaurant_updated'
  | 'webhook_affiliate_registered'
  | 'webhook_bonus_fund_updated'
  | 'webhook_error'

function logEvent(level: WLogLevel, event: WebhookEvent, data: Record<string, unknown>) {
  const entry = JSON.stringify({
    level,
    event,
    ...data,
    timestamp: new Date().toISOString(),
    service: 'webhook/mercadopago',
  })
  if (level === 'error') console.error(entry)
  else if (level === 'warn') console.warn(entry)
  else console.log(entry)
}

// Marca uma notificação como processada na tabela de idempotência
async function markWebhookProcessed(admin: ReturnType<typeof createAdminClient>, eventId: string) {
  if (!eventId) return
  await admin
    .from('webhook_events')
    .update({ status: 'processed', processed_at: new Date().toISOString() })
    .eq('provider', 'mercadopago')
    .eq('event_id', eventId)
}

function getSupabase() {
  return createAdminClient()
}

function getMetadata(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {} as Record<string, unknown>
  }

  return value as Record<string, unknown>
}

async function upsertCheckoutSession(
  admin: ReturnType<typeof createAdminClient>,
  payload: {
    orderId: string
    userId?: string | null
    templateSlug?: string | null
    onboardingPlanSlug?: string | null
    subscriptionPlanSlug?: string | null
    paymentMethod?: string | null
    mpPreferenceId?: string | null
    mpPaymentId?: string | null
    status: string
    metadata?: Record<string, unknown>
  }
) {
  try {
    await admin.from('checkout_sessions').upsert(
      {
        order_id: payload.orderId,
        user_id: payload.userId || null,
        template_slug: payload.templateSlug || null,
        onboarding_plan_slug: payload.onboardingPlanSlug || null,
        subscription_plan_slug: payload.subscriptionPlanSlug || null,
        payment_method: payload.paymentMethod || null,
        mp_preference_id: payload.mpPreferenceId || null,
        mp_payment_id: payload.mpPaymentId || null,
        status: payload.status,
        metadata: payload.metadata || {},
      },
      { onConflict: 'order_id' }
    )
  } catch (error) {
    logEvent('warn', 'webhook_error', { step: 'sync_checkout_sessions', error: String(error) })
  }
}

async function findUserByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
  let page = 1

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })

    if (error) {
      throw error
    }

    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase())

    if (user) {
      return user
    }

    if (data.users.length < 200) {
      break
    }

    page += 1
  }

  return null
}

async function ensureCheckoutOwner(
  admin: ReturnType<typeof createAdminClient>,
  orderUserId: string | null,
  metadata: Record<string, unknown>
) {
  if (orderUserId) {
    const { data, error } = await admin.auth.admin.getUserById(orderUserId)
    if (!error && data.user) {
      return data.user
    }
  }

  const email = String(metadata.customer_email || '')
    .trim()
    .toLowerCase()
  if (!email) {
    throw new Error('Checkout sem email do responsável')
  }

  const existingUser = await findUserByEmail(admin, email)
  if (existingUser) {
    return existingUser
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: {
      name: String(metadata.customer_name || '').trim() || null,
      phone: normalizePhone(String(metadata.customer_phone || '')) || null,
    },
  })

  if (error || !data.user) {
    throw error || new Error('Não foi possível criar usuário administrador')
  }

  return data.user
}

async function ensureAdminUserRecord(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  role: 'admin' | 'super_admin' = 'admin'
) {
  const { error } = await admin
    .from('admin_users')
    .upsert({ user_id: userId, role }, { onConflict: 'user_id' })

  if (error) {
    throw error
  }
}

async function ensureActivationEvent(
  admin: ReturnType<typeof createAdminClient>,
  payload: {
    userId: string
    restaurantId: string
    eventType: string
    details?: Record<string, unknown>
  }
) {
  const { data: existingEvent } = await admin
    .from('activation_events')
    .select('id')
    .eq('restaurant_id', payload.restaurantId)
    .eq('event_type', payload.eventType)
    .limit(1)
    .maybeSingle()

  if (existingEvent?.id) {
    return existingEvent.id
  }

  const { data, error } = await admin
    .from('activation_events')
    .insert({
      user_id: payload.userId,
      restaurant_id: payload.restaurantId,
      event_type: payload.eventType,
      details: payload.details || {},
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  return data.id
}

async function generateActivationUrl(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  siteUrl: string
) {
  const redirectTo = `${siteUrl}/auth/callback?next=/painel`
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo,
    },
  })

  if (error) {
    logEvent('warn', 'webhook_error', { step: 'generate_magic_link', error: String(error) })
    return null
  }

  return data.properties?.action_link || null
}

async function createUniqueRestaurantSlug(
  admin: ReturnType<typeof createAdminClient>,
  restaurantName: string,
  requestedBase?: string | null
) {
  const base = requestedBase || slugifyRestaurantName(restaurantName) || 'cardapio-digital'

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`
    const { data } = await admin
      .from('restaurants')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (!data) {
      return candidate
    }
  }

  return `${base}-${Date.now().toString(36)}`
}

async function activateSubscription(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  restaurantId: string,
  paymentAmount: number | null,
  subscriptionPlanSlug: string
) {
  const normalizedPlanSlug =
    subscriptionPlanSlug in ONBOARDING_PLAN_CONFIG
      ? ONBOARDING_PLAN_CONFIG[subscriptionPlanSlug as keyof typeof ONBOARDING_PLAN_CONFIG]
          .subscriptionPlanSlug
      : subscriptionPlanSlug

  const { data: plan } = await admin
    .from('plans')
    .select('id')
    .eq('slug', normalizedPlanSlug)
    .maybeSingle()

  if (!plan?.id) {
    return
  }

  const periodStart = new Date()
  const periodEnd = new Date(periodStart)
  periodEnd.setDate(periodEnd.getDate() + 30)

  const { data: existingSubscription } = await admin
    .from('subscriptions')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .maybeSingle()

  const payload = {
    user_id: userId,
    restaurant_id: restaurantId,
    plan_id: plan.id,
    status: 'active',
    payment_gateway: 'mercadopago',
    current_period_start: periodStart.toISOString(),
    current_period_end: periodEnd.toISOString(),
    price_brl: paymentAmount ?? 0,
  }

  if (existingSubscription?.id) {
    await admin.from('subscriptions').update(payload).eq('id', existingSubscription.id)
    return
  }

  await admin.from('subscriptions').insert(payload)

  if (paymentAmount) {
    logEvent('info', 'webhook_restaurant_updated', {
      step: 'subscription_activated',
      restaurant_id: restaurantId,
      valor: paymentAmount,
    })
  }
}

async function provisionRestaurantForOrder(
  admin: ReturnType<typeof createAdminClient>,
  order: {
    id: string
    user_id: string | null
    metadata: unknown
  },
  payment: {
    transaction_amount?: number | null
  },
  siteUrl: string
) {
  const metadata = getMetadata(order.metadata)
  const owner = await ensureCheckoutOwner(admin, order.user_id, metadata)
  await ensureAdminUserRecord(admin, owner.id)
  const restaurantName = String(metadata.restaurant_name || '').trim() || 'Meu Cardápio Digital'
  const rawSlug = String(metadata.template_slug || '')
    .trim()
    .toLowerCase()
  const templateSlug = normalizeTemplateSlug(rawSlug || 'restaurante')
  const subscriptionPlanSlug = String(metadata.subscription_plan_slug || 'basico')
  const installation = buildRestaurantInstallation(templateSlug, restaurantName)

  const { data: existingRestaurant } = await admin
    .from('restaurants')
    .select('id, slug')
    .eq('user_id', owner.id)
    .maybeSingle()

  const restaurantSlug = existingRestaurant?.slug
    ? existingRestaurant.slug
    : await createUniqueRestaurantSlug(
        admin,
        restaurantName,
        String(metadata.restaurant_slug_base || '') || null
      )

  let restaurantId = existingRestaurant?.id || null

  const baseCustomizacao = installation.restaurantUpdate.customizacao || {}

  const restaurantPayload = {
    user_id: owner.id,
    nome: restaurantName,
    slug: restaurantSlug,
    telefone: normalizePhone(String(metadata.customer_phone || '')) || '11999999999',
    ativo: true,
    status_pagamento: 'ativo',
    plano: metadata.plan_slug === 'feito-pra-voce' ? 'feito-pra-voce' : 'self-service',
    plan_slug: subscriptionPlanSlug,
    valor_pago: payment.transaction_amount || 0,
    data_pagamento: new Date().toISOString(),
    ...installation.restaurantUpdate,
    customizacao: typeof baseCustomizacao === 'object' ? baseCustomizacao : {},
  }

  if (restaurantId) {
    await admin.from('restaurants').update(restaurantPayload).eq('id', restaurantId)
  } else {
    const { data: newRestaurant, error: restaurantError } = await admin
      .from('restaurants')
      .insert(restaurantPayload)
      .select('id')
      .single()

    if (restaurantError || !newRestaurant) {
      throw restaurantError || new Error('Não foi possível criar restaurante')
    }

    restaurantId = newRestaurant.id
  }

  const { count: productCount } = await admin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId)

  if (!productCount) {
    const sampleProducts = installation.sampleProducts.map((product) => ({
      restaurant_id: restaurantId,
      nome: product.nome,
      descricao: product.descricao,
      preco: product.preco,
      categoria: product.categoria,
      imagem_url: product.imagem_url || null,
      ordem: product.ordem,
      ativo: true,
    }))

    await admin.from('products').insert(sampleProducts)
  }

  await activateSubscription(
    admin,
    owner.id,
    restaurantId,
    payment.transaction_amount || null,
    subscriptionPlanSlug
  )

  await ensureActivationEvent(admin, {
    userId: owner.id,
    restaurantId,
    eventType: 'onboarding_provisioned',
    details: {
      order_id: order.id,
      template_slug: templateSlug,
      subscription_plan_slug: subscriptionPlanSlug,
    },
  })

  // Registrar em user_purchases para aparecer em Meus Templates
  const { data: templateRow } = await admin
    .from('templates')
    .select('id')
    .eq('slug', templateSlug)
    .maybeSingle()
  if (templateRow?.id) {
    await admin.from('user_purchases').upsert(
      {
        user_id: owner.id,
        template_id: templateRow.id,
        order_id: order.id,
        status: 'active',
        purchased_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,template_id', ignoreDuplicates: false }
    )
  }

  const activationUrl = await generateActivationUrl(
    admin,
    String(owner.email || metadata.customer_email || '')
      .trim()
      .toLowerCase(),
    siteUrl
  )

  // Registrar indicação de afiliado, se o pedido veio via link ?ref=
  const affRef = String(metadata.aff_ref || '').trim()
  if (affRef && restaurantId) {
    try {
      const { data: tenant } = await admin
        .from('restaurants')
        .select('tenant_id')
        .eq('id', restaurantId)
        .maybeSingle()

      const tenantId = tenant?.tenant_id ?? restaurantId

      await fetch(`${siteUrl}/api/afiliados/indicacao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          plano: subscriptionPlanSlug,
          valor_assinatura: payment.transaction_amount || 0,
          ref_code: affRef,
        }),
      })
    } catch (affErr) {
      logEvent('warn', 'webhook_affiliate_registered', {
        step: 'register_referral_failed',
        aff_ref: affRef,
        error: String(affErr),
      })
    }
  }

  return {
    ownerId: owner.id,
    restaurantId,
    restaurantSlug,
    activationUrl,
  }
}

async function processOnboardingPayment(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
  payment: {
    id?: number | null
    status?: string | null
    status_detail?: string | null
    transaction_amount?: number | null
    payment_method_id?: string | null
    payment_type_id?: string | null
  },
  siteUrl: string
) {
  const { data: order, error: orderError } = await admin
    .from('template_orders')
    .select('id, user_id, payment_status, payment_id, metadata, coupon_id')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    throw orderError || new Error('Pedido de onboarding não encontrado')
  }

  const mappedStatus = mapMercadoPagoStatus(payment.status)
  const metadata = getMetadata(order.metadata)
  const alreadyApproved = order.payment_status === 'approved'
  const samePaymentAlreadyProcessed =
    alreadyApproved && !!order.payment_id && order.payment_id === (payment.id?.toString() || null)
  const baseMetadata = {
    ...metadata,
    mp_status: payment.status || null,
    mp_status_detail: payment.status_detail || null,
    mp_payment_type: payment.payment_type_id || null,
    onboarding_status:
      mappedStatus.paymentStatus === 'approved'
        ? 'provisioning'
        : mappedStatus.paymentStatus === 'pending'
          ? 'awaiting_payment'
          : 'payment_rejected',
  }

  await upsertCheckoutSession(admin, {
    orderId,
    userId: order.user_id,
    templateSlug: String(metadata.template_slug || ''),
    onboardingPlanSlug: String(metadata.plan_slug || ''),
    subscriptionPlanSlug: String(metadata.subscription_plan_slug || ''),
    paymentMethod: payment.payment_method_id || String(metadata.payment_method || ''),
    mpPreferenceId: String(metadata.mp_preference_id || ''),
    mpPaymentId: payment.id?.toString() || null,
    status: mappedStatus.paymentStatus,
    metadata: baseMetadata,
  })

  if (!alreadyApproved && mappedStatus.paymentStatus === 'approved' && order.coupon_id) {
    await admin.rpc('increment_coupon_usage', { p_coupon_id: order.coupon_id })
  }

  if (samePaymentAlreadyProcessed && metadata.provisioned_restaurant_id) {
    return
  }

  if (mappedStatus.paymentStatus !== 'approved') {
    await admin
      .from('template_orders')
      .update({
        payment_status: mappedStatus.paymentStatus,
        status: mappedStatus.orderStatus,
        payment_id: payment.id?.toString() || null,
        payment_method: payment.payment_method_id || null,
        metadata: baseMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    return
  }

  if (metadata.provisioned_restaurant_id) {
    await admin
      .from('template_orders')
      .update({
        payment_status: 'approved',
        status: 'completed',
        payment_id: payment.id?.toString() || null,
        payment_method: payment.payment_method_id || null,
        metadata: {
          ...baseMetadata,
          onboarding_status: 'ready',
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    await upsertCheckoutSession(admin, {
      orderId,
      userId: String(metadata.owner_user_id || order.user_id || ''),
      templateSlug: String(metadata.template_slug || ''),
      onboardingPlanSlug: String(metadata.plan_slug || ''),
      subscriptionPlanSlug: String(metadata.subscription_plan_slug || ''),
      paymentMethod: payment.payment_method_id || String(metadata.payment_method || ''),
      mpPreferenceId: String(metadata.mp_preference_id || ''),
      mpPaymentId: payment.id?.toString() || null,
      status: 'approved',
      metadata: {
        ...baseMetadata,
        onboarding_status: 'ready',
      },
    })

    return
  }

  const provisioned = await provisionRestaurantForOrder(admin, order, payment, siteUrl)

  // ── Fundo de bônus: 10% do setup alimenta o bonus_fund ────────────────────
  // Falha aqui NUNCA bloqueia o provisionamento (try/catch isolado)
  try {
    const paymentAmount = payment.transaction_amount ?? 0
    if (paymentAmount > 0 && provisioned.restaurantId) {
      const reserva = Math.floor(paymentAmount * 0.1 * 100) / 100
      const { data: restData } = await admin
        .from('restaurants')
        .select('nome')
        .eq('id', provisioned.restaurantId)
        .maybeSingle()
      await admin.from('bonus_fund').insert({
        tipo: 'entrada',
        valor: reserva,
        restaurant_id: provisioned.restaurantId,
        descricao: `Reserva 10% setup — ${restData?.nome ?? provisioned.restaurantId}`,
      })
    }
  } catch (fundErr) {
    logEvent('error', 'webhook_bonus_fund_updated', {
      step: 'bonus_fund_credit_failed',
      restaurant_id: provisioned.restaurantId,
      error: String(fundErr),
    })
  }

  await admin
    .from('template_orders')
    .update({
      payment_status: 'approved',
      status: 'completed',
      payment_id: payment.id?.toString() || null,
      payment_method: payment.payment_method_id || null,
      metadata: {
        ...baseMetadata,
        onboarding_status: 'ready',
        provisioned_restaurant_id: provisioned.restaurantId,
        provisioned_restaurant_slug: provisioned.restaurantSlug,
        owner_user_id: provisioned.ownerId,
        activation_url: provisioned.activationUrl,
        provisioned_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  await upsertCheckoutSession(admin, {
    orderId,
    userId: provisioned.ownerId,
    templateSlug: String(metadata.template_slug || ''),
    onboardingPlanSlug: String(metadata.plan_slug || ''),
    subscriptionPlanSlug: String(metadata.subscription_plan_slug || ''),
    paymentMethod: payment.payment_method_id || String(metadata.payment_method || ''),
    mpPreferenceId: String(metadata.mp_preference_id || ''),
    mpPaymentId: payment.id?.toString() || null,
    status: 'ready',
    metadata: {
      ...baseMetadata,
      onboarding_status: 'ready',
      provisioned_restaurant_id: provisioned.restaurantId,
      provisioned_restaurant_slug: provisioned.restaurantSlug,
      owner_user_id: provisioned.ownerId,
      activation_url: provisioned.activationUrl,
    },
  })
}

export async function POST(request: NextRequest) {
  const siteUrl = getRequestSiteUrl(request)
  const supabase = getSupabase()
  const mercadopago = createMercadoPagoPaymentClient()
  let notificationId = ''
  try {
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')
    const body = await request.json()
    notificationId = String(body.id || body.data?.id || `unknown-${Date.now()}`)

    logEvent('info', 'webhook_received', {
      notification_id: notificationId,
      type: body.type,
      data_id: body.data?.id,
      live_mode: body.live_mode ?? null,
    })

    // ── Idempotência: cada notificação é processada exatamente uma vez ────────
    // Consulta se já existe registro 'processed' para este notification_id.
    // MP reenvia webhooks em retry — sem esta guarda seria duplo-processado.
    const { data: existingWebhookEvent } = await supabase
      .from('webhook_events')
      .select('id, status')
      .eq('provider', 'mercadopago')
      .eq('event_id', notificationId)
      .eq('status', 'processed')
      .maybeSingle()

    if (existingWebhookEvent) {
      logEvent('info', 'webhook_duplicate_skipped', {
        notification_id: notificationId,
        type: body.type,
        existing_event_id: existingWebhookEvent.id,
      })
      return NextResponse.json({ received: true })
    }

    // Registra o evento como 'received' (upsert: permite retry de eventos 'failed')
    await supabase.from('webhook_events').upsert(
      {
        provider: 'mercadopago',
        event_id: notificationId,
        event_type: String(body.type || 'unknown'),
        status: 'received',
        payload: body,
      },
      { onConflict: 'provider,event_id' }
    )

    // Mercado Pago envia diferentes tipos de notificação
    if (body.type === 'payment') {
      const paymentId = body.data?.id

      if (!paymentId) {
        logEvent('warn', 'webhook_received', {
          step: 'missing_payment_id',
          notification_id: notificationId,
          type: body.type,
        })
        await markWebhookProcessed(supabase, notificationId)
        return NextResponse.json({ received: true })
      }

      const webhookSecret = process.env.MP_WEBHOOK_SECRET
      if (webhookSecret) {
        const isValid = validateMercadoPagoWebhookSignature(
          xSignature,
          xRequestId,
          paymentId.toString(),
          webhookSecret
        )

        if (!isValid) {
          logEvent('error', 'webhook_signature_invalid', {
            notification_id: notificationId,
            x_request_id: xRequestId,
            payment_id: paymentId,
          })
          return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
        }
      }

      // Buscar detalhes do pagamento
      const payment = await mercadopago.get({ id: paymentId })
      const externalReference = payment.external_reference
      const status = payment.status

      if (!externalReference) {
        logEvent('warn', 'webhook_received', {
          step: 'no_external_reference',
          payment_id: paymentId,
          payment_status: payment.status,
          notification_id: notificationId,
        })
        await markWebhookProcessed(supabase, notificationId)
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
          },
          siteUrl
        )

        logEvent('info', 'webhook_onboarding_fulfilled', {
          notification_id: notificationId,
          order_id: externalReference.replace('onboarding:', ''),
          payment_id: payment.id,
          payment_status: status,
          valor: payment.transaction_amount,
        })
        await markWebhookProcessed(supabase, notificationId)
        return NextResponse.json({ received: true })
      }

      // Mapear status do Mercado Pago
      const mappedStatus = mapMercadoPagoStatus(status)
      const { data: restaurantData } = await supabase
        .from('restaurants')
        .select('plano')
        .eq('id', externalReference)
        .maybeSingle()

      // Atualizar restaurante
      const updateData: Record<string, unknown> = {
        status_pagamento: mappedStatus.restaurantPaymentStatus,
      }

      if (status === 'approved') {
        updateData.ativo = true
        updateData.plano = restaurantData?.plano ?? 'self-service'
        updateData.valor_pago = payment.transaction_amount
        updateData.data_pagamento = new Date().toISOString()
      }

      if (status === 'rejected' || status === 'cancelled') {
        updateData.ativo = false
      }

      const { error } = await supabase
        .from('restaurants')
        .update(updateData)
        .eq('id', externalReference)

      if (error) {
        logEvent('error', 'webhook_error', {
          step: 'update_restaurant',
          restaurant_id: externalReference,
          error: error.message,
          notification_id: notificationId,
        })
      } else {
        logEvent('info', 'webhook_restaurant_updated', {
          step: 'status_updated',
          restaurant_id: externalReference,
          new_status: mappedStatus.restaurantPaymentStatus,
          payment_status: status,
          payment_id: paymentId,
          notification_id: notificationId,
        })
      }
    }

    await markWebhookProcessed(supabase, notificationId)
    return NextResponse.json({ received: true })
  } catch (error) {
    logEvent('error', 'webhook_error', {
      error: String(error),
      notification_id: notificationId,
      step: 'post_handler',
    })
    if (notificationId) {
      await supabase
        .from('webhook_events')
        .update({ status: 'failed', error_message: String(error) })
        .eq('provider', 'mercadopago')
        .eq('event_id', notificationId)
    }
    return NextResponse.json(
      { received: false, error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}

// ── GET — verificação do endpoint pelo Mercado Pago ───────────────────────
// MP envia GET para confirmar que a URL está ativa antes de ativar o webhook.
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'mercadopago-webhook', version: '2' })
}

export const __internal = {
  processOnboardingPayment,
}
