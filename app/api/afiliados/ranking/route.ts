/**
 * GET /api/afiliados/ranking
 * Retorna os top-50 afiliados (dados públicos).
 * Não requer autenticação — é uma vitrine pública.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Marcos de bônus por volume
const BONUS_TIERS = [
  { nivel: 50, valor: 1000 },
  { nivel: 30, valor: 500 },
  { nivel: 10, valor: 200 },
]

export async function GET() {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('affiliate_ranking')
    .select('id, nome_publico, tier, total_indicados, mrr_estimado, posicao')
    .order('posicao', { ascending: true })
    .limit(50)

  if (error) {
    console.error('[ranking]', error)
    return NextResponse.json({ ranking: [] })
  }

  const ranking = (data ?? []).map((r) => {
    // Próximo bônus que o afiliado ainda não atingiu
    const proximo_bonus = BONUS_TIERS.find((b) => Number(r.total_indicados) < b.nivel) ?? null

    return {
      posicao: Number(r.posicao),
      nome: r.nome_publico,
      tier: r.tier,
      total_indicados: Number(r.total_indicados),
      mrr_estimado: Number(r.mrr_estimado),
      proximo_bonus,
    }
  })

  return NextResponse.json(
    { ranking },
    {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    }
  )
}
