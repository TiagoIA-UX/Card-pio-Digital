/**
 * Page Object Model — Página de Templates (/templates)
 *
 * Encapsula seletores e ações da listagem de templates.
 */
import { type Page, type Locator, expect } from '@playwright/test'

export class TemplatesPage {
  readonly templateCards: Locator
  readonly heading: Locator

  constructor(private page: Page) {
    this.templateCards = page.locator('a[href*="/comprar/"], a[href*="/templates/"]')
    this.heading = page.locator('h1, h2').first()
  }

  async navigate() {
    await this.page.goto('/templates')
    await this.page.waitForLoadState('networkidle')
  }

  async expectLoaded() {
    await expect(this.templateCards.first()).toBeVisible({ timeout: 10_000 })
  }

  async getTemplateCount() {
    return this.templateCards.count()
  }

  async clickTemplate(slug: string) {
    await this.page.locator(`a[href*="${slug}"]`).first().click()
    await this.page.waitForLoadState('networkidle')
  }
}
