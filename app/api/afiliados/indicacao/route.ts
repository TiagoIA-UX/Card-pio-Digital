/**
 * POST /api/afiliados/indicacao
 * Chamado durante onboarding/checkout quando existe cookie aff_ref.
 *
 * Modelo 2 níveis:
 *   Vendedor (quem indicou o restaurante) → commission_rate% (mín. 30%)
 *   Líder    (quem recrutou o vendedor)   → 10%
 *   Empresa                               → restante
 *
 * Body: { tenant_id, plano, valor_assinatura, ref_code }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTierForReferrals, getCommissionRate } from '@/lib/get-affiliate-tier'
import crypto from 'node:crypto'

const PCT_LIDER = 0.1

/**
 * Valida HMAC-SHA256 do header X-Internal-Signature.
 * O webhook gera: HMAC(INTERNAL_API_SECRET, body_raw).
 */
function isInternalCallAuthorized(req: NextRequest, bodyRaw: string): boolean {
  const secret = process.env.INTERNAL_API_SECRET
  // Fallback: se INTERNAL_API_SECRET não existe, aceitar via service role key
  // até que a variável seja configurada na Vercel.
  if (!secret) {
    const authHeader = req.headers.get('authorization')
    return authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
  }
  const signature = req.headers.get('x-internal-signature') ?? ''
  if (!signature) return false
  const expected = crypto.createHmac('sha256', secret).update(bodyRaw).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

export async function POST(req: NextRequest) {
  const bodyRaw = await req.text()
  if (!isInternalCallAuthorized(req, bodyRaw)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = JSON.parse(bodyRaw) as Record<string, unknown>
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

  // Busca vendedor pelo código (inclui lider_id e commission_rate para calcular comissão real)
  const { data: vendedor } = await admin
    .from('affiliates')
    .select('id, status, lider_id, commission_rate')
    .eq('code', ref_code)
    .single()

  if (!vendedor || vendedor.status !== 'ativo') {
    return NextResponse.json({ message: 'Afiliado não encontrado ou inativo' })
  }

  const valorAssinatura = Number(valor_assinatura ?? 0)
  // Usa o commission_rate real do afiliado (30%, 32% ou 35% dependendo do tier)
  const pctVendedor = Number(vendedor.commission_rate ?? 30) / 100
  const comissao = parseFloat((valorAssinatura * pctVendedor).toFixed(2))
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

  // ── Recalcular tier e commission_rate do vendedor ──────────────────────────
  // Conta total de indicações (qualquer status) para determinar o tier correto
  try {
    const { count: totalRefs } = await admin
      .from('affiliate_referrals')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate_id', vendedor.id)

    const novoTier = getTierForReferrals(totalRefs ?? 0)
    const novaComissao = getCommissionRate(novoTier)
    await admin
      .from('affiliates')
      .update({ tier: novoTier.slug, commission_rate: novaComissao })
      .eq('id', vendedor.id)
  } catch (tierErr) {
    console.warn('[afiliados/indicacao] Aviso: falha ao atualizar tier do afiliado:', tierErr)
  }

  return NextResponse.json({ ok: true, comissao, lider_comissao })
}
