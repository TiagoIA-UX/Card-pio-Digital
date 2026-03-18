import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { validateCoupon } from '@/lib/coupon-validation'
import { getRateLimitIdentifier, RATE_LIMITS, withRateLimit } from '@/lib/rate-limit'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const validateCouponSchema = z.object({
  code: z.string().min(1, 'Código do cupom é obrigatório'),
  subtotal: z.number().min(0, 'Subtotal inválido'),
})

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await withRateLimit(getRateLimitIdentifier(request), RATE_LIMITS.checkout)
    if (rateLimit.limited) {
      return rateLimit.response
    }

    const supabase = getSupabase()
    const body = await request.json()

    const result = validateCouponSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { valid: false, error: 'Dados inválidos' },
        { status: 400, headers: rateLimit.headers }
      )
    }

    const { code, subtotal } = result.data
    const validation = await validateCoupon(supabase, code, subtotal)

    if (!validation.valid) {
      return NextResponse.json(
        {
          valid: false,
          error: validation.error,
        },
        { headers: rateLimit.headers }
      )
    }

    return NextResponse.json(
      {
        valid: true,
        coupon: validation.coupon,
      },
      { headers: rateLimit.headers }
    )
  } catch (error) {
    console.error('Erro ao validar cupom:', error)
    return NextResponse.json({ valid: false, error: 'Erro ao validar cupom' }, { status: 500 })
  }
}
