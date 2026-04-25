/**
 * PLAN_REGISTRY — Fonte única de verdade para planos de assinatura.
 *
 * Todo preço, limite e label de plano no sistema DEVE derivar deste registro.
 * Nenhum outro arquivo deve definir esses valores diretamente.
 *
 * Slugs: semente | basico | pro | premium
 * Esses slugs aparecem em URLs de checkout, banco de dados e API.
 * NÃO renomear sem migração completa de banco + URLs.
 */

export interface PlanDefinition {
  readonly slug: string
  readonly label: string
  readonly maxProducts: number
  readonly priceMonthly: number
  readonly priceAnnual: number
  readonly maxOrdersPerMonth?: number
  readonly activationFeePix?: number
  readonly activationFeeCard?: number
}

export const PLAN_REGISTRY = {
  semente: {
    slug: 'semente',
    label: 'Começo',
    maxProducts: 15,
    priceMonthly: 14.9,
    priceAnnual: 149.9,
    maxOrdersPerMonth: 60,
    activationFeePix: 19.9,
    activationFeeCard: 24.9,
  },
  basico: {
    slug: 'basico',
    label: 'Básico',
    maxProducts: 60,
    priceMonthly: 147,
    priceAnnual: 1470,
  },
  pro: {
    slug: 'pro',
    label: 'Profissional',
    maxProducts: 200,
    priceMonthly: 197,
    priceAnnual: 1970,
  },
  premium: {
    slug: 'premium',
    label: 'Premium',
    maxProducts: 1200,
    priceMonthly: 297,
    priceAnnual: 2970,
  },
} as const satisfies Record<string, PlanDefinition>

export type PlanSlug = keyof typeof PLAN_REGISTRY

export const PLAN_SLUGS = Object.keys(PLAN_REGISTRY) as PlanSlug[]

/** Busca plano por slug. Falha explicitamente se slug inválido (zero fallback). */
export function getPlanOrThrow(slug: string): (typeof PLAN_REGISTRY)[PlanSlug] {
  const plan = PLAN_REGISTRY[slug as PlanSlug]
  if (!plan) {
    throw new Error(`Plano desconhecido: "${slug}". Slugs válidos: ${PLAN_SLUGS.join(', ')}`)
  }
  return plan
}

