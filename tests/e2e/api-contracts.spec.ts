import { test, expect } from '@playwright/test'

/**
 * Auditoria E2E — Contratos de API
 * Valida shape/schema de respostas dos endpoints principais.
 */

test.describe('API Contracts', () => {
  test('GET /api/templates retorna lista com shape correto', async ({ request }) => {
    const res = await request.get('/api/templates')
    // 200 = sucesso, 429 = rate limited (válido em suite completa)
    expect([200, 429]).toContain(res.status())
    if (res.status() === 200) {
      const body = await res.json()
      expect(body).toHaveProperty('templates')
      expect(Array.isArray(body.templates)).toBeTruthy()

      if (body.templates.length > 0) {
        const template = body.templates[0]
        expect(template).toHaveProperty('id')
        expect(template).toHaveProperty('slug')
        expect(template).toHaveProperty('name')
      }
    }
  })

  test('POST /api/checkout/validar-cupom retorna shape correto', async ({ request }) => {
    const res = await request.post('/api/checkout/validar-cupom', {
      data: { code: 'INEXISTENTE', subtotal: 100 },
    })
    // Cupom inválido pode retornar 200 com valid:false, 400, ou 429 (rate limited)
    const status = res.status()
    expect([200, 400, 404, 429]).toContain(status)

    if (status === 200) {
      const body = await res.json()
      expect(body).toHaveProperty('valid')
      expect(typeof body.valid).toBe('boolean')
    }
  })

  test('GET /api/pagamento/status sem checkout retorna erro', async ({ request }) => {
    const res = await request.get('/api/pagamento/status')
    // Sem parâmetro checkout, deve retornar erro (429 = rate limited)
    expect([400, 401, 429]).toContain(res.status())
  })

  test('POST /api/pagamento/iniciar-onboarding valida campos obrigatórios', async ({ request }) => {
    const res = await request.post('/api/pagamento/iniciar-onboarding', {
      data: {},
    })
    // Sem campos obrigatórios, deve retornar erro de validação (429 = rate limited)
    expect([400, 401, 422, 429]).toContain(res.status())
  })

  test('POST /api/afiliados/registrar sem auth retorna 401', async ({ request }) => {
    const res = await request.post('/api/afiliados/registrar', {
      data: { nome: 'Teste', chave_pix: 'test@test.com' },
    })
    // Rota deprecated (410) ou sem auth (401)
    expect([401, 410]).toContain(res.status())
  })

  test('POST /api/webhook/mercadopago sem signature retorna erro', async ({ request }) => {
    const res = await request.post('/api/webhook/mercadopago', {
      data: { action: 'payment.updated', data: { id: '123' } },
    })
    expect([400, 401]).toContain(res.status())
  })

  test('GET /api/cron/audit sem auth retorna 401', async ({ request }) => {
    const res = await request.get('/api/cron/audit')
    expect(res.status()).toBe(401)
  })

  test('rotas inexistentes retornam 404', async ({ request }) => {
    const res = await request.get('/api/nao-existe-xyz')
    expect(res.status()).toBe(404)
  })
})
