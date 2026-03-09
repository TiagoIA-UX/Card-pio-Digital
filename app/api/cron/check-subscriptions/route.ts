import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const CRON_SECRET = process.env.CRON_SECRET
const DAYS_TOLERANCE = 7

function getSupabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function isAuthorizedCronRequest(request: NextRequest) {
  if (!CRON_SECRET) {
    return false
  }

  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${CRON_SECRET}`
}

export async function GET(request: NextRequest) {
  if (!CRON_SECRET) {
    console.error('CRON_SECRET não configurado')
    return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })
  }

  // Verificar autorização
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    // Chamar função de auto-suspensão
    const { data: suspendedCount, error } = await supabaseAdmin.rpc(
      'auto_suspend_overdue_restaurants',
      { days_tolerance: DAYS_TOLERANCE }
    )

    if (error) {
      console.error('Erro ao executar auto-suspensão:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Buscar detalhes das assinaturas vencidas (para log)
    const { data: overdueList } = await supabaseAdmin.rpc('check_overdue_subscriptions')

    console.log(`Cron executado: ${suspendedCount} restaurantes suspensos`)
    console.log('Assinaturas vencidas restantes:', overdueList)

    return NextResponse.json({
      success: true,
      suspended_count: suspendedCount,
      remaining_overdue: overdueList?.length || 0,
      executed_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro no cron de suspensão:', error)
    return NextResponse.json(
      { error: 'Erro ao executar verificação de inadimplência' },
      { status: 500 }
    )
  }
}

// POST para forçar verificação manual (admin)
export async function POST(request: NextRequest) {
  try {
    if (!CRON_SECRET) {
      console.error('CRON_SECRET não configurado')
      return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })
    }

    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Executar verificação
    const { data: overdueList } = await supabaseAdmin.rpc('check_overdue_subscriptions')

    // Enviar alertas (aqui poderia enviar email/WhatsApp)
    const alerts = (overdueList || []).map(
      (item: { restaurant_id: string; user_id: string; days_overdue: number }) => ({
        restaurant_id: item.restaurant_id,
        user_id: item.user_id,
        days_overdue: item.days_overdue,
        will_suspend: item.days_overdue > DAYS_TOLERANCE,
      })
    )

    return NextResponse.json({
      success: true,
      overdue_subscriptions: alerts,
      tolerance_days: DAYS_TOLERANCE,
    })
  } catch (error) {
    console.error('Erro na verificação manual:', error)
    return NextResponse.json({ error: 'Erro ao verificar assinaturas' }, { status: 500 })
  }
}
