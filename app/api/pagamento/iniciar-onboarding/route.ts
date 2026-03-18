import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createMercadoPagoPreferenceClient, getMercadoPagoAccessToken } from '@/lib/mercadopago'
import { getRequestSiteUrl } from '@/lib/site-url'
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

const onboardingSchema = z.object({
  template: z.string().min(1),
  plan: z.enum(['self-service', 'feito-pra-voce']),
  paymentMethod: z.enum(['pix', 'card']),
  restaurantName: z.string().min(3).max(120),
  customerName: z.string().min(3).max(120),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  couponCode: z.string().optional(),
  couponId: z.string().uuid().optional(),
})

// Fluxo oficial de compra: /comprar/[template] -> Mercado Pago -> webhook -> provisionamento.

function createCheckoutNumber() {
  return `CHK-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`.toUpperCase()
}

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
  try {
    await supabaseAdmin.from('checkout_sessions').upsert(
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
  } catch (error) {
    console.warn('Falha ao persistir checkout_sessions:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          error:
            'Configuração do Supabase incompleta. Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.',
        },
        { status: 500 }
      )
    }

    try {
      getMercadoPagoAccessToken()
    } catch {
      return NextResponse.json(
        {
          error: 'Serviço de pagamento temporariamente indisponível. Tente novamente em instantes.',
        },
        { status: 503 }
      )
    }

    const rawBody = await request.json()
    const body = onboardingSchema.parse(rawBody)
    const supabaseAdmin = createAdminClient()
    const templateSlug = normalizeTemplateSlug(body.template)
    const orderNumber = createCheckoutNumber()
    const subtotal = getOnboardingPriceByTemplate(templateSlug, body.plan, body.paymentMethod)
    let discount = 0
    let couponId: string | null = null

    if (body.couponCode?.trim() && body.couponId) {
      const validation = await validateCoupon(supabaseAdmin, body.couponCode.trim(), subtotal)
      if (validation.valid && validation.coupon && validation.coupon.id === body.couponId) {
        discount = validation.coupon.discountValue
        couponId = validation.coupon.id
      }
    }

    const total = Math.max(0, subtotal - discount)
    const planConfig = ONBOARDING_PLAN_CONFIG[body.plan]
    const templateLabel = TEMPLATE_PRESETS[templateSlug].label
    const email = body.email.trim().toLowerCase()
    const phone = normalizePhone(body.phone)
    const siteUrl = getRequestSiteUrl(request)
    const authSupabase = await createServerClient()
    const {
      data: { user },
    } = await authSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Faça login para iniciar a compra' }, { status: 401 })
    }

    const rateLimit = await withRateLimit(
      getRateLimitIdentifier(request, user.id),
      RATE_LIMITS.checkout
    )
    if (rateLimit.limited) {
      return rateLimit.response
    }

    const sessionEmail = user.email?.trim().toLowerCase()
    if (!sessionEmail) {
      return NextResponse.json(
        { error: 'Sua conta não possui e-mail válido' },
        { status: 400, headers: rateLimit.headers }
      )
    }

    // Lê o cookie de afiliado para atribuir comissão ao finalizar o pagamento
    const affRef = request.cookies.get('aff_ref')?.value?.trim() || null

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
        metadata: {
          checkout_type: 'restaurant_onboarding',
          template_slug: templateSlug,
          plan_slug: body.plan,
          subscription_plan_slug: planConfig.subscriptionPlanSlug,
          customer_name: body.customerName.trim(),
          customer_email: sessionEmail,
          customer_phone: phone,
          restaurant_name: body.restaurantName.trim(),
          restaurant_slug_base: slugifyRestaurantName(body.restaurantName),
          onboarding_status: 'awaiting_payment',
          activation_url: null,
          provisioned_restaurant_id: null,
          provisioned_restaurant_slug: null,
          owner_user_id: user.id,
          aff_ref: affRef,
        },
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

    await persistCheckoutSession(supabaseAdmin, {
      orderId: order.id,
      userId: user.id,
      templateSlug,
      planSlug: body.plan,
      subscriptionPlanSlug: planConfig.subscriptionPlanSlug,
      paymentMethod: body.paymentMethod,
      status: 'pending',
      metadata: {
        order_number: order.order_number,
        customer_email: sessionEmail,
        restaurant_name: body.restaurantName.trim(),
      },
    })

    const preferenceClient = createMercadoPagoPreferenceClient(10000)

    const baseUrl = siteUrl.startsWith('http://') ? siteUrl.replace('http://', 'https://') : siteUrl

    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: String(order.id),
            title: `${PRODUCT_NAME} — ${planConfig.name} (${templateLabel})`,
            description: `Ativado por ${COMPANY_NAME} para ${body.restaurantName.trim()}`,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: total,
          },
        ],
        payer: {
          email: sessionEmail,
          name: body.customerName.trim(),
        },
        external_reference: `onboarding:${order.id}`,
        back_urls: {
          success: `${baseUrl}/pagamento/sucesso?checkout=${order.order_number}`,
          failure: `${baseUrl}/pagamento/erro?checkout=${order.order_number}`,
          pending: `${baseUrl}/pagamento/pendente?checkout=${order.order_number}`,
        },
        auto_return: 'approved',
        payment_methods:
          body.paymentMethod === 'pix'
            ? {
                excluded_payment_types: [
                  { id: 'ticket' },
                  { id: 'credit_card' },
                  { id: 'debit_card' },
                ],
                excluded_payment_methods: [{ id: 'account_money' }],
              }
            : {
                installments: 12,
                default_installments: 1,
                excluded_payment_methods: [{ id: 'pix' }],
              },
        notification_url: `${baseUrl}/api/webhook/mercadopago`,
        // Aparece na fatura do cartão e no comprovante PIX do pagador
        // Deve bater com o nome da conta Mercado Pago para evitar estranhamento no checkout.
        statement_descriptor: COMPANY_PAYMENT_DESCRIPTOR,
      },
    })

    await supabaseAdmin
      .from('template_orders')
      .update({
        metadata: {
          checkout_type: 'restaurant_onboarding',
          template_slug: templateSlug,
          plan_slug: body.plan,
          subscription_plan_slug: planConfig.subscriptionPlanSlug,
          customer_name: body.customerName.trim(),
          customer_email: sessionEmail,
          customer_phone: phone,
          restaurant_name: body.restaurantName.trim(),
          restaurant_slug_base: slugifyRestaurantName(body.restaurantName),
          onboarding_status: 'awaiting_payment',
          activation_url: null,
          provisioned_restaurant_id: null,
          provisioned_restaurant_slug: null,
          owner_user_id: user.id,
          mp_preference_id: preference.id,
          aff_ref: affRef,
        },
      })
      .eq('id', order.id)

    await persistCheckoutSession(supabaseAdmin, {
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
        restaurant_name: body.restaurantName.trim(),
      },
    })

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

    const isDev = process.env.NODE_ENV !== 'production'
    const isCredentialError = message.includes('Credencial') || message.includes('ausente')
    const isMpError =
      message.includes('mercadopago') ||
      message.includes('Mercado') ||
      message.includes('401') ||
      message.includes('400')

    let userMessage = 'Erro interno ao iniciar pagamento'
    if (isCredentialError || isMpError) {
      userMessage = message
    } else if (typeof apiError === 'object' && apiError !== null && 'message' in apiError) {
      userMessage = String((apiError as { message: string }).message)
    } else if (isDev) {
      userMessage = message
    }

    return NextResponse.json({ error: userMessage }, { status: 500 })
  }
}
