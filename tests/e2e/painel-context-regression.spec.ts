import { test, expect } from '@playwright/test'

const CLIENT_STORAGE_STATE = process.env.PLAYWRIGHT_CLIENT_STORAGE_STATE

if (CLIENT_STORAGE_STATE) {
  test.use({ storageState: CLIENT_STORAGE_STATE })
}

async function getActivePanelRestaurantIds(page: import('@playwright/test').Page) {
  const painelLinks = page
    .locator('a[href^="/painel?restaurant="]')
    .filter({ hasText: /Acessar Painel/i })

  const total = await painelLinks.count()
  const ids: string[] = []

  for (let index = 0; index < total; index += 1) {
    const href = await painelLinks.nth(index).getAttribute('href')
    if (!href) continue

    const restaurantId = new URL(href, 'http://localhost:3000').searchParams.get('restaurant')
    if (restaurantId && !ids.includes(restaurantId)) {
      ids.push(restaurantId)
    }
  }

  return ids
}

test.describe('Painel — Regressão de contexto entre deliverys', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !CLIENT_STORAGE_STATE,
      'Defina PLAYWRIGHT_CLIENT_STORAGE_STATE com uma sessão autenticada para validar o fluxo entre Meus Cardápios e Painel.'
    )

    await page.goto('/meus-templates')
    await page.waitForLoadState('networkidle')
  })

  test('preserva o restaurant ao entrar pelo card e navegar no painel', async ({ page }) => {
    const painelLink = page.locator('a[href^="/painel?restaurant="]').filter({ hasText: /Acessar Painel/i }).first()

    await expect(painelLink).toBeVisible({ timeout: 15000 })

    const href = await painelLink.getAttribute('href')
    expect(href).toBeTruthy()

    const restaurantId = new URL(href!, 'http://localhost:3000').searchParams.get('restaurant')
    expect(restaurantId).toBeTruthy()

    await painelLink.click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(new RegExp(`/painel\\?restaurant=${restaurantId}`))

    const menuTargets = [
      { name: 'Editor Visual', expectedPath: '/painel/editor' },
      { name: 'Produtos', expectedPath: '/painel/produtos' },
      { name: 'Configurações', expectedPath: '/painel/configuracoes' },
    ]

    for (const target of menuTargets) {
      const menuLink = page.locator(`a[href^="${target.expectedPath}"]`).filter({ hasText: target.name }).first()
      await expect(menuLink).toBeVisible({ timeout: 10000 })

      const menuHref = await menuLink.getAttribute('href')
      expect(menuHref).toContain(`restaurant=${restaurantId}`)

      await menuLink.click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(new RegExp(`${target.expectedPath.replace('/', '\\/')}.*restaurant=${restaurantId}`))
    }
  })

  test('permite trocar entre dois deliverys diferentes e atualiza o contexto', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium',
      'O cenário de troca via seletor é validado no layout desktop do painel.'
    )

    const restaurantIds = await getActivePanelRestaurantIds(page)
    test.skip(
      restaurantIds.length < 2,
      'A conta autenticada precisa ter pelo menos dois deliverys ativos com acesso ao painel.'
    )

    await page.goto(`/painel?restaurant=${restaurantIds[0]}`)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(new RegExp(`/painel\\?restaurant=${restaurantIds[0]}`))

    const currentRestaurantName = (await page.locator('aside h2').first().textContent())?.trim() || ''
    expect(currentRestaurantName).not.toBe('')

    const switcherButton = page.locator('aside button').filter({ has: page.locator('aside h2') }).first()
    await expect(switcherButton).toBeVisible({ timeout: 10000 })
    await switcherButton.click()

    const dropdownOptions = page.locator('aside div.absolute button')
    const optionsCount = await dropdownOptions.count()

    let chosenName: string | null = null
    for (let index = 0; index < optionsCount; index += 1) {
      const text = (await dropdownOptions.nth(index).textContent())?.trim() || ''
      if (text && text !== currentRestaurantName) {
        chosenName = text
        await dropdownOptions.nth(index).click()
        break
      }
    }

    expect(chosenName).toBeTruthy()
    await page.waitForLoadState('networkidle')

    const nextUrl = new URL(page.url())
    const switchedRestaurantId = nextUrl.searchParams.get('restaurant')
    expect(switchedRestaurantId).toBeTruthy()
    expect(switchedRestaurantId).not.toBe(restaurantIds[0])

    const switchedRestaurantName = (await page.locator('aside h2').first().textContent())?.trim() || ''
    expect(switchedRestaurantName).toContain(chosenName!)

    const editorLink = page.locator('a[href^="/painel/editor"]').filter({ hasText: 'Editor Visual' }).first()
    const productsLink = page.locator('a[href^="/painel/produtos"]').filter({ hasText: 'Produtos' }).first()

    await expect(editorLink).toHaveAttribute('href', new RegExp(`restaurant=${switchedRestaurantId}`))
    await expect(productsLink).toHaveAttribute('href', new RegExp(`restaurant=${switchedRestaurantId}`))
  })

  test('cards ativos de Meus Cardápios sempre carregam href contextualizado', async ({ page }) => {
    const restaurantIds = await getActivePanelRestaurantIds(page)
    expect(restaurantIds.length).toBeGreaterThan(0)

    const painelLinks = page.locator('a[href^="/painel?restaurant="]').filter({ hasText: /Acessar Painel/i })
    const total = await painelLinks.count()

    for (let index = 0; index < total; index += 1) {
      const href = await painelLinks.nth(index).getAttribute('href')
      expect(href).toMatch(/^\/painel\?restaurant=/)
    }
  })
})
