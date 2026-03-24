/**
 * POST /api/cupons/validar — valida cupom no checkout do cliente
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validarCupomSchema } from '@/lib/schemas/cupom'
import { withRateLimit, getRateLimitIdentifier, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await withRateLimit(getRateLimitIdentifier(req), RATE_LIMITS.checkout)
    if (rateLimit.limited) {
      return rateLimit.response
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const parsed = validarCupomSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', detalhes: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { code, restaurant_id, valor_pedido } = parsed.data

    const admin = createAdminClient()

    const { data: cupom, error } = await admin
      .from('restaurant_coupons')
      .select('id, code, discount_type, discount_value, min_purchase, max_uses, current_uses, expires_at, is_active')
      .eq('restaurant_id', restaurant_id)
      .eq('code', code)
      .single()

    if (error || !cupom) {
      return NextResponse.json({ valido: false, erro: 'Cupom não encontrado' })
    }

    if (!cupom.is_active) {
      return NextResponse.json({ valido: false, erro: 'Cupom inativo' })
    }

    if (cupom.expires_at && new Date(cupom.expires_at) < new Date()) {
      return NextResponse.json({ valido: false, erro: 'Cupom expirado' })
    }

    if (cupom.max_uses !== null && cupom.current_uses >= cupom.max_uses) {
      return NextResponse.json({ valido: false, erro: 'Cupom esgotado' })
    }

    if (valor_pedido < cupom.min_purchase) {
      return NextResponse.json({
        valido: false,
        erro: `Pedido mínimo de R$ ${cupom.min_purchase.toFixed(2)} para usar este cupom`,
      })
    }

    const desconto =
      cupom.discount_type === 'percentage'
        ? (valor_pedido * cupom.discount_value) / 100
        : Math.min(cupom.discount_value, valor_pedido)

    return NextResponse.json(
      {
        valido: true,
        cupom: {
          id: cupom.id,
          code: cupom.code,
          discount_type: cupom.discount_type,
          discount_value: cupom.discount_value,
        },
        desconto: Math.round(desconto * 100) / 100,
      },
      { headers: rateLimit.headers }
    )
  } catch (error) {
    console.error('Erro ao validar cupom:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
