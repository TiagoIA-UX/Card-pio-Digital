import Stripe from 'stripe'
import {
  buildOnboardingContractHash,
  buildOnboardingOrderMetadata,
  createCheckoutNumber,
} from '@/lib/domains/core/onboarding-checkout'
import {
  ONBOARDING_PLAN_CONFIG,
  getOnboardingPriceByTemplate,
  getOnboardingPricingByTemplate,
  normalizePhone,
  slugifyRestaurantName,
} from '@/lib/domains/core/restaurant-onboarding'
import {
  TEMPLATE_PRESETS,
  normalizeTemplateSlug,
} from '@/lib/domains/core/restaurant-customization'
import { validateCoupon } from '@/lib/domains/core/coupon-validation'
import { normalizeValidatedTaxDocument } from '@/lib/domains/core/tax-document'
import type {
  OnboardingCheckoutContext,
  OnboardingCheckoutInput,
  OnboardingCheckoutResult,
} from '@/lib/domains/core/contracts'
import {
  buildCheckoutContractSummary,
  CHECKOUT_CONTRACT_SUMMARY_VERSION,
} from '@/lib/domains/marketing/checkout-contract-summary'
import { getCatalogCapacityOption } from '@/lib/domains/marketing/checkout-catalog-capacity'
import { getTemplatePlans } from '@/lib/domains/marketing/template-plans'
import { getSiteUrl } from '@/lib/shared/site-url'
import { createAdminClient } from '@/lib/shared/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

// -------------------------------------------------------
// Stripe client (lazy — só instanciado no servidor)
// -------------------------------------------------------
function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new OnboardingCheckoutCreationError(
      'STRIPE_SECRET_KEY não configurado.',
      500,
      'Configuração de pagamento incompleta. Contate o suporte.'
    )
  }
  return new Stripe(key, {
    apiVersion: '2026-04-22.dahlia',
    typescript: true,
  })
}

// -------------------------------------------------------
// Mapeamento price_id → plano interno
// -------------------------------------------------------
function getPriceIdForCapacityPlan(capacityPlanSlug: string): string {
  const map: Record<string, string | undefined> = {
    semente: process.env.STRIPE_PRICE_IMPULSO_MONTHLY,
    basico: process.env.STRIPE_PRICE_OPERACAO_MONTHLY,
    pro: process.env.STRIPE_PRICE_ESCALA_MONTHLY,
    premium: process.env.STRIPE_PRICE_EXPANSAO_MONTHLY,
  }
  const priceId = map[capacityPlanSlug]
  if (!priceId) {
    throw new OnboardingCheckoutCreationError(
      `Stripe price_id não configurado para capacityPlanSlug: ${capacityPlanSlug}`,
      500,
      'Plano selecionado não está disponível no momento. Contate o suporte.'
    )
  }
  return priceId
}

// -------------------------------------------------------
// Erro público do domínio
// -------------------------------------------------------
export class OnboardingCheckoutCreationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly publicMessage: string
  ) {
    super(message)
    this.name = 'OnboardingCheckoutCreationError'
  }
}

// -------------------------------------------------------
// Persistência da checkout_session
// -------------------------------------------------------
async function persistCheckoutSession(
  supabaseAdmin: AdminClient,
  payload: {
    orderId: string
    userId?: string | null
    templateSlug: string
    planSlug: string
    subscriptionPlanSlug: string
    paymentMethod: string
    status: string
    billingModel?: string | null
    capacityPlanSlug?: string | null
    contractedInitialAmount?: number | null
    contractedMonthlyAmount?: number | null
    contractHash?: string | null
    stripeSessionId?: string | null
    initPoint?: string | null
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
        billing_model: payload.billingModel || 'stripe_subscription',
        capacity_plan_slug: payload.capacityPlanSlug || null,
        contracted_initial_amount: payload.contractedInitialAmount ?? null,
        contracted_monthly_amount: payload.contractedMonthlyAmount ?? null,
        contract_hash: payload.contractHash || null,
        payment_method: payload.paymentMethod,
        // Reutilizamos mp_preference_id para guardar o stripe_session_id
        // (coluna genérica de referência externa)
        mp_preference_id: payload.stripeSessionId || null,
        init_point: payload.initPoint || null,
        sandbox_init_point: null,
        status: payload.status,
        metadata: payload.metadata || {},
      },
      { onConflict: 'order_id' }
    )

    if (!error) return true

    console.warn('Falha ao persistir checkout_sessions:', {
      orderId: payload.orderId,
      attempt,
      error,
    })
  }

  return false
}

// -------------------------------------------------------
// URL base para redirects
// -------------------------------------------------------
function getBackUrlBase(siteUrl: string) {
  const isLocal = /localhost|127\.0\.0\.1/.test(siteUrl)
  if (isLocal) return getSiteUrl()
  return siteUrl.startsWith('http://') ? siteUrl.replace('http://', 'https://') : siteUrl
}

