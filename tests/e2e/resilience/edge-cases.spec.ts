import { test, expect } from '@playwright/test'
import { dismissCookieBanner, addFirstProduct, openCart, submitButton } from '../helpers'

/**
 * Resiliência — Edge cases, viewport mobile, e comportamentos limítrofes.
 */
test.describe('Resiliência — Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/templates/pizzaria')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
  })

  test('Carrinho vazio: botão flutuante não aparece', async ({ page }) => {
    // Sem adicionar produto, botão do carrinho não deve existir
    const cartBtn = page.locator('[data-testid="btn-open-cart"]')
    await expect(cartBtn).not.toBeVisible({ timeout: 3_000 })
  })

  test('Drawer vazio mostra estado vazio com mensagem', async ({ page }) => {
    // Adicionar e remover para abrir drawer no estado vazio
    await addFirstProduct(page)
    await openCart(page)

    // Remover o item
    await page.locator('[aria-label="Remover item"]').first().click()

    const emptyState = page.locator('[data-testid="cart-empty"]')
    await expect(emptyState).toBeVisible({ timeout: 3_000 })
    await expect(page.locator('[data-testid="cart-empty"]').first()).toBeVisible()

    // Botão de submit não deve aparecer no estado vazio
    await expect(submitButton(page)).not.toBeVisible()
  })

  test('Submeter com nome muito longo funciona sem quebra visual', async ({ page }) => {
    await addFirstProduct(page)
    await openCart(page)

    const longName = 'A'.repeat(200)
    await page.locator('[data-testid="input-nome"]').fill(longName)
    await page.locator('button:has-text("Retirada")').click()
    await page.locator('label:has-text("PIX")').click()

    // Deve continuar habilitado
    await expect(submitButton(page)).toBeEnabled()
  })

  test('Observações preenchidas não bloqueiam envio', async ({ page }) => {
    await addFirstProduct(page)
    await openCart(page)

    await page.locator('[data-testid="input-nome"]').fill('Teste Observações')
    await page.locator('button:has-text("Retirada")').click()
    await page.locator('label:has-text("PIX")').click()

    // Preencher observações
    const notes = page.locator('textarea[placeholder*="sem cebola"]')
    await notes.fill('Sem cebola, sem tomate, bem passado')

    await expect(submitButton(page)).toBeEnabled()
  })

  test('Cookie banner não sobrepõe botão flutuante do carrinho', async ({ page }) => {
    // Limpar cookies para mostrar banner novamente
    await page.evaluate(() => localStorage.removeItem('cookie-consent'))
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Adicionar produto — banner deve estar visível
    await addFirstProduct(page)

    const cartBtn = page.locator('[data-testid="btn-open-cart"]')
    await expect(cartBtn).toBeVisible({ timeout: 5_000 })

    // Verificar que o botão está acima do banner
    const banner = page.locator('div:has(> button:has-text("Aceitar cookies"))').first()
    if (await banner.isVisible().catch(() => false)) {
      const cartBox = await cartBtn.boundingBox()
      const bannerBox = await banner.boundingBox()

      if (cartBox && bannerBox) {
        // O bottom do cart button deve estar acima (ou no topo) do banner
        expect(cartBox.y + cartBox.height).toBeLessThanOrEqual(bannerBox.y + 5)
      }
    }
  })

  test('Múltiplas trocas rápidas entrega/retirada não quebram estado', async ({ page }) => {
    await addFirstProduct(page)
    await openCart(page)

    const deliveryBtn = page.locator('button:has-text("Entrega")')
    const pickupBtn = page.locator('button:has-text("Retirada")')
    const street = page.locator('[data-testid="input-rua-e-número"]')

    // Toggle rápido 5 vezes
    for (let i = 0; i < 5; i++) {
      await deliveryBtn.click()
      await pickupBtn.click()
    }

    // Voltar para entrega — campos devem funcionar normal
    await deliveryBtn.click()
    await expect(street).toBeVisible({ timeout: 3_000 })
    await street.fill('Teste Resiliência, 99')
    await expect(street).toHaveValue('Teste Resiliência, 99')
  })
})

