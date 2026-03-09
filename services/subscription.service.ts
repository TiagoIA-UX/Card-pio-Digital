// =====================================================
// SUBSCRIPTION SERVICE
// Gerenciamento de assinaturas e planos
// =====================================================

import { createClient } from '@/lib/supabase/client'
import type { Plan, Subscription, ApiResponse, PlanLimites } from '@/types/database'

// =====================================================
// PLANOS
// =====================================================

export async function getPlans(): Promise<ApiResponse<Plan[]>> {
  const supabase = createClient()

  const { data, error } = await supabase.from('plans').select('*').eq('ativo', true).order('ordem')

  return {
    data: data || [],
    error: error?.message || null,
    success: !error,
  }
}

export async function getPlanBySlug(slug: string): Promise<ApiResponse<Plan>> {
  const supabase = createClient()

  const { data, error } = await supabase.from('plans').select('*').eq('slug', slug).single()

  return {
    data,
    error: error?.message || null,
    success: !error,
  }
}

// =====================================================
// SUBSCRIPTIONS
// =====================================================

export async function getSubscription(tenantId: string): Promise<ApiResponse<Subscription>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*)')
    .eq('tenant_id', tenantId)
    .single()

  return {
    data,
    error: error?.message || null,
    success: !error,
  }
}

/**
 * Cria subscription com trial de 30 dias
 */
export async function createTrialSubscription(
  tenantId: string
): Promise<ApiResponse<Subscription>> {
  const supabase = createClient()

  // Buscar plano Premium para trial
  const { data: premiumPlan } = await getPlanBySlug('premium')
  if (!premiumPlan) {
    return { data: null, error: 'Plano premium não encontrado', success: false }
  }

  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 30)

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      tenant_id: tenantId,
      plan_id: premiumPlan.id,
      status: 'trial',
      trial_ends_at: trialEndsAt.toISOString(),
    })
    .select('*, plan:plans(*)')
    .single()

  return {
    data,
    error: error?.message || null,
    success: !error,
  }
}

/**
 * Atualiza plano da subscription
 */
export async function updateSubscriptionPlan(
  tenantId: string,
  planId: string
): Promise<ApiResponse<Subscription>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      plan_id: planId,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('tenant_id', tenantId)
    .select('*, plan:plans(*)')
    .single()

  return {
    data,
    error: error?.message || null,
    success: !error,
  }
}

/**
 * Cancela subscription
 */
export async function cancelSubscription(tenantId: string): Promise<ApiResponse<Subscription>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      cancel_at: new Date().toISOString(), // Cancela imediatamente
    })
    .eq('tenant_id', tenantId)
    .select('*, plan:plans(*)')
    .single()

  return {
    data,
    error: error?.message || null,
    success: !error,
  }
}

// =====================================================
// VERIFICAÇÕES DE LIMITES
// =====================================================

/**
 * Verifica se está no período trial
 */
export function isInTrial(subscription: Subscription): boolean {
  if (subscription.status !== 'trial') return false
  if (!subscription.trial_ends_at) return false
  return new Date(subscription.trial_ends_at) > new Date()
}

/**
 * Dias restantes do trial
 */
export function getTrialDaysRemaining(subscription: Subscription): number {
  if (!isInTrial(subscription)) return 0
  const diff = new Date(subscription.trial_ends_at!).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Verifica se subscription está ativa (trial ou pago)
 */
export function isSubscriptionActive(subscription: Subscription): boolean {
  if (subscription.status === 'active') return true
  if (isInTrial(subscription)) return true
  return false
}

/**
 * Obtém limites do plano atual
 */
export function getPlanLimits(subscription: Subscription & { plan?: Plan }): PlanLimites {
  const defaultLimits: PlanLimites = {
    max_produtos: 15,
    max_sabores: 5,
    max_promocoes: 0,
    tem_relatorios: false,
    tem_inteligencia: false,
    tem_multi_usuarios: false,
    marca_dagua: true,
  }

  if (!subscription.plan) return defaultLimits
  return (subscription.plan.limites as PlanLimites) || defaultLimits
}

/**
 * Verifica se pode adicionar mais produtos
 */
export async function canAddProduct(tenantId: string): Promise<boolean> {
  const supabase = createClient()

  // Buscar subscription
  const { data: subscription } = await getSubscription(tenantId)
  if (!subscription || !isSubscriptionActive(subscription)) return false

  const limits = getPlanLimits(subscription as Subscription & { plan?: Plan })
  if (limits.max_produtos === -1) return true // Ilimitado

  // Contar produtos atuais
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  return (count || 0) < limits.max_produtos
}

/**
 * Verifica se pode adicionar mais sabores
 */
export async function canAddFlavor(tenantId: string): Promise<boolean> {
  const supabase = createClient()

  const { data: subscription } = await getSubscription(tenantId)
  if (!subscription || !isSubscriptionActive(subscription)) return false

  const limits = getPlanLimits(subscription as Subscription & { plan?: Plan })
  if (limits.max_sabores === -1) return true // Ilimitado

  const { count } = await supabase
    .from('product_flavors')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  return (count || 0) < limits.max_sabores
}

/**
 * Verifica se pode criar promoções
 */
export async function canCreatePromotion(tenantId: string): Promise<boolean> {
  const supabase = createClient()

  const { data: subscription } = await getSubscription(tenantId)
  if (!subscription || !isSubscriptionActive(subscription)) return false

  const limits = getPlanLimits(subscription as Subscription & { plan?: Plan })
  if (limits.max_promocoes === -1) return true // Ilimitado
  if (limits.max_promocoes === 0) return false // Não disponível

  const { count } = await supabase
    .from('promotions')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('ativo', true)

  return (count || 0) < limits.max_promocoes
}

/**
 * Verifica se tem acesso a relatórios
 */
export async function hasReportsAccess(tenantId: string): Promise<boolean> {
  const { data: subscription } = await getSubscription(tenantId)
  if (!subscription || !isSubscriptionActive(subscription)) return false

  const limits = getPlanLimits(subscription as Subscription & { plan?: Plan })
  return limits.tem_relatorios
}

/**
 * Verifica se tem acesso a inteligência comercial
 */
export async function hasIntelligenceAccess(tenantId: string): Promise<boolean> {
  const { data: subscription } = await getSubscription(tenantId)
  if (!subscription || !isSubscriptionActive(subscription)) return false

  const limits = getPlanLimits(subscription as Subscription & { plan?: Plan })
  return limits.tem_inteligencia
}
