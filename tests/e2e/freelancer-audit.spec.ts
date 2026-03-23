import { test, expect } from '@playwright/test'

/**
 * Auditoria E2E — Persona: Freelancer
 * Verifica APIs de freelancer, proteção de acesso e expiração.
 */

test.describe('Freelancer Audit', () => {
  test('API freelancer GET sem auth retorna 401', async ({ request }) => {
    const res = await request.get('/api/freelancer/job')
    expect(res.status()).toBe(401)
  })

  test('API admin de freelancers requer admin auth', async ({ request }) => {
    const res = await request.post('/api/admin/freelancers', {
      data: { name: 'Test', email: 'test@test.com' },
    })
    expect(res.status()).toBe(401)
  })

  test('cron expire-access roda com proteção', async ({ request }) => {
    // Sem ADMIN_SECRET_KEY, deve retornar 401
    const res = await request.get('/api/cron/expire-access')
    expect(res.status()).toBe(401)
  })

  test('rotas de freelancer não existem publicamente', async ({ page }) => {
    // Freelancers operem via API, não via páginas públicas
    const resp = await page.goto('/freelancer')
    // Deve ser 404 ou redirect
    const status = resp?.status() ?? 0
    const url = page.url()
    const isHandled =
      status === 404 || url.includes('/login') || url.includes('/404') || url.includes('/auth')
    expect(isHandled).toBeTruthy()
  })
})
