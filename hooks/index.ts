// =====================================================
// HOOKS INDEX
// Exporta todos os hooks customizados
// =====================================================

// UI Hooks
export { useIsMobile } from './use-mobile'
export { useToast, toast } from './use-toast'

// Domain Hooks
export { TenantProvider, useTenant, useTenantData } from './use-tenant'

export {
  SubscriptionProvider,
  useSubscription,
  useFeatureAccess,
  useUpgradeBanner,
} from './use-subscription'