// -------------------------------------------------------
// Função principal
// -------------------------------------------------------
export async function createOnboardingCheckout(
  input: OnboardingCheckoutInput,
  context: OnboardingCheckoutContext
): Promise<OnboardingCheckoutResult> {
  // Validar configuração do Supabase
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
  ) {
    throw new OnboardingCheckoutCreationError(
      'Configuração do Supabase incompleta.',
      500,
      'Configuração do Supabase incompleta. Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.'
    )
  }

  // Validar versão dos termos
  if (input.acceptedTermsVersion !== CHECKOUT_CONTRACT_SUMMARY_VERSION) {
    throw new OnboardingCheckoutCreationError(
      'Versão de aceite divergente.',
      400,
      'Atualize a página e confirme novamente os termos da contratação.'
    )
  }

  const templateSlug = normalizeTemplateSlug(input.templateSlug)
  const templatePlans = getTemplatePlans(templateSlug)
  const selectedCapacityPlan = templatePlans.find(
    (plan) => plan.capacitySlug === input.capacityPlanSlug
  )

  if (!selectedCapacityPlan) {
    throw new OnboardingCheckoutCreationError(
      'Plano mensal inválido para o template informado.',
      400,
      'O plano mensal escolhido não está disponível para este template.'
    )
  }

  const orderNumber = createCheckoutNumber()
  const subtotal = getOnboardingPriceByTemplate(
    templateSlug,
    input.onboardingPlan,
    input.paymentMethod
  )
  const supabaseAdmin = createAdminClient()
  let discount = 0
  let couponId: string | null = null

  if (!context.sessionEmail) {
    throw new OnboardingCheckoutCreationError(
      'Usuário sem email válido.',
      400,
      'Sua conta não possui e-mail válido'
    )
  }

  if (input.couponCode?.trim()) {
    const validation = await validateCoupon(supabaseAdmin, input.couponCode.trim(), subtotal)
    if (validation.valid && validation.coupon) {
      discount = validation.coupon.discountValue
      couponId = validation.coupon.id
    }
  }

  const total = Math.max(0, subtotal - discount)
  const planConfig = ONBOARDING_PLAN_CONFIG[input.onboardingPlan]
  const templateLabel = TEMPLATE_PRESETS[templateSlug].label
  const pricing = getOnboardingPricingByTemplate(templateSlug)
  const planPricing =
    input.onboardingPlan === 'feito-pra-voce' ? pricing.feitoPraVoce : pricing.selfService
  const contractedMonthlyAmount = getCatalogCapacityOption(input.capacityPlanSlug).monthlyPrice
  const phone = normalizePhone(input.customerData.phone)
  const normalizedCustomerName = input.customerData.customerName.trim()
  const normalizedRestaurantName = input.customerData.restaurantName.trim()
  const restaurantSlugBase = slugifyRestaurantName(input.customerData.restaurantName)
  const acceptedTermsAt = new Date().toISOString()
  const customerDocument = input.customerData.customerDocument
    ? normalizeValidatedTaxDocument(input.customerData.customerDocument)
    : null

  if (input.customerData.customerDocument && !customerDocument) {
    throw new OnboardingCheckoutCreationError(
      'Documento fiscal inválido.',
      400,
      'Informe um CPF ou CNPJ válido para continuar.'
    )
  }

  const contractHash = buildOnboardingContractHash({
    templateSlug,
    capacityPlanSlug: input.capacityPlanSlug,
    onboardingPlanSlug: input.onboardingPlan,
    paymentMethod: input.paymentMethod,
    initialChargeAmount: total,
    monthlyChargeAmount: contractedMonthlyAmount,
  })

  const contractSummary = buildCheckoutContractSummary({
    templateName: templateLabel,
    planSlug: input.onboardingPlan,
    planName: planConfig.name,
    paymentMethod: input.paymentMethod,
    installments: planPricing.parcelas,
    initialChargeAmount: total,
    monthlyChargeAmount: contractedMonthlyAmount,
    accountEmail: context.sessionEmail,
  })

  // Criar pedido no banco
  const { data: order, error: orderError } = await supabaseAdmin
    .from('template_orders')
    .insert({
      user_id: context.ownerUserId,
      order_number: orderNumber,
      status: 'pending',
      subtotal,
      discount,
      total,
      coupon_id: couponId,
      payment_method: input.paymentMethod,
      payment_status: 'pending',
    })
    .select('id, order_number')
    .single()

  if (orderError || !order) {
    console.error('Erro ao criar registro de checkout:', orderError)
    throw new OnboardingCheckoutCreationError(
      'Falha ao criar pedido de checkout.',
      500,
      'Erro ao iniciar checkout'
    )
  }

  const backUrlBase = getBackUrlBase(context.siteUrl)

  // -------------------------------------------------------
  // Criar Stripe Checkout Session
  // -------------------------------------------------------
  const stripe = getStripeClient()
  const priceId = getPriceIdForCapacityPlan(input.capacityPlanSlug)

  let stripeSession: Stripe.Checkout.Session

  try {
    stripeSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: context.sessionEmail,
      metadata: {
        tenant_id: context.ownerUserId,
        order_id: order.id,
        order_number: order.order_number,
        template_slug: templateSlug,
        capacity_plan_slug: input.capacityPlanSlug,
        onboarding_plan: input.onboardingPlan,
        restaurant_name: normalizedRestaurantName,
        contract_hash: contractHash,
      },
      subscription_data: {
        metadata: {
          tenant_id: context.ownerUserId,
          order_id: order.id,
          template_slug: templateSlug,
          capacity_plan_slug: input.capacityPlanSlug,
        },
      },
      success_url: `${backUrlBase}/pagamento/sucesso?checkout=${order.order_number}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${backUrlBase}/pagamento/erro?checkout=${order.order_number}`,
      locale: 'pt-BR',
      allow_promotion_codes: true,
    })
  } catch (stripeError) {
    // Registrar falha no pedido
    const failureMetadata = buildOnboardingOrderMetadata({
      templateSlug,
      planSlug: input.onboardingPlan,
      capacityPlanSlug: input.capacityPlanSlug,
      subscriptionPlanSlug: input.capacityPlanSlug,
      customerName: normalizedCustomerName,
      customerEmail: context.sessionEmail,
      customerPhone: phone,
      customerDocument,
      restaurantName: normalizedRestaurantName,
      restaurantSlugBase,
      ownerUserId: context.ownerUserId,
      onboardingStatus: 'checkout_creation_failed',
      billingModel: 'stripe_subscription',
      billingState: 'stripe_subscription',
      contractedInitialAmount: total,
      contractedMonthlyAmount,
      contractHash,
      affRef: context.affRef || null,
      acceptedTermsVersion: input.acceptedTermsVersion,
      acceptedTermsAt,
      contractSummary,
    })

    await supabaseAdmin
      .from('template_orders')
      .update({ metadata: failureMetadata })
      .eq('id', order.id)

    console.error('Erro ao criar Stripe Checkout Session:', stripeError)
    throw new OnboardingCheckoutCreationError(
      'Falha ao criar sessão de checkout Stripe.',
      502,
      'Não foi possível iniciar o checkout agora. Tente novamente em instantes.'
    )
  }

  // Persistir checkout_session
  const checkoutSessionPersisted = await persistCheckoutSession(supabaseAdmin, {
    orderId: order.id,
    userId: context.ownerUserId,
    templateSlug,
    planSlug: input.onboardingPlan,
    subscriptionPlanSlug: input.capacityPlanSlug,
    paymentMethod: input.paymentMethod,
    status: 'awaiting_payment',
    billingModel: 'stripe_subscription',
    capacityPlanSlug: input.capacityPlanSlug,
    contractedInitialAmount: total,
    contractedMonthlyAmount,
    contractHash,
    stripeSessionId: stripeSession.id,
    initPoint: stripeSession.url,
    metadata: {
      order_number: order.order_number,
      checkout_flow_version: '2026-04-stripe-v1',
      billing_model: 'stripe_subscription',
      billing_state: 'stripe_subscription',
      onboarding_plan_slug: input.onboardingPlan,
      capacity_plan_slug: input.capacityPlanSlug,
      customer_email: context.sessionEmail,
      customer_document: customerDocument,
      restaurant_name: normalizedRestaurantName,
      contracted_initial_amount: total,
      contracted_monthly_amount: contractedMonthlyAmount,
      contract_hash: contractHash,
      stripe_session_id: stripeSession.id,
      accepted_terms_version: input.acceptedTermsVersion,
      accepted_terms_at: acceptedTermsAt,
      contract_summary: contractSummary,
    },
  })

  // Persistir metadata final no pedido
  const successMetadata = buildOnboardingOrderMetadata({
    templateSlug,
    planSlug: input.onboardingPlan,
    capacityPlanSlug: input.capacityPlanSlug,
    subscriptionPlanSlug: input.capacityPlanSlug,
    customerName: normalizedCustomerName,
    customerEmail: context.sessionEmail,
    customerPhone: phone,
    customerDocument,
    restaurantName: normalizedRestaurantName,
    restaurantSlugBase,
    ownerUserId: context.ownerUserId,
    onboardingStatus: 'awaiting_payment',
    billingModel: 'stripe_subscription',
    billingState: 'stripe_subscription',
    contractedInitialAmount: total,
    contractedMonthlyAmount,
    contractHash,
    affRef: context.affRef || null,
    mpPreferenceId: stripeSession.id,
    mpPreapprovalId: '',
    checkoutSessionSyncFailed: !checkoutSessionPersisted,
    acceptedTermsVersion: input.acceptedTermsVersion,
    acceptedTermsAt,
    contractSummary,
  })

  const { error: metadataUpdateError } = await supabaseAdmin
    .from('template_orders')
    .update({ metadata: successMetadata })
    .eq('id', order.id)

  if (metadataUpdateError) {
    console.error('Erro ao persistir metadata final do checkout:', metadataUpdateError)
    throw new OnboardingCheckoutCreationError(
      'Falha ao persistir metadata final do checkout.',
      500,
      'Não foi possível iniciar o checkout agora. Tente novamente em instantes.'
    )
  }

  return {
    checkout: order.order_number,
    initPoint: stripeSession.url,
    sandboxInitPoint: null,
  }
}
