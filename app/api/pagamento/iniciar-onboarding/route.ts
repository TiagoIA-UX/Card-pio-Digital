import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createMercadoPagoPreferenceClient, getMercadoPagoAccessToken } from '@/lib/mercadopago'
import { getRequestSiteUrl, getSiteUrl } from '@/lib/site-url'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import {
  ONBOARDING_PLAN_CONFIG,
  getOnboardingPriceByTemplate,
  normalizePhone,
  slugifyRestaurantName,
} from '@/lib/restaurant-onboarding'
import { TEMPLATE_PRESETS, normalizeTemplateSlug } from '@/lib/restaurant-customization'
import { validateCoupon } from '@/lib/coupon-validation'
import { getRateLimitIdentifier, RATE_LIMITS, withRateLimit } from '@/lib/rate-limit'
import { COMPANY_NAME, COMPANY_PAYMENT_DESCRIPTOR, PRODUCT_NAME } from '@/lib/brand'
import { isServerSandboxMode } from '@/lib/payment-mode'
import {
  buildOnboardingOrderMetadata,
  createCheckoutNumber,
  sanitizeAffiliateRef,
} from '@/lib/onboarding-checkout'

const onboardingSchema = z.object({
  template: z.string().min(1),
  plan: z.enum(['self-service', 'feito-pra-voce']),
  paymentMethod: z.enum(['pix', 'card']),
  restaurantName: z.string().min(3).max(120),
  customerName: z.string().min(3).max(120),
  phone: z.string().min(10).max(20),
  couponCode: z.string().optional(),
})

// Fluxo oficial de compra: /comprar/[template] -> Mercado Pago -> webhook -> provisionamento.

