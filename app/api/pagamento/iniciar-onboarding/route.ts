import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createMercadoPagoPreferenceClient } from '@/lib/mercadopago'
import { getSiteUrl } from '@/lib/site-url'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import {
  ONBOARDING_PLAN_CONFIG,
  getOnboardingPrice,
  normalizePhone,
  slugifyRestaurantName,
} from '@/lib/restaurant-onboarding'
import { TEMPLATE_PRESETS, normalizeTemplateSlug } from '@/lib/restaurant-customization'

const onboardingSchema = z.object({
  template: z.string().min(1),
  plan: z.enum(['self-service', 'feito-pra-voce']),
  paymentMethod: z.enum(['pix', 'card']),
  restaurantName: z.string().min(3).max(120),
  customerName: z.string().min(3).max(120),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
})

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
    const rawBody = await request.json()
    const body = onboardingSchema.parse(rawBody)
    const templateSlug = normalizeTemplateSlug(body.template)
    const orderNumber = createCheckoutNumber()
    const price = getOnboardingPrice(body.plan, body.paymentMethod)
    const planConfig = ONBOARDING_PLAN_CONFIG[body.plan]
    const templateLabel = TEMPLATE_PRESETS[templateSlug].label
    const email = body.email.trim().toLowerCase()
    const phone = normalizePhone(body.phone)
    const siteUrl = getSiteUrl()
    const supabaseAdmin = createAdminClient()
    const authSupabase = await createServerClient()
    const {
      data: { session },
    } = await authSupabase.auth.getSession()

    const { data: order, error: orderError } = await supabaseAdmin
      .from('template_orders')
      .insert({
        user_id: session?.user?.id ?? null,
        order_number: orderNumber,
        status: 'pending',
        subtotal: price,
        total: price,
        payment_method: body.paymentMethod,
        payment_status: 'pending',
        metadata: {
          checkout_type: 'restaurant_onboarding',
          template_slug: templateSlug,
          plan_slug: body.plan,
          subscription_plan_slug: planConfig.subscriptionPlanSlug,
          customer_name: body.customerName.trim(),
          customer_email: email,
          customer_phone: phone,
          restaurant_name: body.restaurantName.trim(),
          restaurant_slug_base: slugifyRestaurantName(body.restaurantName),
          onboarding_status: 'awaiting_payment',
          activation_url: null,
          provisioned_restaurant_id: null,
          provisioned_restaurant_slug: null,
          owner_user_id: session?.user?.id ?? null,
        },
      })
      .select('id, order_number')
      .single()

    if (orderError || !order) {
      console.error('Erro ao criar registro de checkout:', orderError)
      return NextResponse.json({ error: 'Erro ao iniciar checkout' }, { status: 500 })
    }

    await persistCheckoutSession(supabaseAdmin, {
      orderId: order.id,
      userId: session?.user?.id ?? null,
      templateSlug,
      planSlug: body.plan,
      subscriptionPlanSlug: planConfig.subscriptionPlanSlug,
      paymentMethod: body.paymentMethod,
      status: 'pending',
      metadata: {
        order_number: order.order_number,
        customer_email: email,
        restaurant_name: body.restaurantName.trim(),
      },
    })

    const preferenceClient = createMercadoPagoPreferenceClient(10000)
    const preference = await preferenceClient.preference.create({
      body: {
        items: [
          {
            id: order.id,
            title: `${planConfig.name} - Template ${templateLabel}`,
            description: `Criação automática de cardápio digital para ${body.restaurantName.trim()}`,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: price,
          },
        ],
        payer: {
          email,
          name: body.customerName.trim(),
        },
        external_reference: `onboarding:${order.id}`,
        back_urls: {
          success: `${siteUrl}/pagamento/sucesso?checkout=${order.order_number}`,
          failure: `${siteUrl}/pagamento/erro?checkout=${order.order_number}`,
          pending: `${siteUrl}/pagamento/pendente?checkout=${order.order_number}`,
        },
        auto_return: 'approved',
        payment_methods:
          body.paymentMethod === 'pix'
            ? {
                excluded_payment_types: [{ id: 'credit_card' }, { id: 'debit_card' }],
              }
            : {
                installments: planConfig.installments,
                excluded_payment_types: [{ id: 'ticket' }],
              },
        notification_url: `${siteUrl}/api/webhooks/mercadopago`,
        statement_descriptor: 'CARDAPIO DIGITAL',
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
          customer_email: email,
          customer_phone: phone,
          restaurant_name: body.restaurantName.trim(),
          restaurant_slug_base: slugifyRestaurantName(body.restaurantName),
          onboarding_status: 'awaiting_payment',
          activation_url: null,
          provisioned_restaurant_id: null,
          provisioned_restaurant_slug: null,
          owner_user_id: session?.user?.id ?? null,
          mp_preference_id: preference.id,
        },
      })
      .eq('id', order.id)

    await persistCheckoutSession(supabaseAdmin, {
      orderId: order.id,
      userId: session?.user?.id ?? null,
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
        customer_email: email,
        restaurant_name: body.restaurantName.trim(),
      },
    })

    return NextResponse.json({
      checkout: order.order_number,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: error.flatten() },
        { status: 400 }
      )
    }

    console.error('Erro ao iniciar onboarding:', error)
    return NextResponse.json({ error: 'Erro interno ao iniciar pagamento' }, { status: 500 })
  }
}
