import {
  buildRestaurantCustomizationSeed,
  getRestaurantPresentation,
  normalizeTemplateSlug,
  parseRestaurantCustomization,
} from '@/lib/restaurant-customization'
import { getRestaurantTemplateConfig } from '@/lib/templates-config'

export interface CardapioRestaurant {
  id: string
  user_id: string
  nome: string
  slug: string
  telefone: string | null
  logo_url: string | null
  banner_url: string | null
  slogan: string | null
  cor_primaria: string
  cor_secundaria: string
  template_slug?: string | null
  google_maps_url?: string | null
  endereco_texto?: string | null
  customizacao?: Record<string, unknown> | null
  ativo: boolean
}

export interface CardapioProduct {
  id: string
  restaurant_id: string
  nome: string
  descricao: string | null
  preco: number
  imagem_url: string | null
  categoria: string
  ativo: boolean
  ordem: number
}

export interface CardapioViewModel {
  restaurant: CardapioRestaurant
  products: CardapioProduct[]
  activeProducts: CardapioProduct[]
  categories: string[]
  productsByCategory: Record<string, CardapioProduct[]>
  templateSlug: string
  customizationSeed: ReturnType<typeof buildRestaurantCustomizationSeed>
  customization: ReturnType<typeof parseRestaurantCustomization>
  presentation: ReturnType<typeof getRestaurantPresentation>
  sectionVisibility: ReturnType<typeof getRestaurantPresentation>['sectionVisibility']
  branding: {
    logoUrl: string | null
    bannerUrl: string | null
    primaryColor: string
    secondaryColor: string
  }
}

export function buildTemplatePreviewProducts(
  templateValue: string | null | undefined,
  restaurantId: string
): CardapioProduct[] {
  const template = getRestaurantTemplateConfig(templateValue)

  return template.sampleProducts.map((product, index) => ({
    id: `preview-${template.slug}-${index + 1}`,
    restaurant_id: restaurantId,
    nome: product.nome,
    descricao: product.descricao,
    preco: product.preco,
    imagem_url: product.imagem_url || template.imageUrl,
    categoria: product.categoria,
    ativo: true,
    ordem: product.ordem,
  }))
}

export function resolveCardapioProductsForPreview(
  restaurant: CardapioRestaurant,
  products: CardapioProduct[]
): CardapioProduct[] {
  return products.length > 0
    ? products
    : buildTemplatePreviewProducts(restaurant.template_slug, restaurant.id)
}

/**
 * Mescla produtos do template com os salvos no banco.
 * Mantém o template completo: produtos salvos substituem os do template na mesma posição.
 */
export function mergeTemplateProductsWithSaved(
  restaurant: CardapioRestaurant,
  savedProducts: CardapioProduct[],
  savedTemplateMapping: Record<string, string>
): CardapioProduct[] {
  const templateProducts = buildTemplatePreviewProducts(restaurant.template_slug, restaurant.id)
  return templateProducts.map((tp) => {
    const savedId = savedTemplateMapping[tp.id]
    if (savedId) {
      const saved = savedProducts.find((p) => p.id === savedId)
      if (saved) return saved
    }
    return tp
  })
}

export function buildCardapioViewModel(
  restaurant: CardapioRestaurant,
  products: CardapioProduct[]
): CardapioViewModel {
  const templateSlug = normalizeTemplateSlug(restaurant.template_slug)
  const customizationSeed = buildRestaurantCustomizationSeed(templateSlug, restaurant.nome)
  const customization = parseRestaurantCustomization(restaurant.customizacao)
  const presentation = getRestaurantPresentation({
    nome: restaurant.nome,
    template_slug: templateSlug,
    customizacao: customization,
  })

  const activeProducts = products.filter((product) => product.ativo)
  const productCategories = [...new Set(activeProducts.map((product) => product.categoria).filter(Boolean))]
  const customCategories = (customization as { customCategories?: string[] }).customCategories
  const categories =
    customCategories && customCategories.length > 0
      ? [...customCategories, ...productCategories.filter((c) => !customCategories.includes(c))]
      : [...productCategories].sort()
  const productsByCategory = categories.reduce(
    (accumulator, category) => {
      accumulator[category] = activeProducts.filter((product) => product.categoria === category)
      return accumulator
    },
    {} as Record<string, CardapioProduct[]>
  )

  return {
    restaurant,
    products,
    activeProducts,
    categories,
    productsByCategory,
    templateSlug,
    customizationSeed,
    customization,
    presentation,
    sectionVisibility: presentation.sectionVisibility,
    branding: {
      logoUrl: restaurant.logo_url,
      bannerUrl: restaurant.banner_url,
      primaryColor: restaurant.cor_primaria,
      secondaryColor: restaurant.cor_secundaria,
    },
  }
}
