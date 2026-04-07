import {
  createMercadoPagoPreferenceClient,
  getMercadoPagoAccessToken,
} from '@/lib/domains/core/mercadopago'
import {
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
import { isServerSandboxMode } from '@/lib/domains/core/payment-mode'
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
import { COMPANY_NAME, COMPANY_PAYMENT_DESCRIPTOR, PRODUCT_NAME } from '@/lib/shared/brand'
import { getSiteUrl } from '@/lib/shared/site-url'
import { createAdminClient } from '@/lib/shared/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

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

function getBackUrlBase(siteUrl: string) {
  const isLocal = /localhost|127\.0\.0\.1/.test(siteUrl)
  if (isLocal) {
    return getSiteUrl()
  }

  return siteUrl.startsWith('http://') ? siteUrl.replace('http://', 'https://') : siteUrl
}

function getNotificationUrl(backUrlBase: string) {
  const sandbox = isServerSandboxMode()
  const canonicalSiteUrl = getSiteUrl()

  return sandbox || backUrlBase === canonicalSiteUrl
    ? undefined
    : `${backUrlBase}/api/webhook/mercadopago`
}

function getPaymentMethodsConfig(paymentMethod: OnboardingCheckoutInput['paymentMethod']) {
  const sandbox = isServerSandboxMode()
  if (sandbox) {
    return undefined
  }

  if (paymentMethod === 'pix') {
    return {
      excluded_payment_types: [{ id: 'ticket' }, { id: 'credit_card' }, { id: 'debit_card' }],
      excluded_payment_methods: [{ id: 'account_money' }],
    }
  }

  return {
    installments: 12,
    excluded_payment_methods: [{ id: 'pix' }],
  }
}

export async function createOnboardingCheckout(
  input: OnboardingCheckoutInput,
  context: OnboardingCheckoutContext
): Promise<OnboardingCheckoutResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)) {
    throw new OnboardingCheckoutCreationError(
      'Configuração do Supabase incompleta.',
      500,
      'Configuração do Supabase incompleta. Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SECRET_KEY.'
    )
  }

  try {
    getMercadoPagoAccessToken()
  } catch {
    throw new OnboardingCheckoutCreationError(
      'Mercado Pago indisponível.',
      503,
      'Serviço de pagamento temporariamente indisponível. Tente novamente em instantes.'
    )
  }

  if (input.acceptedTermsVersion !== CHECKOUT_CONTRACT_SUMMARY_VERSION) {
    throw new OnboardingCheckoutCreationError(
      'Versão de aceite divergente.',
      400,
      'Atualize a página e confirme novamente os termos da contratação.'
    )
  }

  const templateSlug = normalizeTemplateSlug(input.template)
  const orderNumber = createCheckoutNumber()
  const subtotal = getOnboardingPriceByTemplate(templateSlug, input.plan, input.paymentMethod)
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
  const planConfig = ONBOARDING_PLAN_CONFIG[input.plan]
  const templateLabel = TEMPLATE_PRESETS[templateSlug].label
  const pricing = getOnboardingPricingByTemplate(templateSlug)
  const planPricing = input.plan === 'feito-pra-voce' ? pricing.feitoPraVoce : pricing.selfService
  const phone = normalizePhone(input.phone)
  const normalizedCustomerName = input.customerName.trim()
  const normalizedRestaurantName = input.restaurantName.trim()
  const restaurantSlugBase = slugifyRestaurantName(input.restaurantName)
  const acceptedTermsAt = new Date().toISOString()
  const customerDocument = input.customerDocument
    ? normalizeValidatedTaxDocument(input.customerDocument)
    : null

  if (input.customerDocument && !customerDocument) {
    throw new OnboardingCheckoutCreationError(
      'Documento fiscal inválido.',
      400,
      'Informe um CPF ou CNPJ válido para continuar.'
    )
  }

  const contractSummary = buildCheckoutContractSummary({
    templateName: templateLabel,
    planSlug: input.plan,
    planName: planConfig.name,
    paymentMethod: input.paymentMethod,
    installments: planPricing.parcelas,
    initialChargeAmount: total,
    monthlyChargeAmount: planPricing.monthly,
    accountEmail: context.sessionEmail,
  })

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

  const preferenceClient = createMercadoPagoPreferenceClient(10000)
  const backUrlBase = getBackUrlBase(context.siteUrl)
  const notificationUrl = getNotificationUrl(backUrlBase)
  const paymentMethodsConfig = getPaymentMethodsConfig(input.paymentMethod)
  const sandbox = isServerSandboxMode()

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
          email: context.sessionEmail,
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
      planSlug: input.plan,
      subscriptionPlanSlug: planConfig.subscriptionPlanSlug,
      customerName: normalizedCustomerName,
      customerEmail: context.sessionEmail,
      customerPhone: phone,
      customerDocument,
      restaurantName: normalizedRestaurantName,
      restaurantSlugBase,
      ownerUserId: context.ownerUserId,
      onboardingStatus: 'checkout_creation_failed',
      affRef: context.affRef || null,
      acceptedTermsVersion: input.acceptedTermsVersion,
      acceptedTermsAt,
      contractSummary,
    })

    await supabaseAdmin
      .from('template_orders')
      .update({ metadata: failureMetadata })
      .eq('id', order.id)

    console.error('Erro ao criar preferência do Mercado Pago:', preferenceError)
    throw new OnboardingCheckoutCreationError(
      'Falha ao criar preferência do Mercado Pago.',
      502,
      'Não foi possível iniciar o checkout agora. Tente novamente em instantes.'
    )
  }

  const checkoutSessionPersisted = await persistCheckoutSession(supabaseAdmin, {
    orderId: order.id,
    userId: context.ownerUserId,
    templateSlug,
    planSlug: input.plan,
    subscriptionPlanSlug: planConfig.subscriptionPlanSlug,
    paymentMethod: input.paymentMethod,
    status: 'awaiting_payment',
    mpPreferenceId: preference.id,
    initPoint: preference.init_point,
    sandboxInitPoint: preference.sandbox_init_point,
    metadata: {
      order_number: order.order_number,
      customer_email: context.sessionEmail,
      customer_document: customerDocument,
      restaurant_name: normalizedRestaurantName,
      accepted_terms_version: input.acceptedTermsVersion,
      accepted_terms_at: acceptedTermsAt,
      contract_summary: contractSummary,
    },
  })

  const successMetadata = buildOnboardingOrderMetadata({
    templateSlug,
    planSlug: input.plan,
    subscriptionPlanSlug: planConfig.subscriptionPlanSlug,
    customerName: normalizedCustomerName,
    customerEmail: context.sessionEmail,
    customerPhone: phone,
    customerDocument,
    restaurantName: normalizedRestaurantName,
    restaurantSlugBase,
    ownerUserId: context.ownerUserId,
    onboardingStatus: 'awaiting_payment',
    affRef: context.affRef || null,
    mpPreferenceId: preference.id,
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
    initPoint: preference.init_point,
    sandboxInitPoint: preference.sandbox_init_point,
  }
}
