// =====================================================
// TIPOS — Cupons por Restaurante
// Corresponde à tabela restaurant_coupons (migration 038)
// =====================================================

import type { UUID, Timestamp } from './database'

export type DiscountType = 'percentage' | 'fixed'

export interface RestaurantCoupon {
  id: UUID
  restaurant_id: UUID
  code: string
  description: string | null
  discount_type: DiscountType
  discount_value: number
  min_purchase: number
  max_uses: number | null
  current_uses: number
  expires_at: Timestamp | null
  is_active: boolean
  created_at: Timestamp
  updated_at: Timestamp
}

export interface CriarCupomInput {
  code: string
  description?: string
  discount_type: DiscountType
  discount_value: number
  min_purchase?: number
  max_uses?: number | null
  expires_at?: string | null
  is_active?: boolean
}

export interface AtualizarCupomInput {
  description?: string
  discount_type?: DiscountType
  discount_value?: number
  min_purchase?: number
  max_uses?: number | null
  expires_at?: string | null
  is_active?: boolean
}

export interface ValidarCupomInput {
  code: string
  restaurant_id: UUID
  valor_pedido: number
}

export interface ValidarCupomResponse {
  valido: boolean
  cupom?: Pick<RestaurantCoupon, 'id' | 'code' | 'discount_type' | 'discount_value'>
  desconto?: number
  erro?: string
}
