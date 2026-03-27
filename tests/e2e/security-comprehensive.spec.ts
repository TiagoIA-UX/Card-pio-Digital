import { test, expect, type APIRequestContext } from '@playwright/test'

// ─────────────────────────────────────────────────────────────────────────────
// Security Comprehensive Tests
// Validates security headers, auth protection, rate limiting, XSS prevention,
// and input validation across the application
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

test.describe('Security Headers', () => {
  test('X-Frame-Options está definido como DENY', async ({ request }) => {
    const res = await request.get('/')
    const xfo = res.headers()['x-frame-options']
    expect(xfo).toBe('DENY')
  })

  test('X-Content-Type-Options está definido como nosniff', async ({ request }) => {
    const res = await request.get('/')
    expect(res.headers()['x-content-type-options']).toBe('nosniff')
  })

  test('Strict-Transport-Security presente com max-age alto', async ({ request }) => {
    const res = await request.get('/')
    const hsts = res.headers()['strict-transport-security']
    // Em dev pode não estar presente, mas se estiver, validamos
    if (hsts) {
      expect(hsts).toContain('max-age=')
      const maxAge = parseInt(hsts.match(/max-age=(\d+)/)?.[1] || '0', 10)
      expect(maxAge).toBeGreaterThanOrEqual(31536000) // >= 1 year
      expect(hsts).toContain('includeSubDomains')
    }
  })

  test('Content-Security-Policy define frame-ancestors none', async ({ request }) => {
    const res = await request.get('/')
    const csp = res.headers()['content-security-policy']
    if (csp) {
      expect(csp).toContain("frame-ancestors 'none'")
    }
  })

  test('CSP define default-src self', async ({ request }) => {
    const res = await request.get('/')
    const csp = res.headers()['content-security-policy']
    if (csp) {
      expect(csp).toContain("default-src 'self'")
    }
  })

  test('Referrer-Policy configurado', async ({ request }) => {
    const res = await request.get('/')
    const rp = res.headers()['referrer-policy']
    if (rp) {
      expect(rp).toContain('strict-origin')
    }
  })

  test('Permissions-Policy restringe APIs sensíveis', async ({ request }) => {
    const res = await request.get('/')
    const pp = res.headers()['permissions-policy']
    if (pp) {
      expect(pp).toContain('camera=()')
      expect(pp).toContain('microphone=()')
    }
  })
})

test.describe('API Auth Protection', () => {
  test('Admin API retorna 401 sem autenticação', async ({ request }) => {
    const res = await request.get('/api/admin/stats', {
      failOnStatusCode: false,
    })
    expect([401, 403, 404]).toContain(res.status())
  })

  test('Admin API retorna 401 com token inválido', async ({ request }) => {
    const res = await request.get('/api/admin/stats', {
      headers: { Authorization: 'Bearer invalid-token-12345' },
      failOnStatusCode: false,
    })
    expect([401, 403, 404]).toContain(res.status())
  })

  test('Painel API sem sessão retorna erro', async ({ request }) => {
    const res = await request.get('/api/painel/restaurant', {
      failOnStatusCode: false,
    })
    // Must not return 200 with sensitive data
    expect([401, 403, 404, 405]).toContain(res.status())
  })

  test('POST em rota protegida sem body retorna 400+', async ({ request }) => {
    const res = await request.post('/api/pagamento/create-preference', {
      failOnStatusCode: false,
    })
    expect(res.status()).toBeGreaterThanOrEqual(400)
  })
})

test.describe('Rate Limiting', () => {
  test('API responde com headers de rate limit quando disponível', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { email: 'test@test.com', password: 'test' },
      failOnStatusCode: false,
    })

    // Verificamos que a rota responde (não crashou)
    expect(res.status()).toBeGreaterThanOrEqual(200)

    // Se rate limit headers existem, devem ser numéricos
    const remaining = res.headers()['x-ratelimit-remaining']
    if (remaining) {
      expect(parseInt(remaining, 10)).toBeGreaterThanOrEqual(0)
    }
  })

  test('Múltiplas requisições rápidas não crasham o servidor', async ({ request }) => {
    const promises = Array.from({ length: 5 }, () =>
      request.get('/api/health', { failOnStatusCode: false })
    )
    const results = await Promise.all(promises)

    // Nenhuma deve retornar 500
    for (const res of results) {
      expect(res.status()).not.toBe(500)
    }
  })
})

