export interface ApprovedTemplateOrderRow {
  metadata?: Record<string, unknown> | null
}

export interface ResolveRestaurantCreationEntitlementsInput {
  activePurchasesCount: number
  approvedOrderRows: ApprovedTemplateOrderRow[]
  restaurantsCount: number
}

export interface RestaurantCreationEntitlements {
  approvedOnboardingOrdersCount: number
  networkExtraUnits: number
  totalCredits: number
  remainingCredits: number
  canCreateRestaurant: boolean
}

function toPositiveInteger(value: unknown) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  const truncated = Math.trunc(numeric)
  return truncated > 0 ? truncated : 0
}

export function resolveRestaurantCreationEntitlements({
  activePurchasesCount,
  approvedOrderRows,
  restaurantsCount,
}: ResolveRestaurantCreationEntitlementsInput): RestaurantCreationEntitlements {
  let approvedOnboardingOrdersCount = 0
  let networkExtraUnits = 0

  for (const order of approvedOrderRows) {
    const metadata = order.metadata || {}
    const checkoutType = String(metadata.checkout_type || '')
      .trim()
      .toLowerCase()

    if (checkoutType === 'restaurant_network_expansion') {
      networkExtraUnits += toPositiveInteger(metadata.network_extra_units)
      continue
    }

    approvedOnboardingOrdersCount += 1
  }

  const totalCredits =
    Math.max(activePurchasesCount, approvedOnboardingOrdersCount) + networkExtraUnits
  const remainingCredits = Math.max(totalCredits - restaurantsCount, 0)

  return {
    approvedOnboardingOrdersCount,
    networkExtraUnits,
    totalCredits,
    remainingCredits,
    canCreateRestaurant: remainingCredits > 0,
  }
}
