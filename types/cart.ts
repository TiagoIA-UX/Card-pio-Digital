// Types para Carrinho

import { Template } from './template'

export interface CartItem {
  id: string
  templateId: string
  template: Pick<Template, 'id' | 'slug' | 'name' | 'price' | 'originalPrice' | 'imageUrl'>
  quantity: number
  addedAt: string
}

export interface Cart {
  items: CartItem[]
  subtotal: number
  discount: number
  total: number
  coupon?: AppliedCoupon
  itemCount: number
}

export interface AppliedCoupon {
  id: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
}

export interface CartState extends Cart {
  isOpen: boolean
  isLoading: boolean
  isSyncing: boolean
}

export interface CartActions {
  addItem: (template: CartItem['template']) => void
  removeItem: (templateId: string) => void
  updateQuantity: (templateId: string, quantity: number) => void
  clearCart: () => void
  applyCoupon: (code: string) => Promise<boolean>
  removeCoupon: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  syncWithServer: (userId: string) => Promise<void>
  loadFromServer: (userId: string) => Promise<void>
}

export type CartStore = CartState & CartActions
