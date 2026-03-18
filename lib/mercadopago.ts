import { MercadoPagoConfig, Preference, Payment, PreApproval } from 'mercadopago'
import { COMPANY_NAME, COMPANY_PAYMENT_DESCRIPTOR, PRODUCT_NAME } from '@/lib/brand'
import { isServerSandboxMode } from '@/lib/payment-mode'
import { getSiteUrl } from '@/lib/site-url'

function readEnvValue(variableNames: string[], label: string) {
  for (const variableName of variableNames) {
    const value = process.env[variableName]?.trim()
    if (value) {
      return value
    }
  }

  throw new Error(`Credencial do Mercado Pago ausente: ${label}`)
}

export function getMercadoPagoAccessToken() {
  if (!isServerSandboxMode()) {
    return readEnvValue(
      ['MERCADO_PAGO_ACCESS_TOKEN', 'MP_ACCESS_TOKEN'],
      'MERCADO_PAGO_ACCESS_TOKEN'
    )
  }

  return readEnvValue(
    ['MERCADO_PAGO_TEST_ACCESS_TOKEN', 'MERCADO_PAGO_ACCESS_TOKEN', 'MP_ACCESS_TOKEN'],
    'MERCADO_PAGO_TEST_ACCESS_TOKEN'
  )
}

export function getMercadoPagoPublicKey() {
  if (!isServerSandboxMode()) {
    return readEnvValue(
      ['NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY', 'MERCADO_PAGO_PUBLIC_KEY'],
      'NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY'
    )
  }

  return readEnvValue(
    [
      'NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY',
      'MERCADO_PAGO_TEST_PUBLIC_KEY',
      'NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY',
      'MERCADO_PAGO_PUBLIC_KEY',
    ],
    'NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY'
  )
}

export function getMercadoPagoTestAccounts() {
  return {
    sellerId: process.env.MERCADO_PAGO_TEST_SELLER_ID?.trim() || '',
    buyerId: process.env.MERCADO_PAGO_TEST_BUYER_ID?.trim() || '',
  }
}

export function getMercadoPagoEnvironment() {
  return isServerSandboxMode() ? 'sandbox' : 'production'
}

export function createMercadoPagoClient(timeout = 5000) {
  return new MercadoPagoConfig({
    accessToken: getMercadoPagoAccessToken(),
    options: { timeout },
  })
}

export function createMercadoPagoPreferenceClient(timeout = 5000) {
  return new Preference(createMercadoPagoClient(timeout))
}

export function createMercadoPagoPaymentClient(timeout = 5000) {
  return new Payment(createMercadoPagoClient(timeout))
}

export function createMercadoPagoPreApprovalClient(timeout = 5000) {
  return new PreApproval(createMercadoPagoClient(timeout))
}

// Preços
export const PRICES = {
  PIX: {
    amount: 497,
    description: 'Site com Cardápio Digital - PIX à vista',
    discount: 100,
  },
  CARD: {
    amount: 597,
    description: 'Site com Cardápio Digital - Cartão',
    installments: 6, // 6x sem juros
    installmentAmount: 99.5,
  },
}

// Criar preferência de pagamento
export async function createPreference(data: {
  restaurantId: string
  restaurantName: string
  userEmail: string
  paymentMethod: 'pix' | 'card'
  baseUrl?: string
}) {
  const mercadopago = createMercadoPagoPreferenceClient()
  const isCard = data.paymentMethod === 'card'
  const price = isCard ? PRICES.CARD : PRICES.PIX

  const baseUrl = data.baseUrl || getSiteUrl()

  const preference = await mercadopago.create({
    body: {
      items: [
        {
          id: data.restaurantId,
          title: `${PRODUCT_NAME} — ${price.description}`,
          description: `Ativado por ${COMPANY_NAME} para ${data.restaurantName}`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: price.amount,
        },
      ],
      payer: {
        email: data.userEmail,
      },
      payment_methods: isCard
        ? {
            installments: PRICES.CARD.installments,
            default_installments: PRICES.CARD.installments,
          }
        : {
            excluded_payment_types: [{ id: 'credit_card' }, { id: 'debit_card' }],
          },
      back_urls: {
        success: `${baseUrl}/pagamento/sucesso`,
        failure: `${baseUrl}/pagamento/erro`,
        pending: `${baseUrl}/pagamento/pendente`,
      },
      auto_return: 'approved',
      external_reference: data.restaurantId,
      notification_url: `${baseUrl}/api/webhook/mercadopago`,
      // Aparece na fatura do cartão e no comprovante PIX do pagador
      // Deve bater com o nome da conta Mercado Pago para evitar estranhamento no checkout.
      statement_descriptor: COMPANY_PAYMENT_DESCRIPTOR,
    },
  })

  return preference
}
