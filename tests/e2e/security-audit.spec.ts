import { test, expect } from '@playwright/test'

/**
 * Auditoria E2E — Segurança
 * Testa SQL injection, XSS, CSRF, path traversal, open redirect e auth bypass.
 */

test.describe('Security Audit', () => {
  const SQL_PAYLOADS = [
    "'; DROP TABLE restaurants;--",
    "1' OR '1'='1",
    "' UNION SELECT * FROM admin_users--",
    '1; DELETE FROM templates',
  ]

  const XSS_PAYLOADS = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    '"><svg onload=alert(1)>',
    "javascript:alert('xss')",
  ]

  test('SQL injection em campo de busca é sanitizado', async ({ request }) => {
    for (const payload of SQL_PAYLOADS) {
      const res = await request.get(`/api/templates?search=${encodeURIComponent(payload)}`)
      // Não deve retornar 500 (erro de banco)
      expect(res.status(), `SQL injection "${payload}" causou erro`).not.toBe(500)

      if (res.status() === 200) {
        const body = await res.text()
        // Não deve conter dados de admin_users
        expect(body).not.toContain('admin_users')
        expect(body).not.toContain('SUPABASE_SERVICE_ROLE_KEY')
      }
    }
  })

  test('XSS em campos de formulário é escapado', async ({ page }) => {
    const errors: string[] = []
    page.on('dialog', () => {
      errors.push('alert/confirm/prompt triggered — XSS detected!')
    })

    await page.goto('/comprar/pizzaria')
    await page.waitForLoadState('networkidle')

    // Tentar injetar XSS nos campos visíveis
    const nameField = page
      .locator('input[name="restaurantName"], input[name="customerName"]')
      .first()
    if (await nameField.isVisible({ timeout: 3_000 }).catch(() => false)) {
      for (const payload of XSS_PAYLOADS) {
        await nameField.fill(payload)
      }
    }

    expect(errors).toEqual([])
  })

  test('path traversal em API de upload é bloqueado', async ({ request }) => {
    const traversalNames = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      'image/../../../.env',
      '%2e%2e%2f%2e%2e%2f.env',
    ]

    for (const filename of traversalNames) {
      const res = await request.post('/api/upload', {
        headers: { 'Content-Type': 'application/json' },
        data: { filename, file: 'data:image/png;base64,iVBORw0KGgo=' },
      })
      // Deve rejeitar ou retornar 400/401/403
      expect(
        [400, 401, 403, 404, 422].includes(res.status()),
        `Path traversal "${filename}" não bloqueado (status: ${res.status()})`
      ).toBeTruthy()
    }
  })

  test('open redirect é bloqueado em login', async ({ page }) => {
    const maliciousUrls = [
      '/login?redirect=https://evil.com',
      '/login?redirect=//evil.com',
      '/login?redirect=javascript:alert(1)',
    ]

    for (const url of maliciousUrls) {
      await page.goto(url)
      await page.waitForLoadState('networkidle')
      const currentUrl = page.url()
      // Deve permanecer na página de login (não ser redirecionado para fora)
      expect(currentUrl).toContain('localhost:3000/login')
      // Não deve ter sido redirecionado para domínio malicioso
      expect(new URL(currentUrl).hostname).toBe('localhost')
    }
  })

  test('auth bypass — APIs admin sem token retornam 401', async ({ request }) => {
    const adminEndpoints = [
      { method: 'GET', path: '/api/admin/metrics' },
      { method: 'GET', path: '/api/admin/logs' },
      { method: 'POST', path: '/api/admin/venda-direta' },
      { method: 'GET', path: '/api/admin/afiliados/comissoes' },
      { method: 'GET', path: '/api/admin/clientes' },
    ]

    for (const endpoint of adminEndpoints) {
      const res =
        endpoint.method === 'GET'
          ? await request.get(endpoint.path)
          : await request.post(endpoint.path, { data: {} })
      expect(
        [401, 403].includes(res.status()),
        `${endpoint.method} ${endpoint.path} deveria retornar 401 ou 403 (retornou ${res.status()})`
      ).toBeTruthy()
    }
  })

  test('security headers estão presentes', async ({ request }) => {
    const res = await request.get('/')
    const headers = res.headers()

    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['strict-transport-security']).toContain('max-age=')
  })

  test('deprecated routes retornam 410', async ({ request }) => {
    const deprecatedRoutes = ['/api/webhook/templates', '/checkout', '/checkout-novo']

    for (const route of deprecatedRoutes) {
      const res = await request.get(route, { maxRedirects: 0 })
      const status = res.status()
      // 410 (Gone) ou 301/308 (redirect permanente)
      expect(
        [301, 308, 410].includes(status),
        `${route} deveria retornar 410 ou redirect permanente (retornou ${status})`
      ).toBeTruthy()
    }
  })

  test('webhook MP com header forjado é rejeitado', async ({ request }) => {
    const res = await request.post('/api/webhook/mercadopago', {
      data: {
        action: 'payment.updated',
        data: { id: '99999999' },
      },
      headers: {
        'x-signature': 'ts=fake,v1=forged_signature_value',
        'x-request-id': 'forged-request-id',
      },
    })
    // Deve rejeitar assinatura inválida
    expect([400, 401].includes(res.status())).toBeTruthy()
  })
})
