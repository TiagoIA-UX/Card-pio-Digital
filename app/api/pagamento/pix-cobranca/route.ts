import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import { resolveDeliveryMode, isTerminalEnabled } from '@/lib/domains/core/delivery-mode'
import { withRateLimit, getRateLimitIdentifier } from '@/lib/shared/rate-limit'
import { z } from 'zod'

const CobrancaRequestSchema = z.object({
  restaurantSlug: z.string().min(1),
  pedidoId: z.string().uuid(),
  valor: z.number().positive(),
  descricao: z.string().optional(),
})

export async function POST(req: NextRequest) {
  // Rate limit
  const rateLimit = await withRateLimit(getRateLimitIdentifier(req), {
    limit: 20,
    windowMs: 60000,
  })
  if (rateLimit.limited) {
    return rateLimit.response
  }

  try {
    const body = await req.json()
    const validation = CobrancaRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { restaurantSlug, pedidoId, valor, descricao } = validation.data

    // Get restaurant and verify delivery mode
    const adminDb = createAdminClient()
    const restaurantResult = await adminDb
      .from('restaurants')
      .select('id, nome, ativo, status_pagamento, suspended, delivery_mode, customizacao')
      .eq('slug', restaurantSlug)
      .maybeSingle()

    if (!restaurantResult.data) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    const restaurant = restaurantResult.data

    // Verify restaurant is active
    if (!restaurant.ativo || restaurant.status_pagamento !== 'ativo' || restaurant.suspended) {
      return NextResponse.json({ error: 'Delivery inactive' }, { status: 403 })
    }

    // Verify delivery mode allows payment
    const deliveryMode = resolveDeliveryMode(restaurant.delivery_mode, restaurant.customizacao)
    const isTerminal = isTerminalEnabled(deliveryMode)

    if (!isTerminal) {
      return NextResponse.json(
        {
          error: 'Delivery mode does not support payments',
          deliveryMode,
        },
        { status: 403 }
      )
    }

    // Verify pedido belongs to this restaurant
    const pedidoResult = await adminDb
      .from('orders')
      .select('id, restaurant_id, status, total, created_at')
      .eq('id', pedidoId)
      .eq('restaurant_id', restaurant.id)
      .maybeSingle()

    if (!pedidoResult.data) {
      return NextResponse.json(
        { error: 'Order not found or does not belong to this delivery' },
        { status: 404 }
      )
    }

    const pedido = pedidoResult.data

    // Verify amount matches
    if (Math.abs(pedido.total - valor) > 0.01) {
      return NextResponse.json(
        {
          error: 'Amount mismatch',
          expected: pedido.total,
          provided: valor,
        },
        { status: 400 }
      )
    }

    // Generate PIX payload (mock)
    const pixKey = `${restaurant.id.substring(0, 8)}-${Date.now()}`
    const qrCode = `00020126580014br.gov.bcb.pix0136${pixKey}520400005303986540${valor.toFixed(2).padStart(10, '0')}5802BR5913${restaurant.nome.substring(0, 25).padEnd(25, ' ')}6009SAO PAULO62070503***63041234`

    // Store cobrança record
    const cobrancaResult = await adminDb
      .from('cobrancas_pix')
      .insert({
        restaurant_id: restaurant.id,
        pedido_id: pedidoId,
        valor,
        qr_code: qrCode,
        pix_key: pixKey,
        descricao: descricao || `Cobrança para pedido #${pedidoId.substring(0, 8)}`,
        status: 'pendente',
      })
      .select()
      .single()

    if (cobrancaResult.error) {
      console.error('Error storing cobrança:', cobrancaResult.error)
      return NextResponse.json(
        {
          error: 'Failed to create payment charge',
        },
        { status: 500 }
      )
    }

    // Audit log
    await adminDb.from('audit_logs').insert({
      actor: 'system',
      action: 'cobranca_pix_criada',
      resource_type: 'cobranca_pix',
      resource_id: cobrancaResult.data.id,
      restaurant_id: restaurant.id,
      metadata: {
        pedido_id: pedidoId,
        valor,
      },
    })

    return NextResponse.json({
      success: true,
      cobranca: {
        id: cobrancaResult.data.id,
        valor,
        qrCode: qrCode,
        copyPaste: `00020126580014br.gov.bcb.pix0136${pixKey}520400005303986540${valor.toFixed(2).padStart(10, '0')}5802BR5913${restaurant.nome.substring(0, 25).padEnd(25, ' ')}6009SAO PAULO62070503***63041234`,
        descricao: cobrancaResult.data.descricao,
        criado_em: cobrancaResult.data.created_at,
      },
      pedido: {
        id: pedido.id,
        status: pedido.status,
      },
    })
  } catch (error) {
    console.error('Error in PIX cobrança endpoint:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
