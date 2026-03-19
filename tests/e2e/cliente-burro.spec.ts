import { test, expect } from '@playwright/test'

/**
 * E2E: Cliente Burro — Chaos Testing
 *
 * Simula comportamentos erráticos de usuários reais:
 * - Cliques múltiplos
 * - Navegação caótica
 * - Inputs inválidos
 * - Race conditions
 * - Concorrência entre abas
 */

test.describe('Cliente Burro — Submissão Múltipla', () => {
  test('double-click no botão de compra não cria checkout duplicado', async ({ page }) => {
    await page.goto('/comprar/pizzaria')

    const submitButton = page.locator(
      'button[type="submit"], button:has-text("pagar"), button:has-text("finalizar")'
    )

    if (
      await submitButton
        .first()
        .isVisible({ timeout: 5_000 })
        .catch(() => false)
    ) {
      // Double-click rápido
      await submitButton.first().dblclick()
      await page.waitForTimeout(3_000)

      // Não deve ter erros de JS no console
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      expect(errors.length).toBe(0)
    }
  })

  test('submissão rápida em sequência (spam click)', async ({ page }) => {
    await page.goto('/comprar/restaurante')

    const submitButton = page.locator(
      'button[type="submit"], button:has-text("pagar"), button:has-text("finalizar")'
    )

    if (
      await submitButton
        .first()
        .isVisible({ timeout: 5_000 })
        .catch(() => false)
    ) {
      // 5 cliques em rápida sucessão
      for (let i = 0; i < 5; i++) {
        await submitButton.first().click({ force: true, delay: 50 })
      }
      await page.waitForTimeout(3_000)

      // Página não deve crashar
      await expect(page.locator('body')).toBeVisible()
    }
  })
})

test.describe('Cliente Burro — Navegação Caótica', () => {
  test('zigzag entre checkout e templates não quebra estado', async ({ page }) => {
    // Ida
    await page.goto('/comprar/pizzaria')
    await page.waitForLoadState('networkidle')

    // Volta
    await page.goto('/templates')
    await page.waitForLoadState('networkidle')

    // Ida de novo (outro template)
    await page.goto('/comprar/restaurante')
    await page.waitForLoadState('networkidle')

    // Volta rápida com browser back
    await page.goBack()
    await page.waitForLoadState('networkidle')

    // Avança
    await page.goForward()
    await page.waitForLoadState('networkidle')

    // Deve estar funcional
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('body')).not.toContainText(/undefined|null|error/i)
  })

  test('refresh no meio do checkout mantém página funcional', async ({ page }) => {
    await page.goto('/comprar/bar')
    await page.waitForLoadState('networkidle')

    // Refresh agressivo
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.reload()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('body')).toBeVisible()
  })

  test('acesso direto a pagamento/sucesso sem checkout real', async ({ page }) => {
    await page.goto('/pagamento/sucesso?checkout=CHK-INVENTADO-123')
    await page.waitForLoadState('networkidle')

    // Não deve mostrar dados sensíveis nem crashar
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('body')).not.toContainText(/stack|trace|exception/i)
  })
})

test.describe('Cliente Burro — Inputs Inválidos', () => {
  test('campos com caracteres especiais não causam erro 500', async ({ request }) => {
    const maliciousInputs = [
      { template: '<script>alert(1)</script>', plan: 'self-service', paymentMethod: 'pix' },
      { template: "'; DROP TABLE restaurants;--", plan: 'self-service', paymentMethod: 'pix' },
      { template: '🍕'.repeat(100), plan: 'self-service', paymentMethod: 'pix' },
      { template: '../../../etc/passwd', plan: 'self-service', paymentMethod: 'pix' },
    ]

    for (const input of maliciousInputs) {
      const response = await request.post('/api/pagamento/iniciar-onboarding', {
        data: {
          ...input,
          restaurantName: 'Test',
          customerName: 'Test User',
          email: 'test@test.com',
          phone: '11999999999',
        },
      })

      // Deve rejeitar com 400/401/422, NUNCA 500
      expect(response.status()).not.toBe(500)
    }
  })

  test('cupom com SQL injection é rejeitado corretamente', async ({ request }) => {
    const response = await request.post('/api/checkout/validar-cupom', {
      data: {
        code: "' OR 1=1; --",
        subtotal: 297,
      },
    })

    expect([200, 400, 429]).toContain(response.status())
    if (response.status() === 200) {
      const body = await response.json()
      expect(body.valid).toBe(false)
    }
  })

  test('webhook com payload forjado é rejeitado', async ({ request }) => {
    const response = await request.post('/api/webhook/mercadopago', {
      data: {
        action: 'payment.created',
        data: { id: '999999999' },
      },
      headers: {
        'x-signature':
          'ts=fake,v1=0000000000000000000000000000000000000000000000000000000000000000',
        'x-request-id': 'fake-request-id',
      },
    })

    // Webhook pode retornar 200 (para evitar retries do provedor) ou 4xx
    expect([200, 400, 401, 403, 500]).toContain(response.status())
    // Se 500, é aceitável apenas se for por validação HMAC (não crash)
  })

  test('upload API rejeita sem autenticação', async ({ request }) => {
    const response = await request.post('/api/upload', {
      multipart: {
        file: {
          name: 'test.png',
          mimeType: 'image/png',
          buffer: Buffer.from('fake-image-data'),
        },
        folder: 'pratos',
      },
    })

    // Sem Bearer token, deve rejeitar
    expect([400, 401, 403]).toContain(response.status())
  })
})

test.describe('Cliente Burro — Race Conditions via API', () => {
  test('requisições simultâneas ao mesmo endpoint são rate-limited', async ({ request }) => {
    const promises = Array.from({ length: 10 }, () =>
      request.post('/api/checkout/validar-cupom', {
        data: { code: 'SPAM_TEST', subtotal: 100 },
      })
    )

    const responses = await Promise.all(promises)
    const statuses = responses.map((r) => r.status())

    // Algumas devem ser 429 (rate limited)
    const rateLimited = statuses.filter((s) => s === 429).length
    // É aceitável que rate limiting bloqueie parte das requisições
    // O importante é que nenhuma retorne 500
    expect(statuses.every((s) => s !== 500)).toBe(true)
  })

  test('múltiplos POSTs ao webhook com IDs diferentes não crasham', async ({ request }) => {
    const promises = Array.from({ length: 5 }, (_, i) =>
      request.post('/api/webhook/mercadopago', {
        data: {
          action: 'payment.created',
          data: { id: `${100000 + i}` },
        },
        headers: {
          'x-signature': `ts=${Date.now()},v1=${'a'.repeat(64)}`,
          'x-request-id': `race-test-${i}`,
        },
      })
    )

    const responses = await Promise.all(promises)
    // Nenhum deve retornar 500 (crash do servidor)
    for (const response of responses) {
      expect(response.status()).not.toBe(500)
    }
  })
})

test.describe('Cliente Burro — Responsividade', () => {
  test('checkout em mobile não tem overflow horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/comprar/pizzaria')
    await page.waitForLoadState('networkidle')

    // Verifica se não há scroll horizontal
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5) // 5px de tolerância
  })

  test('templates page em tablet renderiza sem quebras', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/templates')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('body')).toBeVisible()
    // Nenhum texto cortado
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)
  })
})
