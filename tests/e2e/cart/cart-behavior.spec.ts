import { test, expect } from '@playwright/test'
import { dismissCookieBanner, addFirstProduct, openCart } from '../helpers'

/**
 * Cart Behavior — testa adição, remoção, incremento/decremento,
 * total atualizado, e estado vazio.
 */
test.describe('Carrinho — Comportamento', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/templates/pizzaria')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
  })

  test('Adicionar produto mostra botão flutuante com badge = 1', async ({ page }) => {
    await addFirstProduct(page)

    const badge = page.locator('[data-testid="cart-badge"]')
    await expect(badge).toBeVisible({ timeout: 5_000 })
    await expect(badge).toHaveText('1')
  })

  test('Adicionar mesmo produto 2x incrementa badge para 2', async ({ page }) => {
    const addBtn = page.locator('[data-testid="btn-add-product"]').first()
    await expect(addBtn).toBeVisible({ timeout: 15_000 })
    await addBtn.click()

    // Wait for badge to settle at "1" before second click
    const badge = page.locator('[data-testid="cart-badge"]')
    await expect(badge).toHaveText('1')

    await addBtn.click()
    await expect(badge).toHaveText('2')
  })

  test('Incrementar quantidade no drawer atualiza total', async ({ page }) => {
    await addFirstProduct(page)
    await openCart(page)

    const total = page.locator('[data-testid="cart-total"]')
    const initialTotal = await total.textContent()

    // Incrementar
    await page.locator('[aria-label="Aumentar quantidade"]').first().click()

    // Total deve mudar
    await expect(total).not.toHaveText(initialTotal!)
    const newTotal = await total.textContent()
    expect(newTotal).toMatch(/R\$\s?\d/)
  })

  test('Decrementar de 2 para 1 atualiza total corretamente', async ({ page }) => {
    // Adicionar 2x
    const addBtn = page.locator('[data-testid="btn-add-product"]').first()
    await expect(addBtn).toBeVisible({ timeout: 15_000 })
    await addBtn.click()
    await addBtn.click()

    await openCart(page)

    const total = page.locator('[data-testid="cart-total"]')
    const totalWith2 = await total.textContent()

    // Decrementar
    await page.locator('[aria-label="Diminuir quantidade"]').first().click()

    const totalWith1 = await total.textContent()
    expect(totalWith2).not.toBe(totalWith1)
  })

  test('Decrementar de 1 remove o item do carrinho', async ({ page }) => {
    await addFirstProduct(page)
    await openCart(page)

    const items = page.locator('[data-testid="cart-item"]')
    await expect(items).toHaveCount(1)

    // Decrementar de 1 → remove
    await page.locator('[aria-label="Diminuir quantidade"]').first().click()

    // Deve mostrar estado vazio
    await expect(page.locator('[data-testid="cart-empty"]')).toBeVisible({ timeout: 3_000 })
    await expect(items).toHaveCount(0)
  })

  test('Botão remover (X) remove item diretamente', async ({ page }) => {
    await addFirstProduct(page)
    await openCart(page)

    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1)

    await page.locator('[aria-label="Remover item"]').first().click()

    await expect(page.locator('[data-testid="cart-empty"]')).toBeVisible({ timeout: 3_000 })
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(0)
  })

  test('Adicionar 2 produtos diferentes mostra 2 cards separados', async ({ page }) => {
    const addButtons = page.locator('[data-testid="btn-add-product"]')
    await expect(addButtons.first()).toBeVisible({ timeout: 15_000 })

    await addButtons.nth(0).click()
    await addButtons.nth(1).click()

    await openCart(page)

    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2)
  })

  test('Fechar e reabrir drawer mantém itens', async ({ page }) => {
    await addFirstProduct(page)
    await openCart(page)

    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1)

    // Fechar drawer
    await page.locator('[data-testid="cart-drawer"] [aria-label="Fechar carrinho"]').click()
    await expect(page.locator('[data-testid="cart-drawer"]')).not.toBeVisible({ timeout: 3_000 })

    // Reabrir
    await openCart(page)
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1)
  })
})

