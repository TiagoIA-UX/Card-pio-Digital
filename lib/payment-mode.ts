export type PaymentEnvironment = 'sandbox' | 'production'

function normalizePaymentEnvironment(value?: string | null): PaymentEnvironment | null {
  if (!value) return null

  const normalized = value.trim().toLowerCase()

  if (normalized === 'sandbox' || normalized === 'teste' || normalized === 'test') {
    return 'sandbox'
  }

  if (normalized === 'production' || normalized === 'producao' || normalized === 'prod') {
    return 'production'
  }

  return null
}

export function getPublicPaymentEnvironment(): PaymentEnvironment {
  return (
    normalizePaymentEnvironment(process.env.NEXT_PUBLIC_MERCADO_PAGO_ENV) ||
    (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox')
  )
}

export function getServerPaymentEnvironment(): PaymentEnvironment {
  return (
    normalizePaymentEnvironment(process.env.MERCADO_PAGO_ENV) || getPublicPaymentEnvironment()
  )
}

export function isPublicSandboxMode() {
  return getPublicPaymentEnvironment() === 'sandbox'
}

export function isServerSandboxMode() {
  return getServerPaymentEnvironment() === 'sandbox'
}

export function getPaymentModeBadgeLabel() {
  return isPublicSandboxMode() ? 'MODO TESTE - MERCADO PAGO SANDBOX' : 'MODO PRODUCAO'
}
