import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import { createClient as createServerClient } from '@/lib/shared/supabase/server'
import { getRateLimitIdentifier, withRateLimit } from '@/lib/shared/rate-limit'
import { getRequestSiteUrl } from '@/lib/shared/site-url'
import { slugifyRestaurantName } from '@/lib/domains/core/restaurant-onboarding'
import { getRestaurantTemplateConfig } from '@/lib/domains/marketing/templates-config'
import { createMercadoPagoPreferenceClient } from '@/lib/domains/core/mercadopago'
import {
  buildOnboardingOrderMetadata,
  createCheckoutNumber,
} from '@/lib/domains/core/onboarding-checkout'
import {
  buildCheckoutContractSummary,
  CHECKOUT_CONTRACT_SUMMARY_VERSION,
} from '@/lib/domains/marketing/checkout-contract-summary'
import { COMPANY_PAYMENT_DESCRIPTOR, PRODUCT_NAME } from '@/lib/shared/brand'

const STARTER_PRODUCT_LIMIT = 15
const MONTHLY_ORDER_LIMIT = 60
const STARTER_ACTIVATION_FEE = 19.9
const STARTER_PLAN_NAME = 'Plano Começo'
const ALLOWED_STARTER_TEMPLATES = new Set([
  'lanchonete',
  'acai',
  'cafeteria',
  'sorveteria',
  'doceria',
])

const SementeSchema = z.object({
  restaurantName: z.string().min(2).max(120),
  phone: z.string().min(10).max(20),
  templateSlug: z.string().min(2).max(40),
})

async function resolveUniqueSlug(admin: ReturnType<typeof createAdminClient>, baseName: string) {
  const baseSlug = slugifyRestaurantName(baseName) || 'meu-delivery'

  for (let index = 0; index < 10; index += 1) {
    const candidate = index === 0 ? baseSlug : `${baseSlug}-${index + 1}`
    const { data: existing } = await admin
      .from('restaurants')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (!existing) {
      return candidate
    }
  }

  return `${baseSlug}-${Date.now().toString().slice(-6)}`
}

export async function POST(request: NextRequest) {
  const rateLimit = await withRateLimit(getRateLimitIdentifier(request), {
    limit: 5,
    windowMs: 60000,
  })
  if (rateLimit.limited) {
    return rateLimit.response
  }

  try {
    const authSupabase = await createServerClient()
    const {
      data: { user },
    } = await authSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Faça login para continuar' }, { status: 401 })
    }

    const raw = await request.json()
    const parsed = SementeSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    const { data: existingRestaurant } = await admin
      .from('restaurants')
      .select('id, slug, plan_slug')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (existingRestaurant) {
      return NextResponse.json(
        {
          error:
            'Sua conta já possui um canal digital ativo. O Plano Começo é limitado a um por usuário.',
          restaurant_id: existingRestaurant.id,
          slug: existingRestaurant.slug,
          plan_slug: existingRestaurant.plan_slug,
        },
        { status: 409 }
      )
    }

    const { restaurantName, phone, templateSlug } = parsed.data

    if (!ALLOWED_STARTER_TEMPLATES.has(templateSlug)) {
      return NextResponse.json(
        {
          error:
            'Este nicho já exige um canal profissional. Para ele, use o plano self-service ou feito pra você.',
        },
        { status: 400 }
      )
    }

    const template = getRestaurantTemplateConfig(templateSlug)
    const slug = await resolveUniqueSlug(admin, restaurantName)
    const checkoutNumber = createCheckoutNumber()
    const acceptedTermsAt = new Date().toISOString()
    const customerEmail = user.email?.trim().toLowerCase() || ''
    const customerName =
      (typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim()) ||
      (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()) ||
      restaurantName.trim()

    const contractSummary = buildCheckoutContractSummary({
      templateName: template.name,
      planSlug: 'self-service',
      planName: STARTER_PLAN_NAME,
      paymentMethod: 'pix',
      installments: 1,
      initialChargeAmount: STARTER_ACTIVATION_FEE,
      monthlyChargeAmount: 14.9,
      accountEmail: customerEmail,
    })

    const { data: order, error: orderError } = await admin
      .from('template_orders')
      .insert({
        user_id: user.id,
        order_number: checkoutNumber,
        status: 'pending',
        subtotal: STARTER_ACTIVATION_FEE,
        discount: 0,
        total: STARTER_ACTIVATION_FEE,
        payment_method: 'pix',
        payment_status: 'pending',
      })
      .select('id, order_number')
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        {
          error: `Erro ao iniciar checkout do Plano Começo: ${orderError?.message || 'desconhecido'}`,
        },
        { status: 500 }
      )
    }

    const siteUrl = getRequestSiteUrl(request)
    const notificationUrl = `${siteUrl}/api/webhook/mercadopago`
    const preferenceClient = createMercadoPagoPreferenceClient(10000)
    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: String(order.id),
            title: `${PRODUCT_NAME} — ${STARTER_PLAN_NAME} (${template.name})`,
            description: `Ativação simbólica do ${STARTER_PLAN_NAME} para ${restaurantName.trim()}`,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: STARTER_ACTIVATION_FEE,
          },
        ],
        payer: {
          email: customerEmail,
          name: customerName,
        },
        payment_methods: {
          excluded_payment_types: [{ id: 'ticket' }, { id: 'credit_card' }, { id: 'debit_card' }],
          excluded_payment_methods: [{ id: 'account_money' }],
        },
        external_reference: `onboarding:${order.id}`,
        back_urls: {
          success: `${siteUrl}/pagamento/sucesso?checkout=${order.order_number}`,
          failure: `${siteUrl}/pagamento/erro?checkout=${order.order_number}`,
          pending: `${siteUrl}/pagamento/pendente?checkout=${order.order_number}`,
        },
        auto_return: 'approved',
        notification_url: notificationUrl,
        statement_descriptor: COMPANY_PAYMENT_DESCRIPTOR,
      },
    })

    const metadata = buildOnboardingOrderMetadata({
      templateSlug: template.slug,
      planSlug: 'self-service',
      subscriptionPlanSlug: 'semente',
      customerName,
      customerEmail,
      customerPhone: phone,
      restaurantName: restaurantName.trim(),
      restaurantSlugBase: slug,
      ownerUserId: user.id,
      onboardingStatus: 'awaiting_payment',
      mpPreferenceId: preference.id,
      acceptedTermsVersion: CHECKOUT_CONTRACT_SUMMARY_VERSION,
      acceptedTermsAt,
      contractSummary,
    })

    const { error: metadataError } = await admin
      .from('template_orders')
      .update({ metadata })
      .eq('id', order.id)

    if (metadataError) {
      return NextResponse.json(
        { error: `Erro ao salvar metadados do Plano Começo: ${metadataError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        checkout: order.order_number,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
        limits: {
          maxProducts: STARTER_PRODUCT_LIMIT,
          recommendedUpgradeAtProducts: 12,
          maxOrdersPerMonth: MONTHLY_ORDER_LIMIT,
          recommendedUpgradeAtOrders: 45,
          includesWhatsAppAutomaticOrders: true,
        },
      },
      { headers: rateLimit.headers }
    )
  } catch (error) {
    console.error('[onboarding-semente] Erro:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
