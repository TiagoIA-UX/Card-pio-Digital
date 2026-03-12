import type { SupabaseClient } from '@supabase/supabase-js'

export interface ValidatedCoupon {
  id: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
}

export interface CouponValidationResult {
  valid: boolean
  coupon?: ValidatedCoupon
  error?: string
}

/** Cupons padrão para seed automático quando não existem no banco */
const DEFAULT_COUPONS = [
  {
    code: 'GANHEI20%',
    discount_type: 'percentage' as const,
    discount_value: 20,
    min_purchase: 0,
    max_uses: 10,
    expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  },
  {
    code: 'BEMVINDO10',
    discount_type: 'percentage' as const,
    discount_value: 10,
    min_purchase: 0,
    max_uses: 100,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  },
]

async function ensureCouponExists(
  supabase: SupabaseClient,
  normalizedCode: string
): Promise<boolean> {
  const match = DEFAULT_COUPONS.find((c) => c.code === normalizedCode)
  if (!match) return false

  try {
    await supabase
      .from('coupons')
      .upsert(
        {
          ...match,
          current_uses: 0,
        },
        { onConflict: 'code', ignoreDuplicates: true }
      )
    return true
  } catch {
    return false
  }
}

/**
 * Valida cupom no servidor. Usado por validar-cupom e iniciar-onboarding.
 */
export async function validateCoupon(
  supabase: SupabaseClient,
  code: string,
  subtotal: number
): Promise<CouponValidationResult> {
  const normalizedCode = code.toUpperCase().trim()
  if (!normalizedCode || subtotal < 0) {
    return { valid: false, error: 'Código ou valor inválido' }
  }

  let { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', normalizedCode)
    .eq('is_active', true)
    .single()

  if ((error || !coupon) && (await ensureCouponExists(supabase, normalizedCode))) {
    const retry = await supabase
      .from('coupons')
      .select('*')
      .eq('code', normalizedCode)
      .eq('is_active', true)
      .single()
    coupon = retry.data
    error = retry.error
  }

  if (error || !coupon) {
    return { valid: false, error: 'Cupom não encontrado ou inválido' }
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, error: 'Cupom expirado' }
  }

  if (coupon.max_uses != null && coupon.current_uses >= coupon.max_uses) {
    return { valid: false, error: 'Cupom esgotado' }
  }

  if (coupon.min_purchase != null && subtotal < Number(coupon.min_purchase)) {
    return {
      valid: false,
      error: `Valor mínimo de R$ ${Number(coupon.min_purchase).toFixed(2)} para usar este cupom`,
    }
  }

  let discountValue = Number(coupon.discount_value)
  if (coupon.discount_type === 'percentage') {
    discountValue = Math.round(subtotal * (discountValue / 100))
  }
  discountValue = Math.min(discountValue, subtotal)

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue,
    },
  }
}
