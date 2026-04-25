/**
 * Stub temporário — MP removido. Onboarding em migração para Stripe.
 */

export async function assertMercadoPagoTokenMatchesConfiguredSeller(): Promise<void> {
  throw new Error('Mercado Pago removido — onboarding em migração para Stripe.')
}

export async function createValidatedMercadoPagoPreferenceClient(_timeout?: number): Promise<{
  create: (input: unknown) => Promise<{
    id: string
    init_point: string
    sandbox_init_point: string | null
  }>
}> {
  throw new Error('Mercado Pago removido — onboarding em migração para Stripe.')
}

export async function getMercadoPagoAccessToken(): Promise<string> {
  throw new Error('Mercado Pago removido — onboarding em migração para Stripe.')
}

export async function createMercadoPagoPreapprovalWithTrial(_input: unknown): Promise<{
  id: string
  status: string
  trialEndsAt: string | null
  trialEndsAtEstimated: boolean
}> {
  throw new Error('Mercado Pago removido — onboarding em migração para Stripe.')
}
