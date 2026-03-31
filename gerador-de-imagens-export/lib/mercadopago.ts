import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import { isServerSandboxMode } from '@/lib/payment-mode'

function readEnvValue(variableNames: string[], label: string): string {
  for (const variableName of variableNames) {
    const value = process.env[variableName]?.trim()
    if (value) return value
  }
  throw new Error(`Credencial do Mercado Pago ausente: ${label}`)
}

export function getMercadoPagoAccessToken(): string {
  if (!isServerSandboxMode()) {
    return readEnvValue(
      ['MERCADO_PAGO_ACCESS_TOKEN', 'MP_ACCESS_TOKEN'],
      'MERCADO_PAGO_ACCESS_TOKEN'
    )
  }
  // Em sandbox, aceita tanto TEST- quanto APP_USR-
  return readEnvValue(
    ['MERCADO_PAGO_ACCESS_TOKEN', 'MP_ACCESS_TOKEN'],
    'MERCADO_PAGO_ACCESS_TOKEN'
  )
}

export function getMercadoPagoEnvironment(): 'sandbox' | 'production' {
  return isServerSandboxMode() ? 'sandbox' : 'production'
}

export function createMercadoPagoClient(timeout = 5000): MercadoPagoConfig {
  return new MercadoPagoConfig({
    accessToken: getMercadoPagoAccessToken(),
    options: { timeout },
  })
}

export function createMercadoPagoPreferenceClient(timeout = 5000): Preference {
  return new Preference(createMercadoPagoClient(timeout))
}

export function createMercadoPagoPaymentClient(timeout = 5000): Payment {
  return new Payment(createMercadoPagoClient(timeout))
}
