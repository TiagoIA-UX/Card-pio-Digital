/**
 * Admin API — Gerenciamento de comissões de afiliados
 *
 * GET  /api/admin/afiliados/comissoes
 *   → lista afiliados com saldo aprovado pendente de pagamento
 *
 * POST /api/admin/afiliados/comissoes
 *   → marca comissões de um afiliado como pagas e registra pagamento
 *   Body: { affiliate_id, valor, referencia_mes?, observacao? }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@supabase/supabase-js'

// Verifica se o usuário autenticado é admin
async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!authHeader) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${authHeader}` } } }
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single()

  if (!profile || !['admin', 'owner'].includes(profile.role)) return null
  return user
}

// ── GET — lista saldos ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('affiliate_balances')
    .select('*')
    .gt('saldo_aprovado', 0)
    .order('saldo_aprovado', { ascending: false })

  if (error) {
    console.error('Erro ao buscar saldos:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }

  return NextResponse.json({ balances: data ?? [] })
}

// ── POST — registrar pagamento ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { affiliate_id, valor, referencia_mes, observacao } = body

  if (!affiliate_id || !valor || Number(valor) <= 0) {
    return NextResponse.json({ error: 'affiliate_id e valor são obrigatórios' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 1. Busca afiliado para obter chave PIX
  const { data: affiliateData, error: affErr } = await admin
    .from('affiliates')
    .select('id, nome, chave_pix, status')
    .eq('id', affiliate_id)
    .single()

  if (affErr || !affiliateData) {
    return NextResponse.json({ error: 'Afiliado não encontrado' }, { status: 404 })
  }

  // 2. Registra o pagamento
  const { data: payment, error: payErr } = await admin
    .from('affiliate_commission_payments')
    .insert({
      affiliate_id,
      valor: Number(valor),
      referencia_mes: referencia_mes ?? new Date().toISOString().slice(0, 7),
      metodo: 'pix',
      chave_pix_usada: affiliateData.chave_pix ?? null,
      observacao: observacao ?? null,
      pago_por: user.id,
    })
    .select()
    .single()

  if (payErr || !payment) {
    console.error('Erro ao registrar pagamento:', payErr)
    return NextResponse.json({ error: 'Erro ao registrar pagamento' }, { status: 500 })
  }

  // 3. Marca as comissões aprovadas como pagas (cobrindo até o valor pago)
  // Vendedor
  await admin
    .from('affiliate_referrals')
    .update({ status: 'pago' })
    .eq('affiliate_id', affiliate_id)
    .eq('status', 'aprovado')
    .not('comissao', 'is', null)

  // Líder
  await admin
    .from('affiliate_referrals')
    .update({ lider_status: 'pago' })
    .eq('lider_id', affiliate_id)
    .eq('lider_status', 'aprovado')
    .not('lider_comissao', 'is', null)

  return NextResponse.json({
    success: true,
    payment_id: payment.id,
    affiliate: affiliateData.nome,
    valor_pago: Number(valor),
    chave_pix: affiliateData.chave_pix,
  })
}
