import { expect, test } from '@playwright/test'

const PUBLIC_PAGES = [
  '/',
  '/afiliados',
  '/afiliados/ranking',
  '/beneficios',
  '/funcionalidades',
  '/google-meu-negocio',
  '/precos',
  // /revendedores desabilitada intencionalmente (notFound) por decisão estratégica
  '/templates',
]

function normalizeInternalPath(href: string): string | null {
  if (!href) return null
  if (!href.startsWith('/')) return null
  if (href.startsWith('//')) return null

  const pathOnly = href.split('#')[0]?.split('?')[0] ?? '/'
  if (pathOnly.length > 1 && pathOnly.endsWith('/')) return pathOnly.slice(0, -1)
  return pathOnly
}

test.describe('Monitoramento de links internos', () => {
  test('todas as páginas públicas principais retornam sem 4xx/5xx', async ({ page, request }) => {
    const failing: string[] = []
    const discovered = new Set<string>()

    for (const route of PUBLIC_PAGES) {
      const response = await page.goto(route, { waitUntil: 'networkidle' })
      const status = response?.status() ?? 0
      if (status >= 400 || status === 0) {
        failing.push(`${route} -> status ${status || 'sem resposta'}`)
        continue
      }

      const hrefs = await page
        .locator('a[href]')
        .evaluateAll((anchors) =>
          anchors
            .map((anchor) => (anchor as HTMLAnchorElement).getAttribute('href') || '')
            .filter(Boolean)
        )

      for (const href of hrefs) {
        const normalized = normalizeInternalPath(href)
        if (!normalized) continue
        if (normalized.startsWith('/_next')) continue

        discovered.add(normalized)
      }
    }

    for (const route of discovered) {
      const res = await request.get(route, { maxRedirects: 5 })
      const status = res.status()
      if (status >= 400) {
        failing.push(`${route} -> status ${status}`)
      }
    }

    expect(failing, `Foram encontrados links internos quebrados:\n${failing.join('\n')}`).toEqual(
      []
    )
  })
})
