import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const validateCouponSchema = z.object({
  code: z.string().min(1, 'Código do cupom é obrigatório'),
  subtotal: z.number().min(0, 'Subtotal inválido')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar input
    const result = validateCouponSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { valid: false, error: 'Dados inválidos' },
        { status: 400 }
      )
    }

    const { code, subtotal } = result.data
    const normalizedCode = code.toUpperCase().trim()

    // Buscar cupom no banco
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', normalizedCode)
      .eq('is_active', true)
      .single()

    if (error || !coupon) {
      return NextResponse.json({
        valid: false,
        error: 'Cupom não encontrado ou inválido'
      })
    }

    // Verificar expiração
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'Cupom expirado'
      })
    }

    // Verificar limite de usos
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return NextResponse.json({
        valid: false,
        error: 'Cupom esgotado'
      })
    }

    // Verificar valor mínimo de compra
    if (coupon.min_purchase && subtotal < coupon.min_purchase) {
      return NextResponse.json({
        valid: false,
        error: `Valor mínimo de R$ ${coupon.min_purchase.toFixed(2)} para usar este cupom`
      })
    }

    // Calcular desconto
    let discountValue = coupon.discount_value
    if (coupon.discount_type === 'percentage') {
      discountValue = Math.round(subtotal * (coupon.discount_value / 100))
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: discountValue
      }
    })

  } catch (error) {
    console.error('Erro ao validar cupom:', error)
    return NextResponse.json(
      { valid: false, error: 'Erro ao validar cupom' },
      { status: 500 }
    )
  }
}
