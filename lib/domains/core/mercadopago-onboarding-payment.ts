import { createAdminClient } from '@/lib/shared/supabase/admin'
import { mapMercadoPagoStatus } from '@/lib/domains/core/payment-status'
import {
  buildRestaurantInstallation,
  normalizePhone,
  ONBOARDING_PLAN_CONFIG,
  slugifyRestaurantName,
} from '@/lib/domains/core/restaurant-onboarding'
import { TEMPLATE_PRESETS, normalizeTemplateSlug } from '@/lib/domains/core/restaurant-customization'
import { notifyPaymentRejected, notifyPaymentApproved } from '@/lib/shared/notifications'
import { prepareFiscalInvoiceMetadata } from '@/lib/domains/core/fiscal'
import { dispatchFiscalInvoice } from '@/lib/domains/core/fiscal-dispatch'
import {
  maskAffiliateRef,
  resolveKnownTemplateSlug,
  resolvePaymentTimestamp,
  withCheckoutSessionSyncState,
} from '@/lib/domains/core/mercadopago-webhook-processing'
import {
  ONBOARDING_STALE_PROVISIONING_MS,
  resolveOnboardingProvisioningDecision,
} from '@/lib/domains/core/onboarding-provisioning'

type AdminClient = ReturnType<typeof createAdminClient>

export interface MercadoPagoOnboardingPaymentInput {
  id?: number | null
  status?: string | null
  status_detail?: string | null
  transaction_amount?: number | null
  payment_method_id?: string | null
  payment_type_id?: string | null
  date_approved?: string | null
}

export function getOnboardingPaymentMetadata(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {} as Record<string, unknown>
  }

  return value as Record<string, unknown>
}

export function formatTemplateNameFromSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
}

export function buildOnboardingPaymentBaseMetadata<T extends Record<string, unknown>>(
  metadata: T,
  payment: MercadoPagoOnboardingPaymentInput
): T & {
  mp_status: string | null
  mp_status_detail: string | null
  mp_payment_type: string | null
  onboarding_status: string
} {
  const mappedStatus = mapMercadoPagoStatus(payment.status)

  return {
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
}

async function upsertCheckoutSession(
  admin: AdminClient,
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
    const { error } = await admin.from('checkout_sessions').upsert(
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

    if (error) {
      throw error
    }

    return { ok: true as const, errorMessage: null }
  } catch (error) {
    console.warn('Falha ao sincronizar checkout_sessions:', error)
    return {
      ok: false as const,
      errorMessage:
        error instanceof Error ? error.message.slice(0, 300) : 'checkout_session_sync_failed',
    }
  }
}

async function findUserByEmail(admin: AdminClient, email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) {
    return null
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (profileError) {
    throw profileError
  }

  if (!profile?.id) {
    return null
  }

  const { data, error } = await admin.auth.admin.getUserById(profile.id)
  if (error || !data.user) {
    throw error || new Error('Perfil encontrado sem usuário correspondente no auth')
  }

  return data.user
}

async function ensureCheckoutOwner(
  admin: AdminClient,
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
      requires_password_setup: true,
      provisioned_via_checkout: true,
    },
  })

  if (error || !data.user) {
    throw error || new Error('Não foi possível criar usuário administrador')
  }

  await admin.from('profiles').upsert(
    {
      id: data.user.id,
      email,
      nome: String(metadata.customer_name || '').trim() || null,
      telefone: normalizePhone(String(metadata.customer_phone || '')) || null,
    },
    { onConflict: 'id' }
  )

  return data.user
}

