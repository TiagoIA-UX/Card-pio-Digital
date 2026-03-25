/**
 * Fixtures reutilizáveis para testes de pagamento/checkout.
 *
 * Provê helpers tipados para interagir com os endpoints de
 * pagamento, webhook e cupons.
 */
import { test as base, expect, type APIRequestContext } from '@playwright/test'

/* ── Tipos ─────────────────────────────────────────────── */

export interface CheckoutPayload {
  template: string
  plan: string
  paymentMethod: 'pix' | 'cartao'
  restaurantName: string
  customerName: string
  email: string
  phone: string
  couponCode?: string
}

/* ── Helpers ───────────────────────────────────────────── */

export class PaymentHelper {
  constructor(private request: APIRequestContext) {}

  /** Cria sessão de onboarding (requer auth) */
  async iniciarOnboarding(payload: CheckoutPayload) {
    return this.request.post('/api/pagamento/iniciar-onboarding', { data: payload })
  }

  /** Consulta status do checkout */
  async getStatus(orderNumber: string) {
    return this.request.get(`/api/pagamento/status?checkout=${orderNumber}`)
  }

  /** Valida cupom de desconto */
  async validarCupom(code: string, subtotal: number) {
    return this.request.post('/api/checkout/validar-cupom', {
      data: { code, subtotal },
    })
  }

  /** Envia webhook com assinatura customizada */
  async sendWebhook(data: Record<string, unknown>, headers?: Record<string, string>) {
    return this.request.post('/api/webhook/mercadopago', {
      data,
      headers: headers ?? {
        'x-signature': `ts=${Date.now()},v1=${'a'.repeat(64)}`,
        'x-request-id': `test-${Date.now()}`,
      },
    })
  }
}

/* ── Fixture exports ───────────────────────────────────── */

type PaymentFixtures = {
  paymentHelper: PaymentHelper
}

export const test = base.extend<PaymentFixtures>({
  paymentHelper: async ({ request }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture, not React hook
    await use(new PaymentHelper(request))
  },
})

export { expect }