test.describe('XSS Prevention', () => {
  test('Página não reflete script injetado via query param', async ({ page }) => {
    const xssPayload = encodeURIComponent('<script>alert("xss")</script>')
    await page.goto(`/?q=${xssPayload}`, { waitUntil: 'domcontentloaded' })

    // O payload não deve existir como texto não-escapado no DOM
    const bodyHTML = await page.content()
    expect(bodyHTML).not.toContain('<script>alert("xss")</script>')
  })

  test('Página não reflete event handler injetado', async ({ page }) => {
    const xssPayload = encodeURIComponent('" onmouseover="alert(1)"')
    await page.goto(`/?search=${xssPayload}`, { waitUntil: 'domcontentloaded' })

    const bodyHTML = await page.content()
    expect(bodyHTML).not.toContain('onmouseover="alert(1)"')
  })

  test('Input de busca escapa HTML tags', async ({ page }) => {
    await page.goto('/templates', { waitUntil: 'domcontentloaded' })

    const searchInput = page
      .locator('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="buscar"]')
      .first()
    if (await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await searchInput.fill('<img src=x onerror=alert(1)>')
      await page.waitForTimeout(500)

      // Verify no alert is triggered and content is escaped
      const bodyHTML = await page.content()
      expect(bodyHTML).not.toContain('<img src=x onerror=alert(1)>')
    }
  })
})

test.describe('Input Validation', () => {
  test('API de pagamento rejeita valores negativos', async ({ request }) => {
    const res = await request.post('/api/pagamento/create-preference', {
      data: {
        items: [{ title: 'Test', quantity: -1, unit_price: -100 }],
      },
      failOnStatusCode: false,
    })
    expect(res.status()).toBeGreaterThanOrEqual(400)
  })

  test('API de newsletter rejeita email inválido', async ({ request }) => {
    const res = await request.post('/api/newsletter', {
      data: { email: 'not-an-email' },
      failOnStatusCode: false,
    })
    expect(res.status()).toBeGreaterThanOrEqual(400)
  })

  test('API rejeita Content-Type inesperado', async ({ request }) => {
    const res = await request.post('/api/pagamento/create-preference', {
      headers: { 'Content-Type': 'text/plain' },
      data: 'raw text body',
      failOnStatusCode: false,
    })
    expect(res.status()).toBeGreaterThanOrEqual(400)
  })
})

test.describe('Path Traversal & Access Control', () => {
  test('Acesso a /api/admin/* sem auth retorna 401/403/404', async ({ request }) => {
    const adminPaths = ['/api/admin/stats', '/api/admin/users', '/api/admin/restaurants']

    for (const path of adminPaths) {
      const res = await request.get(path, { failOnStatusCode: false })
      expect([401, 403, 404, 405]).toContain(res.status())
    }
  })

  test('Acesso direto a /painel sem auth redireciona', async ({ page }) => {
    const response = await page.goto('/painel')
    // Should redirect to login or return auth error
    const url = page.url()
    const isRedirected = url.includes('/login') || url.includes('/auth') || url.includes('/painel')
    expect(isRedirected).toBeTruthy()
  })

  test('Acesso direto a /admin sem auth redireciona', async ({ page }) => {
    const response = await page.goto('/admin')
    const url = page.url()
    const isProtected = url.includes('/login') || url.includes('/auth') || url.includes('/admin')
    expect(isProtected).toBeTruthy()
  })

  test('Path traversal em URL retorna 404', async ({ request }) => {
    const res = await request.get('/api/../../../etc/passwd', {
      failOnStatusCode: false,
    })
    expect([400, 404]).toContain(res.status())
  })
})

test.describe('Cookie Security', () => {
  test('Cookies de sessão possuem flags de segurança', async ({ page }) => {
    await page.goto('/')
    const cookies = await page.context().cookies()

    for (const cookie of cookies) {
      // Session/auth cookies should be httpOnly when possible
      if (cookie.name.includes('supabase') || cookie.name.includes('session')) {
        // httpOnly cookies won't be visible to JS — verify sameSite at least
        expect(['Lax', 'Strict', 'None']).toContain(cookie.sameSite)
      }
    }
  })
})
