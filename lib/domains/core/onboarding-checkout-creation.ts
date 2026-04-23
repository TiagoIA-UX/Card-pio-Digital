import {
  assertMercadoPagoTokenMatchesConfiguredSeller,
  createMercadoPagoPreapprovalWithTrial,
  createValidatedMercadoPagoPreferenceClient,
} from '@/lib/domains/core/mercadopago'
import {
  buildOnboardingShadowExternalReference,
  buildOnboardingContractHash,
  buildOnboardingOrderMetadata,
  createCheckoutNumber,
  isNewBillingEnabled,
  isShadowPreapprovalEnabled,
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
import { getCatalogCapacityOption } from '@/lib/domains/marketing/checkout-catalog-capacity'
import { getTemplatePlans } from '@/lib/domains/marketing/template-plans'
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
    billingModel?: string | null
    capacityPlanSlug?: string | null
    contractedInitialAmount?: number | null
    contractedMonthlyAmount?: number | null
    contractHash?: string | null
    mpPreferenceId?: string | null
    mpPreapprovalId?: string | null
    mpPreapprovalStatus?: string | null
    trialEndsAt?: string | null
    initPoint?: string | null
    sandboxInitPoint?: string | null
    shadowPreapprovalCreatedAt?: string | null
    shadowPreapprovalError?: string | null
    shadowPreapprovalAttempts?: number | null
    metadata?: Record<string, unknown>
  }
) {
  const { data: existingSession } = await supabaseAdmin
    .from('checkout_sessions')
    .select(
      'mp_preapproval_id, mp_preapproval_status, trial_ends_at, shadow_preapproval_created_at, shadow_preapproval_error, shadow_preapproval_attempts'
    )
    .eq('order_id', payload.orderId)
    .maybeSingle()

  for (let attempt = 1; attempt <= 2; attempt++) {
    const { error } = await supabaseAdmin.from('checkout_sessions').upsert(
      {
        order_id: payload.orderId,
        user_id: payload.userId || null,
        template_slug: payload.templateSlug,
        onboarding_plan_slug: payload.planSlug,
        subscription_plan_slug: payload.subscriptionPlanSlug,
        billing_model: payload.billingModel || 'legacy_billing',
        capacity_plan_slug: payload.capacityPlanSlug || null,
        contracted_initial_amount: payload.contractedInitialAmount ?? null,
        contracted_monthly_amount: payload.contractedMonthlyAmount ?? null,
        contract_hash: payload.contractHash || null,
        payment_method: payload.paymentMethod,
        mp_preference_id: payload.mpPreferenceId || null,
        mp_preapproval_id: existingSession?.mp_preapproval_id || payload.mpPreapprovalId || null,
        mp_preapproval_status:
          existingSession?.mp_preapproval_status || payload.mpPreapprovalStatus || null,
        trial_ends_at: existingSession?.trial_ends_at || payload.trialEndsAt || null,
        init_point: payload.initPoint || null,
        sandbox_init_point: payload.sandboxInitPoint || null,
        shadow_preapproval_created_at:
          existingSession?.shadow_preapproval_created_at ||
          payload.shadowPreapprovalCreatedAt ||
          null,
        shadow_preapproval_error:
          existingSession?.shadow_preapproval_error || payload.shadowPreapprovalError || null,
        shadow_preapproval_attempts:
          existingSession?.shadow_preapproval_attempts ?? payload.shadowPreapprovalAttempts ?? 0,
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

async function persistShadowSubscriptionAnchor(
  supabaseAdmin: AdminClient,
  payload: {
    userId: string | null
    capacityPlanSlug: string
    mpPreapprovalId: string
    mpPreapprovalStatus: string | null
    contractHash: string
    contractedMonthlyAmount: number
    trialEndsAt: string | null
  }
) {
  const { data: plan } = await supabaseAdmin
    .from('plans')
    .select('id')
    .eq('slug', payload.capacityPlanSlug)
    .maybeSingle()

  if (!plan?.id) {
    console.warn('Plano não encontrado para âncora shadow da assinatura', {
      capacityPlanSlug: payload.capacityPlanSlug,
      mpPreapprovalId: payload.mpPreapprovalId,
    })
    return false
  }

  const { data: existingSubscription } = await supabaseAdmin
    .from('subscriptions')
    .select('id, contract_hash, contracted_monthly_amount, trial_ends_at')
    .eq('mp_preapproval_id', payload.mpPreapprovalId)
    .maybeSingle()

  const anchorPayload = {
    user_id: payload.userId,
    plan_id: plan.id,
    status: 'pending',
    payment_gateway: 'mercadopago',
    mp_preapproval_id: payload.mpPreapprovalId,
    mp_subscription_status: payload.mpPreapprovalStatus || 'pending',
    billing_model: 'subscription_preapproval',
    contract_hash: existingSubscription?.contract_hash || payload.contractHash,
    contracted_monthly_amount:
      existingSubscription?.contracted_monthly_amount ?? payload.contractedMonthlyAmount,
    trial_ends_at: existingSubscription?.trial_ends_at || payload.trialEndsAt || null,
    updated_at: new Date().toISOString(),
  }

  if (existingSubscription?.id) {
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update(anchorPayload)
      .eq('id', existingSubscription.id)

    if (updateError) {
      console.warn('Falha ao atualizar âncora shadow em subscriptions', {
        mpPreapprovalId: payload.mpPreapprovalId,
        error: updateError,
      })
      return false
    }

    return true
  }

  const { error: insertError } = await supabaseAdmin.from('subscriptions').insert({
    ...anchorPayload,
    created_at: new Date().toISOString(),
  })

  if (insertError) {
    console.warn('Falha ao criar âncora shadow em subscriptions', {
      mpPreapprovalId: payload.mpPreapprovalId,
      error: insertError,
    })
    return false
  }

  return true
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
  const useNewBilling = isNewBillingEnabled()
  const shadowPreapprovalEnabled = isShadowPreapprovalEnabled()

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
  ) {
    throw new OnboardingCheckoutCreationError(
      'Configuração do Supabase incompleta.',
      500,
      'Configuração do Supabase incompleta. Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SECRET_KEY.'
    )
  }

  try {
    await assertMercadoPagoTokenMatchesConfiguredSeller()
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

  if (useNewBilling) {
    throw new OnboardingCheckoutCreationError(
      'Novo billing ativado sem implementação completa.',
      503,
      'O novo checkout de assinatura ainda não está liberado operacionalmente.'
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
  const notificationUrl = getNotificationUrl(backUrlBase)
  const paymentMethodsConfig = getPaymentMethodsConfig(input.paymentMethod)
  const sandbox = isServerSandboxMode()

  let preference
  try {
    const preferenceClient = await createValidatedMercadoPagoPreferenceClient(10000)
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
      billingModel: 'legacy_billing',
      billingState: 'legacy_billing',
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
    planSlug: input.onboardingPlan,
    subscriptionPlanSlug: input.capacityPlanSlug,
    paymentMethod: input.paymentMethod,
    status: 'awaiting_payment',
    billingModel: 'legacy_billing',
    capacityPlanSlug: input.capacityPlanSlug,
    contractedInitialAmount: total,
    contractedMonthlyAmount,
    contractHash,
    mpPreferenceId: preference.id,
    initPoint: preference.init_point,
    sandboxInitPoint: preference.sandbox_init_point,
    metadata: {
      order_number: order.order_number,
      checkout_flow_version: '2026-04-contract-v2',
      billing_model: 'legacy_billing',
      billing_state: 'legacy_billing',
      onboarding_plan_slug: input.onboardingPlan,
      capacity_plan_slug: input.capacityPlanSlug,
      customer_email: context.sessionEmail,
      customer_document: customerDocument,
      restaurant_name: normalizedRestaurantName,
      contracted_initial_amount: total,
      contracted_monthly_amount: contractedMonthlyAmount,
      contract_hash: contractHash,
      accepted_terms_version: input.acceptedTermsVersion,
      accepted_terms_at: acceptedTermsAt,
      contract_summary: contractSummary,
    },
  })

  let shadowPreapprovalId: string | null = null
  let shadowPreapprovalStatus: string | null = null
  let shadowTrialEndsAt: string | null = null
  let shadowTrialEndsAtEstimated = false
  let shadowPreapprovalError: string | null = null
  let shadowPreapprovalAttempts = 0
  let shadowSubscriptionAnchorPersisted = false

  if (shadowPreapprovalEnabled) {
    const { data: existingCheckoutSession } = await supabaseAdmin
      .from('checkout_sessions')
      .select(
        'mp_preapproval_id, mp_preapproval_status, trial_ends_at, shadow_preapproval_attempts'
      )
      .eq('order_id', order.id)
      .maybeSingle()

    shadowPreapprovalAttempts = (existingCheckoutSession?.shadow_preapproval_attempts || 0) + 1

    if (existingCheckoutSession?.mp_preapproval_id) {
      shadowPreapprovalId = existingCheckoutSession.mp_preapproval_id
      shadowPreapprovalStatus = existingCheckoutSession.mp_preapproval_status || null
      shadowTrialEndsAt = existingCheckoutSession.trial_ends_at || null
      shadowSubscriptionAnchorPersisted = await persistShadowSubscriptionAnchor(supabaseAdmin, {
        userId: context.ownerUserId,
        capacityPlanSlug: input.capacityPlanSlug,
        mpPreapprovalId: existingCheckoutSession.mp_preapproval_id,
        mpPreapprovalStatus: shadowPreapprovalStatus,
        contractHash,
        contractedMonthlyAmount,
        trialEndsAt: shadowTrialEndsAt,
      })
    } else if (input.paymentMethod !== 'card') {
      shadowPreapprovalError = 'shadow_preapproval_requires_card'
    } else {
      try {
        const externalReference = buildOnboardingShadowExternalReference(order.id, contractHash)
        const preapproval = await createMercadoPagoPreapprovalWithTrial({
          payerEmail: context.sessionEmail,
          reason: `${PRODUCT_NAME} — ${selectedCapacityPlan.displayName} (${templateLabel})`,
          externalReference,
          monthlyAmount: contractedMonthlyAmount,
          backUrl: `${backUrlBase}/painel/planos?preapproval=shadow`,
          trialDays: 7,
        })

        shadowPreapprovalId = preapproval.id
        shadowPreapprovalStatus = preapproval.status
        shadowTrialEndsAt = preapproval.trialEndsAt
        shadowTrialEndsAtEstimated = preapproval.trialEndsAtEstimated
        shadowSubscriptionAnchorPersisted = await persistShadowSubscriptionAnchor(supabaseAdmin, {
          userId: context.ownerUserId,
          capacityPlanSlug: input.capacityPlanSlug,
          mpPreapprovalId: shadowPreapprovalId,
          mpPreapprovalStatus: shadowPreapprovalStatus,
          contractHash,
          contractedMonthlyAmount,
          trialEndsAt: shadowTrialEndsAt,
        })

        console.log(
          JSON.stringify({
            level: 'info',
            event: 'PREAPPROVAL_CREATED',
            billing_model: 'subscription_preapproval_shadow',
            contract_hash: contractHash,
            template_slug: templateSlug,
            capacity_plan_slug: input.capacityPlanSlug,
            onboarding_plan_slug: input.onboardingPlan,
            monthly_amount: contractedMonthlyAmount,
            trial_days: 7,
            trial_ends_at: shadowTrialEndsAt,
            trial_ends_at_estimated: shadowTrialEndsAtEstimated,
            mp_preapproval_id: shadowPreapprovalId,
            subscription_anchor_persisted: shadowSubscriptionAnchorPersisted,
            timestamp: new Date().toISOString(),
          })
        )
      } catch (error) {
        shadowPreapprovalError =
          error instanceof Error ? error.message : 'shadow_preapproval_unknown_error'

        console.error(
          JSON.stringify({
            level: 'error',
            event: 'PREAPPROVAL_CREATE_FAILED',
            billing_model: 'subscription_preapproval_shadow',
            contract_hash: contractHash,
            template_slug: templateSlug,
            capacity_plan_slug: input.capacityPlanSlug,
            onboarding_plan_slug: input.onboardingPlan,
            monthly_amount: contractedMonthlyAmount,
            error: shadowPreapprovalError,
            timestamp: new Date().toISOString(),
          })
        )
      }
    }

    await persistCheckoutSession(supabaseAdmin, {
      orderId: order.id,
      userId: context.ownerUserId,
      templateSlug,
      planSlug: input.onboardingPlan,
      subscriptionPlanSlug: input.capacityPlanSlug,
      paymentMethod: input.paymentMethod,
      status: 'awaiting_payment',
      billingModel: 'legacy_billing',
      capacityPlanSlug: input.capacityPlanSlug,
      contractedInitialAmount: total,
      contractedMonthlyAmount,
      contractHash,
      mpPreferenceId: preference.id,
      mpPreapprovalId: shadowPreapprovalId,
      mpPreapprovalStatus: shadowPreapprovalStatus,
      trialEndsAt: shadowTrialEndsAt,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
      shadowPreapprovalCreatedAt: shadowPreapprovalId ? new Date().toISOString() : null,
      shadowPreapprovalError,
      shadowPreapprovalAttempts,
      metadata: {
        order_number: order.order_number,
        checkout_flow_version: '2026-04-contract-v2',
        billing_model: 'legacy_billing',
        billing_state: 'legacy_billing',
        onboarding_plan_slug: input.onboardingPlan,
        capacity_plan_slug: input.capacityPlanSlug,
        customer_email: context.sessionEmail,
        customer_document: customerDocument,
        restaurant_name: normalizedRestaurantName,
        contracted_initial_amount: total,
        contracted_monthly_amount: contractedMonthlyAmount,
        contract_hash: contractHash,
        mp_preapproval_id: shadowPreapprovalId,
        mp_preapproval_status: shadowPreapprovalStatus,
        trial_ends_at: shadowTrialEndsAt,
        trial_ends_at_estimated: shadowTrialEndsAtEstimated,
        shadow_preapproval_error: shadowPreapprovalError,
        shadow_subscription_anchor_persisted: shadowSubscriptionAnchorPersisted,
        accepted_terms_version: input.acceptedTermsVersion,
        accepted_terms_at: acceptedTermsAt,
        contract_summary: contractSummary,
      },
    })
  }

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
    billingModel: 'legacy_billing',
    billingState: 'legacy_billing',
    contractedInitialAmount: total,
    contractedMonthlyAmount,
    contractHash,
    affRef: context.affRef || null,
    mpPreferenceId: preference.id,
    mpPreapprovalId: shadowPreapprovalId,
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
