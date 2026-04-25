// ═══════════════════════════════════════════════════════════════
// CONTRACTS: MARKETING — API pública do domínio de marketing
// ═══════════════════════════════════════════════════════════════

/** Slugs de template de delivery */
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

/** Slugs de plano de onboarding */
export type OnboardingPlanSlug = 'self-service' | 'feito-pra-voce'

/** Pricing de um template */
export interface TemplatePricing {
  template: RestaurantTemplateSlug
  complexidade: 'simples' | 'medio' | 'avancado'
  mediaProdutos: number
  selfService: { preco: number; parcelaMax: number }
  feitoPraVoce: { preco: number; parcelaMax: number }
}

/** Estado do ciclo de vida de pedido de template */
export type OrderLifecycleState =
  | 'checkout_created'
  | 'awaiting_payment'
  | 'payment_processing'
  | 'provisioning'
  | 'ready'
  | 'payment_rejected'
  | 'cancelled'

/** Dados de consulta GSC */
export interface GSCQueryParams {
  siteUrl: string
  startDate: string
  endDate: string
  dimensions?: string[]
  rowLimit?: number
}

/** Linha de resultado GSC */
export interface GSCRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

/** Resposta GSC */
export interface GSCResponse {
  rows: GSCRow[]
  responseAggregationType?: string
}

/** Overview agregado GSC */
export interface GSCOverview {
  totalClicks: number
  totalImpressions: number
  averageCtr: number
  averagePosition: number
}

/** Tipos de evento de funil */
export type FunnelEvent =
  | 'page_view'
  | 'template_selected'
  | 'plan_selected'
  | 'checkout_started'
  | 'payment_initiated'
  | 'payment_completed'
  | 'onboarding_started'
  | 'onboarding_completed'

/** Contrato público do serviço de marketing */
export interface IMarketingService {
  getTemplatePricing(slug: RestaurantTemplateSlug): TemplatePricing | undefined
  getAllPricing(): readonly TemplatePricing[]
  calcParcelaMensal(total: number, parcelas: number): number
  canTransition(from: OrderLifecycleState, to: OrderLifecycleState): boolean
  trackEvent(event: FunnelEvent, properties?: Record<string, unknown>): void
  generateOrganizationSchema(): Record<string, unknown>
}

