/**
 * GET  /api/fidelidade/config — obtém configuração do programa
 * POST /api/fidelidade/config — cria ou atualiza configuração
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { criarFidelidadeConfigSchema } from '@/lib/schemas/fidelidade'
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
    .from('fidelidade_config')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .maybeSingle()

  if (error) {
    console.error('Erro ao buscar config de fidelidade:', error)
    return NextResponse.json({ error: 'Erro ao buscar configuração' }, { status: 500 })
  }

  return NextResponse.json({ config: data }, { headers: rl.headers })
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

  const parsed = criarFidelidadeConfigSchema.safeParse(body)
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
    .from('fidelidade_config')
    .upsert(
      { ...parsed.data, restaurant_id: restaurant.id },
      { onConflict: 'restaurant_id' }
    )
    .select()
    .single()

  if (error) {
    console.error('Erro ao salvar config de fidelidade:', error)
    return NextResponse.json({ error: 'Erro ao salvar configuração' }, { status: 500 })
  }

  return NextResponse.json({ config: data }, { headers: rl.headers })
}
