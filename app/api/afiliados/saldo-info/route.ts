/**
 * GET /api/afiliados/saldo-info
 *
 * Retorna informações sobre o saldo aprovado e o rendimento estimado
 * enquanto o saldo aguarda o próximo pagamento quinzenal (dias 1 e 15).
 *
 * Campos retornados:
 *   aprovado_aguardando   — soma das comissões aprovadas ainda não pagas
 *   proxima_data_pagamento — próximo ciclo 1/15 (YYYY-MM-DD)
 *   dias_ate_pagamento    — dias corridos até o próximo ciclo (mínimo 0)
 *   rendimento_estimado   — estimativa CDI 13% a.a. · apenas informativo
 *
 * Nota: rendimento_estimado é estritamente informativo.
 * A empresa não garante esse valor — varia com o CDI real.
 */
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getNextAffiliatePayoutDate } from '@/lib/affiliate-payout'

/** CDI diário conservador: 13% ao ano / 360 dias = 0,036% ao dia */
const CDI_DIARIO = 0.13 / 360

export async function GET() {
  const authSupabase = await createServerClient()
  const {
    data: { user },
  } = await authSupabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Busca o afiliado pelo user_id
  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!affiliate) {
    return NextResponse.json({ error: 'Afiliado não cadastrado' }, { status: 404 })
  }

  const [refsVendedor, refsLider] = await Promise.all([
    admin
      .from('affiliate_referrals')
      .select('comissao')
      .eq('affiliate_id', affiliate.id)
      .eq('status', 'aprovado'),
    admin
      .from('affiliate_referrals')
      .select('lider_comissao')
      .eq('lider_id', affiliate.id)
      .eq('lider_status', 'aprovado'),
  ])

  const aprovado_aguardando =
    (refsVendedor.data ?? []).reduce((sum, r) => sum + Number(r.comissao ?? 0), 0) +
    (refsLider.data ?? []).reduce((sum, r) => sum + Number(r.lider_comissao ?? 0), 0)

  const { data: proxima_data_pagamento, dias: dias_ate_pagamento } = getNextAffiliatePayoutDate()

  // Rendimento estimado: saldo × CDI_DIARIO × dias — arredondado para baixo
  const rendimento_estimado = Math.max(
    0,
    Math.floor(aprovado_aguardando * CDI_DIARIO * dias_ate_pagamento * 100) / 100
  )

  return NextResponse.json({
    aprovado_aguardando,
    proxima_data_pagamento,
    dias_ate_pagamento,
    rendimento_estimado,
  })
}
