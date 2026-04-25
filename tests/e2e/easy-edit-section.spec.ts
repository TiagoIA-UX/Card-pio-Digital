import { expect, test } from '@playwright/test'

test.describe('Seção de Edição Fácil', () => {
  test('exibe a proposta principal com autonomia e rapidez', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    await page.getByText('Edição tão fácil que você mesmo faz').scrollIntoViewIfNeeded()

    await expect(page.getByText('Edição tão fácil que você mesmo faz')).toBeVisible()
    await expect(
      page.getByRole('heading', {
        name: /Mude preços, crie combos e atualize produtos/i,
      })
    ).toBeVisible()
    await expect(page.getByText('em segundos — sem pagar desenvolvedor')).toBeVisible()
    await expect(page.getByText(/Cardápio de verão no litoral/i)).toBeVisible()
  })

  test('mantém os badges e o mockup do fluxo no celular', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    await page.getByText('Você mesmo edita').scrollIntoViewIfNeeded()

    await expect(page.getByText('Você mesmo edita')).toBeVisible()
    await expect(page.getByText('Alteração em tempo real')).toBeVisible()
    await expect(page.getByText(/Do login à publicação: edição rápida/i)).toBeVisible()
    await expect(page.locator('.hero-frame')).toHaveCount(6)
  })

  test('destaca aversão à perda no card de economia', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    await page.getByText('Pare de pagar por cada ajuste').scrollIntoViewIfNeeded()

    await expect(page.getByText('Economia real', { exact: true })).toBeVisible()
    await expect(page.getByText(/Pare de pagar por cada ajuste/i)).toBeVisible()
    await expect(page.getByText('R$ 750', { exact: true })).toBeVisible()
    await expect(page.getByText(/R\$ 0 por ajuste/i)).toBeVisible()
  })

  test('destaca velocidade e timing comercial no card de agilidade', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    await page.getByText('Agilidade comercial').scrollIntoViewIfNeeded()

    await expect(page.getByText('Agilidade comercial')).toBeVisible()
    await expect(page.getByText(/Não perca vendas esperando/i)).toBeVisible()
    await expect(page.getByText('30 seg')).toBeVisible()
    await expect(page.getByText(/2 cliques, atualização imediata/i)).toBeVisible()
  })

  test('destaca operação multiunidade com controle centralizado', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    await page.getByText('Operação multiunidade').scrollIntoViewIfNeeded()

    await expect(page.getByText('Operação multiunidade')).toBeVisible()
    await expect(page.getByText(/centro, bairro e litoral/i)).toBeVisible()
    await expect(page.getByText('1 painel')).toBeVisible()
    await expect(page.getByText(/Controle centralizado/i)).toBeVisible()
  })
})

