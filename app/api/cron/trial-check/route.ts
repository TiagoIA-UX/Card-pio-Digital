import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'

const CRON_SECRET = process.env.CRON_SECRET

function isAuthorizedCronRequest(request: NextRequest) {
  if (!CRON_SECRET) return false
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${CRON_SECRET}`
}

/**
 * CRON: Trial Check — roda diariamente às 9h BRT
 * Vercel Cron: /api/cron/trial-check
 *
 * Fluxo neurocomportamental de urgência:
 * Dia 3 → reminder (prova social)
 * Dia 5 → urgência (aversão à perda)
 * Dia 6 → oferta extensão (+7 dias se completar perfil)
 * Dia 7 → trial expirado (bloqueio soft)
 */

function getSupabaseAdmin() {
  return createAdminClient()
}

interface TrialUser {
  id: string
  email: string
  nome: string | null
  trial_ends_at: string | null
  trial_days: number
  onboarding_completed: boolean
}

async function hasEvent(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  eventType: string
): Promise<boolean> {
  const { data } = await supabase
    .from('trial_events')
    .select('id')
    .eq('user_id', userId)
    .eq('event_type', eventType)
    .limit(1)
  return (data?.length ?? 0) > 0
}

async function logEvent(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  eventType: string,
  metadata: Record<string, unknown> = {}
) {
  await supabase.from('trial_events').insert({
    user_id: userId,
    event_type: eventType,
    channel: 'system',
    metadata,
  })
}

export async function GET(request: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })
  }
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const now = new Date()

  // Get all users with active trials
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, nome, trial_ends_at, trial_days, onboarding_completed')
    .not('trial_ends_at', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = {
    processed: 0,
    day3_reminders: 0,
    day5_urgency: 0,
    day6_offers: 0,
    day7_expired: 0,
    auto_extended: 0,
    skipped: 0,
  }

  for (const user of (profiles || []) as TrialUser[]) {
    if (!user.trial_ends_at) continue
    results.processed++

    const trialEnd = new Date(user.trial_ends_at)
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000)

    // Already expired long ago (> 7 days) — skip
    if (daysLeft < -7) {
      results.skipped++
      continue
    }

    // Day 3 reminder (4 days left)
    if (daysLeft === 4) {
      if (await hasEvent(supabase, user.id, 'day3_reminder')) continue
      await logEvent(supabase, user.id, 'day3_reminder', {
        days_left: daysLeft,
        trigger: 'prova_social',
      })
      results.day3_reminders++
      continue
    }

    // Day 5 urgency (2 days left)
    if (daysLeft === 2) {
      if (await hasEvent(supabase, user.id, 'day5_urgency')) continue
      await logEvent(supabase, user.id, 'day5_urgency', {
        days_left: daysLeft,
        trigger: 'aversao_perda',
      })
      results.day5_urgency++
      continue
    }

    // Day 6 offer (1 day left) — auto-extend if profile complete
    if (daysLeft === 1) {
      if (await hasEvent(supabase, user.id, 'day6_offer')) continue

      // Check if user has completed profile (onboarding + at least 5 products)
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id)
        .single()

      let productCount = 0
      if (restaurant) {
        const { count } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', restaurant.id)
        productCount = count ?? 0
      }

      const profileComplete = user.onboarding_completed && productCount >= 5

      if (profileComplete) {
        // Auto-extend +7 days
        const newEnd = new Date(trialEnd.getTime() + 7 * 86400000)
        await supabase
          .from('profiles')
          .update({ trial_ends_at: newEnd.toISOString() })
          .eq('id', user.id)

        if (restaurant) {
          await supabase
            .from('subscriptions')
            .update({ trial_ends_at: newEnd.toISOString() })
            .eq('restaurant_id', restaurant.id)
        }

        await logEvent(supabase, user.id, 'trial_extended', {
          reason: 'profile_complete',
          products: productCount,
          new_end: newEnd.toISOString(),
        })
        results.auto_extended++
      } else {
        await logEvent(supabase, user.id, 'day6_offer', {
          days_left: daysLeft,
          trigger: 'compromisso_reciprocidade',
          profile_complete: profileComplete,
          products: productCount,
        })
        results.day6_offers++
      }
      continue
    }

    // Day 7 expired (0 or negative days)
    if (daysLeft <= 0) {
      if (await hasEvent(supabase, user.id, 'day7_expired')) continue

      // Soft block: update subscription status
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (restaurant) {
        await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('restaurant_id', restaurant.id)
          .eq('status', 'trial')

        // Suspend restaurant to block new orders
        await supabase.from('restaurants').update({ suspended: true }).eq('id', restaurant.id)
      }

      await supabase
        .from('profiles')
        .update({ plan: 'cancelled' })
        .eq('id', user.id)
        .eq('plan', 'trial')

      await logEvent(supabase, user.id, 'day7_expired', {
        trigger: 'urgencia_prova_social',
      })
      results.day7_expired++
      continue
    }

    results.skipped++
  }

  // Log in audit
  await supabase.from('admin_audit_log').insert({
    admin_user_id: 'service-account',
    action: 'config_change',
    metadata: { cron: 'trial-check', results },
  })

  return NextResponse.json({ ok: true, ...results })
}
