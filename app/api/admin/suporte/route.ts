/**
 * API: /api/admin/suporte
 * CRUD de tickets + ações admin (escalar, reatribuir, resolver)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/domains/auth/admin-auth'
import {
  listTickets,
  getTicketWithMessages,
  replyToTicket,
  reassignTicket,
  resolveTicket,
} from '@/services/support.service'
import { z } from 'zod'
import type { TicketStatus, TicketPriority } from '@/types/support'

// GET /api/admin/suporte?status=open&priority=critical
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req, 'support')
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const url = new URL(req.url)
  const ticketId = url.searchParams.get('id')

  // Detalhe de um ticket
  if (ticketId) {
    const result = await getTicketWithMessages(ticketId)
    return NextResponse.json(result)
  }

  // Lista com filtros
  const filters = {
    status: (url.searchParams.get('status') ?? undefined) as TicketStatus | undefined,
    priority: (url.searchParams.get('priority') ?? undefined) as TicketPriority | undefined,
    assigned_to: url.searchParams.get('assigned_to') ?? undefined,
    restaurant_id: url.searchParams.get('restaurant_id') ?? undefined,
    limit: Number(url.searchParams.get('limit')) || 50,
    offset: Number(url.searchParams.get('offset')) || 0,
  }

  const result = await listTickets(filters)
  return NextResponse.json(result)
}

const replySchema = z.object({
  action: z.literal('reply'),
  ticket_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
})

const reassignSchema = z.object({
  action: z.literal('reassign'),
  ticket_id: z.string().uuid(),
  assigned_to: z.string().uuid().nullable(),
  assigned_type: z.enum(['affiliate', 'admin']),
})

const resolveSchema = z.object({
  action: z.literal('resolve'),
  ticket_id: z.string().uuid(),
})

// POST /api/admin/suporte
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const action = body?.action

  if (action === 'reply') {
    const parsed = replySchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const msg = await replyToTicket({
      ticket_id: parsed.data.ticket_id,
      sender_id: admin.id,
      sender_type: 'admin',
      content: parsed.data.content,
    })
    return NextResponse.json({ message: msg })
  }

  if (action === 'reassign') {
    const parsed = reassignSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    await reassignTicket(
      parsed.data.ticket_id,
      parsed.data.assigned_to,
      parsed.data.assigned_type,
      admin.id
    )
    return NextResponse.json({ ok: true })
  }

  if (action === 'resolve') {
    const parsed = resolveSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    await resolveTicket(parsed.data.ticket_id, admin.id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
