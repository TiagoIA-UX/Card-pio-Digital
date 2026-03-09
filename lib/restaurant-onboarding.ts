import {
  buildRestaurantCustomizationSeed,
  normalizeTemplateSlug,
  type RestaurantTemplateSlug,
} from '@/lib/restaurant-customization'
import { getRestaurantTemplateConfig } from '@/lib/templates-config'

export type OnboardingPlanSlug = 'self-service' | 'feito-pra-voce'
export type OnboardingPaymentMethod = 'pix' | 'card'

export interface TemplateSampleProduct {
  nome: string
  descricao: string
  preco: number
  categoria: string
  ordem: number
  imagem_url?: string
}

export const ONBOARDING_PLAN_CONFIG: Record<
  OnboardingPlanSlug,
  {
    slug: OnboardingPlanSlug
    name: string
    subscriptionPlanSlug: 'basico' | 'pro'
    prices: Record<OnboardingPaymentMethod, number>
    installments: number
  }
> = {
  'self-service': {
    slug: 'self-service',
    name: 'Faça Você Mesmo',
    subscriptionPlanSlug: 'basico',
    prices: {
      pix: 247,
      card: 297,
    },
    installments: 3,
  },
  'feito-pra-voce': {
    slug: 'feito-pra-voce',
    name: 'Feito Pra Você',
    subscriptionPlanSlug: 'pro',
    prices: {
      pix: 497,
      card: 597,
    },
    installments: 3,
  },
}

export function slugifyRestaurantName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

export function normalizePhone(value: string) {
  return value.replace(/\D/g, '')
}

export function getOnboardingPrice(
  planSlug: OnboardingPlanSlug,
  paymentMethod: OnboardingPaymentMethod
) {
  return ONBOARDING_PLAN_CONFIG[planSlug].prices[paymentMethod]
}

export function buildRestaurantInstallation(templateValue: string, restaurantName: string) {
  const templateSlug = normalizeTemplateSlug(templateValue)
  const templateConfig = getRestaurantTemplateConfig(templateSlug)

  return {
    templateSlug,
    restaurantUpdate: {
      template_slug: templateSlug,
      slogan: templateConfig.slogan,
      cor_primaria: templateConfig.cor_primaria,
      cor_secundaria: templateConfig.cor_secundaria,
      customizacao: buildRestaurantCustomizationSeed(templateSlug, restaurantName),
    },
    sampleProducts: templateConfig.sampleProducts,
  }
}
