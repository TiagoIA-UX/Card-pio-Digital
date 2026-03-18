/**
 * POST /api/afiliados/indicacao
 * Chamado durante onboarding/checkout quando existe cookie aff_ref.
 *
 * Modelo 2 níveis:
 *   Vendedor (quem indicou o restaurante) → 30%
 *   Líder    (quem recrutou o vendedor)   → 10%
 *   Empresa                               → 60%
 *
 * Body: { tenant_id, plano, valor_assinatura, ref_code }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PCT_VENDEDOR = 0.3
const PCT_LIDER = 0.1

export async function POST(req: NextRequest) {
  // Rota interna — protegida por service role key no header
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { tenant_id, plano, valor_assinatura, ref_code } = body

  if (!tenant_id || !ref_code) {
    return NextResponse.json({ error: 'tenant_id e ref_code são obrigatórios' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verifica se esse tenant já foi indicado (evita duplicata)
  const { data: dup } = await admin
    .from('affiliate_referrals')
    .select('id')
    .eq('tenant_id', tenant_id)
    .single()

  if (dup) {
    return NextResponse.json({ message: 'Indicação já registrada' })
  }

  // Busca vendedor pelo código (inclui lider_id para calcular comissão de rede)
  const { data: vendedor } = await admin
    .from('affiliates')
    .select('id, status, lider_id')
    .eq('code', ref_code)
    .single()

  if (!vendedor || vendedor.status !== 'ativo') {
    return NextResponse.json({ message: 'Afiliado não encontrado ou inativo' })
  }

  const valorAssinatura = Number(valor_assinatura ?? 0)
  const comissao = parseFloat((valorAssinatura * PCT_VENDEDOR).toFixed(2))
  const referenciaMes = new Date().toISOString().slice(0, 7)

  // Resolve comissão do líder (se o vendedor tiver um líder ativo)
  let lider_id: string | null = null
  let lider_comissao: number | null = null
  if (vendedor.lider_id) {
    const { data: lider } = await admin
      .from('affiliates')
      .select('id, status')
      .eq('id', vendedor.lider_id)
      .single()
    if (lider && lider.status === 'ativo') {
      lider_id = lider.id
      lider_comissao = parseFloat((valorAssinatura * PCT_LIDER).toFixed(2))
    }
  }

  const { error } = await admin.from('affiliate_referrals').insert({
    affiliate_id: vendedor.id,
    tenant_id,
    plano: plano ?? null,
    valor_assinatura: valorAssinatura || null,
    comissao: comissao || null,
    referencia_mes: referenciaMes,
    status: 'pendente',
    lider_id,
    lider_comissao,
    lider_status: lider_id ? 'pendente' : null,
  })

  if (error) {
    console.error('[afiliados/indicacao]', error)
    return NextResponse.json({ error: 'Erro ao registrar indicação' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, comissao, lider_comissao })
}
