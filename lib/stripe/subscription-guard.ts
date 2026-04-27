import { createAdminClient } from '@/lib/shared/supabase/admin'

type GuardResult =
  | { active: true; plan: string; until: Date }
  | {
      active: false
      reason: 'no_subscription' | 'past_due' | 'canceled' | 'unknown_status'
      status: string
    }

export async function checkTenantSubscription(tenantId: string): Promise<GuardResult> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('v_tenant_subscription_status')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  if (error || !data) {
    return { active: false, reason: 'no_subscription', status: 'not_found' }
  }

  if (!data.stripe_subscription_id) {
    return { active: false, reason: 'no_subscription', status: 'none' }
  }

  if (data.subscription_active) {
    return {
      active: true,
      plan: data.plano_id ?? 'unknown',
      until: new Date(data.stripe_current_period_end),
    }
  }

  const status: string = data.stripe_subscription_status ?? 'unknown'

  const reasonMap: Record<string, 'no_subscription' | 'past_due' | 'canceled' | 'unknown_status'> =
    {
      past_due: 'past_due',
      canceled: 'canceled',
      unpaid: 'past_due',
      incomplete: 'no_subscription',
      incomplete_expired: 'no_subscription',
    }

  return {
    active: false,
    reason: reasonMap[status] ?? 'unknown_status',
    status,
  }
}
