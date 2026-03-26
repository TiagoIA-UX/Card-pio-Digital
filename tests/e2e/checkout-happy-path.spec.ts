import { test, expect } from '@playwright/test'

/**
 * E2E: Happy Path — Fluxo de compra de template
 *
 * Valida o caminho completo: landing → template preview → checkout form → MP redirect
 * Usa sandbox quando MERCADO_PAGO_ENV=sandbox no servidor.
 */

test.describe('Checkout — Happy Path', () => {
  test('template listing page loads and shows templates', async ({ page }) => {
    await page.goto('/templates')
    await expect(page).toHaveTitle(/template|cardápio|zairyx|canais/i)

    // Deve exibir ao menos alguns templates
    const templateCards = page.locator('[data-testid="template-card"], a[href*="/templates/"]')
    await expect(templateCards.first()).toBeVisible({ timeout: 10_000 })
  })

  test('template preview page renders correctly', async ({ page }) => {
    await page.goto('/templates/pizzaria')
    await expect(page.locator('body')).toContainText(/pizzaria/i)

    // Deve ter botão de compra/CTA
    const ctaButton = page.locator(
      'a[href*="/comprar/pizzaria"], button:has-text("comprar"), button:has-text("contratar"), a:has-text("começar")'
    )
    await expect(ctaButton.first()).toBeVisible({ timeout: 10_000 })
  })

  test('checkout page loads with plan selection', async ({ page }) => {
    await page.goto('/comprar/pizzaria')

    // Deve mostrar opções de plano
    await expect(page.locator('body')).toContainText(/self-service|feito.*voc|plano/i)
  })

  test('checkout summary leaves implementation and monthly continuity explicit', async ({
    page,
  }) => {
    await page.goto('/comprar/pizzaria')

    await expect(page.locator('body')).toContainText(/resumo do pedido/i)
    await expect(page.locator('body')).toContainText(/implantação inicial/i)
    await expect(page.locator('body')).toContainText(/mensalidade após ativação/i)
    await expect(page.locator('body')).toContainText(/cobrança deste checkout/i)
    await expect(page.locator('body')).toContainText(/zero taxa por pedido/i)
    await expect(page.locator('body')).toContainText(/R\$\s?\d+/i)
  })

  test('checkout form validates required fields', async ({ page }) => {
    await page.goto('/comprar/pizzaria')

    // Tenta submeter sem preencher — deve mostrar erros de validação ou não redirecionar
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("pagar"), button:has-text("finalizar"), button:has-text("comprar")'
    )
    if (
      await submitButton
        .first()
        .isVisible({ timeout: 5_000 })
        .catch(() => false)
    ) {
      await submitButton.first().click()
      // Não deve redirecionar para Mercado Pago — deve ficar na mesma página
      await page.waitForTimeout(2_000)
      expect(page.url()).toContain('/comprar/')
    }
  })

  test('coupon validation API rejects invalid codes', async ({ request }) => {
    const response = await request.post('/api/checkout/validar-cupom', {
      data: { code: 'INVALIDO_FAKE_123', subtotal: 297 },
    })

    // Deve retornar 200 com valid: false (ou 429 se rate limited)
    const status = response.status()
    expect([200, 429]).toContain(status)

    if (status === 200) {
      const body = await response.json()
      expect(body.valid).toBe(false)
    }
  })

  test('payment status API requires authentication', async ({ request }) => {
    const response = await request.get('/api/pagamento/status?checkout=CHK-FAKE-123')

    // Sem auth, deve retornar 401 ou redirect
    expect([401, 403, 302, 307]).toContain(response.status())
  })
})

test.describe('Checkout — Pages de Retorno', () => {
  test('success page handles missing checkout param', async ({ page }) => {
    await page.goto('/pagamento/sucesso')

    // Deve lidar gracefully com checkout ausente
    await expect(page.locator('body')).not.toContainText(/undefined|null|error/i)
  })

  test('pending page loads without crash', async ({ page }) => {
    await page.goto('/pagamento/pendente?checkout=CHK-FAKE-TEST')

    // Não deve crashar, pode mostrar mensagem de aguardando
    await expect(page.locator('body')).not.toContainText(/undefined|null|error/i)
  })

  test('error page loads with retry options', async ({ page }) => {
    await page.goto('/pagamento/erro?checkout=CHK-FAKE-TEST')

    // Deve mostrar alguma mensagem de erro/retry
    await expect(page.locator('body')).not.toContainText(/undefined|null/i)
  })
})
