/**
 * GET /api/fidelidade/saldo?telefone=XX — saldo de pontos do cliente
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { withRateLimit, getRateLimitIdentifier, RATE_LIMITS } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  try {
    const rateLimit = await withRateLimit(getRateLimitIdentifier(req), RATE_LIMITS.public)
    if (rateLimit.limited) {
      return rateLimit.response
    }

    const url = new URL(req.url)
    const telefone = url.searchParams.get('telefone')
    const restaurantId = url.searchParams.get('restaurant_id')

    if (!telefone || !restaurantId) {
      return NextResponse.json(
        { error: 'telefone e restaurant_id são obrigatórios' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    const [{ data: config }, { data: cliente }] = await Promise.all([
      admin
        .from('fidelidade_config')
        .select('pontos_por_real, valor_por_ponto, resgate_minimo, nome_programa')
        .eq('restaurant_id', restaurantId)
        .eq('ativo', true)
        .maybeSingle(),
      admin
        .from('fidelidade_clientes')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('cliente_telefone', telefone)
        .maybeSingle(),
    ])

    if (!config) {
      return NextResponse.json(
        { error: 'Programa de fidelidade não ativo para este restaurante' },
        { status: 404 }
      )
    }

    const pontosDisponiveis = cliente
      ? Math.max(0, cliente.pontos_acumulados - cliente.pontos_resgatados - cliente.pontos_expirados)
      : 0

    return NextResponse.json(
      {
        config,
        cliente: cliente
          ? {
              ...cliente,
              pontos_disponiveis: pontosDisponiveis,
            }
          : null,
        pontos_disponiveis: pontosDisponiveis,
      },
      { headers: rateLimit.headers }
    )
  } catch (error) {
    console.error('Erro ao buscar saldo de fidelidade:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
