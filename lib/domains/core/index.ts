// ═══════════════════════════════════════════════════════════════
// DOMAIN: CORE — Cardápio, pedidos, checkout, pagamento, delivery
// ═══════════════════════════════════════════════════════════════

// ─── Restaurant & Cardápio ───────────────────────────────────
export * from './active-restaurant'
export * from './cardapio-renderer'
export * from './restaurant-customization'
export * from './restaurant-onboarding'

// ─── Delivery & Mode ─────────────────────────────────────────
export * from './delivery-mode'
export * from './delivery-assistant'
export * from './whatsapp'

// ─── Pagamento ───────────────────────────────────────────────
export * from './payment-mode'

export * from './pix'

// ─── Checkout & Onboarding ──────────────────────────────────
export * from './checkout-wizard'
export * from './onboarding-checkout'
export * from './onboarding-checkout-creation'
export * from './onboarding-provisioning'
export * from './commercial-entitlements'
export * from './setup-wizard'
export * from './panel-setup'

// ─── Validação ───────────────────────────────────────────────
export * from './coupon-validation'
export * from './tax-document'

// ─── Fiscal ──────────────────────────────────────────────────
export * from './fiscal'
export * from './fiscal-dispatch'

// ─── Rede / Multi-unidade ────────────────────────────────────
export * from './network-expansion'

// ─── Catálogo Minimercado ────────────────────────────────────
export * from './minimercado-catalog'

// ─── Contracts ───────────────────────────────────────────────
export type {
  ICardapioService,
  IPaymentService,
  IValidationService,
  IWhatsAppService,
  IOnboardingService,
  INetworkService,
} from './contracts'

// ─── Schemas (Zod) ──────────────────────────────────────────
export {
  CreateOrderSchema,
  OnboardingCheckoutSchema,
  ProvisionarSchema,
  SubscriptionWebhookSchema,
  ChatRequestSchema,
  FeedbackSchema,
  zodErrorResponse,
} from './schemas'
export type {
  CreateOrderInput,
  OnboardingCheckoutInput,
  ChatRequestInput,
  FeedbackInput,
} from './schemas'

