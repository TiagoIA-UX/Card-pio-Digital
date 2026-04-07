import type { TemplateSampleProduct } from '@/lib/domains/marketing/templates-config'
import { getCategoryFallbackImage, getProductFallbackImage } from '@/lib/domains/marketing/templates-config'
import { TEMPLATE_PRODUCT_IMAGE_URLS } from '@/lib/domains/image/generated-template-product-images'

type GeneratedImageIndex = Record<string, string>
export type TemplateProductImageSource =
  | 'generated-map'
  | 'product-image'
  | 'product-fallback'
  | 'category-fallback'
  | 'template-fallback'

const LEGACY_TEMPLATE_CATEGORY_ALIASES: Record<string, Record<string, string[]>> = {
  minimercado: {
    bebidas: ['bebidas'],
    'bebidas-extras': ['bebidas'],
    'bebidas-quentes': ['bebidas', 'matinais-cereais'],
    'cervejas-destilados': ['cervejas-destilados'],
    congelados: ['congelados'],
    'congelados-extras': ['congelados'],
    'higiene-pessoal': ['higiene-pessoal'],
    hortifruti: ['hortifruti-basico'],
    'kits-combos': ['combos-kits'],
    'kits-suplementares': ['combos-kits'],
    'laticinios-frios': ['laticinios-frios'],
    limpeza: ['limpeza'],
    mercearia: ['mercearia'],
    'mercearia-suplementar': ['mercearia'],
    'molhos-especiais': ['temperos-molhos', 'mercearia'],
    'padaria-matinal': ['padaria-biscoitos', 'matinais-cereais'],
    'snacks-doces': ['snacks-guloseimas'],
    'snacks-extras': ['snacks-guloseimas'],
    utilidades: ['utilidades'],
  },
}

const LEGACY_TEMPLATE_SLUG_ALIASES: Record<string, string[]> = {
  minimercado: ['mercadinho'],
}

const TEMPLATE_PRODUCT_IMAGE_BY_NAME: GeneratedImageIndex = Object.entries(
  TEMPLATE_PRODUCT_IMAGE_URLS
).reduce<GeneratedImageIndex>((index, [key, url]) => {
  const [templateSlug, categoria, , nome] = key.split('::')
  if (!templateSlug || !categoria || !nome) return index

  index[`${templateSlug}::${categoria}::${nome}`] = url
  return index
}, {})

function normalizeKeyPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Chave estável para mapear a imagem gerada para um produto do template.
 * Use sempre nas duas pontas (gerador e consumo) para evitar divergências.
 */
export function getTemplateProductImageKey(templateSlug: string, product: TemplateSampleProduct) {
  const nome = normalizeKeyPart(product.nome)
  const categoria = normalizeKeyPart(product.categoria)
  const ordem = String(product.ordem ?? 0)
  return `${normalizeKeyPart(templateSlug)}::${categoria}::${ordem}::${nome}`
}

function getCompatibleGeneratedImageUrl(
  templateSlug: string,
  product: TemplateSampleProduct
): string | undefined {
  const normalizedTemplateSlug = normalizeKeyPart(templateSlug)
  const normalizedCategory = normalizeKeyPart(product.categoria)
  const normalizedName = normalizeKeyPart(product.nome)
  const aliasTemplates = LEGACY_TEMPLATE_SLUG_ALIASES[normalizedTemplateSlug] ?? []
  const aliasCategories =
    LEGACY_TEMPLATE_CATEGORY_ALIASES[normalizedTemplateSlug]?.[normalizedCategory] ?? [normalizedCategory]

  for (const aliasTemplate of aliasTemplates) {
    for (const aliasCategory of aliasCategories) {
      const compatibleKey = `${aliasTemplate}::${aliasCategory}::${normalizedName}`
      const compatibleUrl = TEMPLATE_PRODUCT_IMAGE_BY_NAME[compatibleKey]
      if (compatibleUrl) return compatibleUrl
    }
  }

  return undefined
}

export function resolveTemplateProductImageUrl(params: {
  templateSlug: string
  product: TemplateSampleProduct
  fallbackTemplateImageUrl: string
}): string {
  return resolveTemplateProductImage(params).url
}

export function resolveTemplateProductImage(params: {
  templateSlug: string
  product: TemplateSampleProduct
  fallbackTemplateImageUrl: string
}): { url: string; source: TemplateProductImageSource } {
  const { templateSlug, product, fallbackTemplateImageUrl } = params
  const key = getTemplateProductImageKey(templateSlug, product)
  const generatedUrl = TEMPLATE_PRODUCT_IMAGE_URLS[key] ?? getCompatibleGeneratedImageUrl(templateSlug, product)
  if (generatedUrl) {
    return {
      url: generatedUrl,
      source: 'generated-map',
    }
  }

  if (product.imagem_url) {
    return {
      url: product.imagem_url,
      source: 'product-image',
    }
  }

  const productFallbackUrl = getProductFallbackImage(product.nome, product.categoria)
  if (productFallbackUrl) {
    return {
      url: productFallbackUrl,
      source: 'product-fallback',
    }
  }

  const categoryFallbackUrl = getCategoryFallbackImage(product.categoria)
  if (categoryFallbackUrl) {
    return {
      url: categoryFallbackUrl,
      source: 'category-fallback',
    }
  }

  return {
    url: fallbackTemplateImageUrl,
    source: 'template-fallback',
  }
}

