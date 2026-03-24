/**
 * POST /api/avaliacoes/[id]/resposta — operador responde a uma avaliação
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { respostaAvaliacaoSchema } from '@/lib/schemas/avaliacao'
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMITS } from '@/lib/rate-limit'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, { params }: RouteParams) {
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

  const parsed = respostaAvaliacaoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', detalhes: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  // Verificar que a avaliação pertence a um restaurante do usuário
  const { data: avaliacao } = await admin
    .from('avaliacoes')
    .select('id, restaurant_id')
    .eq('id', id)
    .single()

  if (!avaliacao) {
    return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })
  }

  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id')
    .eq('id', avaliacao.restaurant_id)
    .eq('user_id', user.id)
    .single()

  if (!restaurant) {
    return NextResponse.json({ error: 'Sem permissão para responder esta avaliação' }, { status: 403 })
  }

  const { data, error } = await admin
    .from('avaliacoes')
    .update({ resposta: parsed.data.resposta, respondido_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, resposta, respondido_at')
    .single()

  if (error) {
    console.error('Erro ao responder avaliação:', error)
    return NextResponse.json({ error: 'Erro ao salvar resposta' }, { status: 500 })
  }

  return NextResponse.json({ success: true, avaliacao: data }, { headers: rl.headers })
}
