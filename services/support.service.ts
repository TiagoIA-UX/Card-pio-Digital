/**
 * services/support.service.ts
 * Lógica de negócio para tickets, escalonamento e SLA.
 */
import { createAdminClient } from '@/lib/shared/supabase/admin'
import {
  CRITICAL_CATEGORIES,
  SLA_TIMEOUT_MS,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
  type SupportTicket,
  type SupportMessage,
  type MessageSenderType,
} from '@/types/support'

const db = () => createAdminClient()

// ── Determina prioridade com base na categoria ────

function resolvePriority(category: TicketCategory): TicketPriority {
  if (CRITICAL_CATEGORIES.includes(category)) return 'critical'
  if (['sugestao', 'feedback'].includes(category)) return 'low'
  return 'operational'
}

// ── Determina quem recebe o ticket ────────────────

async function resolveAssignment(
  restaurantId: string,
  priority: TicketPriority
): Promise<{ assigned_to: string | null; assigned_type: 'affiliate' | 'admin' }> {
  // Críticos vão direto para admin
  if (priority === 'critical') {
    return { assigned_to: null, assigned_type: 'admin' }
  }

  // Busca afiliado do restaurante
  const { data: restaurant } = await db()
    .from('restaurants')
    .select('support_owner')
    .eq('id', restaurantId)
    .single()

  if (restaurant?.support_owner === 'admin') {
    return { assigned_to: null, assigned_type: 'admin' }
  }

  // Busca afiliado vinculado via referral
  const { data: referral } = await db()
    .from('affiliate_referrals')
    .select('affiliate_id, affiliates!inner(user_id, status)')
    .eq('tenant_id', restaurantId)
    .eq('status', 'aprovado')
    .limit(1)
    .single()

  if (referral?.affiliates) {
    const aff = referral.affiliates as unknown as { user_id: string; status: string }
    if (aff.status === 'ativo') {
      return {
        assigned_to: aff.user_id,
        assigned_type: 'affiliate',
      }
    }
  }

  return { assigned_to: null, assigned_type: 'admin' }
}

// ── CRUD ──────────────────────────────────────────

export async function createTicket(params: {
  restaurant_id: string
  opened_by: string
  category: TicketCategory
  subject: string
  message: string
}): Promise<SupportTicket> {
  const priority = resolvePriority(params.category)
  const assignment = await resolveAssignment(params.restaurant_id, priority)

  const slaDeadline = new Date(Date.now() + SLA_TIMEOUT_MS).toISOString()

  const { data: ticket, error } = await db()
    .from('support_tickets')
    .insert({
      restaurant_id: params.restaurant_id,
      opened_by: params.opened_by,
      assigned_to: assignment.assigned_to,
      assigned_type: assignment.assigned_type,
      priority,
      category: params.category,
      subject: params.subject,
      sla_deadline: slaDeadline,
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar ticket: ${error.message}`)

  // Primeira mensagem
  await db()
    .from('support_messages')
    .insert({
      ticket_id: ticket.id,
      sender_id: params.opened_by,
      sender_type: 'customer' as MessageSenderType,
      content: params.message,
    })

  // System log
  await logAction({
    actor_id: params.opened_by,
    actor_type: 'customer',
    action: 'ticket.created',
    entity: 'support_ticket',
    entity_id: ticket.id,
    metadata: { priority, category: params.category, assigned_type: assignment.assigned_type },
  })

  return ticket as SupportTicket
}

export async function replyToTicket(params: {
  ticket_id: string
  sender_id: string
  sender_type: MessageSenderType
  content: string
}): Promise<SupportMessage> {
  const { data: msg, error } = await db()
    .from('support_messages')
    .insert({
      ticket_id: params.ticket_id,
      sender_id: params.sender_id,
      sender_type: params.sender_type,
      content: params.content,
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao enviar mensagem: ${error.message}`)

  // Marcar primeira resposta se for afiliado/admin
  if (params.sender_type !== 'customer') {
    const { data: ticket } = await db()
      .from('support_tickets')
      .select('first_response_at, status')
      .eq('id', params.ticket_id)
      .single()

    const updates: Record<string, unknown> = {}
    if (!ticket?.first_response_at) {
      updates.first_response_at = new Date().toISOString()
    }
    if (ticket?.status === 'open') {
      updates.status = 'in_progress'
    }

    if (Object.keys(updates).length > 0) {
      await db().from('support_tickets').update(updates).eq('id', params.ticket_id)
    }

    // Atualiza last_response_at do afiliado
    if (params.sender_type === 'affiliate') {
      await db()
        .from('affiliates')
        .update({ last_response_at: new Date().toISOString() })
        .eq('user_id', params.sender_id)
    }
  }

  return msg as SupportMessage
}

export async function listTickets(filters: {
  status?: TicketStatus
  priority?: TicketPriority
  assigned_to?: string
  restaurant_id?: string
  limit?: number
  offset?: number
}) {
  let query = db()
    .from('support_tickets')
    .select('*, restaurants!inner(nome)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.priority) query = query.eq('priority', filters.priority)
  if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to)
  if (filters.restaurant_id) query = query.eq('restaurant_id', filters.restaurant_id)
  query = query.range(filters.offset ?? 0, (filters.offset ?? 0) + (filters.limit ?? 50) - 1)

  const { data, count, error } = await query
  if (error) throw new Error(`Erro ao listar tickets: ${error.message}`)
  return { data: data ?? [], total: count ?? 0 }
}

export async function getTicketWithMessages(ticketId: string) {
  const [ticketRes, msgsRes] = await Promise.all([
    db().from('support_tickets').select('*').eq('id', ticketId).single(),
    db()
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true }),
  ])

  if (ticketRes.error) throw new Error(`Ticket não encontrado: ${ticketRes.error.message}`)
  return { ticket: ticketRes.data, messages: msgsRes.data ?? [] }
}

export async function reassignTicket(
  ticketId: string,
  assignedTo: string | null,
  assignedType: 'affiliate' | 'admin',
  reassignedBy: string
) {
  const { error } = await db()
    .from('support_tickets')
    .update({
      assigned_to: assignedTo,
      assigned_type: assignedType,
      status: 'open',
    })
    .eq('id', ticketId)

  if (error) throw new Error(`Erro ao reatribuir: ${error.message}`)

  await logAction({
    actor_id: reassignedBy,
    actor_type: 'admin',
    action: 'ticket.reassigned',
    entity: 'support_ticket',
    entity_id: ticketId,
    metadata: { assigned_to: assignedTo, assigned_type: assignedType },
  })
}

export async function resolveTicket(ticketId: string, resolvedBy: string) {
  const { error } = await db()
    .from('support_tickets')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
    })
    .eq('id', ticketId)

  if (error) throw new Error(`Erro ao resolver: ${error.message}`)

  await logAction({
    actor_id: resolvedBy,
    actor_type: 'admin',
    action: 'ticket.resolved',
    entity: 'support_ticket',
    entity_id: ticketId,
  })
}

// ── System Log helper ─────────────────────────────

export async function logAction(params: {
  actor_id?: string | null
  actor_type: string
  action: string
  entity: string
  entity_id?: string | null
  metadata?: Record<string, unknown>
  ip_address?: string
}) {
  await db()
    .from('system_logs')
    .insert({
      actor_id: params.actor_id ?? null,
      actor_type: params.actor_type,
      action: params.action,
      entity: params.entity,
      entity_id: params.entity_id ?? null,
      metadata: params.metadata ?? {},
      ip_address: params.ip_address ?? null,
    })
    .then(() => {}) // fire-and-forget, não bloqueia
}

