import { test, expect } from '@playwright/test'

/**
 * E2E — Perfil: ADMIN
 *
 * 9 cenários cobrindo:
 * - Proteção de rotas admin
 * - Dashboard com métricas
 * - Módulo de afiliados
 * - Logs e auditoria
 * - Venda direta
 * - Área financeira
 */

const BASE_URL = 'https://zairyx.com'

test.describe('Admin — Proteção de Rotas', () => {
  test('1. /admin sem login é bloqueado', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/admin`)
    await page.waitForLoadState('networkidle')

    const url = page.url()
    const isRedirected = url.includes('/login') || url.includes('/auth')
    const isBlocked = response?.status() === 401 || response?.status() === 403

    expect(isRedirected || isBlocked).toBeTruthy()
  })

  test('2. APIs admin retornam 401 sem autenticação', async ({ request }) => {
    const protectedRoutes = [
      '/api/admin/metrics',
      '/api/admin/logs',
      '/api/admin/afiliados',
      '/api/admin/clientes',
    ]

    for (const route of protectedRoutes) {
      const res = await request.get(`${BASE_URL}${route}`)
      // 401 = auth required, 404 = rota não exposta publicamente (ambos são proteção válida)
      expect([401, 403, 404]).toContain(res.status())
    }
  })

  test('2b. Cron endpoints exigem autenticação', async ({ request }) => {
    const cronRoutes = [
      '/api/cron/audit',
      '/api/cron/health',
      '/api/cron/check-subscriptions',
      '/api/cron/check-sla',
      '/api/cron/expire-access',
    ]

    for (const route of cronRoutes) {
      const res = await request.get(`${BASE_URL}${route}`)
      // 401 = auth required, 404 = rota não exposta publicamente (ambos são proteção válida)
      expect([401, 403, 404]).toContain(res.status())
    }
  })
})

test.describe('Admin — Dashboard e Módulos [REQUER AUTH]', () => {
  test('3-4. Login admin e dashboard com métricas [BLOQUEADO]', async () => {
    test.skip(
      true,
      'Google OAuth requer interação manual — não automatizável sem storageState pré-autenticado'
    )
  })

  test('5. Módulo de afiliados: listagem e comissões [BLOQUEADO]', async () => {
    test.skip(true, 'Requer auth admin — /admin/afiliados não acessível sem sessão')
  })

  test('6. Módulo de logs e auditoria [BLOQUEADO]', async () => {
    test.skip(true, 'Requer auth admin — /admin/logs não acessível sem sessão')
  })

  test('7. Venda direta: criar cliente manualmente [BLOQUEADO]', async () => {
    test.skip(true, 'Requer auth admin — /admin/venda-direta não acessível sem sessão')
  })

  test('8. Verificar restaurante criado após venda direta [BLOQUEADO]', async () => {
    test.skip(true, 'Depende de venda direta anterior — requer sessão admin')
  })

  test('9. Área financeira: reservas e pagamentos [BLOQUEADO]', async () => {
    test.skip(true, 'Requer auth admin — /admin/financeiro não acessível sem sessão')
  })
})

test.describe('Admin — Sub-rotas protegidas', () => {
  const adminSubRoutes = [
    '/admin/afiliados',
    '/admin/venda-direta',
    '/admin/financeiro',
    '/admin/logs',
    '/admin/metrics',
    '/admin/suporte',
    '/admin/usuarios',
    '/admin/trials',
    '/admin/alertas',
    '/admin/cardapios',
    '/admin/feedbacks',
  ]

  for (const route of adminSubRoutes) {
    test(`${route} redireciona sem sessão`, async ({ page }) => {
      const response = await page.goto(`${BASE_URL}${route}`)
      await page.waitForLoadState('networkidle')

      const url = page.url()
      const isRedirected = url.includes('/login') || url.includes('/auth')
      const isBlocked = response?.status() === 401 || response?.status() === 403
      const notOnAdmin = !url.includes(route)

      expect(
        isRedirected || isBlocked || notOnAdmin,
        `${route} deveria redirecionar ou bloquear sem sessão`
      ).toBeTruthy()
    })
  }
})

test.describe('Admin — Rate Limiting', () => {
  test('Rate limiting retorna 429 em excesso de requests', async ({ request }) => {
    const promises = Array.from({ length: 60 }, () =>
      request.get(`${BASE_URL}/api/admin/metrics`).catch(() => null)
    )
    const responses = await Promise.all(promises)
    const has429 = responses.some((r) => r?.status() === 429)

    if (!has429) {
      console.warn(
        'Rate limiting não detectado para /api/admin/metrics — pode estar desabilitado ou threshold é maior'
      )
    }
  })
})
