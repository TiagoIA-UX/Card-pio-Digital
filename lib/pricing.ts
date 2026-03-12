import type { RestaurantTemplateSlug } from '@/lib/restaurant-customization'
import { getRestaurantTemplateConfig } from '@/lib/templates-config'

export type OnboardingPlanSlug = 'self-service' | 'feito-pra-voce'
export type PaymentMethod = 'pix' | 'card'
export type BillingCycle = 'unico' | 'mensal' | 'anual'

/**
 * Estrutura de preço por template e plano.
 * Feito Pra Você inclui custo de freelancer (~R$ 250-400) + margem.
 * Markup FPVC sobre DIY: ~135-152% (cobre mão de obra e lucro).
 * Plano anual = 10 meses (2 meses grátis).
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

/** Preços mensal/anual. DIY = template; FPVC = +50% (cobre suporte e mão de obra) */
function getSubscriptionPrices(slug: RestaurantTemplateSlug) {
  const cfg = getRestaurantTemplateConfig(slug)
  const diyMonthly = cfg.priceMonthly ?? 59
  const diyAnnual = cfg.priceAnnual ?? diyMonthly * 10
  const fpvcMonthly = Math.round(diyMonthly * 1.5)
  const fpvcAnnual = Math.round(diyAnnual * 1.5)
  return { diyMonthly, diyAnnual, fpvcMonthly, fpvcAnnual }
}

/**
 * Preços por template. Valores justos para cobrir freelancer no plano Feito Pra Você.
 * DIY: plataforma + template. FPVC: DIY + mão de obra (~R$ 300-400) + margem.
 * Mensal/Anual: assinatura recorrente (anual = 2 meses grátis).
 */
export const TEMPLATE_PRICING: Record<RestaurantTemplateSlug, TemplatePricing> = {
  lanchonete: (() => {
    const sub = getSubscriptionPrices('lanchonete')
    return {
      template: 'lanchonete',
      complexidade: 1,
      selfService: { pix: 197, card: 237, parcelas: 3, monthly: sub.diyMonthly, annual: sub.diyAnnual },
      feitoPraVoce: { pix: 497, card: 597, parcelas: 3, monthly: sub.fpvcMonthly, annual: sub.fpvcAnnual },
    }
  })(),
  acai: (() => {
    const sub = getSubscriptionPrices('acai')
    return {
      template: 'acai',
      complexidade: 1,
      selfService: { pix: 197, card: 237, parcelas: 3, monthly: sub.diyMonthly, annual: sub.diyAnnual },
      feitoPraVoce: { pix: 497, card: 597, parcelas: 3, monthly: sub.fpvcMonthly, annual: sub.fpvcAnnual },
    }
  })(),
  restaurante: (() => {
    const sub = getSubscriptionPrices('restaurante')
    return {
      template: 'restaurante',
      complexidade: 2,
      selfService: { pix: 247, card: 297, parcelas: 3, monthly: sub.diyMonthly, annual: sub.diyAnnual },
      feitoPraVoce: { pix: 597, card: 717, parcelas: 3, monthly: sub.fpvcMonthly, annual: sub.fpvcAnnual },
    }
  })(),
  cafeteria: (() => {
    const sub = getSubscriptionPrices('cafeteria')
    return {
      template: 'cafeteria',
      complexidade: 2,
      selfService: { pix: 247, card: 297, parcelas: 3, monthly: sub.diyMonthly, annual: sub.diyAnnual },
      feitoPraVoce: { pix: 597, card: 717, parcelas: 3, monthly: sub.fpvcMonthly, annual: sub.fpvcAnnual },
    }
  })(),
  bar: (() => {
    const sub = getSubscriptionPrices('bar')
    return {
      template: 'bar',
      complexidade: 2,
      selfService: { pix: 247, card: 297, parcelas: 3, monthly: sub.diyMonthly, annual: sub.diyAnnual },
      feitoPraVoce: { pix: 597, card: 717, parcelas: 3, monthly: sub.fpvcMonthly, annual: sub.fpvcAnnual },
    }
  })(),
  pizzaria: (() => {
    const sub = getSubscriptionPrices('pizzaria')
    return {
      template: 'pizzaria',
      complexidade: 3,
      selfService: { pix: 297, card: 357, parcelas: 3, monthly: sub.diyMonthly, annual: sub.diyAnnual },
      feitoPraVoce: { pix: 697, card: 837, parcelas: 3, monthly: sub.fpvcMonthly, annual: sub.fpvcAnnual },
    }
  })(),
  sushi: (() => {
    const sub = getSubscriptionPrices('sushi')
    return {
      template: 'sushi',
      complexidade: 3,
      selfService: { pix: 297, card: 357, parcelas: 3, monthly: sub.diyMonthly, annual: sub.diyAnnual },
      feitoPraVoce: { pix: 697, card: 837, parcelas: 3, monthly: sub.fpvcMonthly, annual: sub.fpvcAnnual },
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
