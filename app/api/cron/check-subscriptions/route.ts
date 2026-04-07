import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import { notifyCronFailure, notifyRestaurantSuspended } from '@/lib/shared/notifications'

const CRON_SECRET = process.env.CRON_SECRET
const DAYS_TOLERANCE = 7

type OverdueSubscriptionRow = {
  restaurant_id: string
  user_id?: string | null
  restaurant_name?: string | null
  user_email?: string | null
  days_overdue: number
}

function getSupabaseAdmin() {
  return createAdminClient()
}

function isAuthorizedCronRequest(request: NextRequest) {
  if (!CRON_SECRET) {
    return false
  }

  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${CRON_SECRET}`
}

async function loadOverdueSubscriptions(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>) {
  const { data, error } = await supabaseAdmin.rpc('check_overdue_subscriptions')

  if (error) {
    throw error
  }

  return ((data as OverdueSubscriptionRow[] | null) ?? []).map((item) => ({
    ...item,
    days_overdue: Number(item.days_overdue ?? 0),
  }))
}

async function suspendRestaurantDirectly(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  restaurantId: string
) {
  const suspendedAt = new Date().toISOString()

  const { error: restaurantError } = await supabaseAdmin
    .from('restaurants')
    .update({
      suspended: true,
      suspended_reason: 'Inadimplência - Assinatura vencida',
      suspended_at: suspendedAt,
      ativo: false,
    })
    .eq('id', restaurantId)

  if (restaurantError) {
    throw restaurantError
  }

  const { error: subscriptionError } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
      suspended_at: suspendedAt,
    })
    .eq('restaurant_id', restaurantId)
    .eq('status', 'active')

  if (subscriptionError) {
    throw subscriptionError
  }
}

async function autoSuspendOverdueRestaurants(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  daysTolerance: number
) {
  const { data, error } = await supabaseAdmin.rpc('auto_suspend_overdue_restaurants', {
    days_tolerance: daysTolerance,
  })

  if (!error) {
    return {
      suspendedCount: Number(data ?? 0),
      overdueList: await loadOverdueSubscriptions(supabaseAdmin),
      usedFallback: false,
    }
  }

  const isMissingRpc =
    error.message.includes('Could not find the function public.auto_suspend_overdue_restaurants') ||
    error.message.includes('schema cache')

  if (!isMissingRpc) {
    throw error
  }

  const overdueList = await loadOverdueSubscriptions(supabaseAdmin)
  const candidates = overdueList.filter((item) => item.days_overdue > daysTolerance)

  for (const item of candidates) {
    await suspendRestaurantDirectly(supabaseAdmin, item.restaurant_id)
  }

  return {
    suspendedCount: candidates.length,
    overdueList,
    usedFallback: true,
  }
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
    const { suspendedCount, overdueList, usedFallback } = await autoSuspendOverdueRestaurants(
      supabaseAdmin,
      DAYS_TOLERANCE
    )

    // Notificar sobre restaurantes suspensos
    if (suspendedCount && suspendedCount > 0 && overdueList) {
      for (const item of overdueList.slice(0, 10)) {
        await notifyRestaurantSuspended({
          restaurantId: item.restaurant_id,
          restaurantName: item.restaurant_name || item.restaurant_id,
          ownerEmail: item.user_email || 'desconhecido',
          daysOverdue: item.days_overdue,
        }).catch(() => {})
      }
    }

    console.log(`Cron executado: ${suspendedCount} restaurantes suspensos`)
    console.log('Assinaturas vencidas restantes:', overdueList)

    return NextResponse.json({
      success: true,
      suspended_count: suspendedCount,
      remaining_overdue: overdueList?.length || 0,
      used_fallback: usedFallback,
      executed_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro no cron de suspensão:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    await notifyCronFailure({
      cronName: 'check-subscriptions',
      error: message,
      details: { rpc: 'auto_suspend_overdue_restaurants' },
    }).catch(() => {})
    return NextResponse.json(
      { error: message },
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
    const overdueList = await loadOverdueSubscriptions(supabaseAdmin)

    // Enviar alertas (aqui poderia enviar email/WhatsApp)
    const alerts = (overdueList || []).map(
      (item: OverdueSubscriptionRow) => ({
        restaurant_id: item.restaurant_id,
        user_id: item.user_id ?? null,
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
