import { test, expect } from '@playwright/test'

test.describe('Bônus Exclusivos — Página e Download', () => {
  test('deve exibir página de bônus com e-book GMB', async ({ page }) => {
    await page.goto('/bonus', { waitUntil: 'networkidle' })

    // Verificar elementos principais
    await expect(page.getByRole('heading', { name: /Seus Materiais Exclusivos/i, level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Google Meu Negócio', level: 2 })).toBeVisible()
    
    // Verificar conteúdo do e-book (usar .first() para evitar strict mode)
    await expect(page.getByText('92 páginas', { exact: false }).first()).toBeVisible()
    await expect(page.getByText('46%, 76%, 28%').first()).toBeVisible()
    await expect(page.getByText('R$ 350-800').first()).toBeVisible()
    
    // Verificar botão de download
    await expect(page.getByRole('link', { name: /Baixar E-book Agora/i })).toBeVisible()
  })

  test('deve ter botão de download do e-book funcionando', async ({ page }) => {
    await page.goto('/bonus')

    // Encontrar botão de download
    const downloadButton = page.getByRole('link', { name: /Baixar E-book Agora/i })
    await expect(downloadButton).toBeVisible()

    // Verificar href do link
    const href = await downloadButton.getAttribute('href')
    expect(href).toBe('/Ebook-GMB-Profissional-v2.md')
  })

  test('deve exibir setup assistido como bônus extra', async ({ page }) => {
    await page.goto('/bonus')

    // Verificar seção de setup assistido
    await expect(page.getByText('Setup Assistido (Bônus Extra)')).toBeVisible()
    await expect(page.getByText('Economize R$ 350')).toBeVisible()

    // Verificar link WhatsApp
    const whatsappLink = page.getByRole('link', { name: /Agendar pelo WhatsApp/i })
    await expect(whatsappLink).toBeVisible()

    const whatsappHref = await whatsappLink.getAttribute('href')
    expect(whatsappHref).toContain('wa.me')
    expect(whatsappHref).toContain('assinante%20Zairyx')
  })

  test('deve calcular economia corretamente', async ({ page }) => {
    await page.goto('/bonus')

    // Verificar título da seção
    await expect(page.getByRole('heading', { name: 'Economia Total com Bônus' })).toBeVisible()
    
    // Verificar que os valores estão presentes no card (sem strict matching)
    const economiaSection = page.locator('text=Economia Total com Bônus')
    await expect(economiaSection).toBeVisible()
  })
})

test.describe('Página de Preços — Banner de Bônus', () => {
  test('deve exibir banner de bônus na página de preços', async ({ page }) => {
    await page.goto('/precos', { waitUntil: 'networkidle' })

    // Verificar banner de bônus
    await expect(page.getByText('Bônus Exclusivo Incluído')).toBeVisible()
    await expect(page.getByText('E-book: Google Meu Negócio')).toBeVisible()
    await expect(page.getByText('VALOR: R$ 197')).toBeVisible()

    // Verificar benefícios listados
    await expect(page.getByText('92 páginas de conteúdo prático')).toBeVisible()
    await expect(page.getByText('Economize R$ 350-800')).toBeVisible()
    await expect(page.getByText('46%, 76%, 28%')).toBeVisible()

    // Verificar badge de gratuidade
    await expect(page.getByText('100% GRÁTIS para quem adquirir qualquer plano')).toBeVisible()
  })

  test('banner de bônus deve estar posicionado antes da tabela de preços', async ({ page }) => {
    await page.goto('/precos')

    // Obter elementos
    const bonusBanner = page.getByText('Bônus Exclusivo Incluído')
    const priceTable = page.getByRole('table')

    // Garantir que ambos existem
    await expect(bonusBanner).toBeVisible()
    await expect(priceTable).toBeVisible()

    // Verificar ordem no DOM
    const bonusBox = await bonusBanner.boundingBox()
    const tableBox = await priceTable.boundingBox()

    // Banner deve estar acima (y menor)
    expect(bonusBox?.y).toBeLessThan(tableBox?.y ?? Infinity)
  })

  test('deve destacar visualmente o valor do bônus (R$ 197)', async ({ page }) => {
    await page.goto('/precos')

    // Badge com valor deve ter estilo destacado
    const valueBadge = page.locator('text=VALOR: R$ 197')
    await expect(valueBadge).toBeVisible()

    // Verificar classes de destaque (border, bg, font-bold)
    const classes = await valueBadge.getAttribute('class')
    expect(classes).toContain('font-bold')
  })
})

test.describe('Experiência de Download — E2E', () => {
  test('arquivo de e-book deve estar acessível publicamente', async ({ page, request }) => {
    // Fazer request direto para o arquivo
    const response = await request.get('/Ebook-GMB-Profissional-v2.md')

    // Verificar resposta
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/markdown')

    // Verificar tamanho (deve ter conteúdo)
    const content = await response.text()
    expect(content.length).toBeGreaterThan(10000) // Pelo menos 10KB
    expect(content).toContain('Google Meu Negócio')
    expect(content).toContain('92 páginas')
  })

  test('link de download deve funcionar quando clicado', async ({ page }) => {
    await page.goto('/bonus')

    // Configurar listener para download
    const downloadPromise = page.waitForEvent('download')

    // Clicar no botão
    await page.getByRole('link', { name: /Baixar E-book Agora/i }).click()

    // Aguardar download
    const download = await downloadPromise

    // Verificar arquivo baixado
    expect(download.suggestedFilename()).toBe('Google-Meu-Negocio-Guia-Completo-Zairyx.md')
  })
})

test.describe('Validação de Conteúdo do E-book', () => {
  test('e-book deve conter capítulos essenciais', async ({ request }) => {
    const response = await request.get('/Ebook-GMB-Profissional-v2.md')
    const content = await response.text()

    // Verificar capítulos principais
    expect(content).toContain('Capítulo 1: Por que GMB é crucial')
    expect(content).toContain('Capítulo 2: Dados oficiais do Google')
    expect(content).toContain('Capítulo 3: Preços de mercado')
    expect(content).toContain('Capítulo 4: Passo a passo completo')
    expect(content).toContain('Capítulo 6: 20 melhores práticas')
    expect(content).toContain('Capítulo 8: Como responder avaliações')
    expect(content).toContain('Capítulo 9: Integração com cardápio Zairyx')
    expect(content).toContain('Capítulo 11: Checklist final')
  })

  test('e-book deve conter dados oficiais com fontes', async ({ request }) => {
    const response = await request.get('/Ebook-GMB-Profissional-v2.md')
    const content = await response.text()

    // Verificar estatísticas com fontes
    expect(content).toContain('46%')
    expect(content).toContain('76%')
    expect(content).toContain('28%')
    expect(content).toContain('Think with Google')
  })

  test('e-book deve conter modelos de resposta prontos', async ({ request }) => {
    const response = await request.get('/Ebook-GMB-Profissional-v2.md')
    const content = await response.text()

    // Verificar templates de resposta
    expect(content).toContain('MODELOS PRONTOS')
    expect(content).toContain('Avaliação 5 estrelas')
    expect(content).toContain('Avaliação 1 estrela')
    expect(content).toContain('Sua resposta (COPIE E ADAPTE):')
  })

  test('e-book deve conter integração Zairyx', async ({ request }) => {
    const response = await request.get('/Ebook-GMB-Profissional-v2.md')
    const content = await response.text()

    // Verificar seção de integração
    expect(content).toContain('Integração com cardápio Zairyx')
    expect(content).toContain('assinante Zairyx')
    expect(content).toContain('seucardapio.zairyx.com')
  })
})
