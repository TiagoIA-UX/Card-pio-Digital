import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getRateLimitIdentifier, RATE_LIMITS, withRateLimit } from '@/lib/rate-limit'

interface OrderItemInput {
  product_id: string
  quantidade: number
  observacao?: string
}

interface CreateOrderBody {
  restaurant_id: string
  items: OrderItemInput[]
  cliente_nome?: string
  cliente_telefone?: string
  tipo_entrega: 'entrega' | 'retirada'
  order_origin?: 'online' | 'mesa'
  table_number?: string
  endereco_rua?: string
  endereco_bairro?: string
  endereco_complemento?: string
  forma_pagamento?: string
  troco_para?: number
  comprovante_url?: string
  comprovante_key?: string
  observacoes?: string
}

const MAX_ITEMS_PER_ORDER = 50
const MAX_ITEM_QUANTITY = 50
const ORDER_NUMBER_INSERT_RETRIES = 5

interface OrderInsertPayload {
  restaurant_id: string
  cliente_nome: string | null
  cliente_telefone: string | null
  tipo_entrega: 'entrega' | 'retirada'
  origem_pedido: 'online' | 'mesa'
  mesa_numero: string | null
  endereco_rua: string | null
  endereco_bairro: string | null
  endereco_complemento: string | null
  forma_pagamento: string | null
  troco_para: number | null
  comprovante_url: string | null
  comprovante_key: string | null
  comprovante_enviado_at: string | null
  observacoes: string | null
  total: number
  status: 'pending'
}

function isOrderNumberConflict(error: {
  code?: string
  message?: string | null
  details?: string | null
}) {
  if (error.code !== '23505') {
    return false
  }

  const combinedMessage = `${error.message || ''} ${error.details || ''}`
  return combinedMessage.includes('numero_pedido')
}

async function getNextOrderNumber(
  supabase: ReturnType<typeof createAdminClient>,
  restaurantId: string
) {
  const { data, error } = await supabase
    .from('orders')
    .select('numero_pedido')
    .eq('restaurant_id', restaurantId)
    .order('numero_pedido', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data?.numero_pedido ?? 0) + 1
}

async function createOrderWithSequentialNumber(
  supabase: ReturnType<typeof createAdminClient>,
  payload: OrderInsertPayload
) {
  let lastConflictError: {
    code?: string
    message?: string | null
    details?: string | null
  } | null = null

  for (let attempt = 0; attempt < ORDER_NUMBER_INSERT_RETRIES; attempt += 1) {
    const nextNumber = await getNextOrderNumber(supabase, payload.restaurant_id)

    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...payload,
        numero_pedido: nextNumber,
      })
      .select('id, numero_pedido')
      .single()

    if (!error && data) {
      return data
    }

    if (error && isOrderNumberConflict(error)) {
      lastConflictError = error
      continue
    }

    throw error
  }

  throw lastConflictError || new Error('Não foi possível reservar um número de pedido')
}

