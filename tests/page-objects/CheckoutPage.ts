/**
 * Page Object Model — Checkout (/comprar/[template])
 *
 * Encapsula interação com formulário de compra, seleção de plano,
 * cupom de desconto e submissão.
 */
import { type Page, type Locator, expect } from '@playwright/test'

export class CheckoutPage {
  readonly form: Locator
  readonly submitButton: Locator
  readonly planSelector: Locator
  readonly couponInput: Locator

  constructor(private page: Page) {
    this.form = page.locator('form').first()
    this.submitButton = page.locator(
      'button[type="submit"], button:has-text("pagar"), button:has-text("finalizar"), button:has-text("comprar")'
    )
    this.planSelector = page.locator('[data-testid="plan-selector"], [role="radiogroup"]')
    this.couponInput = page.locator('input[name="coupon"], input[placeholder*="cupom" i]')
  }

  async navigate(template: string) {
    await this.page.goto(`/comprar/${template}`)
    await this.page.waitForLoadState('networkidle')
  }

  async expectLoaded() {
    await expect(this.page.locator('body')).toContainText(/self-service|feito.*voc|plano/i)
  }

  async fillForm(data: {
    restaurantName?: string
    customerName?: string
    email?: string
    phone?: string
  }) {
    const fields = [
      { selector: 'input[name="restaurantName"], input[placeholder*="restaurante" i], input[placeholder*="negócio" i]', value: data.restaurantName },
      { selector: 'input[name="customerName"], input[placeholder*="nome" i], input[placeholder*="responsável" i]', value: data.customerName },
      { selector: 'input[name="email"], input[type="email"]', value: data.email },
      { selector: 'input[name="phone"], input[type="tel"], input[placeholder*="whatsapp" i]', value: data.phone },
    ]

    for (const { selector, value } of fields) {
      if (!value) continue
      const field = this.page.locator(selector).first()
      if (await field.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await field.fill(value)
      }
    }
  }

  async applyCoupon(code: string) {
    if (await this.couponInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.couponInput.fill(code)
      const applyBtn = this.page.locator('button:has-text("aplicar")')
      if (await applyBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await applyBtn.click()
      }
    }
  }

  async submit() {
    if (await this.submitButton.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
      await this.submitButton.first().click()
    }
  }

  async expectStaysOnPage() {
    await this.page.waitForTimeout(2_000)
    expect(this.page.url()).toContain('/comprar/')
  }

  async expectNoJSErrors() {
    const errors: string[] = []
    this.page.on('pageerror', (err) => errors.push(err.message))
    await this.page.waitForTimeout(1_000)
    expect(errors.length).toBe(0)
  }
}

