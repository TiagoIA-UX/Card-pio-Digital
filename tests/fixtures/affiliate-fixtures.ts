/**
 * Fixtures reutilizáveis para testes de afiliados.
 *
 * Provê helpers tipados para criar, consultar e limpar dados
 * de afiliados, comissões e penalidades via API.
 */
import { test as base, expect, type APIRequestContext } from '@playwright/test'

/* ── Tipos ─────────────────────────────────────────────── */

export interface AffiliateData {
  id: string
  code: string
  nome: string
  chave_pix: string
  tier: string
  commission_rate: number
  status: string
}

export interface CommissionData {
  affiliate_id: string
  valor_assinatura: number
  comissao: number
  status: 'pendente' | 'aprovado' | 'pago'
}

/* ── Helpers ───────────────────────────────────────────── */

export class AffiliateHelper {
  constructor(private request: APIRequestContext) {}

  /** Tenta registrar afiliado via API pública (requer auth) */
  async registerViaAPI(data: { nome: string; chave_pix: string; lider_code?: string }) {
    return this.request.post('/api/afiliados/registrar', { data })
  }

  /** Busca dados do afiliado logado */
  async getMe() {
    return this.request.get('/api/afiliados/me')
  }

  /** Atualiza perfil do afiliado logado */
  async updateProfile(data: Record<string, string>) {
    return this.request.patch('/api/afiliados/me', { data })
  }

  /** Busca ranking público */
  async getRanking() {
    return this.request.get('/api/afiliados/ranking')
  }

  /** Busca saldo/info de pagamento */
  async getSaldoInfo() {
    return this.request.get('/api/afiliados/saldo-info')
  }
}

export class FraudHelper {
  constructor(private request: APIRequestContext) {}

  /** Envia webhook forjado com assinatura inválida */
  async sendForgedWebhook(paymentId: string) {
    return this.request.post('/api/webhook/mercadopago', {
      data: { action: 'payment.created', data: { id: paymentId } },
      headers: {
        'x-signature': `ts=1234567890,v1=${'0'.repeat(64)}`,
        'x-request-id': `fraud-test-${Date.now()}`,
      },
    })
  }

  /** Tenta registrar múltiplos afiliados com emails alias */
  async registerMultipleAliasAccounts(baseName: string, count: number) {
    const results: Array<{ name: string; status: number }> = []
    for (let i = 0; i < count; i++) {
      const resp = await this.request.post('/api/afiliados/registrar', {
        data: {
          nome: `${baseName}${i}`,
          chave_pix: `${baseName}+${i}@test.com`,
        },
      })
      results.push({ name: `${baseName}${i}`, status: resp.status() })
    }
    return results
  }
}

/* ── Fixture exports ───────────────────────────────────── */

type AffiliateFixtures = {
  affiliateHelper: AffiliateHelper
  fraudHelper: FraudHelper
}

export const test = base.extend<AffiliateFixtures>({
  affiliateHelper: async ({ request }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture, not React hook
    await use(new AffiliateHelper(request))
  },
  fraudHelper: async ({ request }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture, not React hook
    await use(new FraudHelper(request))
  },
})

export { expect }
