/**
 * GET /api/afiliados/saldo-info
 *
 * Retorna informações sobre o saldo aprovado e o rendimento estimado
 * enquanto o saldo aguarda o pagamento (próximo dia 5).
 *
 * Campos retornados:
 *   aprovado_aguardando   — soma das comissões com status 'aprovado'
 *   proxima_data_pagamento — próximo dia 5 (YYYY-MM-DD)
 *   dias_ate_pagamento    — dias corridos até o dia 5 (mínimo 0)
 *   rendimento_estimado   — estimativa CDI 13% a.a. · apenas informativo
 *
 * Nota: rendimento_estimado é estritamente informativo.
 * A empresa não garante esse valor — varia com o CDI real.
 */
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/** CDI diário conservador: 13% ao ano / 360 dias = 0,036% ao dia */
const CDI_DIARIO = 0.13 / 360

/** Retorna o próximo dia 5 do mês (UTC) e dias restantes. */
function proximoDia5(): { data: string; dias: number } {
  const now = new Date()
  const ano = now.getUTCFullYear()
  const mes = now.getUTCMonth()
  const dia = now.getUTCDate()

  // Se hoje é antes do dia 5, o próximo pagamento é no dia 5 deste mês;
  // caso contrário, dia 5 do mês seguinte.
  const alvo = new Date(Date.UTC(ano, dia < 5 ? mes : mes + 1, 5))

  const msRestantes = alvo.getTime() - now.getTime()
  const dias = Math.max(0, Math.floor(msRestantes / (1000 * 60 * 60 * 24)))

  return {
    data: alvo.toISOString().split('T')[0],
    dias,
  }
}

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

  // Soma de comissões aprovadas aguardando pagamento
  const { data: refs } = await admin
    .from('affiliate_referrals')
    .select('comissao')
    .eq('affiliate_id', affiliate.id)
    .eq('status', 'aprovado')

  const aprovado_aguardando = (refs ?? []).reduce((sum, r) => sum + Number(r.comissao ?? 0), 0)

  const { data: proxima_data_pagamento, dias: dias_ate_pagamento } = proximoDia5()

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
