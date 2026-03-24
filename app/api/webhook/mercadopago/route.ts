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
import { TEMPLATE_PRESETS, normalizeTemplateSlug } from '@/lib/restaurant-customization'
import { notifyPaymentRejected, notifyPaymentApproved } from '@/lib/notifications'

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
    console.warn('Falha ao sincronizar checkout_sessions:', error)
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
    console.error('Erro ao gerar magic link:', error)
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

function formatTemplateNameFromSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
}

async function ensureTemplateIdForPurchase(
  admin: ReturnType<typeof createAdminClient>,
  templateSlug: string
) {
  const { data: existingTemplate } = await admin
    .from('templates')
    .select('id')
    .eq('slug', templateSlug)
    .maybeSingle()

  if (existingTemplate?.id) {
    return existingTemplate.id
  }

  const preset = TEMPLATE_PRESETS[templateSlug as keyof typeof TEMPLATE_PRESETS]
  const name =
    preset?.label || formatTemplateNameFromSlug(templateSlug) || 'Template Cardápio Digital'
  const description = preset?.heroDescription || `Template ${name} para Cardápio Digital`
  const shortDescription = preset?.badge || null

  const { data: insertedTemplate, error: insertError } = await admin
    .from('templates')
    .upsert(
      {
        slug: templateSlug,
        name,
        description,
        short_description: shortDescription,
        category: templateSlug,
        status: 'active',
      },
      { onConflict: 'slug' }
    )
    .select('id')
    .single()

  if (insertError) {
    console.error('Falha ao criar template fallback para compra:', insertError)
  }

  if (insertedTemplate?.id) {
    return insertedTemplate.id
  }

  const { data: fetchedTemplate } = await admin
    .from('templates')
    .select('id')
    .eq('slug', templateSlug)
    .maybeSingle()

  return fetchedTemplate?.id || null
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
  }

  if (existingSubscription?.id) {
    await admin.from('subscriptions').update(payload).eq('id', existingSubscription.id)
    return
  }

  await admin.from('subscriptions').insert(payload)

  if (paymentAmount) {
    console.log(`Assinatura ativada para ${restaurantId} com valor ${paymentAmount}`)
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

  const restaurantSlug = await createUniqueRestaurantSlug(
    admin,
    restaurantName,
    String(metadata.restaurant_slug_base || '') || null
  )

  let restaurantId: string | null = null

  const baseCustomizacao = installation.restaurantUpdate.customizacao || {}

  // Determinar canal de venda: se tem aff_ref → affiliate, senão → organic
  const originSale = metadata.aff_ref ? 'affiliate' : 'organic'
  console.log(
    `[webhook-mp] SALE_TYPE: ${originSale} | aff_ref: ${metadata.aff_ref || 'none'} | restaurant: ${restaurantName}`
  )

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
    origin_sale: originSale,
    ...installation.restaurantUpdate,
    customizacao: typeof baseCustomizacao === 'object' ? baseCustomizacao : {},
  }

  const { data: newRestaurant, error: restaurantError } = await admin
    .from('restaurants')
    .insert(restaurantPayload)
    .select('id')
    .single()

  if (restaurantError || !newRestaurant) {
    throw restaurantError || new Error('Não foi possível criar restaurante')
  }

  restaurantId = newRestaurant.id

  if (!restaurantId) {
    throw new Error('Não foi possível obter o delivery provisionado')
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
  const templateId = await ensureTemplateIdForPurchase(admin, templateSlug)
  if (templateId) {
    await admin.from('user_purchases').upsert(
      {
        user_id: owner.id,
        template_id: templateId,
        order_id: order.id,
        status: 'active',
        purchased_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,template_id', ignoreDuplicates: false }
    )
    await admin.rpc('increment_template_sales', { template_id: templateId })
  } else {
    console.error(`Template não encontrado para registrar compra. slug=${templateSlug}`)
  }

  const activationUrl = await generateActivationUrl(
    admin,
    String(owner.email || metadata.customer_email || '')
      .trim()
      .toLowerCase(),
    siteUrl
  )

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

    // Notificar admin sobre pagamento rejeitado
    if (mappedStatus.paymentStatus === 'rejected') {
      try {
        await notifyPaymentRejected({
          orderId,
          customerEmail: String(metadata.customer_email || ''),
          customerName: String(metadata.customer_name || ''),
          amount: payment.transaction_amount ?? undefined,
          reason: payment.status_detail ?? undefined,
          paymentId: payment.id ?? undefined,
        })
      } catch (notifyErr) {
        console.error('Falha ao notificar pagamento rejeitado:', notifyErr)
      }
    }

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

  // ── Guarda atômica contra race condition ──────────────────
  // Marcar como 'processing' ANTES de provisionar — só avança se ainda estava aguardando
  const { data: claimed, error: claimError } = await admin
    .from('template_orders')
    .update({
      payment_status: 'processing',
      payment_id: payment.id?.toString() || null,
      metadata: { ...baseMetadata, onboarding_status: 'provisioning' },
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .in('payment_status', ['pending', 'awaiting_payment'])
    .select('id')

  if (claimError || !claimed || claimed.length === 0) {
    // Outro webhook já está processando este pedido
    console.log(`Pedido ${orderId} já está sendo processado por outro webhook`)
    return
  }

  const provisioned = await provisionRestaurantForOrder(admin, order, payment, siteUrl)

  // Notificar admin sobre novo pagamento aprovado
  try {
    await notifyPaymentApproved({
      orderId,
      customerEmail: String(metadata.customer_email || ''),
      amount: payment.transaction_amount ?? undefined,
      restaurantSlug: provisioned.restaurantSlug,
    })
  } catch (notifyErr) {
    console.error('Falha ao notificar pagamento aprovado:', notifyErr)
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
  try {
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')
    const body = await request.json()

    console.log('Webhook recebido:', JSON.stringify(body, null, 2))

    // Validação de assinatura HMAC deve ocorrer ANTES de qualquer processamento
    const webhookSecret = process.env.MP_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('❌ MP_WEBHOOK_SECRET não configurado — webhook rejeitado por segurança')
      return NextResponse.json({ error: 'Configuração de segurança ausente' }, { status: 500 })
    }

    const dataId = String(body.data?.id || '')
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
      const paymentId = body.data?.id

      if (!paymentId) {
        return NextResponse.json({ received: true })
      }

      // ── Idempotência ─────────────────────────────────────────
      const eventId = `payment_${paymentId}_${body.action || body.type}`
      const { error: idempErr } = await supabase.from('webhook_events').insert({
        provider: 'mercadopago_payment',
        event_id: eventId,
        event_type: body.type,
        status: 'received',
        payload: body,
      })
      if (idempErr?.code === '23505') {
        console.log(`Webhook duplicado ignorado: ${eventId}`)
        return NextResponse.json({ received: true, duplicate: true })
      }

      // Buscar detalhes do pagamento
      const payment = await mercadopago.get({ id: paymentId })

      console.log('Pagamento:', JSON.stringify(payment, null, 2))

      const externalReference = payment.external_reference
      const status = payment.status

      if (!externalReference) {
        console.log('Sem external_reference no pagamento')
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
        console.error('Erro ao atualizar restaurante:', error)
      } else {
        console.log(
          `Restaurante ${externalReference} atualizado para ${mappedStatus.restaurantPaymentStatus}`
        )
      }

      // Notificar admin sobre pagamentos rejeitados (fluxo legado)
      if (status === 'rejected' || status === 'cancelled') {
        try {
          await notifyPaymentRejected({
            orderId: externalReference,
            customerEmail: payment.payer?.email || 'desconhecido',
            amount: payment.transaction_amount ?? undefined,
            reason: payment.status_detail ?? undefined,
            paymentId: payment.id ?? undefined,
          })
        } catch (notifyErr) {
          console.error('Falha ao notificar pagamento rejeitado (legado):', notifyErr)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
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

export const __internal = {
  processOnboardingPayment,
}
