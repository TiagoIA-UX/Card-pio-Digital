/**
 * PATCH /api/cupons/[id] — atualiza cupom
 * DELETE /api/cupons/[id] — remove cupom
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { atualizarCupomSchema } from '@/lib/schemas/cupom'
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMITS } from '@/lib/rate-limit'

interface RouteParams {
  params: Promise<{ id: string }>
}

async function getRestaurantId(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('restaurants')
    .select('id')
    .eq('user_id', userId)
    .single()
  return data?.id ?? null
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const authSupabase = await createServerClient()
  const {
    data: { user },
  } = await authSupabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const rl = await checkRateLimit(getRateLimitIdentifier(req, user.id), RATE_LIMITS.public)
  if (!rl.success) {
    return NextResponse.json({ error: 'Muitas requisições' }, { status: 429, headers: rl.headers })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = atualizarCupomSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', detalhes: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const restaurantId = await getRestaurantId(user.id)
  if (!restaurantId) {
    return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('restaurant_coupons')
    .update(parsed.data)
    .eq('id', id)
    .eq('restaurant_id', restaurantId)
    .select()
    .single()

  if (error || !data) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Código de cupom já existe' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ cupom: data }, { headers: rl.headers })
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const authSupabase = await createServerClient()
  const {
    data: { user },
  } = await authSupabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const rl = await checkRateLimit(getRateLimitIdentifier(req, user.id), RATE_LIMITS.public)
  if (!rl.success) {
    return NextResponse.json({ error: 'Muitas requisições' }, { status: 429, headers: rl.headers })
  }

  const restaurantId = await getRestaurantId(user.id)
  if (!restaurantId) {
    return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('restaurant_coupons')
    .delete()
    .eq('id', id)
    .eq('restaurant_id', restaurantId)

  if (error) {
    console.error('Erro ao remover cupom:', error)
    return NextResponse.json({ error: 'Erro ao remover cupom' }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { headers: rl.headers })
}
