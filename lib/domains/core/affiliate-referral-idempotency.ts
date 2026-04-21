export const AFFILIATE_REFERRAL_ONBOARDING_CONFLICT_TARGET = 'tenant_id,referencia_mes,plano'

export function buildAffiliateReferralIdempotencyKey(input: {
  tenantId: string
  referenciaMes: string
  plano: string
}) {
  return `${input.tenantId}::${input.referenciaMes}::${input.plano}`
}
