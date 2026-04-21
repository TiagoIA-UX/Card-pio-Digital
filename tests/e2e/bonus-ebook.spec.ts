import { test, expect } from '@playwright/test'

test.describe('Bônus Exclusivos — Página pública e acesso do assinante', () => {
  test('deve exibir página pública de bônus com caminhos corretos', async ({ page }) => {
    await page.goto('/bonus', { waitUntil: 'networkidle' })

    await expect(
      page.getByRole('heading', { name: /Seus Materiais Exclusivos/i, level: 1 })
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Google Meu Negócio', level: 2 })).toBeVisible()

    await expect(page.getByText('92 páginas', { exact: false }).first()).toBeVisible()
    await expect(page.getByText('46%, 76%, 28%').first()).toBeVisible()
    await expect(page.getByText('R$ 350-800').first()).toBeVisible()
    await expect(page.getByText('Assinantes acessam o download dentro do painel.')).toBeVisible()

    const buyLink = page.getByRole('link', { name: /Comprar avulso/i })
    await expect(buyLink).toBeVisible()
    await expect(buyLink).toHaveAttribute('href', '/ebook-google-meu-negocio')

    const loginLink = page.getByRole('link', { name: /Já sou assinante/i })
    await expect(loginLink).toBeVisible()
    await expect(loginLink).toHaveAttribute('href', '/login?redirect=%2Fpainel%2Fbonus')
  })

  test('deve exibir setup assistido como bônus extra', async ({ page }) => {
    await page.goto('/bonus')

    await expect(page.getByText('Setup Assistido (Bônus Extra)')).toBeVisible()
    await expect(page.getByText('Economize R$ 350')).toBeVisible()

    const whatsappLink = page.getByRole('link', { name: /Agendar pelo WhatsApp/i })
    await expect(whatsappLink).toBeVisible()

    const whatsappHref = await whatsappLink.getAttribute('href')
    expect(whatsappHref).toContain('wa.me')
    expect(whatsappHref).toContain('assinante%20Zairyx')
  })

  test('deve calcular economia corretamente', async ({ page }) => {
    await page.goto('/bonus')

    const economyCard = page
      .locator('div')
      .filter({ has: page.getByRole('heading', { name: 'Economia Total com Bônus' }) })
      .first()

    await expect(page.getByRole('heading', { name: 'Economia Total com Bônus' })).toBeVisible()
    await expect(economyCard).toContainText('R$ 547')
    await expect(economyCard).toContainText('100% GRÁTIS')
  })
})

test.describe('Página de Preços — Banner de Bônus', () => {
  test('deve exibir banner de bônus na página de preços', async ({ page }) => {
    await page.goto('/precos', { waitUntil: 'networkidle' })

    await expect(page.getByText('Bônus Exclusivo Incluído')).toBeVisible()
    await expect(page.getByText('E-book: Google Meu Negócio')).toBeVisible()
    await expect(page.getByText('VALOR: R$ 197')).toBeVisible()

    await expect(page.getByText('92 páginas de conteúdo prático')).toBeVisible()
    await expect(page.getByText('Economize R$ 350-800')).toBeVisible()
    await expect(page.getByText('46%, 76%, 28%')).toBeVisible()

    await expect(page.getByText('100% GRÁTIS para quem adquirir qualquer plano')).toBeVisible()
  })

  test('banner de bônus deve estar posicionado antes da tabela de preços', async ({ page }) => {
    await page.goto('/precos')

    const bonusBanner = page.getByText('Bônus Exclusivo Incluído')
    const priceTable = page.getByRole('table')

    await expect(bonusBanner).toBeVisible()
    await expect(priceTable).toBeVisible()

    const bonusBox = await bonusBanner.boundingBox()
    const tableBox = await priceTable.boundingBox()

    expect(bonusBox?.y).toBeLessThan(tableBox?.y ?? Infinity)
  })

  test('deve destacar visualmente o valor do bônus (R$ 197)', async ({ page }) => {
    await page.goto('/precos')

    const valueBadge = page.locator('text=VALOR: R$ 197')
    await expect(valueBadge).toBeVisible()

    const classes = await valueBadge.getAttribute('class')
    expect(classes).toContain('font-bold')
  })
})

test.describe('Oferta avulsa e download controlado', () => {
  test('deve exibir a página de venda avulsa com escopo claro', async ({ page }) => {
    await page.goto('/ebook-google-meu-negocio', { waitUntil: 'networkidle' })

    await expect(
      page.getByRole('heading', {
        name: /Compre o guia de Google Meu Negócio sem contratar o plano inteiro/i,
        level: 1,
      })
    ).toBeVisible()
    await expect(page.getByText('Litoral Conecta Canais Digitais')).toBeVisible()
    await expect(
      page.getByText('Onde sua marca deixa de depender e começa a expandir.')
    ).toBeVisible()
    await expect(page.getByText('O guia não inclui criação do canal digital Zairyx.')).toBeVisible()
    await expect(page.getByLabel('Seu nome')).toBeVisible()
    await expect(page.getByLabel('Seu melhor e-mail')).toBeVisible()
    await expect(page.getByRole('button', { name: /Comprar agora por R\$ 197/i })).toBeVisible()
  })

  test('deve bloquear download sem autenticação ou pagamento aprovado', async ({ request }) => {
    const response = await request.get('/api/ebook-gmb/download')

    expect(response.status()).toBe(401)
    const payload = await response.json()
    expect(payload.error).toBe('Unauthorized download')
  })

  test('deve validar dados mínimos antes de criar checkout', async ({ request }) => {
    const response = await request.post('/api/ebook-gmb/checkout', {
      data: { name: 'A', email: 'invalido' },
    })

    // 400 = validação rejeitou; 429 = rate limiter ativou antes (endpoint ainda protegido)
    expect([400, 429]).toContain(response.status())

    if (response.status() === 400) {
      const payload = await response.json()
      expect(payload.error).toBe('Validation failed')
      expect(payload.details.name).toBeTruthy()
      expect(payload.details.email).toBeTruthy()
    }
  })
})
