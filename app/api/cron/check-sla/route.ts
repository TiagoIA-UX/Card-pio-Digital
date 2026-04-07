import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'

const CRON_SECRET = process.env.CRON_SECRET

function getSupabaseAdmin() {
  return createAdminClient()
}

function isAuthorizedCronRequest(request: NextRequest) {
  if (!CRON_SECRET) return false
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${CRON_SECRET}`
}

export async function GET(request: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })
  }

  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  try {
    // 1. Verificar tickets que excederam o SLA (30 min sem resposta)
    const { data: breached, error: breachError } = await supabase.rpc('check_sla_and_escalate')

    if (breachError) {
      console.error('Erro ao verificar SLA:', breachError)
    }

    // 2. Também buscar tickets abertos há muito tempo sem resposta e escalar individualmente
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    const { data: openTickets } = await supabase
      .from('support_tickets')
      .select('id, assigned_to, sla_deadline')
      .eq('status', 'aberto')
      .is('first_response_at', null)
      .lt('sla_deadline', new Date().toISOString())

    let escalated = 0
    if (openTickets) {
      for (const ticket of openTickets) {
        const { error } = await supabase.rpc('escalate_ticket', {
          p_ticket_id: ticket.id,
        })
        if (!error) escalated++
      }
    }

    // Log da execução
    await supabase.from('system_logs').insert({
      entity: 'cron',
      entity_id: null,
      action: 'check_sla',
      actor_type: 'system',
      metadata: {
        rpc_result: breached ?? null,
        tickets_escalated: escalated,
        checked_at: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      escalated,
      checked_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro no cron check-sla:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
