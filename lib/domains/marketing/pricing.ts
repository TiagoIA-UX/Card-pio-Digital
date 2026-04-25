import type { RestaurantTemplateSlug } from '@/lib/domains/core/restaurant-customization'
import { PLAN_REGISTRY } from '@/lib/domains/core/plan-registry'

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
  /** Quantidade média de produtos que esse tipo de negócio costuma listar no catálogo digital (não o estoque físico) */
  mediaProdutos: string
  /** Faixa legível baseada em volume de produtos */
  faixaLabel: string /**
   * Limite de produtos incluídos na implantação do plano "Feito Pra Você".
   * Acima disso, cada produto adicional é cobrado separadamente.
   * Cálculo: ~12 min/produto (fotos fornecidas pelo cliente) × margem operacional.
   */
  maxSetupProducts: number /** Nome do canal digital adequado ao nicho (canal, catálogo, loja, vitrine, encarte) */
  nomeCanal: string
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
 * Derivado de PLAN_REGISTRY — não definir preços diretamente aqui.
 */
export const PUBLIC_SUBSCRIPTION_PRICES = {
  semente: {
    monthly: PLAN_REGISTRY.semente.priceMonthly,
    annual: PLAN_REGISTRY.semente.priceAnnual,
  },
  basico: { monthly: PLAN_REGISTRY.basico.priceMonthly, annual: PLAN_REGISTRY.basico.priceAnnual },
  pro: { monthly: PLAN_REGISTRY.pro.priceMonthly, annual: PLAN_REGISTRY.pro.priceAnnual },
  premium: {
    monthly: PLAN_REGISTRY.premium.priceMonthly,
    annual: PLAN_REGISTRY.premium.priceAnnual,
  },
} as const

/** Limites de cada plano — derivado de PLAN_REGISTRY. */
export const PLAN_LIMITS = {
  semente: {
    maxProducts: PLAN_REGISTRY.semente.maxProducts,
    maxOrdersPerMonth: PLAN_REGISTRY.semente.maxOrdersPerMonth,
    activationFeePix: PLAN_REGISTRY.semente.activationFeePix,
    activationFeeCard: PLAN_REGISTRY.semente.activationFeeCard,
    label: PLAN_REGISTRY.semente.label,
  },
  basico: { maxProducts: PLAN_REGISTRY.basico.maxProducts, label: PLAN_REGISTRY.basico.label },
  pro: { maxProducts: PLAN_REGISTRY.pro.maxProducts, label: PLAN_REGISTRY.pro.label },
  premium: { maxProducts: PLAN_REGISTRY.premium.maxProducts, label: PLAN_REGISTRY.premium.label },
} as const

export const NETWORK_EXPANSION_UNIT_OPTIONS = [3, 5, 10, 20] as const

export function formatNetworkExpansionLabel(units: number) {
  return units === 1 ? '1 unidade extra' : `${units} unidades extras`
}

export type SubscriptionPlanSlug = keyof typeof PLAN_LIMITS

export function getMaxProducts(planSlug: string): number {
  const plan = PLAN_LIMITS[planSlug as SubscriptionPlanSlug]
  if (!plan) throw new Error(`getMaxProducts: plano desconhecido "${planSlug}"`)
  return plan.maxProducts
}

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
 * Mensal/Anual representam a continuidade do plano do canal digital após a ativação.
 */