function buildOrderNotes(body: CreateOrderBody, isTableOrder: boolean) {
  const notes = body.observacoes?.trim() || ''

  if (!isTableOrder || !body.table_number?.trim()) {
    return notes || null
  }

  const tableNote = `Mesa ${body.table_number.trim()}`
  return notes ? `${tableNote} | ${notes}` : tableNote
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await withRateLimit(getRateLimitIdentifier(request), RATE_LIMITS.checkout)
    if (rateLimit.limited) {
      return rateLimit.response
    }

    // SEGURANÇA: exigir autenticação para criar pedidos (anti-bot)
    const supabaseAuth = await createClient()
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Autenticação necessária para criar pedidos' },
        { status: 401, headers: rateLimit.headers }
      )
    }

    const body: CreateOrderBody = await request.json()

    // Validações básicas
    if (!body.restaurant_id) {
      return NextResponse.json({ error: 'restaurant_id é obrigatório' }, { status: 400 })
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'items não pode estar vazio' }, { status: 400 })
    }

    if (body.items.length > MAX_ITEMS_PER_ORDER) {
      return NextResponse.json(
        { error: `Pedido excede o limite de ${MAX_ITEMS_PER_ORDER} itens` },
        { status: 400 }
      )
    }

    for (const item of body.items) {
      if (!item.product_id) {
        return NextResponse.json({ error: 'Cada item precisa de product_id' }, { status: 400 })
      }

      if (!Number.isInteger(item.quantidade) || item.quantidade <= 0) {
        return NextResponse.json(
          { error: 'quantidade deve ser um inteiro positivo' },
          { status: 400 }
        )
      }

      if (item.quantidade > MAX_ITEM_QUANTITY) {
        return NextResponse.json(
          { error: `quantidade máxima por item é ${MAX_ITEM_QUANTITY}` },
          { status: 400 }
        )
      }
    }

    // Usar cliente admin para bypass de RLS (calcular total com segurança)
    const supabase = createAdminClient()

    // Buscar restaurante
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, nome, slug, telefone, ativo, customizacao')
      .eq('id', body.restaurant_id)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: 'Delivery não encontrado' }, { status: 404 })
    }

    if (!restaurant.ativo) {
      return NextResponse.json(
        { error: 'Este delivery não está aceitando pedidos' },
        { status: 400 }
      )
    }

    // Buscar produtos e calcular total NO SERVIDOR (nunca confiar no frontend)
    const productIds = body.items.map((item) => item.product_id)

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, nome, preco, ativo')
      .in('id', productIds)
      .eq('restaurant_id', body.restaurant_id)
      .eq('ativo', true)

    if (productsError) {
      return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 })
    }

    // Verificar se todos os produtos existem e estão ativos
    const productMap = new Map(products?.map((p) => [p.id, p]) || [])

    for (const item of body.items) {
      if (!productMap.has(item.product_id)) {
        return NextResponse.json(
          {
            error: `Produto não encontrado ou indisponível: ${item.product_id}`,
          },
          { status: 400 }
        )
      }
    }

    // Calcular total com preços do banco (SEGURO)
    let total = 0
    const orderItems = body.items.map((item) => {
      const product = productMap.get(item.product_id)!
      const unitPrice = Number(product.preco)
      const subtotal = unitPrice * item.quantidade
      total += subtotal

      return {
        product_id: item.product_id,
        nome_snapshot: product.nome,
        preco_snapshot: unitPrice,
        quantidade: item.quantidade,
        observacao: item.observacao || null,
      }
    })

    if (!Number.isFinite(total) || total <= 0) {
      return NextResponse.json({ error: 'Total do pedido inválido' }, { status: 400 })
    }

    const isTableOrder = body.order_origin === 'mesa'
    let validatedMesaNumero: string | null = null

    if (isTableOrder) {
      const mesaStr = body.table_number?.trim()
      if (!mesaStr) {
        return NextResponse.json(
          { error: 'Número da mesa é obrigatório para pedidos de mesa' },
          { status: 400 }
        )
      }

      const mesaNum = parseInt(mesaStr, 10)
      if (isNaN(mesaNum) || mesaNum <= 0 || mesaNum > 999) {
        return NextResponse.json({ error: 'Número da mesa inválido' }, { status: 400 })
      }

      // Validar se a mesa existe no cadastro (se o restaurante tem mesas cadastradas)
      const { data: mesas } = await supabase
        .from('restaurant_mesas')
        .select('id')
        .eq('restaurant_id', body.restaurant_id)
        .eq('ativa', true)
        .limit(1)

      if (mesas && mesas.length > 0) {
        // Restaurante tem mesas cadastradas → validar contra whitelist
        const { data: mesaValida } = await supabase
          .from('restaurant_mesas')
          .select('id')
          .eq('restaurant_id', body.restaurant_id)
          .eq('numero', mesaNum)
          .eq('ativa', true)
          .maybeSingle()

        if (!mesaValida) {
          return NextResponse.json(
            { error: `Mesa ${mesaNum} não existe ou está desativada neste restaurante` },
            { status: 400 }
          )
        }
      }

      validatedMesaNumero = String(mesaNum)
    }

    const orderPayload: OrderInsertPayload = {
      restaurant_id: body.restaurant_id,
      cliente_nome: body.cliente_nome || null,
      cliente_telefone: body.cliente_telefone || null,
      tipo_entrega: body.tipo_entrega,
      origem_pedido: body.order_origin || 'online',
      mesa_numero: validatedMesaNumero,
      endereco_rua: body.endereco_rua || null,
      endereco_bairro: body.endereco_bairro || null,
      endereco_complemento: body.endereco_complemento || null,
      forma_pagamento: body.forma_pagamento || null,
      troco_para: body.troco_para != null ? body.troco_para : null,
      comprovante_url: body.comprovante_url || null,
      comprovante_key: body.comprovante_key || null,
      comprovante_enviado_at: body.comprovante_url ? new Date().toISOString() : null,
      observacoes: buildOrderNotes(body, isTableOrder),
      total: total,
      status: 'pending',
    }

    let order: { id: string; numero_pedido: number }

    try {
      order = await createOrderWithSequentialNumber(supabase, orderPayload)
    } catch (orderError) {
      console.error('Erro ao criar pedido:', orderError)
      return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 })
    }

    // Criar itens do pedido
    const itemsToInsert = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert)

    if (itemsError) {
      console.error('Erro ao criar itens:', itemsError)
      // Tentar deletar o pedido órfão
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Erro ao salvar itens do pedido' }, { status: 500 })
    }

    // Registrar evento de ativação: primeiro pedido recebido
    try {
      const { data: existingEvent } = await supabase
        .from('activation_events')
        .select('id')
        .eq('restaurant_id', body.restaurant_id)
        .eq('event_type', 'received_first_order')
        .limit(1)
        .maybeSingle()

      if (!existingEvent) {
        // Buscar user_id do dono do restaurante
        const { data: restOwner } = await supabase
          .from('restaurants')
          .select('user_id')
          .eq('id', body.restaurant_id)
          .single()

        if (restOwner?.user_id) {
          await supabase.from('activation_events').insert({
            user_id: restOwner.user_id,
            restaurant_id: body.restaurant_id,
            event_type: 'received_first_order',
          })
        }
      }
    } catch (e) {
      console.error('Erro ao registrar activation_event received_first_order:', e)
    }

    return NextResponse.json(
      {
        success: true,
        order_id: order.id,
        numero_pedido: order.numero_pedido,
        total: total,
      },
      { headers: rateLimit.headers }
    )
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
