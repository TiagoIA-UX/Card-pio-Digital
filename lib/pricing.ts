import type { RestaurantTemplateSlug } from '@/lib/restaurant-customization'

export type OnboardingPlanSlug = 'self-service' | 'feito-pra-voce'
export type PaymentMethod = 'pix' | 'card'
export type BillingCycle = 'unico' | 'mensal' | 'anual'

/**
 * Estrutura de preço por template e plano.
 * O funil público combina uma taxa inicial de implantação (PIX/cartão) com o plano mensal/anual
 * correspondente ao template e ao modelo escolhido.
 */
export interface TemplatePricing {
  template: RestaurantTemplateSlug
  complexidade: 1 | 2 | 3 // 1=simples, 2=médio, 3=complexo
  selfService: {
    pix: number
    card: number
    parcelas: number
    monthly: number
    annual: number
  }
  feitoPraVoce: {
    pix: number
    card: number
    parcelas: number
    monthly: number
    annual: number
  }
}

/**
 * Mensalidade pública simplificada por modelo.
 * A implantação varia por template; a continuidade da plataforma segue o plano escolhido.
 */
export const PUBLIC_SUBSCRIPTION_PRICES = {
  basico: {
    monthly: 59,
    annual: 590,
  },
  pro: {
    monthly: 89,
    annual: 885,
  },
} as const

/** Valores do plano recorrente por modelo. */
function getSubscriptionPrices(slug: RestaurantTemplateSlug) {
  const diyMonthly = PUBLIC_SUBSCRIPTION_PRICES.basico.monthly
  const diyAnnual = PUBLIC_SUBSCRIPTION_PRICES.basico.annual
  const fpvcMonthly = PUBLIC_SUBSCRIPTION_PRICES.pro.monthly
  const fpvcAnnual = PUBLIC_SUBSCRIPTION_PRICES.pro.annual
  return { diyMonthly, diyAnnual, fpvcMonthly, fpvcAnnual }
}

/**
 * Preços públicos por template.
 * PIX/Cartão representam a implantação inicial.
 * Mensal/Anual representam a continuidade do plano do cardápio após a ativação.
 */
export const TEMPLATE_PRICING: Record<RestaurantTemplateSlug, TemplatePricing> = {
  lanchonete: (() => {
    const sub = getSubscriptionPrices('lanchonete')
    return {
      template: 'lanchonete',
      complexidade: 1,
      selfService: {
        pix: 197,
        card: 237,
        parcelas: 3,
        monthly: sub.diyMonthly,
        annual: sub.diyAnnual,
      },
      feitoPraVoce: {
        pix: 497,
        card: 597,
        parcelas: 3,
        monthly: sub.fpvcMonthly,
        annual: sub.fpvcAnnual,
      },
    }
  })(),
  acai: (() => {
    const sub = getSubscriptionPrices('acai')
    return {
      template: 'acai',
      complexidade: 1,
      selfService: {
        pix: 197,
        card: 237,
        parcelas: 3,
        monthly: sub.diyMonthly,
        annual: sub.diyAnnual,
      },
      feitoPraVoce: {
        pix: 497,
        card: 597,
        parcelas: 3,
        monthly: sub.fpvcMonthly,
        annual: sub.fpvcAnnual,
      },
    }
  })(),
  restaurante: (() => {
    const sub = getSubscriptionPrices('restaurante')
    return {
      template: 'restaurante',
      complexidade: 2,
      selfService: {
        pix: 247,
        card: 297,
        parcelas: 3,
        monthly: sub.diyMonthly,
        annual: sub.diyAnnual,
      },
      feitoPraVoce: {
        pix: 597,
        card: 717,
        parcelas: 3,
        monthly: sub.fpvcMonthly,
        annual: sub.fpvcAnnual,
      },
    }
  })(),
  cafeteria: (() => {
    const sub = getSubscriptionPrices('cafeteria')
    return {
      template: 'cafeteria',
      complexidade: 2,
      selfService: {
        pix: 247,
        card: 297,
        parcelas: 3,
        monthly: sub.diyMonthly,
        annual: sub.diyAnnual,
      },
      feitoPraVoce: {
        pix: 597,
        card: 717,
        parcelas: 3,
        monthly: sub.fpvcMonthly,
        annual: sub.fpvcAnnual,
      },
    }
  })(),
  bar: (() => {
    const sub = getSubscriptionPrices('bar')
    return {
      template: 'bar',
      complexidade: 2,
      selfService: {
        pix: 247,
        card: 297,
        parcelas: 3,
        monthly: sub.diyMonthly,
        annual: sub.diyAnnual,
      },
      feitoPraVoce: {
        pix: 597,
        card: 717,
        parcelas: 3,
        monthly: sub.fpvcMonthly,
        annual: sub.fpvcAnnual,
      },
    }
  })(),
  pizzaria: (() => {
    const sub = getSubscriptionPrices('pizzaria')
    return {
      template: 'pizzaria',
      complexidade: 3,
      selfService: {
        pix: 297,
        card: 357,
        parcelas: 3,
        monthly: sub.diyMonthly,
        annual: sub.diyAnnual,
      },
      feitoPraVoce: {
        pix: 697,
        card: 837,
        parcelas: 3,
        monthly: sub.fpvcMonthly,
        annual: sub.fpvcAnnual,
      },
    }
  })(),
  sushi: (() => {
    const sub = getSubscriptionPrices('sushi')
    return {
      template: 'sushi',
      complexidade: 3,
      selfService: {
        pix: 297,
        card: 357,
        parcelas: 3,
        monthly: sub.diyMonthly,
        annual: sub.diyAnnual,
      },
      feitoPraVoce: {
        pix: 697,
        card: 837,
        parcelas: 3,
        monthly: sub.fpvcMonthly,
        annual: sub.fpvcAnnual,
      },
    }
  })(),
}

export function getTemplatePrice(
  templateSlug: RestaurantTemplateSlug,
  plan: OnboardingPlanSlug,
  paymentMethod: PaymentMethod
): number {
  const pricing = TEMPLATE_PRICING[templateSlug] ?? TEMPLATE_PRICING.restaurante
  const planPrices = plan === 'feito-pra-voce' ? pricing.feitoPraVoce : pricing.selfService
  return paymentMethod === 'pix' ? planPrices.pix : planPrices.card
}

export function getTemplatePricing(templateSlug: RestaurantTemplateSlug): TemplatePricing {
  return TEMPLATE_PRICING[templateSlug] ?? TEMPLATE_PRICING.restaurante
}

/** Percentual a mais do Feito Pra Você sobre Faça Você Mesmo (PIX) */
export function getFpvcMarkupPercent(templateSlug: RestaurantTemplateSlug): number {
  const p = TEMPLATE_PRICING[templateSlug] ?? TEMPLATE_PRICING.restaurante
  const diy = p.selfService.pix
  const fpvc = p.feitoPraVoce.pix
  return Math.round(((fpvc - diy) / diy) * 100)
}
