/**
 * Máquina de estados formal para o lifecycle de compra de template.
 *
 * Os estados são derivados dos campos de DB existentes (template_orders.status,
 * template_orders.payment_status, template_orders.metadata.onboarding_status).
 *
 * Uso: resolver o estado canônico → validar transições → aplicar transições.
 */

// ── Lifecycle states ────────────────────────────────────────────────────

export const ORDER_LIFECYCLE_STATES = [
  'checkout_created',
  'awaiting_payment',
  'payment_processing',
  'provisioning',
  'ready',
  'payment_rejected',
  'cancelled',
] as const

export type OrderLifecycleState = (typeof ORDER_LIFECYCLE_STATES)[number]

// ── Transition table ────────────────────────────────────────────────────

export const LIFECYCLE_TRANSITIONS: Record<OrderLifecycleState, readonly OrderLifecycleState[]> = {
  checkout_created: ['awaiting_payment', 'cancelled'],
  awaiting_payment: ['payment_processing', 'payment_rejected', 'cancelled'],
  payment_processing: ['provisioning', 'payment_rejected'],
  provisioning: ['ready'],
  ready: [],
  payment_rejected: ['awaiting_payment'],
  cancelled: [],
}

export function canTransition(from: OrderLifecycleState, to: OrderLifecycleState): boolean {
  return LIFECYCLE_TRANSITIONS[from]?.includes(to) ?? false
}

// ── State resolver ──────────────────────────────────────────────────────

export interface OrderStateInput {
  status: string
  payment_status: string
  metadata?: {
    onboarding_status?: string | null
    provisioned_restaurant_id?: string | null
  } | null
}

/**
 * Resolve o estado canônico do lifecycle a partir dos campos de DB.
 * A precedência reflete a progressão do fluxo: estados mais avançados
 * têm prioridade sobre estados anteriores.
 */
export function resolveOrderLifecycleState(order: OrderStateInput): OrderLifecycleState {
  const onboarding = order.metadata?.onboarding_status
  const hasRestaurant = !!order.metadata?.provisioned_restaurant_id

  // Terminal positivo: completamente provisionado
  if (onboarding === 'ready' && hasRestaurant) return 'ready'

  // Em provisionamento ativo
  if (onboarding === 'provisioning' || order.payment_status === 'processing') {
    return hasRestaurant
      ? 'ready'
      : order.payment_status === 'processing'
        ? 'payment_processing'
        : 'provisioning'
  }

  // Rejeições
  if (onboarding === 'payment_rejected' || order.payment_status === 'rejected') {
    return 'payment_rejected'
  }

  // Cancelamento explícito
  if (order.status === 'cancelled') return 'cancelled'

  // Aguardando pagamento (preferência MP já criada)
  if (onboarding === 'awaiting_payment') return 'awaiting_payment'
  if (order.payment_status === 'pending' && onboarding) return 'awaiting_payment'

  // Fallback: pedido acabou de ser criado (preferência MP ainda não gerada)
  return 'checkout_created'
}

// ── DB field builder ────────────────────────────────────────────────────

export interface LifecycleDbFields {
  status: string
  payment_status: string
  onboarding_status: string
}

/**
 * Dado um estado do lifecycle, retorna os campos de DB que representam aquele estado.
 * Útil para garantir consistência ao escrever no banco.
 */
export function lifecycleStateToDbFields(state: OrderLifecycleState): LifecycleDbFields {
  switch (state) {
    case 'checkout_created':
      return { status: 'pending', payment_status: 'pending', onboarding_status: 'awaiting_payment' }
    case 'awaiting_payment':
      return { status: 'pending', payment_status: 'pending', onboarding_status: 'awaiting_payment' }
    case 'payment_processing':
      return {
        status: 'processing',
        payment_status: 'processing',
        onboarding_status: 'provisioning',
      }
    case 'provisioning':
      return { status: 'processing', payment_status: 'approved', onboarding_status: 'provisioning' }
    case 'ready':
      return { status: 'completed', payment_status: 'approved', onboarding_status: 'ready' }
    case 'payment_rejected':
      return {
        status: 'cancelled',
        payment_status: 'rejected',
        onboarding_status: 'payment_rejected',
      }
    case 'cancelled':
      return {
        status: 'cancelled',
        payment_status: 'rejected',
        onboarding_status: 'payment_rejected',
      }
  }
}

// ── Transition labels (para audit / UI) ─────────────────────────────────

export const LIFECYCLE_STATE_LABELS: Record<OrderLifecycleState, string> = {
  checkout_created: 'Pedido criado',
  awaiting_payment: 'Aguardando pagamento',
  payment_processing: 'Processando pagamento',
  provisioning: 'Provisionando canal digital',
  ready: 'Pronto',
  payment_rejected: 'Pagamento rejeitado',
  cancelled: 'Cancelado',
}
