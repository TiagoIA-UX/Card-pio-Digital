import test from 'node:test'
import assert from 'node:assert/strict'

import {
  AFFILIATE_REFERRAL_ONBOARDING_CONFLICT_TARGET,
  buildAffiliateReferralIdempotencyKey,
} from '@/lib/domains/core/affiliate-referral-idempotency'

test('idempotência de affiliate_referral inclui tenant, mês e plano', () => {
  assert.equal(AFFILIATE_REFERRAL_ONBOARDING_CONFLICT_TARGET, 'tenant_id,referencia_mes,plano')

  assert.equal(
    buildAffiliateReferralIdempotencyKey({
      tenantId: 'tenant-1',
      referenciaMes: '2026-04',
      plano: 'pro',
    }),
    'tenant-1::2026-04::pro'
  )

  assert.notEqual(
    buildAffiliateReferralIdempotencyKey({
      tenantId: 'tenant-1',
      referenciaMes: '2026-04',
      plano: 'start',
    }),
    buildAffiliateReferralIdempotencyKey({
      tenantId: 'tenant-1',
      referenciaMes: '2026-04',
      plano: 'pro',
    })
  )
})

