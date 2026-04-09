import { test, expect, type Page } from '@playwright/test'

const PUBLIC_CARDAPIO_CANDIDATES = [
  '/r/piazzaria-do-jopao',
  '/r/adega-do-morro',
  '/r/ship-mode-mmji68yw',
]
const KNOWN_DEV_PERF_ERRORS = [/cannot ha+ve a negative time stamp/i]

async function resolvePublicCardapioSlug(page: Page) {
  for (const candidate of PUBLIC_CARDAPIO_CANDIDATES) {
    const response = await page.request.get(candidate, { failOnStatusCode: false })
    if (response.status() === 200) {
      return candidate
    }
  }

  throw new Error('Nenhum slug público de cardápio conhecido respondeu 200 no ambiente E2E.')
}

/**
 * Auditoria E2E — Persona: Restaurante (seller)
 * Verifica que o painel do restaurante funciona e é protegido.
 */

test.describe('Restaurante Audit', () => {
  test('painel redireciona para login sem sessão', async ({ page }) => {
    await page.goto('/painel')
    await page.waitForLoadState('networkidle')
    const url = page.url()
    expect(url).toMatch(/\/(login|auth)/)
  })

  test('páginas do painel exigem autenticação', async ({ page }) => {
    const painelRoutes = [
      '/painel/produtos',
      '/painel/categorias',
      '/painel/editor',
      '/painel/qrcode',
      '/painel/configuracoes',
      '/painel/pedidos',
    ]

    for (const route of painelRoutes) {
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      const url = page.url()
      expect(url, `${route} deve redirecionar sem sessão`).toMatch(/\/(login|auth)/)
    }
  })

  test('painel não deve expor rotas admin para restaurante', async ({ page }) => {
    // Restaurante tentando acessar admin deve ser bloqueado
    const resp = await page.goto('/admin')
    const url = page.url()
    const isBlocked =
      url.includes('/login') ||
      url.includes('/auth') ||
      resp?.status() === 401 ||
      resp?.status() === 403
    expect(isBlocked).toBeTruthy()
  })

  test('cardápio público carrega sem erros JS', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => {
      if (KNOWN_DEV_PERF_ERRORS.some((pattern) => pattern.test(err.message))) {
        return
      }

      errors.push(err.message)
    })

    const publicSlug = await resolvePublicCardapioSlug(page)
    const response = await page.goto(publicSlug)
    await page.waitForLoadState('networkidle')

    expect(response?.status()).toBe(200)
    expect(errors).toEqual([])
  })

  test('criar restaurante/pizzaria páginas carregam', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    // Estes devem redirecionar para login se não autenticado
    await page.goto('/painel/criar-restaurante')
    await page.waitForLoadState('networkidle')

    await page.goto('/painel/criar-pizzaria')
    await page.waitForLoadState('networkidle')

    expect(errors).toEqual([])
  })
})
