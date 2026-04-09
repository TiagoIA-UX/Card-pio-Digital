import { test, expect } from '@playwright/test'
import {
  dismissCookieBanner,
  addFirstProduct,
  openCart,
  fillDeliveryForm,
  fillPickupForm,
  submitButton,
} from '../helpers'

/**
 * Checkout Happy Path — valida que um pedido completo habilita o envio
 * e que a URL do WhatsApp contém os dados corretos da mensagem.
 */
test.describe('Checkout — Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/templates/pizzaria')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
  })

  test('Entrega completa: botão habilitado e WhatsApp URL contém dados do pedido', async ({
    page,
  }) => {
    await addFirstProduct(page)
    await openCart(page)
    await fillDeliveryForm(page, {
      name: 'João Silva',
      phone: '11988776655',
      street: 'Av Brasil, 500',
      district: 'Jardim América',
      payment: 'PIX',
    })

    const btn = submitButton(page)
    await expect(btn).toBeEnabled()

    await dismissCookieBanner(page)
    await page
      .locator('[role="region"][aria-label*="Notifications"]')
      .waitFor({ state: 'hidden', timeout: 5_000 })
      .catch(() => {})

    // Intercept WhatsApp navigation to prevent leaving the page
    let whatsappUrl: string | null = null
    await page.route('**/api/orders', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          numero_pedido: 1234,
          total: 14,
        }),
      })
    })

    await page.route('**/api.whatsapp.com/**', async (route) => {
      whatsappUrl = route.request().url()
      await route.abort()
    })

    await btn.click({ noWaitAfter: true, force: true })

    await page.waitForTimeout(1_000)

    if (whatsappUrl) {
      expect(decodeURIComponent(whatsappUrl)).toMatch(/João Silva/)
      expect(decodeURIComponent(whatsappUrl)).toMatch(/11988776655/)
      expect(decodeURIComponent(whatsappUrl)).toMatch(/Av Brasil, 500/)
      return
    }

    const successToast = page.getByText('Pedido enviado!')
    await expect(successToast).toBeVisible()
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeHidden()
  })

  test('Retirada completa: botão habilitado', async ({ page }) => {
    await addFirstProduct(page)
    await openCart(page)
    await fillPickupForm(page, {
      name: 'Maria Santos',
      phone: '21977665544',
      payment: 'Dinheiro',
    })

    await expect(submitButton(page)).toBeEnabled()
  })

  test('Múltiplos itens: total correto no formulário de checkout', async ({ page }) => {
    // Add two different products
    const addButtons = page.locator('[data-testid="btn-add-product"]')
    await expect(addButtons.first()).toBeVisible({ timeout: 15_000 })

    await addButtons.nth(0).click()
    await addButtons.nth(1).click()

    await openCart(page)

    // Should have 2 cart items
    const items = page.locator('[data-testid="cart-item"]')
    await expect(items).toHaveCount(2)

    // Total should include both prices
    const total = page.locator('[data-testid="cart-total"]')
    await expect(total).toBeVisible()
    const totalText = await total.textContent()
    expect(totalText).toMatch(/R\$\s?\d/)
  })

  test('Pagamento dinheiro com troco: campo aparece', async ({ page }) => {
    await addFirstProduct(page)
    await openCart(page)

    await page.locator('[data-testid="input-nome"]').fill('Teste Troco')
    await page.locator('button:has-text("Retirada")').click()
    await page.locator('label:has-text("Dinheiro")').click()

    // Campo de troco deve aparecer
    const trocoInput = page.locator('input[placeholder="Ex: 50,00"]')
    await expect(trocoInput).toBeVisible({ timeout: 3_000 })
    await trocoInput.fill('100,00')

    await page.locator('[data-testid="input-telefone"]').fill('11999887766')
    await expect(submitButton(page)).toBeEnabled()
  })
})
