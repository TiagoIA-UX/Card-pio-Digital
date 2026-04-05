import type { TemplateSampleProduct } from '@/lib/domains/marketing/templates-config'
import { getCategoryFallbackImage } from '@/lib/domains/marketing/templates-config'
import { TEMPLATE_PRODUCT_IMAGE_URLS } from '@/lib/domains/image/generated-template-product-images'

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

export function resolveTemplateProductImageUrl(params: {
  templateSlug: string
  product: TemplateSampleProduct
  fallbackTemplateImageUrl: string
}): string {
  const { templateSlug, product, fallbackTemplateImageUrl } = params
  const key = getTemplateProductImageKey(templateSlug, product)
  const generatedUrl = TEMPLATE_PRODUCT_IMAGE_URLS[key]
  if (generatedUrl) return generatedUrl

  return (
    product.imagem_url ??
    getCategoryFallbackImage(product.categoria) ??
    // Último fallback: imagem do template (banner)
    fallbackTemplateImageUrl
  )
}

