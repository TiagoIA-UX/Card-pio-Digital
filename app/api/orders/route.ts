import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
  endereco_rua?: string
  endereco_bairro?: string
  endereco_complemento?: string
  forma_pagamento?: string
  observacoes?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderBody = await request.json()

    // Validações básicas
    if (!body.restaurant_id) {
      return NextResponse.json({ error: 'restaurant_id é obrigatório' }, { status: 400 })
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'items não pode estar vazio' }, { status: 400 })
    }

    // Usar cliente admin para bypass de RLS (calcular total com segurança)
    const supabase = createAdminClient()

    // Buscar restaurante
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, telefone, ativo')
      .eq('id', body.restaurant_id)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
    }

    if (!restaurant.ativo) {
      return NextResponse.json({ error: 'Restaurante não está aceitando pedidos' }, { status: 400 })
    }

    // Buscar produtos e calcular total NO SERVIDOR (nunca confiar no frontend)
    const productIds = body.items.map(item => item.product_id)
    
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
    const productMap = new Map(products?.map(p => [p.id, p]) || [])
    
    for (const item of body.items) {
      if (!productMap.has(item.product_id)) {
        return NextResponse.json({ 
          error: `Produto não encontrado ou indisponível: ${item.product_id}` 
        }, { status: 400 })
      }
    }

    // Calcular total com preços do banco (SEGURO)
    let total = 0
    const orderItems = body.items.map(item => {
      const product = productMap.get(item.product_id)!
      const subtotal = product.preco * item.quantidade
      total += subtotal
      
      return {
        product_id: item.product_id,
        nome_snapshot: product.nome,
        preco_snapshot: product.preco,
        quantidade: item.quantidade,
        observacao: item.observacao || null
      }
    })

    // Gerar número do pedido (sequencial por restaurante)
    const { data: nextNumber, error: numberError } = await supabase
      .rpc('get_next_order_number', { p_restaurant_id: body.restaurant_id })

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
        endereco_rua: body.endereco_rua || null,
        endereco_bairro: body.endereco_bairro || null,
        endereco_complemento: body.endereco_complemento || null,
        forma_pagamento: body.forma_pagamento || null,
        observacoes: body.observacoes || null,
        total: total,
        status: 'pending'
      })
      .select('id, numero_pedido')
      .single()

    if (orderError) {
      console.error('Erro ao criar pedido:', orderError)
      return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 })
    }

    // Criar itens do pedido
    const itemsToInsert = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert)

    if (itemsError) {
      console.error('Erro ao criar itens:', itemsError)
      // Tentar deletar o pedido órfão
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Erro ao salvar itens do pedido' }, { status: 500 })
    }

    // Gerar URL do WhatsApp (mensagem fixa, não editável)
    const whatsappMessage = `Olá, fiz o pedido #${order.numero_pedido}`
    const whatsappUrl = `https://wa.me/${restaurant.telefone}?text=${encodeURIComponent(whatsappMessage)}`

    return NextResponse.json({
      success: true,
      order_id: order.id,
      numero_pedido: order.numero_pedido,
      total: total,
      whatsapp_url: whatsappUrl
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
