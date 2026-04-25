/**
 * Handler de provisionamento de onboarding.
 * Stub temporário — gateway de pagamento em migração.
 * O processamento real ocorre via webhook Stripe.
 */
export async function processOnboardingPayment(
  _admin: unknown,
  _orderId: string,
  _payment: unknown,
  _siteUrl: string
): Promise<void> {
  throw new Error(
    'processOnboardingPayment: gateway em migração para Stripe. Use o webhook Stripe para provisionamento.'
  )
}
