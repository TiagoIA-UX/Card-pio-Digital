import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/supabase/server'
import { z } from 'zod'

const GetStatusSchema = z.object({
  restaurant_id: z.string().uuid().optional(),
})

/**
 * GET /api/subscription/status
 * Retorna status da assinatura para verificar se pode editar
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // ── Buscar parametro restaurant_id ──────────────────────
    const { searchParams } = new URL(request.url)
    const parsed = GetStatusSchema.safeParse({
      restaurant_id: searchParams.get('restaurant_id') ?? undefined,
    })

    if (!parsed.success || !parsed.data.restaurant_id) {
      return NextResponse.json({ error: 'restaurant_id é obrigatório' }, { status: 400 })
    }

    const restaurantId = parsed.data.restaurant_id

    // ── Chamar RPC ──────────────────────────────────────────
    const { data, error } = await supabase.rpc('can_edit_restaurant', {
      p_restaurant_id: restaurantId,
    })

    if (error) {
      console.error('Erro ao verificar subscription:', error)
      return NextResponse.json({ error: 'Erro ao verificar status' }, { status: 500 })
    }

    const status = Array.isArray(data) ? data[0] : data

    return NextResponse.json({
      success: true,
      can_edit: status?.can_edit || false,
      is_blocked: status?.is_blocked || false,
      reason: status?.reason,
      days_until_block: status?.days_until_block,
      subscription_status: status?.subscription_status,
    })
  } catch (error) {
    console.error('Erro em GET /api/subscription/status:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

