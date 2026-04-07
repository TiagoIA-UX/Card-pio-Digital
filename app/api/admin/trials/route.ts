import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/domains/auth/admin-auth'
import { createAdminClient } from '@/lib/shared/supabase/admin'

function getSupabaseAdmin() {
  return createAdminClient()
}

// Cron job: check trial status and generate events
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = getSupabaseAdmin()

  // Get all active trials
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('id, restaurant_id, trial_ends_at, status')
    .eq('status', 'trial')
    .not('trial_ends_at', 'is', null)

  if (!subs) return NextResponse.json({ trials: [], events_sent: 0 })

  // Get restaurants with user_ids
  const restIds = subs.map((s) => s.restaurant_id)
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, user_id, nome')
    .in('id', restIds)

  const restMap = new Map((restaurants || []).map((r) => [r.id, r]))

  // Get existing events to avoid duplicates
  const userIds = (restaurants || []).map((r) => r.user_id)
  const { data: existingEvents } = await supabase
    .from('trial_events')
    .select('user_id, event_type')
    .in('user_id', userIds)

  const eventSet = new Set((existingEvents || []).map((e) => `${e.user_id}:${e.event_type}`))

  const now = Date.now()
  const eventsToCreate: Array<{
    user_id: string
    event_type: string
    metadata: Record<string, unknown>
  }> = []

  for (const sub of subs) {
    const rest = restMap.get(sub.restaurant_id)
    if (!rest) continue

    const trialEnd = new Date(sub.trial_ends_at).getTime()
    const daysLeft = Math.ceil((trialEnd - now) / 86400000)
    const userId = rest.user_id

    // Day 3 reminder (4 days left)
    if (daysLeft <= 4 && daysLeft > 2 && !eventSet.has(`${userId}:day3_reminder`)) {
      eventsToCreate.push({
        user_id: userId,
        event_type: 'day3_reminder',
        metadata: { days_left: daysLeft },
      })
    }
    // Day 5 urgency (2 days left)
    if (daysLeft <= 2 && daysLeft > 1 && !eventSet.has(`${userId}:day5_urgency`)) {
      eventsToCreate.push({
        user_id: userId,
        event_type: 'day5_urgency',
        metadata: { days_left: daysLeft },
      })
    }
    // Day 6 offer (1 day left)
    if (daysLeft <= 1 && daysLeft > 0 && !eventSet.has(`${userId}:day6_offer`)) {
      eventsToCreate.push({
        user_id: userId,
        event_type: 'day6_offer',
        metadata: { days_left: daysLeft },
      })
    }
    // Day 7 expired
    if (daysLeft <= 0 && !eventSet.has(`${userId}:day7_expired`)) {
      eventsToCreate.push({
        user_id: userId,
        event_type: 'day7_expired',
        metadata: { expired_at: new Date().toISOString() },
      })
    }
  }

  if (eventsToCreate.length > 0) {
    await supabase.from('trial_events').insert(eventsToCreate)
  }

  // Build trial summary
  const trials = subs
    .map((sub) => {
      const rest = restMap.get(sub.restaurant_id)
      const trialEnd = new Date(sub.trial_ends_at).getTime()
      const daysLeft = Math.ceil((trialEnd - now) / 86400000)
      return {
        subscription_id: sub.id,
        restaurant_id: sub.restaurant_id,
        restaurant_nome: rest?.nome || 'N/A',
        user_id: rest?.user_id,
        trial_ends_at: sub.trial_ends_at,
        days_left: daysLeft,
        status: daysLeft <= 0 ? 'expired' : daysLeft <= 2 ? 'critical' : 'active',
      }
    })
    .sort((a, b) => a.days_left - b.days_left)

  return NextResponse.json({ trials, events_sent: eventsToCreate.length })
}
