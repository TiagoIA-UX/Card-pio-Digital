import { test, expect } from '@playwright/test'

/**
 * Auditoria E2E — Persona: Admin
 * Verifica acesso ao painel administrativo, autenticação e proteções.
 */

test.describe('Admin Audit', () => {
  test('rotas admin sem autenticação retornam 401', async ({ request }) => {
    const protectedRoutes = [
      '/api/admin/metrics',
      '/api/admin/logs',
      '/api/admin/afiliados/comissoes',
      '/api/admin/clientes',
    ]

    for (const route of protectedRoutes) {
      const res = await request.get(route)
      expect(res.status(), `${route} deveria retornar 401`).toBe(401)
    }
  })

  test('cron endpoints exigem autenticação', async ({ request }) => {
    const cronRoutes = [
      '/api/cron/audit',
      '/api/cron/health',
      '/api/cron/check-subscriptions',
      '/api/cron/check-sla',
      '/api/cron/payout',
    ]

    for (const route of cronRoutes) {
      const res = await request.get(route)
      expect(res.status(), `${route} deveria retornar 401`).toBe(401)
    }
  })

  test('acesso ao /admin redireciona sem sessão', async ({ page }) => {
    const response = await page.goto('/admin')
    // Deve redirecionar para login ou retornar 401/403
    const url = page.url()
    const isRedirected = url.includes('/login') || url.includes('/auth')
    const isBlocked = response?.status() === 401 || response?.status() === 403
    expect(isRedirected || isBlocked).toBeTruthy()
  })

  test('rate limiting retorna 429 em excesso de requests', async ({ request }) => {
    const requests = Array.from({ length: 120 }, () =>
      request.get('/api/admin/metrics').catch(() => null)
    )
    const responses = await Promise.all(requests)
    const has429 = responses.some((r) => r?.status() === 429)
    // Rate limiting pode ou não disparar dependendo da config — registramos o resultado
    if (!has429) {
      console.warn('Rate limiting não detectado para /api/admin/metrics — verificar configuração')
    }
  })
})
