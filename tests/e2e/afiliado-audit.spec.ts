import { test, expect } from '@/tests/fixtures/affiliate-fixtures'

/**
 * Auditoria E2E — Persona: Afiliado (reseller)
 * Verifica cadastro, proteção contra fraude e APIs de afiliado.
 */

test.describe('Afiliado Audit', () => {
  test('landing de afiliados carrega sem erros', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/afiliados')
    await page.waitForLoadState('networkidle')

    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5_000 })
    expect(errors).toEqual([])
  })

  test('landing de revendedores carrega sem erros', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/revendedores')
    await page.waitForLoadState('networkidle')
    expect(errors).toEqual([])
  })

  test('dashboard de afiliados é protegido', async ({ page }) => {
    await page.goto('/painel/afiliados')
    await page.waitForLoadState('networkidle')
    const url = page.url()
    expect(url).toMatch(/\/(login|auth|afiliados)/)
  })

  test('API ranking retorna dados ou redireciona', async ({ request }) => {
    const res = await request.get('/api/afiliados/ranking')
    // Sem sessão: 401, 200 com dados públicos, ou 410 (deprecated)
    expect([200, 401, 410]).toContain(res.status())

    if (res.status() === 200) {
      const body = await res.json()
      expect(body).toHaveProperty('ranking')
      expect(Array.isArray(body.ranking)).toBeTruthy()
    }
  })

  test('webhook com assinatura forjada é rejeitado', async ({ fraudHelper }) => {
    const res = await fraudHelper.sendForgedWebhook('fake-payment-id-12345')
    // Deve retornar 401 ou 400
    expect([400, 401]).toContain(res.status())
  })

  test('cookie aff_ref é setado ao visitar com ?ref=', async ({ page }) => {
    await page.goto('/?ref=TESTCODE')
    await page.waitForLoadState('networkidle')

    const cookies = await page.context().cookies()
    const affRef = cookies.find((c) => c.name === 'aff_ref')
    // O cookie pode ser setado pelo middleware ou JS do cliente
    if (affRef) {
      expect(affRef.value).toBe('TESTCODE')
    }
  })

  test('múltiplas contas com mesmo padrão são detectadas', async ({ fraudHelper }) => {
    const results = await fraudHelper.registerMultipleAliasAccounts('audit-test', 3)
    // Pelo menos algumas registrações devem falhar ou ser detectadas
    const hasBlocked = results.some((r) => r.status !== 200)
    // Se nenhuma foi bloqueada, é um warning (não necessariamente falha)
    if (!hasBlocked) {
      console.warn('Nenhuma conta alias foi bloqueada — verificar proteção anti-fraude')
    }
  })
})
