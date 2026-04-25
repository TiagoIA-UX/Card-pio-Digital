// =====================================================
// TIPOS — Sistema de Suporte + Penalidades
// =====================================================

// ── Suporte ────────────────────────────────────────

export type TicketPriority = 'critical' | 'operational' | 'low'

export type TicketCategory =
  | 'erro_sistema'
  | 'pagamento'
  | 'pedido_falhando'
  | 'cardapio'
  | 'configuracao'
  | 'duvida'
  | 'geral'
  | 'sugestao'
  | 'feedback'

export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_customer'
  | 'escalated'
  | 'resolved'
  | 'closed'

export type AssignedType = 'affiliate' | 'admin'

export interface SupportTicket {
  id: string
  restaurant_id: string
  opened_by: string
  assigned_to: string | null
  assigned_type: AssignedType
  priority: TicketPriority
  category: TicketCategory
  status: TicketStatus
  subject: string
  sla_deadline: string | null
  first_response_at: string | null
  resolved_at: string | null
  escalated_at: string | null
  escalated_reason: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  // Joins
  restaurant_name?: string
  assigned_name?: string
  messages_count?: number
}

export type MessageSenderType = 'customer' | 'affiliate' | 'admin' | 'system'

export interface SupportMessage {
  id: string
  ticket_id: string
  sender_id: string | null
  sender_type: MessageSenderType
  content: string
  metadata: Record<string, unknown>
  created_at: string
  // Joins
  sender_name?: string
}

// Categorias críticas → vão direto para admin
export const CRITICAL_CATEGORIES: TicketCategory[] = [
  'erro_sistema',
  'pagamento',
  'pedido_falhando',
]

// SLA em milissegundos (30 minutos)
export const SLA_TIMEOUT_MS = 30 * 60 * 1000

// ── Penalidades ────────────────────────────────────

export type PenaltyType =
  | 'warning'
  | 'commission_reduction'
  | 'client_loss'
  | 'suspension'
  | 'manual'

export interface AffiliatePenalty {
  id: string
  affiliate_id: string
  ticket_id: string | null
  tipo: PenaltyType
  strike_number: number
  descricao: string
  applied_by: string | null
  reverted_at: string | null
  reverted_by: string | null
  created_at: string
  // Joins
  affiliate_name?: string
  ticket_subject?: string
}

// ── System Logs ────────────────────────────────────

export type ActorType = 'admin' | 'affiliate' | 'customer' | 'system' | 'cron'

export interface SystemLog {
  id: string
  actor_id: string | null
  actor_type: ActorType
  action: string
  entity: string
  entity_id: string | null
  metadata: Record<string, unknown>
  ip_address: string | null
  created_at: string
}

// ── Affiliate estendido (com strikes) ──────────────

export interface AffiliateWithStrikes {
  id: string
  user_id: string
  code: string
  nome: string
  email?: string
  status: string
  tier: string
  commission_rate: number
  strikes: number
  last_response_at: string | null
  cidade: string | null
  estado: string | null
  created_at: string
  // Computed
  total_referrals?: number
  active_referrals?: number
  pending_penalties?: number
}

