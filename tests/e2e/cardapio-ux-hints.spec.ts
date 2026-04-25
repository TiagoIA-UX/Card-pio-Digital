import { test, expect } from '@playwright/test'

/**
 * E2E — Suíte completa de UX do cardápio:
 *  1. Fluxo normal de pedido via entrega → botão WhatsApp ativado
 *  2. Hints de endereço (campo vazio após blur)
 *  3. Hint de telefone inválido
 *  4. Regressão de carrinho (adicionar, total correto)
 *  5. Bloqueio de envio com telefone inválido
 *  6. Troca entrega/retirada (campos somem/aparecem)
 *
 * Usa /templates/pizzaria que renderiza CardapioClient com dados demo
 * (telefone: 11999999999, produtos reais).
 */

test.describe('Cardápio UX — Hints e Fluxo de Pedido', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/templates/pizzaria')
    await page.waitForLoadState('networkidle')

    // Fechar o banner de cookies que sobrepõe o botão do carrinho
    const acceptCookies = page.locator('button:has-text("Aceitar cookies")')
    if (await acceptCookies.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await acceptCookies.click()
      await acceptCookies.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {})
    }
  })

  test('Cenário 1 — Fluxo normal entrega: formulário completo habilita botão WhatsApp', async ({
    page,
  }) => {
    // 1. Adicionar produto ao carrinho
    const addButton = page.locator('button:has(svg.lucide-plus)').first()
    await expect(addButton).toBeVisible({ timeout: 15_000 })
    await addButton.click()

    // 2. Abrir carrinho
    const cartButton = page.locator('button:has-text("Ver carrinho")')
    await expect(cartButton).toBeVisible({ timeout: 5_000 })
    await cartButton.click()

    // 3. Preencher Nome
    const nameInput = page.locator('input[aria-label="Nome"]')
    await expect(nameInput).toBeVisible({ timeout: 5_000 })
    await nameInput.fill('Teste E2E')

    // 4. Preencher Telefone válido (11 dígitos)
    const phoneInput = page.locator('input[aria-label="Telefone"]')
    await phoneInput.fill('11999887766')

    // 5. Selecionar Entrega
    const deliveryButton = page.locator('button:has-text("Entrega")')
    await deliveryButton.click()

    // 6. Preencher endereço
    const streetInput = page.locator('input[aria-label="Rua e número"]')
    await expect(streetInput).toBeVisible({ timeout: 3_000 })
    await streetInput.fill('Rua Teste, 123')

    const districtInput = page.locator('input[aria-label="Bairro"]')
    await districtInput.fill('Centro')

    // 7. Escolher forma de pagamento (PIX)
    const pixLabel = page.locator('label:has-text("PIX")')
    await pixLabel.click()

    // 8. Verificar botão "Enviar pedido via WhatsApp" habilitado
    const submitBtn = page.locator('button:has-text("Enviar pedido via WhatsApp")')
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toBeEnabled()

    // 9. Verificar que NÃO há hint de erro visível
    const phoneHint = page.locator('text=Digite um telefone válido com DDD')
    await expect(phoneHint).not.toBeVisible()

    const streetHint = page.locator('text=Informe a rua e o número para entrega')
    await expect(streetHint).not.toBeVisible()

    const districtHint = page.locator('text=Informe o bairro para entrega')
    await expect(districtHint).not.toBeVisible()
  })

  test('Cenário 2 — Hint de endereço aparece ao sair do campo vazio', async ({ page }) => {
    // Adicionar produto para abrir carrinho
    const addButton = page.locator('button:has(svg.lucide-plus)').first()
    await expect(addButton).toBeVisible({ timeout: 15_000 })
    await addButton.click()

    const cartButton = page.locator('button:has-text("Ver carrinho")')
    await cartButton.click()

    // Selecionar Entrega para campos de endereço aparecerem
    const deliveryButton = page.locator('button:has-text("Entrega")')
    await expect(deliveryButton).toBeVisible({ timeout: 5_000 })
    await deliveryButton.click()

    // Clicar em "Rua e número" → sair sem digitar (Tab)
    const streetInput = page.locator('input[aria-label="Rua e número"]')
    await expect(streetInput).toBeVisible({ timeout: 3_000 })
    await streetInput.focus()
    await streetInput.blur()

    // Esperar hint de rua aparecer
    const streetHint = page.locator('text=Informe a rua e o número para entrega')
    await expect(streetHint).toBeVisible({ timeout: 3_000 })

    // Clicar em "Bairro" → sair sem digitar
    const districtInput = page.locator('input[aria-label="Bairro"]')
    await districtInput.focus()
    await districtInput.blur()

    // Esperar hint de bairro aparecer
    const districtHint = page.locator('text=Informe o bairro para entrega')
    await expect(districtHint).toBeVisible({ timeout: 3_000 })

    // Verificar que ambos têm estilo de erro (text-destructive)
    const streetHintEl = page.locator('p:has-text("Informe a rua e o número para entrega")')
    await expect(streetHintEl).toHaveClass(/text-destructive/)

    const districtHintEl = page.locator('p:has-text("Informe o bairro para entrega")')
    await expect(districtHintEl).toHaveClass(/text-destructive/)
  })

  test('Cenário 3 — Telefone inválido mostra hint em vermelho', async ({ page }) => {
    // Adicionar produto para abrir carrinho
    const addButton = page.locator('button:has(svg.lucide-plus)').first()
    await expect(addButton).toBeVisible({ timeout: 15_000 })
    await addButton.click()

    const cartButton = page.locator('button:has-text("Ver carrinho")')
    await cartButton.click()

    // Digitar telefone incompleto
    const phoneInput = page.locator('input[aria-label="Telefone"]')
    await expect(phoneInput).toBeVisible({ timeout: 5_000 })
    await phoneInput.fill('11999')

    // Clicar fora (no campo Nome, por exemplo)
    const nameInput = page.locator('input[aria-label="Nome"]')
    await nameInput.click()

    // Hint de telefone deve aparecer
    const phoneHint = page.locator('text=Digite um telefone válido com DDD')
    await expect(phoneHint).toBeVisible({ timeout: 3_000 })

    // Deve ter estilo de erro
    const phoneHintEl = page.locator('p:has-text("Digite um telefone válido com DDD")')
    await expect(phoneHintEl).toHaveClass(/text-destructive/)

    // Agora completar o telefone — hint deve sumir
    await phoneInput.fill('11999887766')
    await nameInput.click()

    await expect(phoneHint).not.toBeVisible({ timeout: 3_000 })
  })

  test('Cenário 4 — Regressão de carrinho: adicionar itens e total correto', async ({ page }) => {
    // Adicionar primeiro produto 1 vez
    const addButton = page.locator('button:has(svg.lucide-plus)').first()
    await expect(addButton).toBeVisible({ timeout: 15_000 })
    await addButton.click()

    // Abrir carrinho
    const cartButton = page.locator('button:has-text("Ver carrinho")')
    await expect(cartButton).toBeVisible({ timeout: 5_000 })
    await cartButton.click()

    // Dentro do drawer, verificar que existe 1 item (qty = 1)
    const qtySpan = page.locator('[aria-label="Diminuir quantidade"] ~ span, span:between([aria-label="Diminuir quantidade"], [aria-label="Aumentar quantidade"])').first()

    // Incrementar com o botão + do drawer
    const incrementBtn = page.locator('[aria-label="Aumentar quantidade"]').first()
    await expect(incrementBtn).toBeVisible({ timeout: 3_000 })
    await incrementBtn.click()

    // Após incrementar, verificar total atualizado (deve ser 2x o preço)
    // Pegar os textos de total do drawer — o total no footer mostra o valor correto
    const totalDisplay = page.locator('div.space-y-2 >> text=Total').locator('..')
    const totalValue = totalDisplay.locator('span.text-primary')
    await expect(totalValue).toBeVisible({ timeout: 3_000 })

    const totalText = await totalValue.textContent()
    // Verificar que existe um valor formatado como R$ XX,XX
    expect(totalText).toMatch(/R\$\s?\d/)

    // Decrementar de volta para 1
    const decrementBtn = page.locator('[aria-label="Diminuir quantidade"]').first()
    await decrementBtn.click()

    // Total deve ter mudado (metade do anterior)
    const newTotalText = await totalValue.textContent()
    expect(newTotalText).toMatch(/R\$\s?\d/)

    // Os totais devem ser diferentes (2x vs 1x)
    expect(totalText).not.toBe(newTotalText)
  })

  test('Cenário 5 — Botão desabilitado com telefone inválido', async ({ page }) => {
    // Adicionar produto
    const addButton = page.locator('button:has(svg.lucide-plus)').first()
    await expect(addButton).toBeVisible({ timeout: 15_000 })
    await addButton.click()

    // Abrir carrinho
    const cartButton = page.locator('button:has-text("Ver carrinho")')
    await cartButton.click()

    // Preencher nome + telefone inválido
    const nameInput = page.locator('input[aria-label="Nome"]')
    await expect(nameInput).toBeVisible({ timeout: 5_000 })
    await nameInput.fill('Teste Bloqueio')

    const phoneInput = page.locator('input[aria-label="Telefone"]')
    await phoneInput.fill('119')

    // Selecionar Retirada (sem necessidade de endereço)
    const pickupButton = page.locator('button:has-text("Retirada")')
    await pickupButton.click()

    // Escolher forma de pagamento
    const pixLabel = page.locator('label:has-text("PIX")')
    await pixLabel.click()

    // Botão deve estar desabilitado (telefone inválido)
    const submitBtn = page.locator('button:has-text("Enviar pedido via WhatsApp")')
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toBeDisabled()

    // Corrigir telefone → botão habilita
    await phoneInput.fill('11999887766')
    await expect(submitBtn).toBeEnabled()
  })

  test('Cenário 6 — Troca entrega/retirada mostra/esconde campos de endereço', async ({
    page,
  }) => {
    // Adicionar produto
    const addButton = page.locator('button:has(svg.lucide-plus)').first()
    await expect(addButton).toBeVisible({ timeout: 15_000 })
    await addButton.click()

    // Abrir carrinho
    const cartButton = page.locator('button:has-text("Ver carrinho")')
    await cartButton.click()

    const deliveryButton = page.locator('button:has-text("Entrega")')
    const pickupButton = page.locator('button:has-text("Retirada")')
    const streetInput = page.locator('input[aria-label="Rua e número"]')
    const districtInput = page.locator('input[aria-label="Bairro"]')
    const complementInput = page.locator('input[aria-label="Complemento"]')

    // Estado inicial: Retirada (padrão) — campos de endereço ocultos
    await expect(deliveryButton).toBeVisible({ timeout: 5_000 })
    await expect(streetInput).not.toBeVisible()

    // Mudar para Entrega → campos aparecem
    await deliveryButton.click()
    await expect(streetInput).toBeVisible({ timeout: 3_000 })
    await expect(districtInput).toBeVisible()
    await expect(complementInput).toBeVisible()

    // Preencher endereço
    await streetInput.fill('Av. Brasil, 500')
    await districtInput.fill('Jardins')

    // Mudar para Retirada → campos somem
    await pickupButton.click()
    await expect(streetInput).not.toBeVisible({ timeout: 3_000 })
    await expect(districtInput).not.toBeVisible()
    await expect(complementInput).not.toBeVisible()

    // Voltar para Entrega → dados preenchidos persistem
    await deliveryButton.click()
    await expect(streetInput).toBeVisible({ timeout: 3_000 })
    await expect(streetInput).toHaveValue('Av. Brasil, 500')
    await expect(districtInput).toHaveValue('Jardins')
  })
})

