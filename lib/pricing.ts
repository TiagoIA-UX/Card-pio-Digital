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
    parcelas_max: number
    card_12x: number
    monthly: number
    annual: number
  }
  feitoPraVoce: {
    pix: number
    card: number
    parcelas: number
    parcelas_max: number
    card_12x: number
    monthly: number
    annual: number
  }
}

export function calcParcelaMensal(valor: number, parcelas: number, taxaMensal = 0.0299): number {
  if (parcelas <= 1) return valor
  const i = taxaMensal
  const pmt = valor * (i / (1 - Math.pow(1 + i, -parcelas)))
  return Math.ceil(pmt * 100) / 100
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

export const POST_PURCHASE_OFFERS = {
  aceleracaoVendas7Dias: {
    original: 397,
    current: 197,
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

function createPlanPricing(pix: number, card: number, monthly: number, annual: number) {
  return {
    pix,
    card,
    parcelas: 3,
    parcelas_max: 12,
    card_12x: calcParcelaMensal(card, 12),
    monthly,
    annual,
  }
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
      selfService: createPlanPricing(197, 237, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(497, 597, sub.fpvcMonthly, sub.fpvcAnnual),
    }
  })(),
  acai: (() => {
    const sub = getSubscriptionPrices('acai')
    return {
      template: 'acai',
      complexidade: 1,
      selfService: createPlanPricing(197, 237, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(497, 597, sub.fpvcMonthly, sub.fpvcAnnual),
    }
  })(),
  restaurante: (() => {
    const sub = getSubscriptionPrices('restaurante')
    return {
      template: 'restaurante',
      complexidade: 2,
      selfService: createPlanPricing(247, 297, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(597, 717, sub.fpvcMonthly, sub.fpvcAnnual),
    }
  })(),
  cafeteria: (() => {
    const sub = getSubscriptionPrices('cafeteria')
    return {
      template: 'cafeteria',
      complexidade: 2,
      selfService: createPlanPricing(247, 297, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(597, 717, sub.fpvcMonthly, sub.fpvcAnnual),
    }
  })(),
  bar: (() => {
    const sub = getSubscriptionPrices('bar')
    return {
      template: 'bar',
      complexidade: 2,
      selfService: createPlanPricing(247, 297, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(597, 717, sub.fpvcMonthly, sub.fpvcAnnual),
    }
  })(),
  pizzaria: (() => {
    const sub = getSubscriptionPrices('pizzaria')
    return {
      template: 'pizzaria',
      complexidade: 3,
      selfService: createPlanPricing(297, 357, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(697, 837, sub.fpvcMonthly, sub.fpvcAnnual),
    }
  })(),
  sushi: (() => {
    const sub = getSubscriptionPrices('sushi')
    return {
      template: 'sushi',
      complexidade: 3,
      selfService: createPlanPricing(297, 357, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(697, 837, sub.fpvcMonthly, sub.fpvcAnnual),
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
