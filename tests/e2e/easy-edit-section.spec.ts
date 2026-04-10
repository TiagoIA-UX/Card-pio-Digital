import { test, expect } from '@playwright/test'

test.describe('Seção de Edição Fácil — Landing Page', () => {
  test('deve exibir seção de edição fácil com benefícios', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    // Scroll até a seção de edição
    await page.locator('text=Edição tão fácil que você mesmo faz').scrollIntoViewIfNeeded()

    // Verificar título principal
    await expect(page.getByText('Edição tão fácil que você mesmo faz')).toBeVisible()
    
    // Verificar heading com destaque
    await expect(page.getByRole('heading', { 
      name: /Mude preços, crie combos e atualize produtos/i 
    })).toBeVisible()
    await expect(page.getByText('em segundos — sem pagar desenvolvedor')).toBeVisible()

    // Verificar descrição de casos de uso
    await expect(page.getByText(/Cardápio de verão no litoral/i)).toBeVisible()
    await expect(page.getByText(/Combo de páscoa/i)).toBeVisible()
    await expect(page.getByText(/Você faz tudo direto no painel/i)).toBeVisible()
  })

  test('deve exibir badges de benefícios', async ({ page }) => {
    await page.goto('/')
    
    await page.locator('text=Você mesmo edita').scrollIntoViewIfNeeded()

    // Verificar badges visuais
    await expect(page.getByText('Você mesmo edita')).toBeVisible()
    await expect(page.getByText('Alteração em tempo real')).toBeVisible()
  })

  test('deve exibir 3 cards de benefícios específicos', async ({ page }) => {
    await page.goto('/')

    await page.locator('text=Economize com desenvolvedor').scrollIntoViewIfNeeded()

    // Card 1: Economia com desenvolvedor
    await expect(page.getByText('🎯 Economize com desenvolvedor')).toBeVisible()
    await expect(page.getByText(/Toda vez que você pagar alguém/i)).toBeVisible()
    await expect(page.getByText(/R\$ 50 a R\$ 300/i)).toBeVisible()

    // Card 2: Reação rápida ao mercado
    await expect(page.getByText('⚡ Reaja rápido ao mercado')).toBeVisible()
    await expect(page.getByText(/Segunda-feira vendeu pouco/i)).toBeVisible()
    await expect(page.getByText(/Páscoa chegando/i)).toBeVisible()

    // Card 3: Múltiplas unidades
    await expect(page.getByText('🏖️ Perfeito para quem tem múltiplas unidades')).toBeVisible()
    await expect(page.getByText(/Delivery no centro \+ quiosque no litoral/i)).toBeVisible()
    await expect(page.getByText(/operações sazonais/i)).toBeVisible()
  })

  test('deve mencionar casos de uso específicos nos cards', async ({ page }) => {
    await page.goto('/')

    await page.locator('text=Economize com desenvolvedor').scrollIntoViewIfNeeded()

    // Verificar que os cards mencionam casos de uso práticos
    // Usando locator específico do card para evitar strict mode
    const card1 = page.locator('text=Economize com desenvolvedor').locator('..')
    await expect(card1.getByText(/ajustar um preço/i)).toBeVisible()
    await expect(card1.getByText(/criar um combo/i)).toBeVisible()

    const card2 = page.locator('text=Reaja rápido ao mercado').locator('..')
    await expect(card2.getByText(/Segunda-feira/i)).toBeVisible()
    await expect(card2.getByText(/Páscoa/i)).toBeVisible()

    const card3 = page.locator('text=múltiplas unidades').locator('..')
    await expect(card3.getByText(/litoral/i)).toBeVisible()
    await expect(card3.getByText(/verão/i)).toBeVisible()
  })

  test('deve destacar velocidade de edição', async ({ page }) => {
    await page.goto('/')

    await page.locator('text=em segundos').first().scrollIntoViewIfNeeded()

    // Verificar menções de rapidez
    await expect(page.getByText('em segundos — sem pagar desenvolvedor')).toBeVisible()
    await expect(page.getByText('você faz sozinho em 2 minutos')).toBeVisible()
    await expect(page.getByText('Tudo isso em segundos')).toBeVisible()
  })

  test('deve exibir mockup do fluxo de edição', async ({ page }) => {
    await page.goto('/')

    await page.locator('text=Você mesmo edita').scrollIntoViewIfNeeded()

    // Verificar que o carousel de frames existe (6 imagens)
    const frames = await page.locator('.hero-frame').count()
    expect(frames).toBe(6)

    // Verificar descrição do visual
    await expect(page.getByText(/Do login à publicação: edição rápida/i)).toBeVisible()
  })

  test('deve enfatizar economia de custos recorrentes', async ({ page }) => {
    await page.goto('/')

    await page.locator('text=Economize com desenvolvedor').scrollIntoViewIfNeeded()

    // Verificar cálculo de economia
    await expect(page.getByText('R$ 50 a R$ 300')).toBeVisible()
    await expect(page.getByText('quantas vezes quiser')).toBeVisible()
  })

  test('deve mencionar acesso mobile e desktop', async ({ page }) => {
    await page.goto('/')

    await page.locator('text=Reaja rápido ao mercado').scrollIntoViewIfNeeded()

    // Verificar menção de platforms
    await expect(page.getByText('direto do celular ou computador')).toBeVisible()
  })
})

test.describe('Validação de Mensagem para Cliente', () => {
  test('deve comunicar valor principal: edição sem dependência', async ({ page }) => {
    await page.goto('/')

    await page.locator('text=Edição tão fácil').scrollIntoViewIfNeeded()

    // Mensagens-chave que o cliente deve entender
    const keyMessages = [
      'Você mesmo edita',  // Autonomia
      'sem pagar desenvolvedor',  // Economia
      'quantas vezes quiser',  // Sem limite
      'direto do celular',  // Conveniência
    ]

    for (const message of keyMessages) {
      await expect(page.getByText(message, { exact: false })).toBeVisible()
    }
    
    // "em segundos" aparece múltiplas vezes, verificar apenas uma
    await expect(page.getByText('em segundos', { exact: false }).first()).toBeVisible()
  })

  test('deve apresentar ROI claro: tempo e dinheiro economizados', async ({ page }) => {
    await page.goto('/')

    await page.locator('text=Economize com desenvolvedor').scrollIntoViewIfNeeded()

    // ROI explícito
    await expect(page.getByText('R$ 50 a R$ 300')).toBeVisible()  // Custo evitado
    await expect(page.getByText('2 minutos')).toBeVisible()  // Tempo de execução
    await expect(page.getByText('quantas vezes quiser')).toBeVisible()  // Ilimitado
  })
})
