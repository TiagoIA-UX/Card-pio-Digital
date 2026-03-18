import {
  buildRestaurantCustomizationSeed,
  normalizeTemplateSlug,
  type RestaurantTemplateSlug,
} from '@/lib/restaurant-customization'
import { getRestaurantTemplateConfig } from '@/lib/templates-config'
import { getTemplatePrice, getTemplatePricing } from '@/lib/pricing'

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

/** Configuração de planos (nomes e slugs). Preços vêm de lib/pricing por template. */
export const ONBOARDING_PLAN_CONFIG: Record<
  OnboardingPlanSlug,
  {
    slug: OnboardingPlanSlug
    name: string
    subscriptionPlanSlug: 'basico' | 'pro'
    installments: number
  }
> = {
  'self-service': {
    slug: 'self-service',
    name: 'Faça Você Mesmo',
    subscriptionPlanSlug: 'basico',
    installments: 12,
  },
  'feito-pra-voce': {
    slug: 'feito-pra-voce',
    name: 'Feito Pra Você',
    subscriptionPlanSlug: 'pro',
    installments: 12,
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

/** Preço fixo (fallback quando não há template). Usar getOnboardingPriceByTemplate quando possível. */
export function getOnboardingPrice(
  planSlug: OnboardingPlanSlug,
  paymentMethod: OnboardingPaymentMethod
) {
  return getOnboardingPriceByTemplate('restaurante', planSlug, paymentMethod)
}

/** Preço por template e plano (usa lib/pricing). */
export function getOnboardingPriceByTemplate(
  templateSlug: RestaurantTemplateSlug,
  planSlug: OnboardingPlanSlug,
  paymentMethod: OnboardingPaymentMethod
) {
  return getTemplatePrice(templateSlug, planSlug, paymentMethod)
}

/** Parcelas e valores por template (para exibição). */
export function getOnboardingPricingByTemplate(templateSlug: RestaurantTemplateSlug) {
  return getTemplatePricing(templateSlug)
}

/**
 * Monta a instalação completa do template escolhido na landing page.
 * O restaurante recebe banner, cores, customização e produtos de exemplo
 * exatamente como aparecem na prévia do template.
 */
export function buildRestaurantInstallation(templateValue: string, restaurantName: string) {
  const templateSlug = normalizeTemplateSlug(templateValue)
  const templateConfig = getRestaurantTemplateConfig(templateSlug)

  const sampleProducts = templateConfig.sampleProducts.map((product) => ({
    ...product,
    imagem_url: product.imagem_url ?? templateConfig.imageUrl,
  }))

  return {
    templateSlug,
    restaurantUpdate: {
      template_slug: templateSlug,
      slogan: templateConfig.slogan,
      banner_url: templateConfig.imageUrl,
      cor_primaria: templateConfig.cor_primaria,
      cor_secundaria: templateConfig.cor_secundaria,
      customizacao: buildRestaurantCustomizationSeed(templateSlug, restaurantName),
    },
    sampleProducts,
  }
}
