import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/domains/auth/admin-auth'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import { z } from 'zod'

function getSupabaseAdmin() {
  return createAdminClient()
}

const actionSchema = z.object({
  action: z.enum(['extend_trial', 'revoke_trial', 'impersonate']),
  user_id: z.string().uuid(),
  days: z.number().min(1).max(90).optional(),
})

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = getSupabaseAdmin()

  // Auth users list
  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers({ perPage: 500 })
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })

  // Profiles
  const { data: profiles } = await supabase.from('profiles').select('*')
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]))

  // Restaurants
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, user_id, nome, slug, plan_slug, ativo, suspended, created_at, referred_by')
  const restMap = new Map((restaurants || []).map((r) => [r.user_id, r]))

  // Subscriptions
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('id, restaurant_id, status, trial_ends_at, current_period_end')
  const subMap = new Map((subscriptions || []).map((s) => [s.restaurant_id, s]))

  // Orders count per restaurant (rpc may not exist yet)
  let orderCounts: unknown = null
  try {
    const { data } = await supabase.rpc('count_orders_per_restaurant')
    orderCounts = data
  } catch {
    // rpc not available
  }

  // Build unified list
  const users = authData.users.map((u) => {
    const profile = profileMap.get(u.id)
    const rest = restMap.get(u.id)
    const sub = rest ? subMap.get(rest.id) : null

    const trialEndsAt = sub?.trial_ends_at || profile?.trial_ends_at
    const trialDaysLeft = trialEndsAt
      ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
      : null

    return {
      id: u.id,
      email: u.email,
      nome: profile?.nome || u.user_metadata?.full_name || u.user_metadata?.name || null,
      avatar_url: profile?.avatar_url || u.user_metadata?.avatar_url || null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      last_seen_at: profile?.last_seen_at,
      referred_by: profile?.referred_by || rest?.referred_by || null,
      restaurant: rest
        ? {
            id: rest.id,
            nome: rest.nome,
            slug: rest.slug,
            plan_slug: rest.plan_slug,
            ativo: rest.ativo,
            suspended: rest.suspended,
          }
        : null,
      subscription: sub
        ? {
            status: sub.status,
            trial_ends_at: sub.trial_ends_at,
            current_period_end: sub.current_period_end,
          }
        : null,
      trial_days_left: trialDaysLeft,
      trial_days: profile?.trial_days || 7,
      status: rest?.suspended
        ? 'suspended'
        : sub?.status === 'trial'
          ? 'trial'
          : sub?.status === 'active'
            ? 'active'
            : sub?.status === 'canceled'
              ? 'canceled'
              : rest
                ? 'inactive'
                : 'no_restaurant',
    }
  })

  // Stats
  const stats = {
    total: users.length,
    with_restaurant: users.filter((u) => u.restaurant).length,
    trial: users.filter((u) => u.status === 'trial').length,
    active: users.filter((u) => u.status === 'active').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
    canceled: users.filter((u) => u.status === 'canceled').length,
    no_restaurant: users.filter((u) => u.status === 'no_restaurant').length,
  }

  return NextResponse.json({ users, stats })
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request, 'admin')
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const parsed = actionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })

  const { action, user_id, days } = parsed.data
  const supabase = getSupabaseAdmin()

  if (action === 'extend_trial') {
    const extDays = days || 7
    const { data: profile } = await supabase
      .from('profiles')
      .select('trial_ends_at')
      .eq('id', user_id)
      .single()
    const base = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : new Date()
    const newEnd = new Date(base.getTime() + extDays * 86400000)

    await supabase.from('profiles').upsert({ id: user_id, trial_ends_at: newEnd.toISOString() })

    // Update subscription trial_ends_at too
    const { data: rest } = await supabase
      .from('restaurants')
      .select('id')
      .eq('user_id', user_id)
      .single()
    if (rest) {
      await supabase
        .from('subscriptions')
        .update({ trial_ends_at: newEnd.toISOString(), status: 'trial' })
        .eq('restaurant_id', rest.id)
    }

    // Log trial event
    await supabase.from('trial_events').insert({
      user_id,
      event_type: 'trial_extended',
      metadata: { days: extDays, new_end: newEnd.toISOString(), by: admin.email },
    })

    // Audit log
    await supabase.from('admin_audit_log').insert({
      admin_user_id: admin.id,
      action: 'trial_extend',
      target_user_id: user_id,
      metadata: { days: extDays },
    })

    return NextResponse.json({ ok: true, trial_ends_at: newEnd.toISOString() })
  }

  if (action === 'revoke_trial') {
    const now = new Date().toISOString()
    await supabase.from('profiles').upsert({ id: user_id, trial_ends_at: now })

    const { data: rest } = await supabase
      .from('restaurants')
      .select('id')
      .eq('user_id', user_id)
      .single()
    if (rest) {
      await supabase
        .from('subscriptions')
        .update({ trial_ends_at: now, status: 'expired' })
        .eq('restaurant_id', rest.id)
    }

    await supabase.from('trial_events').insert({
      user_id,
      event_type: 'trial_revoked',
      metadata: { by: admin.email },
    })

    await supabase.from('admin_audit_log').insert({
      admin_user_id: admin.id,
      action: 'trial_revoke',
      target_user_id: user_id,
    })

    return NextResponse.json({ ok: true })
  }

  if (action === 'impersonate') {
    // Generate a temporary impersonation token (15min)
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: (await supabase.auth.admin.getUserById(user_id)).data.user?.email || '',
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/painel` },
    })

    if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 })

    // Audit log
    await supabase.from('admin_audit_log').insert({
      admin_user_id: admin.id,
      action: 'impersonate_start',
      target_user_id: user_id,
      metadata: { admin_email: admin.email },
    })

    return NextResponse.json({
      ok: true,
      impersonate_url: linkData.properties?.action_link,
    })
  }

  return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })
}

