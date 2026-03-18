import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

const actionSchema = z.object({
  action: z.enum(['suspend', 'reactivate', 'change_plan']),
  restaurant_id: z.string().uuid(),
  details: z
    .object({
      plan_slug: z.string().max(50).optional(),
    })
    .optional(),
})

function getSupabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Buscar todos os restaurantes com dados de assinatura
    const { data: restaurants, error } = await supabaseAdmin
      .from('restaurants')
      .select(
        `
        *,
        subscriptions (
          id,
          status,
          mp_subscription_status,
          current_period_end,
          failed_payments
        )
      `
      )
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calcular estatísticas
    const stats = {
      total: restaurants.length,
      active: restaurants.filter((r) => r.ativo && !r.suspended).length,
      suspended: restaurants.filter((r) => r.suspended).length,
      byPlan: {} as Record<string, number>,
      mrr: 0,
    }

    const planPrices: Record<string, number> = {
      basico: 49,
      pro: 99,
      premium: 199,
    }

    restaurants.forEach((r) => {
      const plan = r.plan_slug || 'basico'
      stats.byPlan[plan] = (stats.byPlan[plan] || 0) + 1
      if (r.ativo && !r.suspended) {
        stats.mrr += planPrices[plan] || 49
      }
    })

    return NextResponse.json({
      restaurants,
      stats,
    })
  } catch (error) {
    console.error('Erro na API admin:', error)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }
}

// Ação admin: suspender/reativar
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const adminUserId = admin.id

    const raw = await request.json().catch(() => ({}))
    const parsed = actionSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { action, restaurant_id, details } = parsed.data

    const supabaseAdmin = getSupabaseAdmin()

    let result

    switch (action) {
      case 'suspend':
        result = await supabaseAdmin.rpc('suspend_restaurant_for_nonpayment', {
          p_restaurant_id: restaurant_id,
        })
        break

      case 'reactivate':
        result = await supabaseAdmin.rpc('reactivate_restaurant', {
          p_restaurant_id: restaurant_id,
        })
        break

      case 'change_plan':
        if (!details?.plan_slug) {
          return NextResponse.json({ error: 'plan_slug é obrigatório' }, { status: 400 })
        }
        result = await supabaseAdmin
          .from('restaurants')
          .update({ plan_slug: details.plan_slug })
          .eq('id', restaurant_id)
        break

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    // Registrar ação
    await supabaseAdmin.from('admin_actions').insert({
      admin_id: adminUserId,
      action_type: action,
      target_restaurant_id: restaurant_id,
      details: details || {},
    })

    return NextResponse.json({ success: true, action })
  } catch (error) {
    console.error('Erro na ação admin:', error)
    return NextResponse.json({ error: 'Erro ao executar ação' }, { status: 500 })
  }
}
