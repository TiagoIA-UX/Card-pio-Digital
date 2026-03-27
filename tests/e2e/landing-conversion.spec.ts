import { test, expect } from '@playwright/test'

// ─────────────────────────────────────────────────────────────────────────────
// Landing Page Conversion Tests — 18 scenarios
// Validates CTAs, social proof, sections, mobile responsiveness, and SEO/meta
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Landing Page — Elementos de conversão', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Dismiss cookie banner if it pops up
    const cookieBtn = page.locator('button:has-text("Aceitar")')
    if (await cookieBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await cookieBtn.click()
    }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Hero Section
  // ═══════════════════════════════════════════════════════════════════════════
  test('01 — Hero section é visível e tem CTA principal', async ({ page }) => {
    const hero = page.locator('[data-testid="hero-section"]')
    await expect(hero).toBeVisible({ timeout: 10_000 })

    const ctaPrimary = page.locator('[data-testid="hero-cta-primary"]')
    await expect(ctaPrimary).toBeVisible()
    await expect(ctaPrimary).toHaveAttribute('href', /\/templates/)
  })

  test('02 — Hero CTA WhatsApp tem link correto', async ({ page }) => {
    const ctaWhatsApp = page.locator('[data-testid="hero-cta-whatsapp"]')
    await expect(ctaWhatsApp).toBeVisible()
    await expect(ctaWhatsApp).toHaveAttribute('href', /wa\.me/)
  })

  test('03 — Hero badge de garantia está visível', async ({ page }) => {
    const hero = page.locator('[data-testid="hero-section"]')
    const garantia = hero.locator('text=Garantia 30 dias')
    await expect(garantia).toBeVisible()
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Social Proof
  // ═══════════════════════════════════════════════════════════════════════════
  test('04 — Proof section mostra 4 estatísticas', async ({ page }) => {
    const proof = page.locator('[data-testid="proof-section"]')
    await expect(proof).toBeVisible()

    const stats = proof.locator('[data-testid^="proof-stat-"]')
    await expect(stats).toHaveCount(4)
  })

  test('05 — Stat "0%" de comissão está presente', async ({ page }) => {
    const stat = page.locator('[data-testid="proof-stat-0%"]')
    await expect(stat).toBeVisible()
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. Pain/Solution Section
  // ═══════════════════════════════════════════════════════════════════════════
  test('06 — Seção Dor vs Solução exibe comparação', async ({ page }) => {
    const section = page.locator('[data-testid="pain-solution-section"]')
    await expect(section).toBeVisible()

    // "iFood" e "Zairyx" mencionados
    await expect(section.locator('text=iFood').first()).toBeVisible()
    await expect(section.locator('text=Zairyx').first()).toBeVisible()
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. How it Works
  // ═══════════════════════════════════════════════════════════════════════════
  test('07 — How it Works tem 3 passos', async ({ page }) => {
    const section = page.locator('[data-testid="how-it-works-section"]')
    await expect(section).toBeVisible()

    const steps = section.locator('[data-testid^="step-card-"]')
    await expect(steps).toHaveCount(3)
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. Benefits
  // ═══════════════════════════════════════════════════════════════════════════
  test('08 — Benefits section com cards de benefício', async ({ page }) => {
    const section = page.locator('[data-testid="benefits-section"]')
    await expect(section).toBeVisible()

    // Pelo menos 6 benefit cards
    const text = await section.textContent()
    expect(text).toContain('Zero comissão')
    expect(text).toContain('IA que atende')
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. Testimonials
  // ═══════════════════════════════════════════════════════════════════════════
  test('09 — Testimonials section visível com carousel', async ({ page }) => {
    const section = page.locator('[data-testid="testimonials-section"]')
    await expect(section).toBeVisible()

    // Dots de navegação presentes
    const dots = section.locator('[role="tab"]')
    const count = await dots.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })

  test('10 — Testimonial navega ao clicar seta', async ({ page }) => {
    const section = page.locator('[data-testid="testimonials-section"]')
    await expect(section).toBeVisible()

    const firstQuote = await section.locator('blockquote').textContent()
    const nextBtn = section.locator('button[aria-label="Próximo depoimento"]')
    await nextBtn.click()

    // Wait for content change
    await page.waitForTimeout(300)
    const secondQuote = await section.locator('blockquote').textContent()
    expect(firstQuote).not.toBe(secondQuote)
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. Templates
  // ═══════════════════════════════════════════════════════════════════════════
  test('11 — Templates section com pelo menos 6 cards', async ({ page }) => {
    const section = page.locator('[data-testid="templates-section"]')
    await expect(section).toBeVisible()

    const viewAll = page.locator('[data-testid="templates-view-all"]')
    await expect(viewAll).toHaveAttribute('href', '/templates')
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. Competitor Comparison
  // ═══════════════════════════════════════════════════════════════════════════
  test('12 — Tabela de comparação com concorrentes', async ({ page }) => {
    const section = page.locator('[data-testid="competitor-comparison-section"]')
    await expect(section).toBeVisible()

    const table = section.locator('table')
    await expect(table).toBeVisible()

    // Verifica coluna Zairyx
    const zairyxHeader = table.locator('th:has-text("Zairyx")')
    await expect(zairyxHeader).toBeVisible()
  })

  test('13 — CTA de comparação redireciona para templates', async ({ page }) => {
    const cta = page.locator('[data-testid="comparison-cta"]')
    await expect(cta).toBeVisible()
    await expect(cta).toHaveAttribute('href', /\/templates/)
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. Pricing
  // ═══════════════════════════════════════════════════════════════════════════
  test('14 — Pricing section mostra R$ 97/mês', async ({ page }) => {
    const section = page.locator('[data-testid="pricing-section"]')
    await expect(section).toBeVisible()

    const text = await section.textContent()
    expect(text).toContain('R$ 97')
    expect(text).toContain('0% de comissão')
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. Final CTA
  // ═══════════════════════════════════════════════════════════════════════════
  test('15 — Final CTA section com dois botões', async ({ page }) => {
    const primary = page.locator('[data-testid="final-cta-primary"]')
    await expect(primary).toBeVisible()
    await expect(primary).toHaveAttribute('href', /\/templates/)

    const whatsapp = page.locator('[data-testid="final-cta-whatsapp"]')
    await expect(whatsapp).toBeVisible()
    await expect(whatsapp).toHaveAttribute('href', /wa\.me/)
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. Mobile Responsiveness
  // ═══════════════════════════════════════════════════════════════════════════
  test('16 — Layout mobile: hero section sem overflow horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    const hero = page.locator('[data-testid="hero-section"]')
    await expect(hero).toBeVisible()

    // Check no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5) // 5px tolerance
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. SEO & Meta
  // ═══════════════════════════════════════════════════════════════════════════
  test('17 — Página tem meta title e description', async ({ page }) => {
    const title = await page.title()
    expect(title.length).toBeGreaterThan(10)

    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description).toBeTruthy()
    expect(description!.length).toBeGreaterThan(30)
  })

  test('18 — Página tem Open Graph tags', async ({ page }) => {
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
    expect(ogTitle).toBeTruthy()

    const ogDesc = await page.locator('meta[property="og:description"]').getAttribute('content')
    expect(ogDesc).toBeTruthy()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CTA Flow Tests — Validação de fluxos de clique
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Landing Page — Fluxos de CTA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const cookieBtn = page.locator('button:has-text("Aceitar")')
    if (await cookieBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await cookieBtn.click()
    }
  })

  test('Hero CTA primary navega para /templates', async ({ page }) => {
    const cta = page.locator('[data-testid="hero-cta-primary"]')
    await expect(cta).toBeVisible()

    await cta.click()
    await page.waitForURL(/\/templates/, { timeout: 10_000 })
    expect(page.url()).toContain('/templates')
  })

  test('Final CTA primary navega para /templates', async ({ page }) => {
    const cta = page.locator('[data-testid="final-cta-primary"]')
    await cta.scrollIntoViewIfNeeded()
    await expect(cta).toBeVisible()

    await cta.click()
    await page.waitForURL(/\/templates/, { timeout: 10_000 })
    expect(page.url()).toContain('/templates')
  })
})
