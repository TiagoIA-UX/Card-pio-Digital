/**
 * API: /api/suporte
 * Rota pública para clientes/restaurantes abrirem e consultarem tickets.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/supabase/server'
import {
  createTicket,
  listTickets,
  getTicketWithMessages,
  replyToTicket,
} from '@/services/support.service'
import { checkRateLimit, RATE_LIMITS, getRateLimitIdentifier } from '@/lib/shared/rate-limit'
import { z } from 'zod'

// GET /api/suporte — lista tickets do usuário logado
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const url = new URL(req.url)
  const ticketId = url.searchParams.get('id')

  if (ticketId) {
    const result = await getTicketWithMessages(ticketId)
    return NextResponse.json(result)
  }

  // Busca restaurant_id do usuário
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!restaurant) return NextResponse.json({ data: [], total: 0 })

  const result = await listTickets({
    restaurant_id: restaurant.id,
    limit: Number(url.searchParams.get('limit')) || 20,
    offset: Number(url.searchParams.get('offset')) || 0,
  })

  return NextResponse.json(result)
}

const createSchema = z.object({
  action: z.literal('create'),
  category: z.enum([
    'erro_sistema',
    'pagamento',
    'pedido_falhando',
    'cardapio',
    'configuracao',
    'duvida',
    'geral',
    'sugestao',
    'feedback',
  ]),
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(5000),
})

const replySchema = z.object({
  action: z.literal('reply'),
  ticket_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
})

// POST /api/suporte
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // Rate limit: 5 tickets/min
  const rl = await checkRateLimit(getRateLimitIdentifier(req, user.id), RATE_LIMITS.auth)
  if (!rl.success) {
    return NextResponse.json({ error: 'Muitas requisições' }, { status: 429, headers: rl.headers })
  }

  const body = await req.json()

  if (body?.action === 'create') {
    const parsed = createSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    // Busca restaurant_id
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!restaurant)
      return NextResponse.json({ error: 'Delivery não encontrado' }, { status: 404 })

    const ticket = await createTicket({
      restaurant_id: restaurant.id,
      opened_by: user.id,
      category: parsed.data.category,
      subject: parsed.data.subject,
      message: parsed.data.message,
    })

    return NextResponse.json({ ticket }, { status: 201 })
  }

  if (body?.action === 'reply') {
    const parsed = replySchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const msg = await replyToTicket({
      ticket_id: parsed.data.ticket_id,
      sender_id: user.id,
      sender_type: 'customer',
      content: parsed.data.content,
    })

    return NextResponse.json({ message: msg })
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
