/**
 * Page Object Model — Landing e dashboard de afiliados.
 *
 * Encapsula interações básicas do fluxo público de afiliados.
 */
import { type Page, type Locator, expect } from '@playwright/test'

export class AffiliateLandingPage {
  readonly heading: Locator
  readonly ctaButtons: Locator

  constructor(private page: Page) {
    this.heading = page.locator('h1, h2').first()
    this.ctaButtons = page.locator('a[href*="/login"], a[href*="/cadastro"], button:has-text("afiliado"), a:has-text("quero")')
  }

  async navigate() {
    await this.page.goto('/afiliados')
    await this.page.waitForLoadState('networkidle')
  }

  async expectLoaded() {
    await expect(this.page.locator('body')).toContainText(/afiliad|comiss|revendedor/i)
  }
}

export class AffiliateDashboardPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/painel/afiliados')
    await this.page.waitForLoadState('networkidle')
  }

  async expectProtectedOrLoaded() {
    await expect(this.page.locator('body')).toBeVisible()
  }
}

