/**
 * GET /api/afiliados/me
 * Retorna dados + estatísticas + posição no ranking + bônus do afiliado logado.
 */
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const authSupabase = await createServerClient()
  const {
    data: { session },
  } = await authSupabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id, code, nome, chave_pix, status, tier, created_at')
    .eq('user_id', session.user.id)
    .single()

  if (!affiliate) {
    return NextResponse.json({ affiliate: null })
  }

  // Busca em paralelo: referrals diretos, stats do ranking, bônus, e vendedores recrutados
  const [referralsResult, rankingResult, bonusesResult, redeResult, redeReferralsResult] =
    await Promise.all([
      admin
        .from('affiliate_referrals')
        .select('id, plano, valor_assinatura, comissao, status, referencia_mes, created_at')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false }),
      admin
        .from('affiliate_ranking')
        .select('posicao, is_lider, total_vendedores, rede_indicados, mrr_direto, mrr_rede')
        .eq('id', affiliate.id)
        .single(),
      admin
        .from('affiliate_bonuses')
        .select('id, nivel, valor_bonus, status, referencia_mes, created_at')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false }),
      // Vendedores que este afiliado recrutou
      admin
        .from('affiliates')
        .select('id, nome, code, status, created_at')
        .eq('lider_id', affiliate.id)
        .order('created_at', { ascending: false }),
      // Comissões de rede recebidas como líder
      admin
        .from('affiliate_referrals')
        .select('id, lider_comissao, lider_status, referencia_mes, created_at')
        .eq('lider_id', affiliate.id)
        .order('created_at', { ascending: false }),
    ])

  const refs = referralsResult.data ?? []
  const rankRow = rankingResult.data
  const posicao_ranking: number | null = rankRow?.posicao ?? null
  const is_lider: boolean = rankRow?.is_lider ?? false
  const bonuses = bonusesResult.data ?? []
  const vendedores = redeResult.data ?? []
  const rede_referrals = redeReferralsResult.data ?? []

  const stats = {
    total_indicados: refs.length,
    comissao_pendente: refs
      .filter((r) => r.status === 'pendente')
      .reduce((s, r) => s + Number(r.comissao ?? 0), 0),
    comissao_aprovada: refs
      .filter((r) => r.status === 'aprovado')
      .reduce((s, r) => s + Number(r.comissao ?? 0), 0),
    comissao_paga: refs
      .filter((r) => r.status === 'pago')
      .reduce((s, r) => s + Number(r.comissao ?? 0), 0),
    mrr_direto: Number(rankRow?.mrr_direto ?? 0),
    mrr_rede: Number(rankRow?.mrr_rede ?? 0),
    mrr_estimado: Number(rankRow?.mrr_direto ?? 0) + Number(rankRow?.mrr_rede ?? 0),
    total_vendedores: Number(rankRow?.total_vendedores ?? 0),
    rede_indicados: Number(rankRow?.rede_indicados ?? 0),
  }

  return NextResponse.json({
    affiliate,
    referrals: refs,
    stats,
    posicao_ranking,
    is_lider,
    bonuses,
    vendedores,
    rede_referrals,
  })
}