async function persistCheckoutSession(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  payload: {
    orderId: string
    userId?: string | null
    templateSlug: string
    planSlug: string
    subscriptionPlanSlug: string
    paymentMethod: string
    status: string
    mpPreferenceId?: string | null
    initPoint?: string | null
    sandboxInitPoint?: string | null
    metadata?: Record<string, unknown>
  }
) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const { error } = await supabaseAdmin.from('checkout_sessions').upsert(
      {
        order_id: payload.orderId,
        user_id: payload.userId || null,
        template_slug: payload.templateSlug,
        onboarding_plan_slug: payload.planSlug,
        subscription_plan_slug: payload.subscriptionPlanSlug,
        payment_method: payload.paymentMethod,
        mp_preference_id: payload.mpPreferenceId || null,
        init_point: payload.initPoint || null,
        sandbox_init_point: payload.sandboxInitPoint || null,
        status: payload.status,
        metadata: payload.metadata || {},
      },
      { onConflict: 'order_id' }
    )

    if (!error) {
      return true
    }

    console.warn('Falha ao persistir checkout_sessions:', {
      orderId: payload.orderId,
      attempt,
      error,
    })
  }

  return false
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await withRateLimit(getRateLimitIdentifier(request), RATE_LIMITS.checkout)
    if (rateLimit.limited) {
      return rateLimit.response
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          error:
            'Configuração do Supabase incompleta. Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.',
        },
        { status: 500, headers: rateLimit.headers }
      )
    }

    try {
      getMercadoPagoAccessToken()
    } catch {
      return NextResponse.json(
        {
          error: 'Serviço de pagamento temporariamente indisponível. Tente novamente em instantes.',
        },
        { status: 503, headers: rateLimit.headers }
      )
    }

    const rawBody = await request.json()
    const body = onboardingSchema.parse(rawBody)
    const templateSlug = normalizeTemplateSlug(body.template)
    const orderNumber = createCheckoutNumber()
    const subtotal = getOnboardingPriceByTemplate(templateSlug, body.plan, body.paymentMethod)
    let discount = 0
    let couponId: string | null = null

    const authSupabase = await createServerClient()
    const {
      data: { user },
    } = await authSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Faça login para iniciar a compra' },
        { status: 401, headers: rateLimit.headers }
      )
    }

    const supabaseAdmin = createAdminClient()

    if (body.couponCode?.trim()) {
      const validation = await validateCoupon(supabaseAdmin, body.couponCode.trim(), subtotal)
      if (validation.valid && validation.coupon) {
        discount = validation.coupon.discountValue
        couponId = validation.coupon.id
      }
    }

    const total = Math.max(0, subtotal - discount)
    const planConfig = ONBOARDING_PLAN_CONFIG[body.plan]
    const templateLabel = TEMPLATE_PRESETS[templateSlug].label
    const phone = normalizePhone(body.phone)
    const siteUrl = getRequestSiteUrl(request)

    const sessionEmail = user.email?.trim().toLowerCase()
    if (!sessionEmail) {
      return NextResponse.json(
        { error: 'Sua conta não possui e-mail válido' },
        { status: 400, headers: rateLimit.headers }
      )
    }

    // Lê o cookie de afiliado para atribuir comissão ao finalizar o pagamento
    const affRef = sanitizeAffiliateRef(request.cookies.get('aff_ref')?.value || null)
    const normalizedCustomerName = body.customerName.trim()
    const normalizedRestaurantName = body.restaurantName.trim()
    const restaurantSlugBase = slugifyRestaurantName(body.restaurantName)

    const { data: order, error: orderError } = await supabaseAdmin
      .from('template_orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        status: 'pending',
        subtotal,
        discount,
        total,
        coupon_id: couponId,
        payment_method: body.paymentMethod,
        payment_status: 'pending',
      })
      .select('id, order_number')
      .single()

    if (orderError || !order) {
      console.error('Erro ao criar registro de checkout:', orderError)
      return NextResponse.json(
        { error: 'Erro ao iniciar checkout' },
        { status: 500, headers: rateLimit.headers }
      )
    }

    const preferenceClient = createMercadoPagoPreferenceClient(10000)

    // MercadoPago rejeita http://localhost em back_urls — usar URL pública em dev local
    const isLocal = /localhost|127\.0\.0\.1/.test(siteUrl)
    const backUrlBase = isLocal
      ? getSiteUrl() // https://zairyx.com (MP exige URL pública)
      : siteUrl.startsWith('http://')
        ? siteUrl.replace('http://', 'https://')
        : siteUrl
    const sandbox = isServerSandboxMode()
    const notificationUrl =
      sandbox || isLocal ? undefined : `${backUrlBase}/api/webhook/mercadopago`

    // Em sandbox, omitir payment_methods inteiramente (objeto vazio {} trava o checkout)
    const paymentMethodsConfig = sandbox
      ? undefined
      : body.paymentMethod === 'pix'
        ? {
            excluded_payment_types: [{ id: 'ticket' }, { id: 'credit_card' }, { id: 'debit_card' }],
            excluded_payment_methods: [{ id: 'account_money' }],
          }
        : {
            installments: 12,
            excluded_payment_methods: [{ id: 'pix' }],
          }

    let preference
    try {
      preference = await preferenceClient.create({
        body: {
          items: [
            {
              id: String(order.id),
              title: `${PRODUCT_NAME} — ${planConfig.name} (${templateLabel})`,
              description: `Ativado por ${COMPANY_NAME} para ${normalizedRestaurantName}`,
              quantity: 1,
              currency_id: 'BRL',
              unit_price: total,
            },
          ],
          payer: {
            email: sessionEmail,
            name: normalizedCustomerName,
          },
          external_reference: `onboarding:${order.id}`,
          back_urls: {
            success: `${backUrlBase}/pagamento/sucesso?checkout=${order.order_number}`,
            failure: `${backUrlBase}/pagamento/erro?checkout=${order.order_number}`,
            pending: `${backUrlBase}/pagamento/pendente?checkout=${order.order_number}`,
          },
          ...(sandbox ? {} : { auto_return: 'approved' as const }),
          ...(paymentMethodsConfig && { payment_methods: paymentMethodsConfig }),
          ...(notificationUrl && { notification_url: notificationUrl }),
          statement_descriptor: COMPANY_PAYMENT_DESCRIPTOR,
        },
      })
    } catch (preferenceError) {
      const failureMetadata = buildOnboardingOrderMetadata({
        templateSlug,
        planSlug: body.plan,
        subscriptionPlanSlug: planConfig.subscriptionPlanSlug,
        customerName: normalizedCustomerName,
        customerEmail: sessionEmail,
        customerPhone: phone,
        restaurantName: normalizedRestaurantName,
        restaurantSlugBase,
        ownerUserId: user.id,
        onboardingStatus: 'checkout_creation_failed',
        affRef,
      })

      await supabaseAdmin
        .from('template_orders')
        .update({ metadata: failureMetadata })
        .eq('id', order.id)

      console.error('Erro ao criar preferência do Mercado Pago:', preferenceError)

      return NextResponse.json(
        { error: 'Não foi possível iniciar o checkout agora. Tente novamente em instantes.' },
        { status: 502, headers: rateLimit.headers }
      )
    }

    const checkoutSessionPersisted = await persistCheckoutSession(supabaseAdmin, {
      orderId: order.id,
      userId: user.id,
      templateSlug,
      planSlug: body.plan,
      subscriptionPlanSlug: planConfig.subscriptionPlanSlug,
      paymentMethod: body.paymentMethod,
      status: 'awaiting_payment',
      mpPreferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
      metadata: {
        order_number: order.order_number,
        customer_email: sessionEmail,
        restaurant_name: normalizedRestaurantName,
      },
    })

    const successMetadata = buildOnboardingOrderMetadata({
      templateSlug,
      planSlug: body.plan,
      subscriptionPlanSlug: planConfig.subscriptionPlanSlug,
      customerName: normalizedCustomerName,
      customerEmail: sessionEmail,
      customerPhone: phone,
      restaurantName: normalizedRestaurantName,
      restaurantSlugBase,
      ownerUserId: user.id,
      onboardingStatus: 'awaiting_payment',
      affRef,
      mpPreferenceId: preference.id,
      checkoutSessionSyncFailed: !checkoutSessionPersisted,
    })

    const { error: metadataUpdateError } = await supabaseAdmin
      .from('template_orders')
      .update({ metadata: successMetadata })
      .eq('id', order.id)

    if (metadataUpdateError) {
      console.error('Erro ao persistir metadata final do checkout:', metadataUpdateError)
      return NextResponse.json(
        { error: 'Não foi possível iniciar o checkout agora. Tente novamente em instantes.' },
        { status: 500, headers: rateLimit.headers }
      )
    }

    return NextResponse.json(
      {
        checkout: order.order_number,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
      },
      { headers: rateLimit.headers }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: error.flatten() },
        { status: 400 }
      )
    }

    const err = error as Error & { cause?: unknown; response?: { data?: unknown } }
    const message = err?.message ?? 'Erro desconhecido'
    const cause = err?.cause
    const apiError = err?.response?.data

    console.error('Erro ao iniciar onboarding:', {
      message,
      cause,
      apiError,
      stack: err?.stack,
    })

    return NextResponse.json(
      { error: 'Não foi possível iniciar o checkout agora. Tente novamente em instantes.' },
      { status: 500 }
    )
  }
}