export const TEMPLATE_PRICING: Record<RestaurantTemplateSlug, TemplatePricing> = {
  lanchonete: (() => {
    const sub = getSubscriptionPrices('lanchonete')
    return {
      template: 'lanchonete' as const,
      complexidade: 1 as const,
      mediaProdutos: '15 a 35',
      faixaLabel: 'Até 40 produtos',
      maxSetupProducts: 30,
      nomeCanal: 'Canal digital',
      selfService: createPlanPricing(197, 237, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(497, 597, sub.fpvcMonthly, sub.fpvcAnnual),
    }
  })(),
  acai: (() => {
    const sub = getSubscriptionPrices('acai')
    return {
      template: 'acai' as const,
      complexidade: 1 as const,
      mediaProdutos: '10 a 25',
      faixaLabel: 'Até 40 produtos',
      maxSetupProducts: 25,
      nomeCanal: 'Canal digital',
      selfService: createPlanPricing(197, 237, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(497, 597, sub.fpvcMonthly, sub.fpvcAnnual),
    }
  })(),
  restaurante: (() => {
    const sub = getSubscriptionPrices('restaurante')
    return {
      template: 'restaurante' as const,
      complexidade: 2 as const,
      mediaProdutos: '30 a 60',
      faixaLabel: 'Até 80 produtos',
      maxSetupProducts: 40,
      nomeCanal: 'Canal digital',
      selfService: createPlanPricing(247, 297, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(597, 717, sub.fpvcMonthly, sub.fpvcAnnual),
    }
  })(),
  cafeteria: (() => {
    const sub = getSubscriptionPrices('cafeteria')
    return {
      template: 'cafeteria' as const,
      complexidade: 2 as const,
      mediaProdutos: '25 a 45',
      faixaLabel: 'Até 80 produtos',
      maxSetupProducts: 40,
      nomeCanal: 'Canal digital',
      selfService: createPlanPricing(247, 297, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(597, 717, sub.fpvcMonthly, sub.fpvcAnnual),
    }
  })(),
  bar: (() => {
    const sub = getSubscriptionPrices('bar')
    return {
      template: 'bar' as const,
      complexidade: 2 as const,
      mediaProdutos: '30 a 50',
      faixaLabel: 'Até 80 produtos',
      maxSetupProducts: 40,
      nomeCanal: 'Canal digital',
      selfService: createPlanPricing(247, 297, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(597, 717, sub.fpvcMonthly, sub.fpvcAnnual),
    }
  })(),
  pizzaria: (() => {
    const sub = getSubscriptionPrices('pizzaria')
    return {
      template: 'pizzaria' as const,
      complexidade: 3 as const,
      mediaProdutos: '40 a 80',
      faixaLabel: 'Até 120 produtos',
      maxSetupProducts: 50,
      nomeCanal: 'Canal digital',
      selfService: createPlanPricing(297, 357, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(697, 837, sub.fpvcMonthly, sub.fpvcAnnual),
    }
  })(),
  sushi: (() => {
    const sub = getSubscriptionPrices('sushi')
    return {
      template: 'sushi' as const,
      complexidade: 3 as const,
      mediaProdutos: '50 a 100',
      faixaLabel: 'Até 120 produtos',
      maxSetupProducts: 50,
      nomeCanal: 'Canal digital',
      selfService: createPlanPricing(297, 357, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(697, 837, sub.fpvcMonthly, sub.fpvcAnnual),
    }
  })(),
  adega: (() => {
    const sub = getSubscriptionPrices('adega')
    return {
      template: 'adega' as const,
      complexidade: 2 as const,
      mediaProdutos: '40 a 80',
      faixaLabel: 'Até 80 produtos',
      maxSetupProducts: 40,
      nomeCanal: 'Catálogo digital',
      selfService: createPlanPricing(247, 297, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(597, 717, sub.fpvcMonthly, sub.fpvcAnnual),
    }
  })(),
  mercadinho: (() => {
    const sub = getSubscriptionPrices('mercadinho')
    return {
      template: 'mercadinho' as const,
      complexidade: 3 as const,
      mediaProdutos: '50 a 150',
      faixaLabel: 'Catálogo essencial',
      maxSetupProducts: 30,
      nomeCanal: 'Catálogo digital',
      selfService: createPlanPricing(347, 417, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(897, 1077, sub.fpvcMonthly, sub.fpvcAnnual),
    }
  })(),
  minimercado: (() => {
    const sub = getSubscriptionPrices('minimercado')
    return {
      template: 'minimercado' as const,
      complexidade: 3 as const,
      mediaProdutos: '400 a 1200',
      faixaLabel: 'Mega catálogo com entrega rápida',
      maxSetupProducts: 100,
      nomeCanal: 'Catálogo digital',
      selfService: createPlanPricing(497, 597, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(1297, 1557, sub.fpvcMonthly, sub.fpvcAnnual),
    }
  })(),
  padaria: (() => {
    const sub = getSubscriptionPrices('padaria')
    return {
      template: 'padaria' as const,
      complexidade: 2 as const,
      mediaProdutos: '35 a 60',
      faixaLabel: 'Até 80 produtos',
      maxSetupProducts: 40,
      nomeCanal: 'Vitrine digital',
      selfService: createPlanPricing(247, 297, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(597, 717, sub.fpvcMonthly, sub.fpvcAnnual),
    }
  })(),
  sorveteria: (() => {
    const sub = getSubscriptionPrices('sorveteria')
    return {
      template: 'sorveteria' as const,
      complexidade: 1 as const,
      mediaProdutos: '15 a 30',
      faixaLabel: 'Até 40 produtos',
      maxSetupProducts: 25,
      nomeCanal: 'Canal digital',
      selfService: createPlanPricing(197, 237, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(497, 597, sub.fpvcMonthly, sub.fpvcAnnual),
    }
  })(),
  acougue: (() => {
    const sub = getSubscriptionPrices('acougue')
    return {
      template: 'acougue' as const,
      complexidade: 2 as const,
      mediaProdutos: '30 a 60',
      faixaLabel: 'Até 80 produtos',
      maxSetupProducts: 40,
      nomeCanal: 'Catálogo digital',
      selfService: createPlanPricing(247, 297, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(597, 717, sub.fpvcMonthly, sub.fpvcAnnual),
    }
  })(),
  hortifruti: (() => {
    const sub = getSubscriptionPrices('hortifruti')
    return {
      template: 'hortifruti' as const,
      complexidade: 3 as const,
      mediaProdutos: '50 a 100',
      faixaLabel: 'Catálogo médio/grande',
      maxSetupProducts: 50,
      nomeCanal: 'Catálogo digital',
      selfService: createPlanPricing(297, 357, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(697, 837, sub.fpvcMonthly, sub.fpvcAnnual),
    }
  })(),
  petshop: (() => {
    const sub = getSubscriptionPrices('petshop')
    return {
      template: 'petshop' as const,
      complexidade: 3 as const,
      mediaProdutos: '40 a 80',
      faixaLabel: 'Catálogo variado',
      maxSetupProducts: 30,
      nomeCanal: 'Loja virtual pet',
      selfService: createPlanPricing(347, 417, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(897, 1077, sub.fpvcMonthly, sub.fpvcAnnual),
    }
  })(),
  doceria: (() => {
    const sub = getSubscriptionPrices('doceria')
    return {
      template: 'doceria' as const,
      complexidade: 1 as const,
      mediaProdutos: '15 a 35',
      faixaLabel: 'Até 40 produtos',
      maxSetupProducts: 25,
      nomeCanal: 'Vitrine digital',
      selfService: createPlanPricing(197, 237, sub.diyMonthly, sub.diyAnnual),
      feitoPraVoce: createPlanPricing(497, 597, sub.fpvcMonthly, sub.fpvcAnnual),
    }
  })(),
}

export function getTemplatePrice(
  templateSlug: RestaurantTemplateSlug,
  plan: OnboardingPlanSlug,
  paymentMethod: PaymentMethod
): number {
  const pricing = TEMPLATE_PRICING[templateSlug]
  if (!pricing) throw new Error(`getTemplatePrice: template sem pricing "${templateSlug}"`)
  const planPrices = plan === 'feito-pra-voce' ? pricing.feitoPraVoce : pricing.selfService
  return paymentMethod === 'pix' ? planPrices.pix : planPrices.card
}

export function getTemplatePricing(templateSlug: RestaurantTemplateSlug): TemplatePricing {
  const pricing = TEMPLATE_PRICING[templateSlug]
  if (!pricing) throw new Error(`getTemplatePricing: template sem pricing "${templateSlug}"`)
  return pricing
}

/** Percentual a mais do Feito Pra Você sobre Faça Você Mesmo (PIX) */
export function getFpvcMarkupPercent(templateSlug: RestaurantTemplateSlug): number {
  const p = TEMPLATE_PRICING[templateSlug]
  if (!p) throw new Error(`getFpvcMarkupPercent: template sem pricing "${templateSlug}"`)
  const diy = p.selfService.pix
  const fpvc = p.feitoPraVoce.pix
  return Math.round(((fpvc - diy) / diy) * 100)
}