async function ensureActivationEvent(
  admin: AdminClient,
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

async function generateActivationUrl(admin: AdminClient, email: string, siteUrl: string) {
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
  admin: AdminClient,
  restaurantName: string,
  requestedBase?: string | null
) {
  const base = requestedBase || slugifyRestaurantName(restaurantName) || 'zairyx'

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

async function ensureTemplateIdForPurchase(admin: AdminClient, templateSlug: string) {
  const knownTemplateSlug = resolveKnownTemplateSlug(templateSlug)
  if (!knownTemplateSlug) {
    console.error(`Slug de template inválido no webhook: ${templateSlug}`)
    return null
  }

  const { data: existingTemplate } = await admin
    .from('templates')
    .select('id')
    .eq('slug', knownTemplateSlug)
    .maybeSingle()

  if (existingTemplate?.id) {
    return existingTemplate.id
  }

  const preset = TEMPLATE_PRESETS[knownTemplateSlug]
  const name = preset?.label || formatTemplateNameFromSlug(knownTemplateSlug) || 'Template Zairyx'
  const description = preset?.heroDescription || `Template ${name} para Zairyx`
  const shortDescription = preset?.badge || null

  const { data: insertedTemplate, error: insertError } = await admin
    .from('templates')
    .upsert(
      {
        slug: knownTemplateSlug,
        name,
        description,
        short_description: shortDescription,
        category: knownTemplateSlug,
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
    .eq('slug', knownTemplateSlug)
    .maybeSingle()

  return fetchedTemplate?.id || null
}

async function activateSubscription(
  admin: AdminClient,
  userId: string,
  restaurantId: string,
  paymentAmount: number | null,
  subscriptionPlanSlug: string,
  approvedAt?: string | null
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

  const periodStart = new Date(resolvePaymentTimestamp(approvedAt))
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
  admin: AdminClient,
  order: {
    id: string
    user_id: string | null
    metadata: unknown
  },
  payment: {
    transaction_amount?: number | null
    date_approved?: string | null
  },
  siteUrl: string
) {
  const metadata = getOnboardingPaymentMetadata(order.metadata)
  const owner = await ensureCheckoutOwner(admin, order.user_id, metadata)
  const restaurantName = String(metadata.restaurant_name || '').trim() || 'Meu Cardápio Digital'
  const rawSlug = String(metadata.template_slug || '')
    .trim()
    .toLowerCase()
  const templateSlug = normalizeTemplateSlug(rawSlug || 'restaurante')
  const subscriptionPlanSlug = String(metadata.subscription_plan_slug || 'basico')
  const installation = buildRestaurantInstallation(templateSlug, restaurantName)

  let restaurantSlug = await createUniqueRestaurantSlug(
    admin,
    restaurantName,
    String(metadata.restaurant_slug_base || '') || null
  )

  let restaurantId: string | null = null

  const baseCustomizacao = installation.restaurantUpdate.customizacao || {}
  const originSale = metadata.aff_ref ? 'affiliate' : 'organic'
  console.log(
    `[webhook-mp] SALE_TYPE: ${originSale} | aff_ref: ${maskAffiliateRef(metadata.aff_ref)} | restaurant: ${restaurantName}`
  )

  const approvedAt = resolvePaymentTimestamp(payment.date_approved)

  const restaurantPayload = {
    user_id: owner.id,
    nome: restaurantName,
    slug: restaurantSlug,
    telefone: normalizePhone(String(metadata.customer_phone || '')) || null,
    ativo: true,
    status_pagamento: 'ativo',
    plano: metadata.plan_slug === 'feito-pra-voce' ? 'feito-pra-voce' : 'self-service',
    plan_slug: subscriptionPlanSlug,
    valor_pago: payment.transaction_amount || 0,
    data_pagamento: approvedAt,
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
    if (restaurantError?.code === '23505' && restaurantError.message?.includes('slug')) {
      const fallbackSlug = `${restaurantSlug}-${Date.now().toString(36)}`
      const { data: retryRestaurant, error: retryError } = await admin
        .from('restaurants')
        .insert({ ...restaurantPayload, slug: fallbackSlug })
        .select('id')
        .single()

      if (retryError || !retryRestaurant) {
        throw retryError || new Error('Não foi possível criar restaurante após retry de slug')
      }

      restaurantId = retryRestaurant.id
      restaurantSlug = fallbackSlug
    } else {
      throw restaurantError || new Error('Não foi possível criar restaurante')
    }
  } else {
    restaurantId = newRestaurant.id
  }

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
    subscriptionPlanSlug,
    payment.date_approved || null
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

  if (originSale === 'affiliate' && metadata.aff_ref) {
    try {
      const { data: affiliate } = await admin
        .from('affiliates')
        .select('id, lider_id')
        .eq('code', metadata.aff_ref)
        .eq('status', 'ativo')
        .single()

      if (affiliate) {
        const valorAssinatura = payment.transaction_amount || 0
        const { data: affData } = await admin
          .from('affiliates')
          .select('commission_rate')
          .eq('id', affiliate.id)
          .single()

        const commissionRate = Number(affData?.commission_rate) || 0.3
        const comissao = Math.round(valorAssinatura * commissionRate * 100) / 100
        const liderComissao = affiliate.lider_id
          ? Math.round(valorAssinatura * 0.1 * 100) / 100
          : null

        await admin.from('affiliate_referrals').insert({
          affiliate_id: affiliate.id,
          tenant_id: restaurantId,
          plano: subscriptionPlanSlug,
          valor_assinatura: valorAssinatura,
          comissao,
          referencia_mes: new Date().toISOString().slice(0, 7),
          status: 'pendente',
          lider_id: affiliate.lider_id || null,
          lider_comissao: liderComissao,
          lider_status: affiliate.lider_id ? 'pendente' : null,
        })

        console.log(
          `[webhook-mp] REFERRAL_CREATED: affiliate=${affiliate.id} restaurant=${restaurantId} comissao=R$${comissao}`
        )
      }
    } catch (refErr) {
      console.error('[webhook-mp] Error creating affiliate referral:', refErr)
    }
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

export async function processOnboardingPayment(
  admin: AdminClient,
  orderId: string,
  payment: MercadoPagoOnboardingPaymentInput,
  siteUrl: string
) {
  const { data: order, error: orderError } = await admin
    .from('template_orders')
    .select('id, user_id, status, payment_status, payment_id, metadata, coupon_id, updated_at')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    throw orderError || new Error('Pedido de onboarding não encontrado')
  }

  const mappedStatus = mapMercadoPagoStatus(payment.status)
  const metadata = getOnboardingPaymentMetadata(order.metadata)
  const alreadyApproved = order.payment_status === 'approved'
  const samePaymentAlreadyProcessed =
    alreadyApproved && !!order.payment_id && order.payment_id === (payment.id?.toString() || null)
  const baseMetadata = buildOnboardingPaymentBaseMetadata(metadata, payment)

  let orderMetadata = withCheckoutSessionSyncState(baseMetadata, null)

  const initialCheckoutSessionSync = await upsertCheckoutSession(admin, {
    orderId,
    userId: order.user_id,
    templateSlug: String(metadata.template_slug || ''),
    onboardingPlanSlug: String(metadata.plan_slug || ''),
    subscriptionPlanSlug: String(metadata.subscription_plan_slug || ''),
    paymentMethod: payment.payment_method_id || String(metadata.payment_method || ''),
    mpPreferenceId: String(metadata.mp_preference_id || ''),
    mpPaymentId: payment.id?.toString() || null,
    status: mappedStatus.paymentStatus,
    metadata: orderMetadata,
  })

  orderMetadata = withCheckoutSessionSyncState(baseMetadata, initialCheckoutSessionSync.errorMessage)

  if (samePaymentAlreadyProcessed && metadata.provisioned_restaurant_id) {
    if (initialCheckoutSessionSync.errorMessage) {
      await admin
        .from('template_orders')
        .update({ metadata: orderMetadata, updated_at: new Date().toISOString() })
        .eq('id', orderId)
    }

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
        metadata: orderMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

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
    const fiscalMetadata = prepareFiscalInvoiceMetadata({
      orderId,
      paymentId: payment.id?.toString() || null,
      paymentAmount: payment.transaction_amount ?? null,
      approvedAt: payment.date_approved || null,
      customerName: String(metadata.customer_name || '') || null,
      customerEmail: String(metadata.customer_email || '') || null,
      customerPhone: String(metadata.customer_phone || '') || null,
      customerDocument: String(metadata.customer_document || '') || null,
      restaurantName: String(metadata.restaurant_name || '') || null,
      restaurantId: String(metadata.provisioned_restaurant_id || '') || null,
      restaurantSlug: String(metadata.provisioned_restaurant_slug || '') || null,
      orderMetadata: metadata,
    })
    const fiscalDispatch = await dispatchFiscalInvoice({
      orderId,
      fiscal: fiscalMetadata,
    })
    const persistedFiscalMetadata = {
      ...fiscalMetadata,
      dispatch: fiscalDispatch,
    }

    await admin
      .from('template_orders')
      .update({
        payment_status: 'approved',
        status: 'completed',
        payment_id: payment.id?.toString() || null,
        payment_method: payment.payment_method_id || null,
        metadata: {
          ...orderMetadata,
          onboarding_status: 'ready',
          fiscal: persistedFiscalMetadata,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    const readyCheckoutSessionSync = await upsertCheckoutSession(admin, {
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
        ...withCheckoutSessionSyncState(baseMetadata, null),
        onboarding_status: 'ready',
        fiscal: persistedFiscalMetadata,
      },
    })

    if (readyCheckoutSessionSync.errorMessage) {
      await admin
        .from('template_orders')
        .update({
          metadata: {
            ...withCheckoutSessionSyncState(baseMetadata, readyCheckoutSessionSync.errorMessage),
            onboarding_status: 'ready',
            fiscal: persistedFiscalMetadata,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
    }

    return
  }

  const claimDecision = resolveOnboardingProvisioningDecision(order)
  const claimPayload = {
    status: 'processing',
    payment_status: 'processing',
    payment_id: payment.id?.toString() || null,
    metadata: { ...orderMetadata, onboarding_status: 'provisioning' },
    updated_at: new Date().toISOString(),
  }

  let claimed: Array<{ id: string }> | null = null

  if (claimDecision === 'fresh-claim') {
    const { data, error: claimError } = await admin
      .from('template_orders')
      .update(claimPayload)
      .eq('id', orderId)
      .in('payment_status', ['pending', 'awaiting_payment'])
      .select('id')

    if (claimError) {
      throw claimError
    }

    claimed = data
  } else if (claimDecision === 'stale-recovery') {
    const staleCutoff = new Date(Date.now() - ONBOARDING_STALE_PROVISIONING_MS).toISOString()
    const { data, error: reclaimError } = await admin
      .from('template_orders')
      .update({
        ...claimPayload,
        metadata: {
          ...claimPayload.metadata,
          stale_recovery_at: new Date().toISOString(),
          stale_recovery_payment_status: order.payment_status,
        },
      })
      .eq('id', orderId)
      .lte('updated_at', staleCutoff)
      .in('payment_status', ['processing', 'approved'])
      .neq('status', 'completed')
      .select('id')

    if (reclaimError) {
      throw reclaimError
    }

    claimed = data
  } else if (claimDecision === 'active-processing') {
    console.log(`Pedido ${orderId} ainda está em processamento ativo; aguardando retry natural`)
    return
  } else if (claimDecision === 'already-ready') {
    return
  } else {
    console.warn(`Pedido ${orderId} não está em estado reaproveitável para provisionamento`)
    return
  }

  if (!claimed || claimed.length === 0) {
    console.log(
      `Pedido ${orderId} não pôde ser reivindicado para provisionamento (${claimDecision})`
    )
    return
  }

  const provisioned = await provisionRestaurantForOrder(admin, order, payment, siteUrl)
  const fiscalMetadata = prepareFiscalInvoiceMetadata({
    orderId,
    paymentId: payment.id?.toString() || null,
    paymentAmount: payment.transaction_amount ?? null,
    approvedAt: payment.date_approved || null,
    customerName: String(metadata.customer_name || '') || null,
    customerEmail: String(metadata.customer_email || '') || null,
    customerPhone: String(metadata.customer_phone || '') || null,
    customerDocument: String(metadata.customer_document || '') || null,
    restaurantName: String(metadata.restaurant_name || '') || null,
    restaurantId: provisioned.restaurantId,
    restaurantSlug: provisioned.restaurantSlug,
    orderMetadata: metadata,
  })
  const fiscalDispatch = await dispatchFiscalInvoice({
    orderId,
    fiscal: fiscalMetadata,
  })
  const persistedFiscalMetadata = {
    ...fiscalMetadata,
    dispatch: fiscalDispatch,
  }

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

  if (!alreadyApproved && order.coupon_id) {
    await admin.rpc('increment_coupon_usage', { p_coupon_id: order.coupon_id })
  }

  await admin
    .from('template_orders')
    .update({
      payment_status: 'approved',
      status: 'completed',
      payment_id: payment.id?.toString() || null,
      payment_method: payment.payment_method_id || null,
      metadata: {
        ...orderMetadata,
        onboarding_status: 'ready',
        fiscal: persistedFiscalMetadata,
        provisioned_restaurant_id: provisioned.restaurantId,
        provisioned_restaurant_slug: provisioned.restaurantSlug,
        owner_user_id: provisioned.ownerId,
        activation_url: provisioned.activationUrl,
        provisioned_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  const finalCheckoutSessionSync = await upsertCheckoutSession(admin, {
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
      ...withCheckoutSessionSyncState(baseMetadata, null),
      onboarding_status: 'ready',
      fiscal: persistedFiscalMetadata,
      provisioned_restaurant_id: provisioned.restaurantId,
      provisioned_restaurant_slug: provisioned.restaurantSlug,
      owner_user_id: provisioned.ownerId,
      activation_url: provisioned.activationUrl,
    },
  })

  if (finalCheckoutSessionSync.errorMessage) {
    await admin
      .from('template_orders')
      .update({
        metadata: {
          ...withCheckoutSessionSyncState(baseMetadata, finalCheckoutSessionSync.errorMessage),
          onboarding_status: 'ready',
          fiscal: persistedFiscalMetadata,
          provisioned_restaurant_id: provisioned.restaurantId,
          provisioned_restaurant_slug: provisioned.restaurantSlug,
          owner_user_id: provisioned.ownerId,
          activation_url: provisioned.activationUrl,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
  }
}