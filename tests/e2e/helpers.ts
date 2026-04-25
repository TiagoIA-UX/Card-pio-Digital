import { type Page, type Locator, expect } from '@playwright/test'

/** Dismiss cookie banner if visible */
export async function dismissCookieBanner(page: Page) {
  const btn = page.locator('button:has-text("Aceitar cookies")')
  if (await btn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await btn.click()
    await btn.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {})
  }
}

/** Add the first product to the cart */
export async function addFirstProduct(page: Page) {
  const addBtn = page.locator('[data-testid="btn-add-product"]').first()
  await expect(addBtn).toBeVisible({ timeout: 15_000 })
  await addBtn.click()
}

/** Open the cart drawer via the floating button */
export async function openCart(page: Page) {
  const cartBtn = page.locator('[data-testid="btn-open-cart"]')
  await expect(cartBtn).toBeVisible({ timeout: 5_000 })
  await cartBtn.click()
  await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible({ timeout: 3_000 })
}

/** Fill the minimum delivery form: name + phone + delivery address + payment */
export async function fillDeliveryForm(
  page: Page,
  opts: {
    name?: string
    phone?: string
    street?: string
    district?: string
    payment?: 'PIX' | 'Dinheiro' | 'Cartão'
  } = {}
) {
  const {
    name = 'Teste E2E',
    phone = '11999887766',
    street = 'Rua Teste, 123',
    district = 'Centro',
    payment = 'PIX',
  } = opts

  await page.locator('[data-testid="input-nome"]').fill(name)
  await page.locator('[data-testid="input-telefone"]').fill(phone)

  await page.locator('button:has-text("Entrega")').click()

  const streetInput = page.locator('[data-testid="input-rua-e-número"]')
  await expect(streetInput).toBeVisible({ timeout: 3_000 })
  await streetInput.fill(street)
  await page.locator('[data-testid="input-bairro"]').fill(district)

  await page.locator(`label:has-text("${payment}")`).click()
}

/** Fill the minimum pickup form: name + phone + pickup + payment */
export async function fillPickupForm(
  page: Page,
  opts: {
    name?: string
    phone?: string
    payment?: 'PIX' | 'Dinheiro' | 'Cartão'
  } = {}
) {
  const { name = 'Teste E2E', phone = '11999887766', payment = 'PIX' } = opts

  await page.locator('[data-testid="input-nome"]').fill(name)
  await page.locator('[data-testid="input-telefone"]').fill(phone)

  await page.locator('button:has-text("Retirada")').click()

  await page.locator(`label:has-text("${payment}")`).click()
}

/** Get the submit order button */
export function submitButton(page: Page): Locator {
  return page.locator('[data-testid="btn-submit-order"]')
}

