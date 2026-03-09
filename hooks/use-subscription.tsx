// =====================================================
// USE SUBSCRIPTION HOOK
// Gerencia assinatura e limites do plano
// =====================================================

'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import type { Subscription, Plan, PlanLimites } from '@/types/database'
import {
  getSubscription,
  getPlans,
  getPlanLimits,
  isInTrial as checkIsInTrial,
  getTrialDaysRemaining,
} from '@/services'

// Contexto
interface SubscriptionContextValue {
  subscription: Subscription | null
  plan: Plan | null
  limits: PlanLimites | null
  isLoading: boolean
  error: Error | null
  // Status
  isActive: boolean
  isInTrial: boolean
  trialDaysRemaining: number
  isPro: boolean
  isPremium: boolean
  // Verificações de limite
  canAddProduct: (currentCount: number) => boolean
  canAddFlavor: (currentCount: number) => boolean
  canCreatePromotion: () => boolean
  hasReports: boolean
  hasIntelligence: boolean
  hasWhiteLabel: boolean
  // Ações
  refresh: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

// Provider Props
interface SubscriptionProviderProps {
  children: React.ReactNode
  tenantId: string
}

/**
 * Provider para contexto de subscription
 */
export function SubscriptionProvider({ children, tenantId }: SubscriptionProviderProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadSubscription = useCallback(async () => {
    if (!tenantId) return

    setIsLoading(true)
    setError(null)

    try {
      const subResult = await getSubscription(tenantId)
      if (subResult.data) {
        setSubscription(subResult.data)

        if (subResult.data.plan_id) {
          // Busca dados do plano
          const plansResult = await getPlans()
          const currentPlan = plansResult.data?.find((p: Plan) => p.id === subResult.data!.plan_id)
          setPlan(currentPlan || null)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar assinatura'))
    } finally {
      setIsLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    loadSubscription()
  }, [loadSubscription])

  // Limites do plano
  const limits = useMemo((): PlanLimites | null => {
    if (!plan) return null
    return plan.limites
  }, [plan])

  // Status da assinatura
  const isActive = useMemo(() => {
    if (!subscription) return false
    return subscription.status === 'trial' || subscription.status === 'active'
  }, [subscription])

  const isInTrialValue = useMemo(() => {
    if (!subscription) return false
    return checkIsInTrial(subscription)
  }, [subscription])

  const trialDaysRemainingValue = useMemo(() => {
    if (!subscription) return 0
    return getTrialDaysRemaining(subscription)
  }, [subscription])

  const isPro = useMemo(() => {
    return plan?.slug === 'pro' || plan?.slug === 'premium'
  }, [plan])

  const isPremium = useMemo(() => {
    return plan?.slug === 'premium'
  }, [plan])

  // Funções de verificação de limite
  const canAddProductLocal = useCallback(
    (currentCount: number): boolean => {
      if (!limits) return false
      return limits.max_produtos === -1 || currentCount < limits.max_produtos
    },
    [limits]
  )

  const canAddFlavorLocal = useCallback(
    (currentCount: number): boolean => {
      if (!limits) return false
      return limits.max_sabores === -1 || currentCount < limits.max_sabores
    },
    [limits]
  )

  const canCreatePromotionLocal = useCallback((): boolean => {
    if (!limits) return false
    return limits.max_promocoes > 0
  }, [limits])

  // Features
  const hasReports = useMemo(() => {
    return limits?.tem_relatorios ?? false
  }, [limits])

  const hasIntelligence = useMemo(() => {
    return limits?.tem_inteligencia ?? false
  }, [limits])

  const hasWhiteLabel = useMemo(() => {
    return isPremium
  }, [isPremium])

  const value: SubscriptionContextValue = {
    subscription,
    plan,
    limits,
    isLoading,
    error,
    isActive,
    isInTrial: isInTrialValue,
    trialDaysRemaining: trialDaysRemainingValue,
    isPro,
    isPremium,
    canAddProduct: canAddProductLocal,
    canAddFlavor: canAddFlavorLocal,
    canCreatePromotion: canCreatePromotionLocal,
    hasReports,
    hasIntelligence,
    hasWhiteLabel,
    refresh: loadSubscription,
  }

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}

/**
 * Hook para acessar contexto de subscription
 */
export function useSubscription() {
  const context = useContext(SubscriptionContext)

  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }

  return context
}

/**
 * Hook para verificar feature específica
 */
export function useFeatureAccess(
  feature: 'reports' | 'intelligence' | 'promotions' | 'whitelabel'
) {
  const { hasReports, hasIntelligence, canCreatePromotion, hasWhiteLabel, isLoading } =
    useSubscription()

  return useMemo(() => {
    switch (feature) {
      case 'reports':
        return { hasAccess: hasReports, isLoading }
      case 'intelligence':
        return { hasAccess: hasIntelligence, isLoading }
      case 'promotions':
        return { hasAccess: canCreatePromotion(), isLoading }
      case 'whitelabel':
        return { hasAccess: hasWhiteLabel, isLoading }
      default:
        return { hasAccess: false, isLoading }
    }
  }, [feature, hasReports, hasIntelligence, canCreatePromotion, hasWhiteLabel, isLoading])
}

/**
 * Hook para mostrar banner de upgrade
 */
export function useUpgradeBanner() {
  const { isInTrial, trialDaysRemaining, plan, isPro, isPremium } = useSubscription()

  return useMemo(() => {
    // Durante trial
    if (isInTrial && trialDaysRemaining <= 3) {
      return {
        show: true,
        type: 'trial-ending' as const,
        message: `Seu período de teste termina em ${trialDaysRemaining} dia${trialDaysRemaining !== 1 ? 's' : ''}`,
        cta: 'Assine agora',
      }
    }

    // Plano gratuito
    if (plan?.slug === 'gratis' && !isInTrial) {
      return {
        show: true,
        type: 'upgrade' as const,
        message: 'Desbloqueie mais recursos com o plano Pro',
        cta: 'Ver planos',
      }
    }

    // Plano Pro - mostrar Premium
    if (isPro && !isPremium) {
      return {
        show: false, // Não mostrar agressivamente
        type: 'premium' as const,
        message: 'Maximize seus resultados com relatórios e IA',
        cta: 'Conhecer Premium',
      }
    }

    return {
      show: false,
      type: null,
      message: '',
      cta: '',
    }
  }, [isInTrial, trialDaysRemaining, plan, isPro, isPremium])
}

export default useSubscription
