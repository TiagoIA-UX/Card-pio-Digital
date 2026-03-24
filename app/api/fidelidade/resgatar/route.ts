/**
 * POST /api/fidelidade/resgatar — resgata pontos do cliente
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resgatarPontosSchema } from '@/lib/schemas/fidelidade'
import { withRateLimit, getRateLimitIdentifier, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await withRateLimit(getRateLimitIdentifier(req), RATE_LIMITS.checkout)
    if (rateLimit.limited) {
      return rateLimit.response
    }

    const authSupabase = await createServerClient()
    const {
      data: { user },
    } = await authSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const parsed = resgatarPontosSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', detalhes: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { cliente_telefone, pontos } = parsed.data

    const admin = createAdminClient()

    const { data: restaurant } = await admin
      .from('restaurants')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
    }

    // Verificar config de fidelidade
    const { data: config } = await admin
      .from('fidelidade_config')
      .select('id, resgate_minimo, valor_por_ponto, ativo')
      .eq('restaurant_id', restaurant.id)
      .single()

    if (!config || !config.ativo) {
      return NextResponse.json(
        { error: 'Programa de fidelidade não ativo' },
        { status: 422 }
      )
    }

    if (pontos < config.resgate_minimo) {
      return NextResponse.json(
        { error: `Mínimo para resgate é ${config.resgate_minimo} pontos` },
        { status: 422 }
      )
    }

    // Buscar cliente
    const { data: cliente } = await admin
      .from('fidelidade_clientes')
      .select('id, pontos_acumulados, pontos_resgatados, pontos_expirados')
      .eq('restaurant_id', restaurant.id)
      .eq('cliente_telefone', cliente_telefone)
      .single()

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado no programa' }, { status: 404 })
    }

    const pontosDisponiveis = Math.max(
      0,
      cliente.pontos_acumulados - cliente.pontos_resgatados - cliente.pontos_expirados
    )

    if (pontos > pontosDisponiveis) {
      return NextResponse.json(
        { error: `Saldo insuficiente. Disponível: ${pontosDisponiveis} pontos` },
        { status: 422 }
      )
    }

    const valorDesconto = pontos * config.valor_por_ponto

    // Atualizar pontos e registrar transação
    const [{ error: updateError }, { error: txError }] = await Promise.all([
      admin
        .from('fidelidade_clientes')
        .update({ pontos_resgatados: cliente.pontos_resgatados + pontos })
        .eq('id', cliente.id),
      admin.from('fidelidade_transacoes').insert({
        restaurant_id: restaurant.id,
        cliente_id: cliente.id,
        tipo: 'debito',
        pontos,
        descricao: `Resgate de ${pontos} pontos — desconto de R$ ${valorDesconto.toFixed(2)}`,
      }),
    ])

    if (updateError || txError) {
      console.error('Erro no resgate:', updateError ?? txError)
      return NextResponse.json({ error: 'Erro ao processar resgate' }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        pontos_resgatados: pontos,
        valor_desconto: valorDesconto,
        pontos_restantes: pontosDisponiveis - pontos,
      },
      { headers: rateLimit.headers }
    )
  } catch (error) {
    console.error('Erro interno no resgate de fidelidade:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
