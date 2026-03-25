import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getRateLimitIdentifier, RATE_LIMITS, withRateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  delivery_mode: z.enum(['whatsapp_only', 'terminal_only', 'hybrid']),
})

export async function PATCH(req: NextRequest) {
  try {
    const rateLimit = await withRateLimit(getRateLimitIdentifier(req), RATE_LIMITS.auth)
    if (rateLimit.limited) return rateLimit.response

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401, headers: rateLimit.headers }
      )
    }

    const raw = await req.json().catch(() => ({}))
    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Modo inválido', details: parsed.error.flatten().fieldErrors },
        { status: 400, headers: rateLimit.headers }
      )
    }

    const newMode = parsed.data.delivery_mode

    let restaurant: {
      id: string
      delivery_mode: string | null
    } | null = null

    const byOwner = await supabase
      .from('restaurants')
      .select('id, delivery_mode')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (byOwner.data) {
      restaurant = byOwner.data
    } else {
      const byUser = await supabase
        .from('restaurants')
        .select('id, delivery_mode')
        .eq('user_id', user.id)
        .maybeSingle()

      if (byUser.data) {
        restaurant = byUser.data
      }
    }

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurante não encontrado' },
        { status: 404, headers: rateLimit.headers }
      )
    }

    const previousMode = restaurant.delivery_mode ?? 'whatsapp_only'

    if (previousMode === newMode) {
      return NextResponse.json(
        { success: true, delivery_mode: newMode, changed: false, previous_mode: previousMode },
        { headers: rateLimit.headers }
      )
    }

    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ delivery_mode: newMode })
      .eq('id', restaurant.id)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500, headers: rateLimit.headers }
      )
    }

    console.log(
      '[DELIVERY_MODE_CHANGED]',
      JSON.stringify({
        restaurantId: restaurant.id,
        from: previousMode,
        to: newMode,
        userId: user.id,
      })
    )

    return NextResponse.json(
      {
        success: true,
        delivery_mode: newMode,
        previous_mode: previousMode,
        changed: true,
      },
      { headers: rateLimit.headers }
    )
  } catch (err) {
    console.error('[delivery-mode/route] erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
