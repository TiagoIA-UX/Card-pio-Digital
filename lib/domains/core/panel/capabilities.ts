export interface ResolvePanelCapabilitiesInput {
  activePurchasesCount: number
  approvedOrdersCount: number
  restaurantsCount: number
}

export interface PanelCapabilities {
  hasCommercialAccess: boolean
  canCreateRestaurant: boolean
  hasRestaurant: boolean
  canAccessDashboard: boolean
  canAccessVisualEditor: boolean
  canManageCatalog: boolean
  canViewOrders: boolean
  canViewPublicLink: boolean
  canManageQrCode: boolean
  canViewPlans: boolean
  canViewTemplates: boolean
  canManageAffiliates: boolean
  canManageSettings: boolean
  canSwitchRestaurant: boolean
}

export type PanelCapabilityKey = keyof PanelCapabilities

export function resolvePanelCapabilities({
  activePurchasesCount,
  approvedOrdersCount,
  restaurantsCount,
}: ResolvePanelCapabilitiesInput): PanelCapabilities {
  const hasCommercialAccess = activePurchasesCount > 0 || approvedOrdersCount > 0
  const hasRestaurant = restaurantsCount > 0
  const canAccessManagedPanel = hasRestaurant

  return {
    hasCommercialAccess,
    canCreateRestaurant: hasCommercialAccess,
    hasRestaurant,
    canAccessDashboard: canAccessManagedPanel,
    canAccessVisualEditor: canAccessManagedPanel,
    canManageCatalog: canAccessManagedPanel,
    canViewOrders: canAccessManagedPanel,
    canViewPublicLink: canAccessManagedPanel,
    canManageQrCode: canAccessManagedPanel,
    canViewPlans: canAccessManagedPanel,
    canViewTemplates: canAccessManagedPanel,
    canManageAffiliates: false, // ✅ DESABILITADO PARA MVP (v2)
    canManageSettings: canAccessManagedPanel,
    canSwitchRestaurant: restaurantsCount > 1,
  }
}
