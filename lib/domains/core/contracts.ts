// ═══════════════════════════════════════════════════════════════
// CONTRACTS: CORE — API pública do domínio principal
// Cardápio, pedidos, checkout, pagamento, delivery, onboarding
// ═══════════════════════════════════════════════════════════════

// ─── Restaurant ──────────────────────────────────────────────

/** Delivery operando em qual modo */
export type DeliveryMode = 'whatsapp_only' | 'terminal_only' | 'hybrid'

/** Ambiente de pagamento */
export type PaymentEnvironment = 'sandbox' | 'production'

/** Template de delivery */
export type RestaurantTemplateSlug =
  | 'restaurante'
  | 'pizzaria'
  | 'lanchonete'
  | 'hamburgueria'
  | 'japonesa'
  | 'acaiteria'
  | 'sorveteria'
  | 'cafeteria'
  | 'marmitaria'
  | 'pastelaria'
  | 'doceria'
  | 'petshop'

/** Dados completos de restaurante para renderização */
export interface CardapioRestaurant {
  id: string
  nome: string
  slug: string
  telefone: string
  logo_url?: string
  template_slug: RestaurantTemplateSlug
  customizacao?: Record<string, unknown>
}

/** Produto do cardápio */
export interface CardapioProduct {
  id: string
  nome: string
  preco: number
  imagem_url?: string
  categoria: string
  ativo: boolean
  ordem: number
}

/** ViewModel completa do cardápio */
export interface CardapioViewModel {
  restaurant: CardapioRestaurant
  products: CardapioProduct[]
  categories: string[]
  productsByCategory: Record<string, CardapioProduct[]>
  customization?: Record<string, unknown>
}

/** Customização visual do restaurante */
export interface RestaurantCustomization {
  sections?: Record<string, unknown>
  aiAssistantSettings?: Record<string, unknown>
  [key: string]: unknown
}

// ─── Checkout & Pagamento ────────────────────────────────────

/** Input para criar checkout de delivery */
export interface DeliveryCheckoutInput {
  orderId: string
  restaurantSlug: string
  siteUrl: string
}

/** Resultado do checkout de delivery */
export interface DeliveryCheckoutResult {
  paymentId: string
  checkoutUrl: string
  sandboxCheckoutUrl?: string
  amount: number
}

/** Cupom validado */
export interface ValidatedCoupon {
  id: string
  code: string
  discountType: string
  discountValue: number
}

/** Resultado de validação de cupom */
export interface CouponValidationResult {
  valid: boolean
  coupon?: ValidatedCoupon
  error?: string
}

// ─── Onboarding ──────────────────────────────────────────────

/** Plano de onboarding */
export type OnboardingPlanSlug = 'self-service' | 'feito-pra-voce'

/** Método de pagamento no onboarding */
export type OnboardingPaymentMethod = 'card'

/** Input validado para criar checkout de onboarding */
export interface OnboardingCheckoutInput {
  templateSlug: string
  capacityPlanSlug: 'semente' | 'basico' | 'pro' | 'premium'
  onboardingPlan: OnboardingPlanSlug
  paymentMethod: OnboardingPaymentMethod
  customerData: {
    restaurantName: string
    customerName: string
    phone: string
    customerDocument?: string
  }
  couponCode?: string
  acceptedTerms: true
  acceptedTermsVersion: string
}

/** Contexto operacional do checkout onboarding */
export interface OnboardingCheckoutContext {
  ownerUserId: string
  sessionEmail: string
  siteUrl: string
  affRef?: string | null
}

/** Resultado do checkout onboarding */
export interface OnboardingCheckoutResult {
  checkout: string
  initPoint?: string | null
  sandboxInitPoint?: string | null
}

/** Decisão de provisionamento */
export type OnboardingProvisioningDecision = 'fresh-claim' | 'stale-recovery' | 'already-ready'

/** Step do wizard de checkout */
export interface CheckoutWizardStep {
  id: string
  title: string
  description: string
  status: 'complete' | 'current' | 'upcoming'
}

