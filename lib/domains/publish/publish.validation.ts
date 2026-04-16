import {
  buildCardapioViewModel,
  type CardapioProduct,
  type CardapioRestaurant,
} from '@/lib/domains/core/cardapio-renderer'

export interface DeliveryPublicationPayload {
  restaurant: CardapioRestaurant
  products: CardapioProduct[]
}

export interface PublicationValidationResult {
  success: boolean
  errors: string[]
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCardapioRestaurant(value: unknown): value is CardapioRestaurant {
  if (!isPlainObject(value)) return false

  return (
    typeof value.id === 'string' &&
    typeof value.user_id === 'string' &&
    typeof value.nome === 'string' &&
    typeof value.slug === 'string' &&
    typeof value.cor_primaria === 'string' &&
    typeof value.cor_secundaria === 'string' &&
    typeof value.ativo === 'boolean'
  )
}

function isCardapioProduct(value: unknown): value is CardapioProduct {
  if (!isPlainObject(value)) return false

  return (
    typeof value.id === 'string' &&
    typeof value.restaurant_id === 'string' &&
    typeof value.nome === 'string' &&
    typeof value.preco === 'number' &&
    Number.isFinite(value.preco) &&
    typeof value.categoria === 'string' &&
    typeof value.ativo === 'boolean' &&
    typeof value.ordem === 'number'
  )
}

export function validatePublicationPayload(payload: unknown): PublicationValidationResult {
  const errors: string[] = []

  if (!isPlainObject(payload)) {
    return { success: false, errors: ['Payload de publicação inválido.'] }
  }

  const restaurant = payload.restaurant
  const products = payload.products

  if (!isCardapioRestaurant(restaurant)) {
    errors.push('Restaurant inválido no payload.')
  }

  if (!Array.isArray(products) || products.length === 0) {
    errors.push('O payload precisa conter produtos.')
  }

  const activeProducts = Array.isArray(products)
    ? products.filter(
        (product): product is CardapioProduct => isCardapioProduct(product) && product.ativo
      )
    : []

  if (Array.isArray(products)) {
    for (const product of products) {
      if (!isCardapioProduct(product)) {
        errors.push('Existe produto inválido no payload.')
        continue
      }

      if (!product.nome.trim()) {
        errors.push(`Produto ${product.id} sem nome válido.`)
      }

      if (!Number.isFinite(product.preco) || product.preco < 0) {
        errors.push(`Produto ${product.id} com preço inválido.`)
      }
    }
  }

  if (activeProducts.length === 0) {
    errors.push('É necessário ter pelo menos um produto ativo para publicar.')
  }

  if (errors.length > 0 || !isCardapioRestaurant(restaurant)) {
    return { success: false, errors }
  }

  try {
    buildCardapioViewModel(restaurant, activeProducts)
  } catch (error) {
    errors.push(
      error instanceof Error
        ? `Falha ao renderizar preview final: ${error.message}`
        : 'Falha ao renderizar preview final.'
    )
  }

  return {
    success: errors.length === 0,
    errors,
  }
}
