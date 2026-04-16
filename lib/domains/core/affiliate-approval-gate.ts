export type AffiliateApprovalGateState = 'eligible' | 'blocked' | 'pending_sync'

interface ResolveAffiliateApprovalGateInput {
  restaurantPaymentStatus: string | null | undefined
  subscriptionStatus: string | null | undefined
  financialTruthStatus: string | null | undefined
  financialTruthSyncState?: 'pending_sync' | 'synced' | 'failed' | null | undefined
}

function normalizeValue(value: string | null | undefined) {
  return (value || '').trim().toLowerCase()
}

export function resolveAffiliateApprovalGate(
  input: ResolveAffiliateApprovalGateInput
): AffiliateApprovalGateState {
  const restaurantPaymentStatus = normalizeValue(input.restaurantPaymentStatus)
  const subscriptionStatus = normalizeValue(input.subscriptionStatus)
  const financialTruthStatus = normalizeValue(input.financialTruthStatus)
  const financialTruthSyncState = normalizeValue(input.financialTruthSyncState)

  const deliveryStatusOk = restaurantPaymentStatus === 'ativo'
  const subscriptionActive = subscriptionStatus === 'active'

  if (!deliveryStatusOk || !subscriptionActive) {
    return 'blocked'
  }

  if (financialTruthStatus === 'approved') {
    return 'eligible'
  }

  if (
    financialTruthStatus === 'canceled' ||
    financialTruthStatus === 'cancelled' ||
    financialTruthStatus === 'refunded' ||
    financialTruthStatus === 'chargeback'
  ) {
    return 'blocked'
  }

  if (financialTruthSyncState === 'pending_sync' || !financialTruthStatus) {
    return 'pending_sync'
  }

  return 'blocked'
}

export function hasValidEconomicStateForAffiliateApproval(input: ResolveAffiliateApprovalGateInput) {
  return resolveAffiliateApprovalGate(input) === 'eligible'
}