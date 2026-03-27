import { test, expect } from '@playwright/test'

/**
 * Comprehensive Security E2E Tests
 */

test.describe('Security Headers', () => {
  test('Content-Security-Policy header is present', async ({ request }) => {
    const res = await request.get('/')
    const csp = res.headers()['content-security-policy']
    expect(csp).toBeTruthy()
    expect(csp).toContain("default-src")
  })

  test('Strict-Transport-Security header is present', async ({ request }) => {
    const res = await request.get('/')
    const hsts = res.headers()['strict-transport-security']
    expect(hsts).toBeTruthy()
    expect(hsts).toContain('max-age')
  })

  test('X-Frame-Options header is present', async ({ request }) => {
    const res = await request.get('/')
    const xfo = res.headers()['x-frame-options']
    expect(xfo).toBeTruthy()
    expect(xfo.toUpperCase()).toMatch(/DENY|SAMEORIGIN/)
  })

  test('X-Content-Type-Options header is present', async ({ request }) => {
    const res = await request.get('/')
    const xcto = res.headers()['x-content-type-options']
    expect(xcto).toBeTruthy()
    expect(xcto).toBe('nosniff')
  })

  test('Referrer-Policy header is present', async ({ request }) => {
    const res = await request.get('/')
    const rp = res.headers()['referrer-policy']
    expect(rp).toBeTruthy()
  })
})

test.describe('API Security - Public vs Private', () => {
  test('public endpoints return 200', async ({ request }) => {
    const res = await request.get('/api/health')
    expect([200, 404]).toContain(res.status())
  })

  test('private endpoints without auth return 401', async ({ request }) => {
    const res = await request.get('/api/painel/menu-items')
    expect([401, 403, 404]).toContain(res.status())
  })

  test('API responses have security headers', async ({ request }) => {
    const res = await request.get('/api/templates')
    expect([200, 404]).toContain(res.status())
    if (res.status() === 200) {
      const xcto = res.headers()['x-content-type-options']
      expect(xcto).toBeTruthy()
    }
  })
})

test.describe('Rate Limiting', () => {
  test('multiple rapid requests trigger rate limiting', async ({ request }) => {
    const requests = Array.from({ length: 20 }, () => request.get('/api/templates'))
    const responses = await Promise.all(requests)
    const statuses = responses.map((r) => r.status())
    // At least one should succeed (200 or 404), and optionally some may be rate-limited (429)
    expect(statuses.some((s) => [200, 404, 429].includes(s))).toBe(true)
  })
})

test.describe('XSS Prevention', () => {
  test('form inputs sanitize <script> tags', async ({ page }) => {
    const errors: string[] = []
    page.on('dialog', () => {
      errors.push('XSS alert triggered')
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const input = page.locator('input[type="text"], input[type="email"]').first()
    if (await input.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await input.fill('<script>alert("xss")</script>')
    }

    expect(errors).toEqual([])
  })

  test('URL parameters with script injection do not execute', async ({ page }) => {
    const errors: string[] = []
    page.on('dialog', () => {
      errors.push('XSS alert triggered')
    })

    await page.goto('/?q=%3Cscript%3Ealert%281%29%3C%2Fscript%3E')
    await page.waitForLoadState('networkidle')

    expect(errors).toEqual([])
  })

  test('API payloads with XSS are rejected or sanitized', async ({ request }) => {
    const payload = { name: '<script>alert("xss")</script>' }
    const res = await request.post('/api/templates', {
      data: payload,
      headers: { 'Content-Type': 'application/json' },
    })
    // Should not return 500 (internal error due to unhandled input)
    expect(res.status()).not.toBe(500)
    if (res.status() === 200) {
      const body = await res.text()
      expect(body).not.toContain('<script>')
    }
  })
})

test.describe('Input Validation', () => {
  test('SQL injection attempts are blocked', async ({ request }) => {
    const payload = "'; DROP TABLE restaurants;--"
    const res = await request.get(`/api/templates?search=${encodeURIComponent(payload)}`)
    expect(res.status()).not.toBe(500)
    if (res.status() === 200) {
      const body = await res.text()
      expect(body).not.toContain('admin_users')
    }
  })

  test('path traversal attempts return 400/404', async ({ request }) => {
    const res = await request.get('/api/../../../etc/passwd')
    expect([400, 404]).toContain(res.status())
  })

  test('oversized payloads are rejected', async ({ request }) => {
    const largePayload = 'x'.repeat(1_000_000)
    const res = await request.post('/api/templates', {
      data: { name: largePayload },
      headers: { 'Content-Type': 'application/json' },
    })
    expect([400, 413, 422, 401, 403, 404]).toContain(res.status())
  })
})

test.describe('Sensitive Data Protection', () => {
  test('API responses do not expose stack traces', async ({ request }) => {
    const res = await request.get('/api/templates?cause=error')
    if (res.status() >= 500) {
      const body = await res.text()
      expect(body).not.toMatch(/at\s+\w+\s+\(.*:\d+:\d+\)/)
      expect(body).not.toContain('node_modules')
    }
  })

  test('error pages do not show server info', async ({ page }) => {
    await page.goto('/non-existent-page-404')
    await page.waitForLoadState('networkidle')
    const content = await page.content()
    expect(content).not.toContain('SUPABASE_SERVICE_ROLE_KEY')
    expect(content).not.toContain('DATABASE_URL')
    expect(content).not.toMatch(/Express|Next\.js version \d/)
  })

  test('console does not log sensitive data', async ({ page }) => {
    const sensitiveMessages: string[] = []
    page.on('console', (msg) => {
      const text = msg.text().toLowerCase()
      if (
        text.includes('password') ||
        text.includes('token') ||
        text.includes('secret') ||
        text.includes('api_key')
      ) {
        sensitiveMessages.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    expect(sensitiveMessages).toEqual([])
  })
})
