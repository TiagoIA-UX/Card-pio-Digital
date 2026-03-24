/**
 * GET  /api/avaliacoes?restaurant_id=  — lista avaliações públicas
 * POST /api/avaliacoes                 — envia nova avaliação
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { criarAvaliacaoSchema } from '@/lib/schemas/avaliacao'
import { withRateLimit, getRateLimitIdentifier, RATE_LIMITS } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  try {
    const rateLimit = await withRateLimit(getRateLimitIdentifier(req), RATE_LIMITS.public)
    if (rateLimit.limited) {
      return rateLimit.response
    }

    const url = new URL(req.url)
    const restaurantId = url.searchParams.get('restaurant_id')
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 50)

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurant_id é obrigatório' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('avaliacoes')
      .select('id, cliente_nome, nota, comentario, resposta, respondido_at, created_at')
      .eq('restaurant_id', restaurantId)
      .eq('publicada', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Erro ao buscar avaliações:', error)
      return NextResponse.json({ error: 'Erro ao buscar avaliações' }, { status: 500 })
    }

    const media =
      data && data.length > 0
        ? data.reduce((acc, a) => acc + a.nota, 0) / data.length
        : null

    return NextResponse.json(
      { avaliacoes: data, total: data?.length ?? 0, media_nota: media ? Math.round(media * 10) / 10 : null },
      { headers: rateLimit.headers }
    )
  } catch (error) {
    console.error('Erro interno ao buscar avaliações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

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

    const parsed = criarAvaliacaoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', detalhes: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // Verificar se restaurante existe
    const { data: restaurant } = await admin
      .from('restaurants')
      .select('id')
      .eq('id', parsed.data.restaurant_id)
      .single()

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
    }

    const { data, error } = await admin
      .from('avaliacoes')
      .insert(parsed.data)
      .select('id, nota, created_at')
      .single()

    if (error) {
      console.error('Erro ao criar avaliação:', error)
      return NextResponse.json({ error: 'Erro ao salvar avaliação' }, { status: 500 })
    }

    return NextResponse.json(
      { success: true, avaliacao: data },
      { status: 201, headers: rateLimit.headers }
    )
  } catch (error) {
    console.error('Erro interno ao criar avaliação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
