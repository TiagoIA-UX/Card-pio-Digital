import {
  PLAN_LIMITS,
  PUBLIC_SUBSCRIPTION_PRICES,
  type SubscriptionPlanSlug,
} from '@/lib/domains/marketing/pricing'
import { getPublicPlanDisplay } from '@/lib/domains/marketing/plan-display'

export interface CatalogCapacityOption {
  slug: SubscriptionPlanSlug
  title: string
  description: string
  maxProducts: number
  monthlyPrice: number
}

export const CATALOG_CAPACITY_OPTIONS: CatalogCapacityOption[] = [
  {
    slug: 'semente',
    title: getPublicPlanDisplay('semente').name,
    description: getPublicPlanDisplay('semente').microcopy,
    maxProducts: PLAN_LIMITS.semente.maxProducts,
    monthlyPrice: PUBLIC_SUBSCRIPTION_PRICES.semente.monthly,
  },
  {
    slug: 'basico',
    title: getPublicPlanDisplay('basico').name,
    description: getPublicPlanDisplay('basico').microcopy,
    maxProducts: PLAN_LIMITS.basico.maxProducts,
    monthlyPrice: PUBLIC_SUBSCRIPTION_PRICES.basico.monthly,
  },
  {
    slug: 'pro',
    title: getPublicPlanDisplay('pro').name,
    description: getPublicPlanDisplay('pro').microcopy,
    maxProducts: PLAN_LIMITS.pro.maxProducts,
    monthlyPrice: PUBLIC_SUBSCRIPTION_PRICES.pro.monthly,
  },
  {
    slug: 'premium',
    title: getPublicPlanDisplay('premium').name,
    description: getPublicPlanDisplay('premium').microcopy,
    maxProducts: PLAN_LIMITS.premium.maxProducts,
    monthlyPrice: PUBLIC_SUBSCRIPTION_PRICES.premium.monthly,
  },
]

export function getCatalogCapacityOption(slug: SubscriptionPlanSlug): CatalogCapacityOption {
  return (
    CATALOG_CAPACITY_OPTIONS.find((option) => option.slug === slug) || CATALOG_CAPACITY_OPTIONS[1]
  )
}

