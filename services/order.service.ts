// =====================================================
// ORDER SERVICE
// Gerenciamento de pedidos
// =====================================================

import { createClient } from '@/lib/supabase/client'
import type {
  Order,
  OrderInsert,
  OrderUpdate,
  OrderItem,
  OrderItemInsert,
  OrderStatus,
  ApiResponse,
  PaginatedResponse,
} from '@/types/database'

// =====================================================
// PEDIDOS
// =====================================================

export async function getOrders(
  tenantId: string,
  options?: {
    status?: OrderStatus | OrderStatus[]
    startDate?: string
    endDate?: string
    page?: number
    perPage?: number
  }
): Promise<PaginatedResponse<Order>> {
  const supabase = createClient()
  const { status, startDate, endDate, page = 1, perPage = 20 } = options || {}

  let query = supabase
    .from('orders')
    .select('*, items:order_items(*)', { count: 'exact' })
    .eq('tenant_id', tenantId)

  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status)
    } else {
      query = query.eq('status', status)
    }
  }

  if (startDate) query = query.gte('created_at', startDate)
  if (endDate) query = query.lte('created_at', endDate)

  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  return {
    data: data || [],
    total: count || 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count || 0) / perPage),
  }
}

export async function getOrderById(id: string): Promise<ApiResponse<Order>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', id)
    .single()

  return {
    data,
    error: error?.message || null,
    success: !error,
  }
}

export async function getOrderByNumero(
  tenantId: string,
  numero: number
): Promise<ApiResponse<Order>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('tenant_id', tenantId)
    .eq('numero', numero)
    .single()

  return {
    data,
    error: error?.message || null,
    success: !error,
  }
}

/**
 * Busca pedidos ativos (não finalizados/cancelados)
 */
export async function getActiveOrders(tenantId: string): Promise<ApiResponse<Order[]>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('tenant_id', tenantId)
    .in('status', ['novo', 'confirmado', 'em_preparo', 'saiu_entrega'])
    .order('created_at', { ascending: true })

  return {
    data: data || [],
    error: error?.message || null,
    success: !error,
  }
}

/**
 * Busca pedidos de hoje
 */
export async function getTodayOrders(tenantId: string): Promise<ApiResponse<Order[]>> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('tenant_id', tenantId)
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`)
    .order('created_at', { ascending: false })

  return {
    data: data || [],
    error: error?.message || null,
    success: !error,
  }
}

/**
 * Cria novo pedido com itens
 */
export async function createOrder(
  order: OrderInsert,
  items: Omit<OrderItemInsert, 'order_id'>[]
): Promise<ApiResponse<Order>> {
  const supabase = createClient()

  // Inserir pedido
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single()

  if (orderError || !orderData) {
    return {
      data: null,
      error: orderError?.message || 'Erro ao criar pedido',
      success: false,
    }
  }

  // Inserir itens
  const orderItems = items.map((item) => ({
    ...item,
    order_id: orderData.id,
    tenant_id: order.tenant_id,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

  if (itemsError) {
    // Rollback - deletar pedido criado
    await supabase.from('orders').delete().eq('id', orderData.id)
    return {
      data: null,
      error: itemsError.message,
      success: false,
    }
  }

  // Buscar pedido completo
  return getOrderById(orderData.id)
}

/**
 * Atualiza status do pedido
 */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<ApiResponse<Order>> {
  const supabase = createClient()

  const updates: Partial<Order> = { status }

  // Atualizar timestamps correspondentes
  const now = new Date().toISOString()
  switch (status) {
    case 'confirmado':
      updates.horario_confirmacao = now
      break
    case 'em_preparo':
      updates.horario_preparo = now
      break
    case 'saiu_entrega':
      updates.horario_saiu = now
      break
    case 'entregue':
    case 'finalizado':
      updates.horario_entrega = now
      break
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return {
    data,
    error: error?.message || null,
    success: !error,
  }
}

/**
 * Atualiza pedido
 */
export async function updateOrder(id: string, updates: OrderUpdate): Promise<ApiResponse<Order>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return {
    data,
    error: error?.message || null,
    success: !error,
  }
}

/**
 * Marca pedido como enviado via WhatsApp
 */
export async function markAsSentWhatsApp(id: string): Promise<ApiResponse<Order>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('orders')
    .update({
      enviado_whatsapp: true,
      whatsapp_enviado_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  return {
    data,
    error: error?.message || null,
    success: !error,
  }
}

// =====================================================
// ESTATÍSTICAS
// =====================================================

/**
 * Estatísticas de pedidos de hoje
 */
export async function getTodayStats(tenantId: string): Promise<{
  totalPedidos: number
  faturamento: number
  ticketMedio: number
  pedidosDelivery: number
  pedidosRetirada: number
}> {
  const { data: orders } = await getTodayOrders(tenantId)

  const pedidosValidos = orders?.filter((o) => o.status !== 'cancelado') || []

  const totalPedidos = pedidosValidos.length
  const faturamento = pedidosValidos.reduce((sum, o) => sum + o.total, 0)
  const ticketMedio = totalPedidos > 0 ? faturamento / totalPedidos : 0
  const pedidosDelivery = pedidosValidos.filter((o) => o.tipo_entrega === 'delivery').length
  const pedidosRetirada = pedidosValidos.filter((o) => o.tipo_entrega === 'retirada').length

  return {
    totalPedidos,
    faturamento,
    ticketMedio,
    pedidosDelivery,
    pedidosRetirada,
  }
}

/**
 * Pedidos por hora (últimas 24h)
 */
export async function getOrdersByHour(
  tenantId: string
): Promise<Array<{ hora: string; quantidade: number; valor: number }>> {
  const supabase = createClient()
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: orders } = await supabase
    .from('orders')
    .select('created_at, total')
    .eq('tenant_id', tenantId)
    .gte('created_at', yesterday)
    .neq('status', 'cancelado')

  // Agrupar por hora
  const byHour: Record<string, { quantidade: number; valor: number }> = {}

  orders?.forEach((order: Order) => {
    const hora = new Date(order.created_at).getHours().toString().padStart(2, '0') + ':00'
    if (!byHour[hora]) {
      byHour[hora] = { quantidade: 0, valor: 0 }
    }
    byHour[hora].quantidade++
    byHour[hora].valor += order.total
  })

  // Converter para array ordenado
  return Object.entries(byHour)
    .map(([hora, data]) => ({ hora, ...data }))
    .sort((a, b) => a.hora.localeCompare(b.hora))
}

/**
 * Comparativo com dia anterior
 */
export async function getYesterdayComparison(tenantId: string): Promise<{
  pedidosHoje: number
  pedidosOntem: number
  variacao: number
}> {
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [todayResult, yesterdayResult] = await Promise.all([
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', `${today}T00:00:00`)
      .neq('status', 'cancelado'),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', `${yesterday}T00:00:00`)
      .lt('created_at', `${today}T00:00:00`)
      .neq('status', 'cancelado'),
  ])

  const pedidosHoje = todayResult.count || 0
  const pedidosOntem = yesterdayResult.count || 0
  const variacao = pedidosOntem > 0 ? ((pedidosHoje - pedidosOntem) / pedidosOntem) * 100 : 0

  return { pedidosHoje, pedidosOntem, variacao }
}
