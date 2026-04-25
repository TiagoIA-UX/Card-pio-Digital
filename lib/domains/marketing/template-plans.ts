import type { RestaurantTemplateSlug } from '@/lib/domains/core/restaurant-customization'
import {
  PLAN_LIMITS,
  PUBLIC_SUBSCRIPTION_PRICES,
  type OnboardingPlanSlug,
  type SubscriptionPlanSlug,
} from '@/lib/domains/marketing/pricing'
import {
  TEMPLATE_PUBLIC_META,
  TEMPLATE_PUBLIC_ORDER,
} from '@/lib/domains/marketing/template-public-meta'

export interface TemplatePlan {
  id: string
  name: 'essencial' | 'operacao' | 'escala'
  displayName: string
  description: string
  maxProducts: number
  features: string[]
  priceMonthly: number
  priceAnnual: number
  recommended: boolean
  popular?: boolean
  capacitySlug: SubscriptionPlanSlug
}

export type TemplatePlans = Record<RestaurantTemplateSlug, TemplatePlan[]>

const TEMPLATE_PLAN_BLUEPRINTS: Record<
  RestaurantTemplateSlug,
  { essencial: number; operacao: number; escala: number }
> = {
  lanchonete: { essencial: 15, operacao: 35, escala: 60 },
  acai: { essencial: 12, operacao: 25, escala: 45 },
  restaurante: { essencial: 20, operacao: 40, escala: 80 },
  cafeteria: { essencial: 15, operacao: 35, escala: 60 },
  bar: { essencial: 20, operacao: 40, escala: 80 },
  pizzaria: { essencial: 18, operacao: 30, escala: 60 },
  sushi: { essencial: 25, operacao: 50, escala: 100 },
  adega: { essencial: 35, operacao: 80, escala: 160 },
  mercadinho: { essencial: 30, operacao: 70, escala: 140 },
  minimercado: { essencial: 80, operacao: 200, escala: 600 },
  padaria: { essencial: 20, operacao: 45, escala: 90 },
  sorveteria: { essencial: 15, operacao: 30, escala: 60 },
  acougue: { essencial: 20, operacao: 45, escala: 90 },
  hortifruti: { essencial: 25, operacao: 60, escala: 120 },
  petshop: { essencial: 25, operacao: 50, escala: 100 },
  doceria: { essencial: 15, operacao: 30, escala: 60 },
}

const TIER_SLUG_MAP: Record<TemplatePlan['name'], SubscriptionPlanSlug> = {
  essencial: 'semente',
  operacao: 'basico',
  escala: 'pro',
}

// Mapeamento posicional: essencial→semente, operacao→basico, escala→pro.
// Exceção: escala com blueprint acima do limite pro (ex: minimercado 600 produtos) → premium.
function resolveCapacitySlug(
  name: TemplatePlan['name'],
  maxProducts: number
): SubscriptionPlanSlug {
  if (name === 'escala' && maxProducts > PLAN_LIMITS.pro.maxProducts) return 'premium'
  return TIER_SLUG_MAP[name]
}

