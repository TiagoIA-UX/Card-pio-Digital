// Types para Checkout

import { CartItem, AppliedCoupon } from './cart'

export interface CheckoutSession {
  id: string
  userId?: string
  email: string
  items: CartItem[]
  subtotal: number
  discount: number
  total: number
  coupon?: AppliedCoupon
  paymentMethod: PaymentMethod
  status: CheckoutStatus
  createdAt: string
  expiresAt: string
}

export type PaymentMethod = 'pix' | 'card' | 'boleto'

export type CheckoutStatus = 
  | 'pending'
  | 'awaiting_payment'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'refunded'

export interface CheckoutFormData {
  email: string
  name?: string
  phone?: string
  paymentMethod: PaymentMethod
  couponCode?: string
  acceptTerms: boolean
}

export interface Order {
  id: string
  orderNumber: string
  userId: string
  status: OrderStatus
  subtotal: number
  discount: number
  total: number
  couponId?: string
  paymentMethod: PaymentMethod
  paymentId?: string
  paymentStatus: PaymentStatus
  items: OrderItem[]
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  templateId: string
  templateName: string
  price: number
  quantity: number
}

export type OrderStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'refunded'

export type PaymentStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'in_process'

export interface Coupon {
  id: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minPurchase: number
  maxUses?: number
  currentUses: number
  expiresAt?: string
  isActive: boolean
}

export interface ValidateCouponResponse {
  valid: boolean
  coupon?: AppliedCoupon
  error?: string
}
