import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// =====================================================
// SUPABASE SERVER CLIENT
// Para uso em Server Components, Route Handlers e Server Actions
// =====================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

/**
 * Cria cliente Supabase para Server Components
 * Usa cookies para manter sessão
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Ignorar em Server Components (read-only)
        }
      },
    },
  })
}

/**
 * Obtém o usuário autenticado no servidor
 */
export async function getServerUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return { user, error }
}

/**
 * Obtém a sessão no servidor
 */
export async function getServerSession() {
  const supabase = await createClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  return { session, error }
}

/**
 * Obtém o tenant do usuário atual
 */
export async function getCurrentTenant() {
  const { user, error: userError } = await getServerUser()
  if (userError || !user) return { tenant: null, error: userError }

  const supabase = await createClient()
  const { data: userData, error: dataError } = await supabase
    .from('users')
    .select('tenant_id, tenant:tenants(*)')
    .eq('id', user.id)
    .single()

  if (dataError || !userData) {
    return { tenant: null, error: dataError }
  }

  return { tenant: userData.tenant, error: null }
}

/**
 * Obtém a subscription do tenant atual
 */
export async function getCurrentSubscription() {
  const { tenant, error: tenantError } = await getCurrentTenant()
  if (tenantError || !tenant) return { subscription: null, error: tenantError }

  const supabase = await createClient()
  const tenantId = Array.isArray(tenant) ? tenant[0]?.id : (tenant as { id: string }).id
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*)')
    .eq('tenant_id', tenantId)
    .single()

  return { subscription, error }
}

/**
 * Verifica se usuário tem acesso a uma feature do plano
 */
export async function checkPlanFeature(feature: string): Promise<boolean> {
  const { subscription } = await getCurrentSubscription()
  if (!subscription || !subscription.plan) return false

  const plan = subscription.plan as { limites: Record<string, unknown> }
  const limites = plan.limites || {}

  return !!limites[feature]
}

/**
 * Verifica se ainda está no período trial
 */
export async function isInTrial(): Promise<boolean> {
  const { subscription } = await getCurrentSubscription()
  if (!subscription) return false

  return subscription.status === 'trial' && new Date(subscription.trial_ends_at) > new Date()
}
