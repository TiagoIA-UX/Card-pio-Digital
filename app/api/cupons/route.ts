/**
 * GET  /api/cupons  — lista cupons do restaurante logado
 * POST /api/cupons  — cria novo cupom
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { criarCupomSchema } from '@/lib/schemas/cupom'
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMITS } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
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

  const admin = createAdminClient()

  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
  }

  const { data, error } = await admin
    .from('restaurant_coupons')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar cupons:', error)
    return NextResponse.json({ error: 'Erro ao buscar cupons' }, { status: 500 })
  }

  return NextResponse.json({ cupons: data }, { headers: rl.headers })
}

export async function POST(req: NextRequest) {
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

  const parsed = criarCupomSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', detalhes: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
  }

  const { data, error } = await admin
    .from('restaurant_coupons')
    .insert({ ...parsed.data, restaurant_id: restaurant.id })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Código de cupom já existe' }, { status: 409 })
    }
    console.error('Erro ao criar cupom:', error)
    return NextResponse.json({ error: 'Erro ao criar cupom' }, { status: 500 })
  }

  return NextResponse.json({ cupom: data }, { status: 201, headers: rl.headers })
}
