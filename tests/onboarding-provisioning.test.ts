import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ONBOARDING_STALE_PROVISIONING_MS,
  isStaleProvisioningTimestamp,
  resolveManualProvisioningResultStatus,
  resolveOnboardingProvisioningDecision,
} from '@/lib/onboarding-provisioning'

test('fresh approved webhook can claim pending onboarding order', () => {
  assert.equal(
    resolveOnboardingProvisioningDecision({
      status: 'pending',
      payment_status: 'pending',
      updated_at: '2026-03-25T10:00:00.000Z',
      metadata: { onboarding_status: 'awaiting_payment' },
    }),
    'fresh-claim'
  )
})

test('stale processing onboarding can be recovered safely', () => {
  const now = new Date('2026-03-25T12:00:00.000Z').getTime()
  const staleUpdatedAt = new Date(now - ONBOARDING_STALE_PROVISIONING_MS - 1000).toISOString()

  assert.equal(
    resolveOnboardingProvisioningDecision(
      {
        status: 'processing',
        payment_status: 'processing',
        updated_at: staleUpdatedAt,
        metadata: { onboarding_status: 'provisioning' },
      },
      now
    ),
    'stale-recovery'
  )
})

test('recent processing onboarding remains locked for natural retry', () => {
  const now = new Date('2026-03-25T12:00:00.000Z').getTime()
  const freshUpdatedAt = new Date(now - 60_000).toISOString()

  assert.equal(
    resolveOnboardingProvisioningDecision(
      {
        status: 'processing',
        payment_status: 'processing',
        updated_at: freshUpdatedAt,
        metadata: { onboarding_status: 'provisioning' },
      },
      now
    ),
    'active-processing'
  )
})

test('ready onboarding is never reclaimed', () => {
  assert.equal(
    resolveOnboardingProvisioningDecision({
      status: 'completed',
      payment_status: 'approved',
      updated_at: '2026-03-25T12:00:00.000Z',
      metadata: {
        onboarding_status: 'ready',
        provisioned_restaurant_id: 'rest-1',
      },
    }),
    'already-ready'
  )
})

test('invalid timestamp is treated as stale for recovery safety', () => {
  assert.equal(isStaleProvisioningTimestamp('data-invalida'), true)
})

test('manual provisioning result distinguishes provisioned, recovered and active cases', () => {
  assert.equal(resolveManualProvisioningResultStatus('fresh-claim', true), 'provisioned')
  assert.equal(resolveManualProvisioningResultStatus('stale-recovery', true), 'recovered')
  assert.equal(
    resolveManualProvisioningResultStatus('active-processing', false),
    'still-processing'
  )
  assert.equal(resolveManualProvisioningResultStatus('already-ready', true), 'already-ready')
})