// ─── Fiscal ──────────────────────────────────────────────────

/** Providers fiscais suportados */
export type FiscalProvider = string

/** Tipo de documento fiscal */
export type FiscalDocumentKind = string

/** Status de dispatch fiscal */
export type FiscalDispatchStatus = 'skipped' | 'blocked' | 'dry_run' | 'submitted' | 'failed'

/** Resultado de dispatch fiscal */
export interface FiscalDispatchResult {
  status: FiscalDispatchStatus
  message?: string
  documentId?: string
}

// ─── Tax Document ────────────────────────────────────────────

/** Tipo de documento tributário */
export type TaxDocumentType = 'cpf' | 'cnpj'

// ─── PIX ─────────────────────────────────────────────────────

/** Resultado de validação PIX */
export interface PixValidationResult {
  valid: boolean
  type?: string
  normalized?: string
}

// ─── WhatsApp ────────────────────────────────────────────────

/** Item do pedido rápido via WhatsApp */
export interface QuickOrderItem {
  name: string
  quantity: number
  price: number
}

// ─── Network ─────────────────────────────────────────────────

/** Pricing de rede (multi-unidade) */
export interface NetworkPricing {
  unitPrice: number
  totalPrice: number
  discount: number
  quantity: number
}

// ─── Panel ───────────────────────────────────────────────────

/** Capacidades do painel do restaurante */
export interface PanelCapabilities {
  hasCommercialAccess: boolean
  canCreateRestaurant: boolean
  hasRestaurant: boolean
  canAccessDashboard: boolean
  canAccessVisualEditor: boolean
  canManageCatalog: boolean
  canViewOrders: boolean
  canViewPublicLink: boolean
  canManageQrCode: boolean
  [key: string]: boolean
}

// ─── Editor ──────────────────────────────────────────────────

/** Tipo de campo no editor visual */
export type EditorFieldType = 'text' | 'textarea' | 'image' | 'select' | 'toggle'

// ─── Contratos de Serviço ────────────────────────────────────

/** Contrato público — Cardápio & Renderização */
export interface ICardapioService {
  buildCardapioViewModel(restaurantSlug: string): Promise<CardapioViewModel>
  buildTemplatePreviewProducts(templateSlug: RestaurantTemplateSlug): CardapioProduct[]
}

/** Contrato público — Pagamento & Checkout */
export interface IPaymentService {
  createDeliveryCheckout(input: DeliveryCheckoutInput): Promise<DeliveryCheckoutResult>
  getPaymentEnvironment(): PaymentEnvironment
  isTerminalEnabled(mode: DeliveryMode): boolean
  isWhatsAppEnabled(mode: DeliveryMode): boolean

}

/** Contrato público — Validação */
export interface IValidationService {
  validateCoupon(code: string, restaurantId: string): Promise<CouponValidationResult>
  validatePixKey(key: string): PixValidationResult
  isValidCpf(cpf: string): boolean
  isValidCnpj(cnpj: string): boolean
  isValidTaxDocument(doc: string): boolean
  normalizeTaxDocument(doc: string): string
  detectTaxDocumentType(doc: string): TaxDocumentType | null
}

/** Contrato público — WhatsApp */
export interface IWhatsAppService {
  buildQuickOrderMessage(items: QuickOrderItem[]): string
  getQuickOrderWhatsAppUrl(phone: string, message: string): string
}

/** Contrato público — Onboarding */
export interface IOnboardingService {
  getCheckoutWizardSteps(formValues: Record<string, unknown>): CheckoutWizardStep[]
  slugifyRestaurantName(name: string): string
  getOnboardingPrice(template: RestaurantTemplateSlug, plan: OnboardingPlanSlug): number
  createOnboardingCheckout?(
    input: OnboardingCheckoutInput,
    context: OnboardingCheckoutContext
  ): Promise<OnboardingCheckoutResult>
}

/** Contrato público — Rede / Multi-unidade */
export interface INetworkService {
  calculateNetworkPrice(quantity: number): NetworkPricing
  generateBranchSlug(baseName: string, index: number): string
}

