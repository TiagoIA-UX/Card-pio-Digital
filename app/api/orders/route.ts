import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import { getRateLimitIdentifier, RATE_LIMITS, withRateLimit } from '@/lib/shared/rate-limit'
import {
  CreateOrderSchema,
  zodErrorResponse,
  type CreateOrderInput,
} from '@/lib/domains/core/schemas'
import { getPublicPlanDisplay } from '@/lib/domains/marketing/plan-display'
import { checkIsOpen } from '@/lib/shared/check-is-open'

const MAX_ITEMS_PER_ORDER = 50
const MAX_ITEM_QUANTITY = 50
const ORDER_NUMBER_INSERT_RETRIES = 5
const ENTRY_PLAN_NAME = getPublicPlanDisplay('semente').name

const OPTIONAL_ORDER_COLUMNS = new Set<keyof OrderInsertPayload>([
  'origem_pedido',
  'mesa_numero',
  'comprovante_url',
  'comprovante_key',
  'comprovante_enviado_at',
  'troco_para',
  'forma_pagamento',
])

interface OrderInsertPayload {
  restaurant_id: string
  cliente_nome: string | null
  cliente_telefone: string | null
  tipo_entrega: 'delivery' | 'retirada'
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

type OrderInsertResult = { id: string; numero_pedido: number }

type DbError = {
  code?: string
  message?: string | null
  details?: string | null
  hint?: string | null
}

function normalizeDeliveryType(deliveryType: CreateOrderInput['tipo_entrega']) {
  return deliveryType === 'retirada' ? 'retirada' : 'delivery'
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

function extractMissingColumn(error: DbError, tableName: string): string | null {
  if (error.code !== 'PGRST204') {
    return null
  }

  const combined = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`
  const regex = new RegExp(`['\"]([a-zA-Z0-9_]+)['\"]\\s+column\\s+of\\s+['\"]${tableName}['\"]`)
  const match = combined.match(regex)

  return match?.[1] || null
}

function omitColumns<T extends Record<string, unknown>>(payload: T, columns: Set<string>) {
  const entries = Object.entries(payload).filter(([key]) => !columns.has(key))
  return Object.fromEntries(entries) as Partial<T>
}

async function getNextOrderNumber(
  supabase: ReturnType<typeof createAdminClient>,
  restaurantId: string
) {
  // Usar RPC atômica para evitar números duplicados sob concorrência
  const { data, error } = await supabase.rpc('get_next_order_number', {
    p_restaurant_id: restaurantId,
  })

  if (error || data == null) {
    // Fallback: MAX+1 (menos seguro, mas funciona se a RPC não existir ainda)
    const { data: fallback } = await supabase
      .from('orders')
      .select('numero_pedido')
      .eq('restaurant_id', restaurantId)
      .order('numero_pedido', { ascending: false })
      .limit(1)
      .maybeSingle()
    return (fallback?.numero_pedido ?? 0) + 1
  }

  return data as number
}

async function createOrderWithSequentialNumber(
  supabase: ReturnType<typeof createAdminClient>,
  payload: OrderInsertPayload
) {
  let lastConflictError: DbError | null = null
  const omittedColumns = new Set<string>()
  const maxAttempts = ORDER_NUMBER_INSERT_RETRIES + OPTIONAL_ORDER_COLUMNS.size

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const nextNumber = await getNextOrderNumber(supabase, payload.restaurant_id)
    const compatiblePayload = omitColumns(
      {
        ...payload,
        numero_pedido: nextNumber,
      },
      omittedColumns
    )

    const { data, error } = await supabase
      .from('orders')
      .insert(compatiblePayload)
      .select('id, numero_pedido')
      .single()

    if (!error && data) {
      return data as OrderInsertResult
    }

    if (error && isOrderNumberConflict(error)) {
      lastConflictError = error
      continue
    }

    const missingColumn = error ? extractMissingColumn(error, 'orders') : null
    if (
      missingColumn &&
      OPTIONAL_ORDER_COLUMNS.has(missingColumn as keyof OrderInsertPayload) &&
      !omittedColumns.has(missingColumn)
    ) {
      omittedColumns.add(missingColumn)
      continue
    }

    throw error
  }

  throw lastConflictError || new Error('Não foi possível reservar um número de pedido')
}

type OrderItemInsertPayload = {
  order_id: string
  product_id: string
  nome_snapshot: string
  preco_snapshot: number
  quantidade: number
  observacao: string | null
}

function buildItemsPayloadWithObservationColumn(
  items: OrderItemInsertPayload[],
  observationColumn: 'observacao' | 'observacoes' | null
) {
  return items.map(({ observacao, ...rest }) => {
    if (!observationColumn) {
      return rest
    }

    return {
      ...rest,
      [observationColumn]: observacao,
    }
  })
}

async function insertOrderItemsWithCompat(
  supabase: ReturnType<typeof createAdminClient>,
  items: OrderItemInsertPayload[]
) {
  const observationColumns: Array<'observacao' | 'observacoes' | null> = [
    'observacao',
    'observacoes',
    null,
  ]

  let lastError: DbError | null = null

  for (const column of observationColumns) {
    const payload = buildItemsPayloadWithObservationColumn(items, column)
    const { error } = await supabase.from('order_items').insert(payload)

    if (!error) {
      return null
    }

    lastError = error

    const missingColumn = extractMissingColumn(error, 'order_items')
    if ((missingColumn === 'observacao' || missingColumn === 'observacoes') && column !== null) {
      continue
    }

    return error
  }

  return lastError
}

function buildOrderNotes(body: CreateOrderInput, isTableOrder: boolean) {
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

    const raw = await request.json()
    const parsed = CreateOrderSchema.safeParse(raw)
    if (!parsed.success) {
      return zodErrorResponse(parsed.error)
    }
    const body = parsed.data

    // Usar cliente admin para bypass de RLS (calcular total com segurança)
    const supabase = createAdminClient()

    // Buscar restaurante
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select(
        'id, nome, slug, telefone, ativo, customizacao, status_pagamento, suspended, delivery_mode, pedido_minimo, taxa_entrega, horario_funcionamento, plan_slug'
      )
      .eq('id', body.restaurant_id)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: 'Delivery não encontrado' }, { status: 404 })
    }

    if (!restaurant.ativo || restaurant.suspended || restaurant.status_pagamento !== 'ativo') {
      return NextResponse.json(
        { error: 'Este delivery não está aceitando pedidos' },
        { status: 400 }
      )
    }

    // Validar horário de funcionamento
    if (!checkIsOpen(restaurant.horario_funcionamento)) {
      return NextResponse.json(
        { error: 'Restaurante fechado no momento. Confira o horário de funcionamento.' },
        { status: 400 }
      )
    }

    // Validar delivery_mode: se terminal_only ou whatsapp_only, verificar compatibilidade
    if (restaurant.delivery_mode === 'whatsapp_only') {
      return NextResponse.json(
        { error: 'Este delivery aceita pedidos apenas via WhatsApp' },
        { status: 400 }
      )
    }

    if (restaurant.plan_slug === 'semente') {
      const { data: orderLimit, error: orderLimitError } = await supabase.rpc(
        'check_monthly_order_limit',
        { p_restaurant_id: body.restaurant_id }
      )

      if (orderLimitError) {
        console.error('Erro ao verificar limite mensal do plano semente:', orderLimitError)
        return NextResponse.json({ error: 'Erro ao validar limite do plano' }, { status: 500 })
      }

      if (orderLimit && orderLimit.allowed === false) {
        const current = Number(orderLimit.current || 0)
        const limit = Number(orderLimit.limit || 120)
        return NextResponse.json(
          {
            error:
              `Este canal digital atingiu ${current} de ${limit} pedidos do plano ${ENTRY_PLAN_NAME}. ` +
              'Faça upgrade para continuar recebendo pedidos sem limite.',
            code: 'SEMENTE_ORDER_LIMIT_REACHED',
            upgrade_needed: true,
          },
          { status: 403 }
        )
      }
    }

    // Validar endereço obrigatório para delivery
    if (body.tipo_entrega === 'delivery' || body.tipo_entrega === 'entrega') {
      if (!body.endereco_rua?.trim() || !body.endereco_bairro?.trim()) {
        return NextResponse.json({ error: 'Endereço é obrigatório para entregas' }, { status: 400 })
      }
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

    // Adicionar taxa de entrega se for delivery
    const isDelivery = body.tipo_entrega === 'delivery' || body.tipo_entrega === 'entrega'
    const taxaEntrega = isDelivery ? Number(restaurant.taxa_entrega || 0) : 0
    total += taxaEntrega

    if (!Number.isFinite(total) || total <= 0) {
      return NextResponse.json({ error: 'Total do pedido inválido' }, { status: 400 })
    }

    // Validar pedido mínimo
    const pedidoMinimo = Number(restaurant.pedido_minimo || 0)
    if (pedidoMinimo > 0 && total - taxaEntrega < pedidoMinimo) {
      return NextResponse.json(
        { error: `Pedido mínimo é R$ ${pedidoMinimo.toFixed(2).replace('.', ',')}` },
        { status: 400 }
      )
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
      tipo_entrega: normalizeDeliveryType(body.tipo_entrega),
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
    const itemsToInsert: OrderItemInsertPayload[] = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }))

    const itemsError = await insertOrderItemsWithCompat(supabase, itemsToInsert)

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

