import { test, expect } from '@playwright/test'

/**
 * E2E Tests — Landing Page Conversion Elements 🔥
 */

test.describe('Landing Page - Elementos de Conversão 🔥', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('hero section loads with urgency elements', async ({ page }) => {
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible()
    await expect(page.locator('[data-testid="hero-cta-primary"]')).toBeVisible()
    await expect(page.locator('[data-testid="hero-cta-whatsapp"]')).toBeVisible()
  })

  test('social proof section displays metrics', async ({ page }) => {
    await expect(page.locator('[data-testid="proof-section"]')).toBeVisible()
    await expect(page.locator('[data-testid="proof-stat-0%"]')).toBeVisible()
    await expect(page.locator('[data-testid="proof-stat-15"]')).toBeVisible()
  })

  test('pain vs solution section works', async ({ page }) => {
    await expect(page.locator('[data-testid="pain-solution-section"]')).toBeVisible()
    await expect(page.locator('[data-testid="pain-solution-section"]')).toContainText('zero comissão')
  })

  test('savings calculator is interactive', async ({ page }) => {
    await expect(page.locator('[data-testid="savings-calculator-section"]')).toBeVisible()
    await page.locator('[data-testid="preset-10000"]').click()
    await expect(page.locator('[data-testid="monthly-loss"]')).toBeVisible()
    await expect(page.locator('[data-testid="annual-savings"]')).toBeVisible()
    await expect(page.locator('[data-testid="calc-cta-primary"]')).toBeVisible()
    await expect(page.locator('[data-testid="revenue-slider"]')).toBeVisible()
  })

  test('how it works has 3 steps', async ({ page }) => {
    await expect(page.locator('[data-testid="how-it-works-section"]')).toBeVisible()
    await expect(page.locator('[data-testid="step-card-01"]')).toBeVisible()
    await expect(page.locator('[data-testid="step-card-02"]')).toBeVisible()
    await expect(page.locator('[data-testid="step-card-03"]')).toBeVisible()
  })

  test('benefits section visible', async ({ page }) => {
    await expect(page.locator('[data-testid="benefits-section"]')).toBeVisible()
    await expect(page.locator('[data-testid="benefits-section"]')).toContainText('zero comissão')
  })

  test('templates section shows models', async ({ page }) => {
    await expect(page.locator('[data-testid="templates-section"]')).toBeVisible()
    await expect(page.locator('[data-testid="templates-view-all"]')).toBeVisible()
  })

  test('FAQ is expandable', async ({ page }) => {
    const faqSection = page.locator('[data-testid="faq-section"]')
    await expect(faqSection).toBeVisible()
    const toggle = page.locator('[data-testid="faq-toggle-0"]')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  test('comparison table is responsive', async ({ page }) => {
    const section = page.locator('[data-testid="competitor-comparison-section"]')
    await expect(section).toBeVisible()
    await expect(section).toContainText('iFood')
    await expect(section).toContainText('Zairyx')
  })

  test('final CTA has guarantee', async ({ page }) => {
    const finalCta = page.locator('[data-testid="final-cta-section"]')
    await expect(finalCta).toBeVisible()
    await expect(page.locator('[data-testid="final-cta-primary"]')).toBeVisible()
    await expect(page.locator('[data-testid="final-cta-whatsapp"]')).toBeVisible()
    await expect(finalCta).toContainText('30 dias')
  })

  test('target audience section', async ({ page }) => {
    const section = page.locator('[data-testid="target-audience-section"]')
    await expect(section).toBeVisible()
    await expect(section).toContainText('motoboy próprio')
    await expect(section).toContainText('clientes fiéis')
  })
})

test.describe('Landing Page - Fluxo de Conversão 🔥', () => {
  test('CTA Hero redirects to /templates', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-testid="hero-cta-primary"]').click()
    await expect(page).toHaveURL(/\/templates/)
  })

  test('CTA Calculator redirects to /templates', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-testid="calc-cta-primary"]').click()
    await expect(page).toHaveURL(/\/templates/)
  })

  test('CTA Comparison redirects to /templates', async ({ page }) => {
    await page.goto('/')
    const comparisonCta = page.locator('[data-testid="competitor-comparison-section"] a[href*="/templates"]').first()
    await expect(comparisonCta).toBeVisible()
    await comparisonCta.click()
    await expect(page).toHaveURL(/\/templates/)
  })

  test('Link "Ver Todos" Templates works', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-testid="templates-view-all"]').click()
    await expect(page).toHaveURL(/\/templates/)
  })
})

test.describe('Landing Page - Mobile Responsivo 🔥', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('hero is responsive on mobile', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible()
    await expect(page.locator('[data-testid="hero-cta-primary"]')).toBeVisible()
  })

  test('calculator works on mobile', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-testid="preset-15000"]').click()
    await expect(page.locator('[data-testid="monthly-loss"]')).toBeVisible()
  })

  test('FAQ expandable on mobile', async ({ page }) => {
    await page.goto('/')
    const toggle = page.locator('[data-testid="faq-toggle-0"]')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })
})

test.describe('Landing Page - Performance & SEO 🔥', () => {
  test('meta tags present', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Zairyx/i)
    const metaDescription = page.locator('meta[name="description"]')
    const content = await metaDescription.getAttribute('content')
    expect(content).toMatch(/delivery|cardápio|canal/i)
  })

  test('JSON-LD structured data present', async ({ page }) => {
    await page.goto('/')
    const jsonLd = page.locator('script[type="application/ld+json"]')
    await expect(jsonLd).toHaveCount({ minimum: 1 })
  })

  test('images have alt text', async ({ page }) => {
    await page.goto('/')
    const images = page.locator('img[alt*="cardápio" i]')
    await expect(images.first()).toBeVisible()
  })

  test('external links have rel="noopener noreferrer" and target="_blank"', async ({ page }) => {
    await page.goto('/')
    const whatsappLinks = page.locator('a[href*="wa.me"]')
    const count = await whatsappLinks.count()
    for (let i = 0; i < count; i++) {
      const link = whatsappLinks.nth(i)
      await expect(link).toHaveAttribute('rel', /noopener noreferrer/)
      await expect(link).toHaveAttribute('target', '_blank')
    }
  })
})
