import { test, expect } from '@playwright/test'
import {
  dismissCookieBanner,
  addFirstProduct,
  openCart,
  submitButton,
} from '../helpers'

/**
 * Checkout Validation — valida que o formulário bloqueia envio
 * quando dados obrigatórios estão faltando ou inválidos.
 */
test.describe('Checkout — Validação de Campos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/templates/pizzaria')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    await addFirstProduct(page)
    await openCart(page)
  })

  test('Carrinho com item mas sem nome, telefone ou pagamento → botão desabilitado', async ({
    page,
  }) => {
    // Apenas 1 item no carrinho, nada preenchido
    await expect(submitButton(page)).toBeDisabled()
  })

  test('Nome preenchido sem forma de pagamento → botão desabilitado', async ({ page }) => {
    await page.locator('[data-testid="input-nome"]').fill('Teste Validação')
    await page.locator('button:has-text("Retirada")').click()

    // Sem forma de pagamento selecionada
    await expect(submitButton(page)).toBeDisabled()
  })

  test('Telefone inválido bloqueia envio, corrigir libera', async ({ page }) => {
    await page.locator('[data-testid="input-nome"]').fill('Teste Bloqueio')
    await page.locator('[data-testid="input-telefone"]').fill('119')
    await page.locator('button:has-text("Retirada")').click()
    await page.locator('label:has-text("PIX")').click()

    await expect(submitButton(page)).toBeDisabled()

    // Corrigir telefone
    await page.locator('[data-testid="input-telefone"]').fill('11999887766')
    await expect(submitButton(page)).toBeEnabled()
  })

  test('Entrega sem endereço → botão desabilitado', async ({ page }) => {
    await page.locator('[data-testid="input-nome"]').fill('Teste Endereço')
    await page.locator('[data-testid="input-telefone"]').fill('11999887766')
    await page.locator('button:has-text("Entrega")').click()
    await page.locator('label:has-text("PIX")').click()

    // Campos de endereço visíveis mas vazios
    const street = page.locator('[data-testid="input-rua-e-número"]')
    await expect(street).toBeVisible({ timeout: 3_000 })

    await expect(submitButton(page)).toBeDisabled()
  })

  test('Entrega com rua mas sem bairro → botão desabilitado', async ({ page }) => {
    await page.locator('[data-testid="input-nome"]').fill('Teste Parcial')
    await page.locator('[data-testid="input-telefone"]').fill('11999887766')
    await page.locator('button:has-text("Entrega")').click()
    await page.locator('label:has-text("PIX")').click()

    await page.locator('[data-testid="input-rua-e-número"]').fill('Rua Teste, 1')

    // Bairro vazio → desabilitado
    await expect(submitButton(page)).toBeDisabled()

    // Preencher bairro → habilitado
    await page.locator('[data-testid="input-bairro"]').fill('Centro')
    await expect(submitButton(page)).toBeEnabled()
  })

  test('Telefone vazio é aceito (opcional)', async ({ page }) => {
    await page.locator('[data-testid="input-nome"]').fill('Sem Telefone')
    // Telefone fica vazio
    await page.locator('button:has-text("Retirada")').click()
    await page.locator('label:has-text("Cartão")').click()

    await expect(submitButton(page)).toBeEnabled()
  })
})

