import { test, expect } from '@playwright/test'

/**
 * E2E — Perfil: REVENDEDOR (fluxo comercial)
 *
 * 5 cenários cobrindo a perspectiva de um revendedor/parceiro:
 * - Compreensão do produto
 * - Diferencial vs iFood
 * - Clareza do CTA de afiliado
 * - Proposta de comissão
 *
 * Nenhum login necessário — todos os testes são de navegação pública.
 */

const BASE_URL = 'https://zairyx.com'

test.describe('Revendedor — Avaliação Comercial', () => {
  test('1. Homepage carrega e mostra produto claramente', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    expect(errors).toEqual([])

    // Página deve carregar com conteúdo significativo
    const body = await page.locator('body').textContent()
    expect(body?.length || 0).toBeGreaterThan(200)
  })

  test('2. Produto é compreensível em 30 segundos', async ({ page }) => {
    const start = Date.now()

    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    // Headline principal visível
    const headline = page.locator('h1').first()
    await expect(headline).toBeVisible({ timeout: 10_000 })

    const elapsed = Date.now() - start

    // Página deve carregar em tempo razoável
    expect(elapsed).toBeLessThan(15_000)

    // Deve ter conteúdo que explica O QUE é
    const body = await page.locator('body').textContent()

    // Keywords essenciais para compreensão do produto
    const hasWhatItIs = /cardápio\s*digital|menu\s*digital|template/i.test(body || '')
    const hasWhoItsFor = /restaurante|lanchonete|pizzaria|alimentação|food/i.test(body || '')
    const hasBenefit = /sem\s*comissão|lucro|pedido|vender|faturamento/i.test(body || '')

    expect(hasWhatItIs).toBeTruthy()
    expect(hasWhoItsFor).toBeTruthy()
    expect(hasBenefit).toBeTruthy()

    // Pelo menos 1 CTA visível
    const cta = page.locator(
      'a:has-text("Template"), a:has-text("Modelo"), a:has-text("Começar"), button:has-text("Ver"), a[href="/templates"]'
    )
    await expect(cta.first()).toBeVisible({ timeout: 5_000 })
  })

  test('3. Objeção "por que não usar iFood?" está respondida', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    const body = await page.locator('body').textContent()

    // A homepage deve abordar diferencial vs marketplaces
    const addressesCommission =
      /sem\s*comissão|zero\s*comissão|comissão.*pedido|12%|27%|ifood|marketplace|intermediário/i.test(
        body || ''
      )
    const addressesOwnership = /seu\s*cliente|lucro\s*é\s*todo|direto|próprio|independen/i.test(
      body || ''
    )

    // Deve ter pelo menos um dos argumentos anti-marketplace
    expect(
      addressesCommission || addressesOwnership,
      'Homepage deveria abordar diferencial vs iFood/marketplace'
    ).toBeTruthy()
  })

  test('4. CTA de afiliado está visível e claro', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    // Busca por link de afiliado na homepage ou no menu
    const affiliateCta = page.locator(
      'a[href*="/afiliados"], a:has-text("afiliado"), a:has-text("revend"), a:has-text("ganhe"), a:has-text("parceiro")'
    )

    // O CTA pode estar na seção de afiliados da homepage, no footer, ou no nav
    const isVisible = await affiliateCta
      .first()
      .isVisible()
      .catch(() => false)

    if (isVisible) {
      // CTA visível — já é suficiente para o revendedor encontrar
      const href = await affiliateCta.first().getAttribute('href')
      expect(
        href?.includes('/afiliados') ||
          (await affiliateCta.first().textContent())?.match(/afiliado|revend|parceiro|ganhe/i),
        'CTA de afiliado deveria ter link ou texto sobre afiliados'
      ).toBeTruthy()
    } else {
      // Verifica footer e nav
      const footer = page.locator('footer')
      const footerText = await footer.textContent().catch(() => '')
      const hasAffiliateInFooter = /afiliado|revend|parceiro/i.test(footerText || '')

      const nav = page.locator('nav, header')
      const navText = await nav
        .first()
        .textContent()
        .catch(() => '')
      const hasAffiliateInNav = /afiliado|revend|parceiro/i.test(navText || '')

      expect(
        hasAffiliateInFooter || hasAffiliateInNav,
        'CTA de afiliado deveria estar visível na homepage, nav ou footer'
      ).toBeTruthy()
    }
  })

  test('5. Proposta de 30% de comissão é fácil de explicar', async ({ page }) => {
    await page.goto(`${BASE_URL}/revendedores`)
    await page.waitForLoadState('networkidle')

    const body = await page.locator('body').textContent()

    // A comissão deve estar claramente visível
    expect(body).toMatch(/30%/i)

    // Deve explicar o modelo de forma simples
    const hasSimpleExplanation =
      /comissão\s*(direta|recorrente)|indica|ganhe|ganha|por\s*venda|por\s*indicação|carteira/i.test(body || '')
    expect(hasSimpleExplanation).toBeTruthy()

    // Deve ter calculadora ou exemplo de ganhos
    const hasEarningsExample = /R\$\s*\d+|ganho|faturamento|mês|mensal|calculadora|simulador/i.test(
      body || ''
    )
    expect(hasEarningsExample).toBeTruthy()

    // Deve ter steps claros (Como Funciona)
    const hasSteps = /como\s*funciona|passo|etapa|1|2|3/i.test(body || '')
    expect(hasSteps).toBeTruthy()
  })
})
