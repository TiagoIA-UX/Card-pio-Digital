import test from 'node:test'
import assert from 'node:assert/strict'

import { isOrderEligibleForManualProvisioningRecovery } from '@/app/api/admin/provisionar-pendentes/route'
import { isDuplicateCommissionPaymentError } from '@/app/api/admin/afiliados/comissoes/route'
import {
  hasValidEconomicStateForAffiliateApproval,
  resolveAffiliateApprovalGate,
} from '@/lib/domains/core/affiliate-approval-gate'

test('manual provisioning recovery exige pagamento aprovado e stale-recovery', () => {
  assert.equal(
    isOrderEligibleForManualProvisioningRecovery({
      status: 'processing',
      payment_status: 'approved',
      updated_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      metadata: {
        checkout_type: 'restaurant_onboarding',
        onboarding_status: 'provisioning',
      },
    }),
    true
  )

  assert.equal(
    isOrderEligibleForManualProvisioningRecovery({
      status: 'pending',
      payment_status: 'pending',
      updated_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      metadata: {
        checkout_type: 'restaurant_onboarding',
      },
    }),
    false
  )
})

test('aprovação automática de afiliado exige os 3 fatores positivos', () => {
  assert.equal(
    hasValidEconomicStateForAffiliateApproval({
      restaurantPaymentStatus: 'ativo',
      subscriptionStatus: 'active',
      financialTruthStatus: 'approved',
    }),
    true
  )

  assert.equal(
    hasValidEconomicStateForAffiliateApproval({
      restaurantPaymentStatus: 'cancelado',
      subscriptionStatus: 'active',
      financialTruthStatus: 'approved',
    }),
    false
  )

  assert.equal(
    hasValidEconomicStateForAffiliateApproval({
      restaurantPaymentStatus: 'ativo',
      subscriptionStatus: 'canceled',
      financialTruthStatus: 'approved',
    }),
    false
  )

  assert.equal(
    hasValidEconomicStateForAffiliateApproval({
      restaurantPaymentStatus: 'ativo',
      subscriptionStatus: 'active',
      financialTruthStatus: 'pending',
    }),
    false
  )
})

test('gate de afiliado devolve pending_sync quando falta confirmação financeira final', () => {
  assert.equal(
    resolveAffiliateApprovalGate({
      restaurantPaymentStatus: 'ativo',
      subscriptionStatus: 'active',
      financialTruthStatus: null,
      financialTruthSyncState: 'pending_sync',
    }),
    'pending_sync'
  )

  assert.equal(
    resolveAffiliateApprovalGate({
      restaurantPaymentStatus: 'ativo',
      subscriptionStatus: 'active',
      financialTruthStatus: 'approved',
      financialTruthSyncState: 'pending_sync',
    }),
    'eligible'
  )

  assert.equal(
    resolveAffiliateApprovalGate({
      restaurantPaymentStatus: 'ativo',
      subscriptionStatus: 'active',
      financialTruthStatus: 'chargeback',
      financialTruthSyncState: 'pending_sync',
    }),
    'blocked'
  )
})

test('erro 23505 de comissão é tratado como duplicidade controlada', () => {
  assert.equal(isDuplicateCommissionPaymentError({ code: '23505' }), true)
  assert.equal(isDuplicateCommissionPaymentError({ code: 'PGRST116' }), false)
  assert.equal(isDuplicateCommissionPaymentError(null), false)
})
