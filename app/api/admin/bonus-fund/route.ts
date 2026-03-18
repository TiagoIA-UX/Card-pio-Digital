/**
 * Admin API — Fundo de Bônus
 *
 * GET  /api/admin/bonus-fund
 *   → { saldo_atual, total_entradas, total_saques, total_rendimentos,
 *        ultimas_movimentacoes (last 10), projecao_proximos_30dias }
 *
 * POST /api/admin/bonus-fund
 *   → registra rendimento externo no fundo (requer role = 'owner')
 *   Body: { valor: number, descricao: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

const rendimentoSchema = z.object({
  valor: z.number().positive(),
  descricao: z.string().min(1).max(500),
})

// ── GET — saldo + últimas movimentações + projeção ─────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()

  // Saldo consolidado via view
  const { data: saldoData, error: saldoErr } = await admin
    .from('bonus_fund_saldo')
    .select('*')
    .single()

  if (saldoErr) {
    console.error('[bonus-fund] Erro ao buscar saldo:', saldoErr)
    return NextResponse.json({ error: 'Erro ao buscar saldo' }, { status: 500 })
  }

  // Últimas 10 movimentações
  const { data: movimentacoes, error: movErr } = await admin
    .from('bonus_fund')
    .select('id, tipo, valor, descricao, created_at, restaurant_id, affiliate_id')
    .order('created_at', { ascending: false })
    .limit(10)

  if (movErr) {
    console.error('[bonus-fund] Erro ao buscar movimentações:', movErr)
    return NextResponse.json({ error: 'Erro ao buscar movimentações' }, { status: 500 })
  }

  // Projeção: média diária de entradas nos últimos 90 dias × 30
  const noventa = new Date()
  noventa.setDate(noventa.getDate() - 90)

  const { data: entradasRecentes, error: projErr } = await admin
    .from('bonus_fund')
    .select('valor')
    .eq('tipo', 'entrada')
    .gte('created_at', noventa.toISOString())

  const somaEntradas90 = projErr
    ? 0
    : (entradasRecentes ?? []).reduce((acc, r) => acc + Number(r.valor), 0)
  const projecao_proximos_30dias = Math.floor((somaEntradas90 / 90) * 30 * 100) / 100

  return NextResponse.json({
    saldo_atual: saldoData?.saldo_atual ?? 0,
    total_entradas: saldoData?.total_entradas ?? 0,
    total_saques: saldoData?.total_saques ?? 0,
    total_rendimentos: saldoData?.total_rendimentos ?? 0,
    ultimas_movimentacoes: movimentacoes ?? [],
    projecao_proximos_30dias,
  })
}

// ── POST — creditar rendimento externo (role = owner) ─────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (auth.role !== 'owner') {
    return NextResponse.json(
      { error: 'Apenas o owner pode creditar rendimentos no fundo' },
      { status: 403 }
    )
  }

  let body: z.infer<typeof rendimentoSchema>
  try {
    const raw = await req.json()
    const parsed = rendimentoSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { valor, descricao } = body

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('bonus_fund')
    .insert({ tipo: 'rendimento', valor, descricao })
    .select('id, tipo, valor, descricao, created_at')
    .single()

  if (error) {
    console.error('[bonus-fund] Erro ao creditar rendimento:', error)
    return NextResponse.json({ error: 'Erro ao creditar rendimento' }, { status: 500 })
  }

  return NextResponse.json({ success: true, movimentacao: data }, { status: 201 })
}
