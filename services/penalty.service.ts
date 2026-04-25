/**
 * services/penalty.service.ts
 * Lógica de penalidades progressivas para afiliados.
 *
 * Regras:
 *   1 strike → aviso (warning)
 *   2 strikes → redução de comissão (-5%)
 *   3 strikes → perde cliente (transferido para admin)
 */
import { createAdminClient } from '@/lib/shared/supabase/admin'
import { logAction } from './support.service'
import type { PenaltyType } from '@/types/support'

const db = () => createAdminClient()

const PENALTY_RULES: Record<number, { tipo: PenaltyType; descricao: string }> = {
  1: { tipo: 'warning', descricao: 'Primeiro aviso — responda dentro do SLA de 30 minutos.' },
  2: { tipo: 'commission_reduction', descricao: 'Segundo strike — comissão reduzida em 5%.' },
  3: {
    tipo: 'client_loss',
    descricao: 'Terceiro strike — cliente sem suporte transferido para admin. Strikes resetados.',
  },
}

export async function applyStrike(
  affiliateId: string,
  ticketId?: string,
  appliedBy?: string,
  customDescription?: string
) {
  // Busca afiliado
  const { data: affiliate, error } = await db()
    .from('affiliates')
    .select('id, strikes, commission_rate, user_id')
    .eq('id', affiliateId)
    .single()

  if (error || !affiliate) throw new Error('Afiliado não encontrado')

  const newStrikes = affiliate.strikes + 1
  const rule = PENALTY_RULES[Math.min(newStrikes, 3)]

  // Atualiza strikes
  const updates: Record<string, unknown> = { strikes: newStrikes }

  // Strike 2: reduz comissão em 5%
  if (newStrikes === 2) {
    updates.commission_rate = Math.max(0, affiliate.commission_rate - 5)
  }

  // Strike 3+: perde SOMENTE o cliente do ticket sem suporte (não todos)
  // O afiliado continua ativo, mas aquele restaurante vai para admin
  if (newStrikes >= 3 && ticketId) {
    // Busca o restaurante do ticket que causou o 3o strike
    const { data: ticket } = await db()
      .from('support_tickets')
      .select('restaurant_id')
      .eq('id', ticketId)
      .single()

    if (ticket?.restaurant_id) {
      await db()
        .from('restaurants')
        .update({ support_owner: 'admin' })
        .eq('id', ticket.restaurant_id)
    }
  }

  await db().from('affiliates').update(updates).eq('id', affiliateId)

  // Registra penalidade
  await db()
    .from('affiliate_penalties')
    .insert({
      affiliate_id: affiliateId,
      ticket_id: ticketId ?? null,
      tipo: rule.tipo,
      strike_number: newStrikes,
      descricao: customDescription ?? rule.descricao,
      applied_by: appliedBy ?? null,
    })

  await logAction({
    actor_id: appliedBy ?? null,
    actor_type: appliedBy ? 'admin' : 'cron',
    action: 'penalty.applied',
    entity: 'affiliate',
    entity_id: affiliateId,
    metadata: { strike_number: newStrikes, tipo: rule.tipo, ticket_id: ticketId },
  })

  return { strikes: newStrikes, penalty: rule }
}

export async function revertStrike(penaltyId: string, revertedBy: string) {
  // Busca penalidade
  const { data: penalty, error } = await db()
    .from('affiliate_penalties')
    .select('*, affiliates!inner(id, strikes, commission_rate)')
    .eq('id', penaltyId)
    .is('reverted_at', null)
    .single()

  if (error || !penalty) throw new Error('Penalidade não encontrada ou já revertida')

  // Reverte no registro
  await db()
    .from('affiliate_penalties')
    .update({
      reverted_at: new Date().toISOString(),
      reverted_by: revertedBy,
    })
    .eq('id', penaltyId)

  // Decrementa strikes
  const affiliate = penalty.affiliates as { id: string; strikes: number; commission_rate: number }
  const newStrikes = Math.max(0, affiliate.strikes - 1)
  const updates: Record<string, unknown> = { strikes: newStrikes }

  // Se estava suspenso e desceu para <3, reativa
  if (newStrikes < 3) {
    updates.status = 'ativo'
  }

  // Se era commission_reduction, restaura comissão
  if (penalty.tipo === 'commission_reduction') {
    updates.commission_rate = affiliate.commission_rate + 5
  }

  await db().from('affiliates').update(updates).eq('id', affiliate.id)

  await logAction({
    actor_id: revertedBy,
    actor_type: 'admin',
    action: 'penalty.reverted',
    entity: 'affiliate',
    entity_id: affiliate.id,
    metadata: { penalty_id: penaltyId, new_strikes: newStrikes },
  })

  return { strikes: newStrikes }
}

export async function listPenalties(affiliateId?: string) {
  let query = db().from('affiliate_penalties').select('*').order('created_at', { ascending: false })

  if (affiliateId) query = query.eq('affiliate_id', affiliateId)

  const { data, error } = await query
  if (error) throw new Error(`Erro ao listar penalidades: ${error.message}`)
  return data ?? []
}