function buildPlan(
  templateSlug: RestaurantTemplateSlug,
  name: TemplatePlan['name'],
  maxProducts: number
): TemplatePlan {
  const meta = TEMPLATE_PUBLIC_META[templateSlug]
  const capacitySlug = resolveCapacitySlug(name, maxProducts)
  const planMaxProducts = PLAN_LIMITS[capacitySlug].maxProducts
  const priceMonthly = PUBLIC_SUBSCRIPTION_PRICES[capacitySlug].monthly
  const priceAnnual = PUBLIC_SUBSCRIPTION_PRICES[capacitySlug].annual

  const planLabels: Record<TemplatePlan['name'], { displayName: string; description: string }> = {
    essencial: {
      displayName: 'Impulso',
      description: `Para validar ${meta.shortName.toLowerCase()} com o mix principal.`,
    },
    operacao: {
      displayName: 'Operação',
      description: `Para rodar o dia a dia com variedade saudável e catálogo estável.`,
    },
    escala: {
      displayName: 'Escala',
      description: `Para ampliar mix, sazonalidade, kits e categorias sem travar a leitura.`,
    },
  }

  return {
    id: `${templateSlug}-${name}`,
    name,
    displayName: planLabels[name].displayName,
    description: planLabels[name].description,
    maxProducts: planMaxProducts,
    features: [
      `Até ${planMaxProducts} produtos no catálogo`,
      meta.productProfile,
      `Faixa pública alinhada ao plano ${PLAN_LIMITS[capacitySlug].label}`,
      'Troca de fotos, preços e categorias no painel',
    ],
    priceMonthly,
    priceAnnual,
    recommended: name === 'operacao',
    popular: name === 'operacao',
    capacitySlug,
  }
}

export const TEMPLATE_PLANS: TemplatePlans = TEMPLATE_PUBLIC_ORDER.reduce((acc, templateSlug) => {
  const blueprint = TEMPLATE_PLAN_BLUEPRINTS[templateSlug]
  acc[templateSlug] = [
    buildPlan(templateSlug, 'essencial', blueprint.essencial),
    buildPlan(templateSlug, 'operacao', blueprint.operacao),
    buildPlan(templateSlug, 'escala', blueprint.escala),
  ]
  return acc
}, {} as TemplatePlans)

export function getTemplatePlans(templateSlug: string): TemplatePlan[] {
  return TEMPLATE_PLANS[templateSlug as RestaurantTemplateSlug] || []
}

export function getPlanById(templateSlug: string, planId: string): TemplatePlan | undefined {
  return getTemplatePlans(templateSlug).find((plan) => plan.id === planId)
}

export function getRecommendedPlan(templateSlug: string): TemplatePlan | undefined {
  return getTemplatePlans(templateSlug).find((plan) => plan.recommended)
}

export function getPopularPlan(templateSlug: string): TemplatePlan | undefined {
  return getTemplatePlans(templateSlug).find((plan) => plan.popular)
}

export function getEntryPlan(templateSlug: string): TemplatePlan | undefined {
  return getTemplatePlans(templateSlug)[0]
}

export function getTemplatePlanCheckoutHref(
  templateSlug: string,
  planName: TemplatePlan['name'],
  onboardingPlan: OnboardingPlanSlug = 'self-service'
): string {
  const selectedPlan = getTemplatePlans(templateSlug).find((plan) => plan.name === planName)
  if (!selectedPlan) {
    throw new Error(`Plano "${planName}" não encontrado para template "${templateSlug}"`)
  }
  return `/comprar/${templateSlug}?plano=${onboardingPlan}&capacidade=${selectedPlan.capacitySlug}`
}

export const PLAN_METRICS = {
  totalTemplates: Object.keys(TEMPLATE_PLANS).length,
  totalPlans: Object.values(TEMPLATE_PLANS).reduce((sum, plans) => sum + plans.length, 0),
  avgProductsEssential: Math.round(
    Object.values(TEMPLATE_PLANS)
      .map((plans) => plans.find((p) => p.name === 'essencial')?.maxProducts || 0)
      .reduce((sum, count, _, arr) => sum + count / arr.length, 0)
  ),
  avgProductsOperation: Math.round(
    Object.values(TEMPLATE_PLANS)
      .map((plans) => plans.find((p) => p.name === 'operacao')?.maxProducts || 0)
      .reduce((sum, count, _, arr) => sum + count / arr.length, 0)
  ),
  avgProductsScale: Math.round(
    Object.values(TEMPLATE_PLANS)
      .map((plans) => plans.find((p) => p.name === 'escala')?.maxProducts || 0)
      .reduce((sum, count, _, arr) => sum + count / arr.length, 0)
  ),
} as const

