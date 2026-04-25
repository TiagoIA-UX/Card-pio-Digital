import { test, expect } from '@playwright/test'
import { dismissCookieBanner, addFirstProduct, openCart } from '../helpers'

/**
 * UX — Hints de validação, máscaras de telefone, e interações de teclado.
 */
test.describe('UX — Hints e Máscaras', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/templates/pizzaria')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    await addFirstProduct(page)
    await openCart(page)
  })

  test('Hint de endereço aparece ao sair do campo vazio', async ({ page }) => {
    await page.locator('button:has-text("Entrega")').click()

    const street = page.locator('[data-testid="input-rua-e-número"]')
    await expect(street).toBeVisible({ timeout: 3_000 })
    await street.focus()
    await street.blur()

    const streetHint = page.locator('p:has-text("Informe a rua e o número para entrega")')
    await expect(streetHint).toBeVisible({ timeout: 3_000 })
    await expect(streetHint).toHaveClass(/text-destructive/)

    const district = page.locator('[data-testid="input-bairro"]')
    await district.focus()
    await district.blur()

    const districtHint = page.locator('p:has-text("Informe o bairro para entrega")')
    await expect(districtHint).toBeVisible({ timeout: 3_000 })
    await expect(districtHint).toHaveClass(/text-destructive/)
  })

  test('Hint de endereço some ao preencher o campo', async ({ page }) => {
    await page.locator('button:has-text("Entrega")').click()

    const street = page.locator('[data-testid="input-rua-e-número"]')
    await street.focus()
    await street.blur()

    const streetHint = page.locator('p:has-text("Informe a rua e o número para entrega")')
    await expect(streetHint).toBeVisible({ timeout: 3_000 })

    // Preencher → hint some
    await street.fill('Rua Teste, 123')
    await expect(streetHint).not.toBeVisible({ timeout: 3_000 })
  })

  test('Telefone inválido mostra hint em vermelho', async ({ page }) => {
    const phone = page.locator('[data-testid="input-telefone"]')
    await phone.fill('11999')

    // Clicar fora
    await page.locator('[data-testid="input-nome"]').click()

    const hint = page.locator('p:has-text("Digite um telefone válido com DDD")')
    await expect(hint).toBeVisible({ timeout: 3_000 })
    await expect(hint).toHaveClass(/text-destructive/)
  })

  test('Telefone válido não mostra hint', async ({ page }) => {
    const phone = page.locator('[data-testid="input-telefone"]')
    await phone.fill('11999887766')

    await page.locator('[data-testid="input-nome"]').click()

    const hint = page.locator('p:has-text("Digite um telefone válido com DDD")')
    await expect(hint).not.toBeVisible({ timeout: 2_000 })
  })

  test('Corrigir telefone faz hint desaparecer', async ({ page }) => {
    const phone = page.locator('[data-testid="input-telefone"]')
    await phone.fill('11999')
    await page.locator('[data-testid="input-nome"]').click()

    const hint = page.locator('p:has-text("Digite um telefone válido com DDD")')
    await expect(hint).toBeVisible({ timeout: 3_000 })

    // Corrigir
    await phone.fill('11999887766')
    await page.locator('[data-testid="input-nome"]').click()
    await expect(hint).not.toBeVisible({ timeout: 3_000 })
  })

  test('Máscara de telefone formata corretamente (XX) XXXXX-XXXX', async ({ page }) => {
    const phone = page.locator('[data-testid="input-telefone"]')
    await phone.fill('11999887766')

    // O valor exibido deve estar com máscara
    const displayedValue = await phone.inputValue()
    expect(displayedValue).toBe('(11) 99988-7766')
  })

  test('Troca entrega/retirada mostra/esconde campos de endereço', async ({ page }) => {
    const street = page.locator('[data-testid="input-rua-e-número"]')
    const district = page.locator('[data-testid="input-bairro"]')
    const complement = page.locator('[data-testid="input-complemento"]')

    // Por padrão (retirada), campos não visíveis
    await expect(street).not.toBeVisible()

    // Selecionar entrega
    await page.locator('button:has-text("Entrega")').click()
    await expect(street).toBeVisible({ timeout: 3_000 })
    await expect(district).toBeVisible()
    await expect(complement).toBeVisible()

    // Preencher endereço
    await street.fill('Av Principal, 100')
    await district.fill('Vila Nova')

    // Trocar para retirada
    await page.locator('button:has-text("Retirada")').click()
    await expect(street).not.toBeVisible()

    // Voltar para entrega → dados preservados
    await page.locator('button:has-text("Entrega")').click()
    await expect(street).toHaveValue('Av Principal, 100')
    await expect(district).toHaveValue('Vila Nova')
  })

  test('Campo telefone tem type="tel" e inputMode="tel"', async ({ page }) => {
    const phone = page.locator('[data-testid="input-telefone"]')
    await expect(phone).toHaveAttribute('type', 'tel')
    await expect(phone).toHaveAttribute('inputmode', 'tel')
  })
})

