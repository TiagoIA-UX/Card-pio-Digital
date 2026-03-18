import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
  observacoes?: string
}

const MAX_ITEMS_PER_ORDER = 50
const MAX_ITEM_QUANTITY = 50

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await withRateLimit(getRateLimitIdentifier(request), RATE_LIMITS.checkout)
    if (rateLimit.limited) {
      return rateLimit.response
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
      return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
    }

    if (!restaurant.ativo) {
      return NextResponse.json({ error: 'Restaurante não está aceitando pedidos' }, { status: 400 })
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

    // Gerar número do pedido (sequencial por restaurante)
    const { data: nextNumber, error: numberError } = await supabase.rpc('get_next_order_number', {
      p_restaurant_id: body.restaurant_id,
    })

    if (numberError) {
      console.error('Erro ao gerar número:', numberError)
      return NextResponse.json({ error: 'Erro ao gerar número do pedido' }, { status: 500 })
    }

    // Criar pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: body.restaurant_id,
        numero_pedido: nextNumber,
        cliente_nome: body.cliente_nome || null,
        cliente_telefone: body.cliente_telefone || null,
        tipo_entrega: body.tipo_entrega,
        origem_pedido: body.order_origin || 'online',
        mesa_numero: body.table_number || null,
        endereco_rua: body.endereco_rua || null,
        endereco_bairro: body.endereco_bairro || null,
        endereco_complemento: body.endereco_complemento || null,
        forma_pagamento: body.forma_pagamento || null,
        troco_para: body.troco_para != null ? body.troco_para : null,
        observacoes: body.observacoes || null,
        total: total,
        status: 'pending',
      })
      .select('id, numero_pedido')
      .single()

    if (orderError) {
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
