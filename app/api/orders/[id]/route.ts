import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/supabase/server'

// ── Mapa de transições válidas ──────────────────────────────────
// Cada status só pode ir para os próximos estados listados
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivered'],
  delivered: [], // estado final
  cancelled: [], // estado final
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params

  if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: { status?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const newStatus = body.status
  if (!newStatus || !(newStatus in VALID_TRANSITIONS)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  // Buscar pedido + verificar ownership via restaurant
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status, restaurant_id')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }

  // Verificar que o usuário é dono do delivery
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', order.restaurant_id)
    .eq('user_id', user.id)
    .single()

  if (!restaurant) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  // Validar transição
  const currentStatus = order.status
  const allowedNext = VALID_TRANSITIONS[currentStatus]

  if (!allowedNext || !allowedNext.includes(newStatus)) {
    return NextResponse.json(
      {
        error: `Transição inválida: ${currentStatus} → ${newStatus}`,
        allowed: allowedNext || [],
      },
      { status: 422 }
    )
  }

  // Atualizar status
  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)

  if (updateError) {
    return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 })
  }

  return NextResponse.json({ success: true, status: newStatus })
}
