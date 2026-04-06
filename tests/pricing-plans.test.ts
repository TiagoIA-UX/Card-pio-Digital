import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calcParcelaMensal,
  PUBLIC_SUBSCRIPTION_PRICES,
  PLAN_LIMITS,
  TEMPLATE_PRICING,
  getMaxProducts,
  formatNetworkExpansionLabel,
  NETWORK_EXPANSION_UNIT_OPTIONS,
} from '@/lib/domains/marketing/pricing'

// ═══════════════════════════════════════════════════════════════
// calcParcelaMensal — juros compostos
// ═══════════════════════════════════════════════════════════════

test('calcParcelaMensal: 1 parcela = valor cheio', () => {
  assert.equal(calcParcelaMensal(300, 1), 300)
})

test('calcParcelaMensal: 12x de R$237 ≈ R$23.86/mês', () => {
  const parcela = calcParcelaMensal(237, 12)
  assert.ok(parcela > 20 && parcela < 30, `Parcela deveria ser ~23-24, recebeu ${parcela}`)
})

test('calcParcelaMensal: resultado é centavos arredondados', () => {
  const parcela = calcParcelaMensal(500, 6)
  const centavos = Math.round(parcela * 100) / 100
  assert.equal(parcela, centavos, 'Deve ter no máximo 2 casas decimais')
})

test('calcParcelaMensal: 3x > valor/3 (juros)', () => {
  const parcela = calcParcelaMensal(300, 3)
  assert.ok(parcela > 100, 'Parcela com juros deve ser > valor/n')
})

// ═══════════════════════════════════════════════════════════════
// PUBLIC_SUBSCRIPTION_PRICES — planos SaaS
// ═══════════════════════════════════════════════════════════════

test('Plano básico: R$147/mês, R$1470/ano', () => {
  assert.equal(PUBLIC_SUBSCRIPTION_PRICES.basico.monthly, 147)
  assert.equal(PUBLIC_SUBSCRIPTION_PRICES.basico.annual, 1470)
})

test('Plano pro: R$149/mês', () => {
  assert.equal(PUBLIC_SUBSCRIPTION_PRICES.pro.monthly, 149)
})

test('Plano premium: R$199/mês', () => {
  assert.equal(PUBLIC_SUBSCRIPTION_PRICES.premium.monthly, 199)
})

test('Anual é 10x (desconto de 2 meses)', () => {
  assert.equal(
    PUBLIC_SUBSCRIPTION_PRICES.basico.annual,
    PUBLIC_SUBSCRIPTION_PRICES.basico.monthly * 10
  )
})

// ═══════════════════════════════════════════════════════════════
// PLAN_LIMITS
// ═══════════════════════════════════════════════════════════════

test('Basico: 60 produtos', () => {
  assert.equal(PLAN_LIMITS.basico.maxProducts, 60)
})

test('Pro: 200 produtos', () => {
  assert.equal(PLAN_LIMITS.pro.maxProducts, 200)
})

test('Premium: 1200 produtos', () => {
  assert.equal(PLAN_LIMITS.premium.maxProducts, 1200)
})

test('getMaxProducts("basico") → 60', () => {
  assert.equal(getMaxProducts('basico'), 60)
})

test('getMaxProducts("premium") → 1200', () => {
  assert.equal(getMaxProducts('premium'), 1200)
})

test('getMaxProducts(slug desconhecido) → 60 (fallback seguro)', () => {
  assert.equal(getMaxProducts('inexistente'), 60)
})

// ═══════════════════════════════════════════════════════════════
// TEMPLATE_PRICING — 10 templates
// ═══════════════════════════════════════════════════════════════

test('Todos os templates têm pricing configurado', () => {
  const templates = Object.keys(TEMPLATE_PRICING)
  assert.ok(templates.length >= 7, `Esperado >=7 templates, encontrou ${templates.length}`)
})

test('Lanchonete tem complexidade 1', () => {
  assert.equal(TEMPLATE_PRICING.lanchonete.complexidade, 1)
})

test('Pizzaria tem complexidade 3', () => {
  assert.equal(TEMPLATE_PRICING.pizzaria.complexidade, 3)
})

test('selfService PIX é sempre menor que card (desconto PIX)', () => {
  for (const [slug, tp] of Object.entries(TEMPLATE_PRICING)) {
    assert.ok(
      tp.selfService.pix < tp.selfService.card,
      `${slug}: PIX (${tp.selfService.pix}) deveria ser < card (${tp.selfService.card})`
    )
  }
})

test('feitoPraVoce é mais caro que selfService', () => {
  for (const [slug, tp] of Object.entries(TEMPLATE_PRICING)) {
    assert.ok(
      tp.feitoPraVoce.pix > tp.selfService.pix,
      `${slug}: FPVC PIX (${tp.feitoPraVoce.pix}) deveria ser > DIY PIX (${tp.selfService.pix})`
    )
  }
})

test('card_12x é calculado (não zero)', () => {
  for (const [slug, tp] of Object.entries(TEMPLATE_PRICING)) {
    assert.ok(tp.selfService.card_12x > 0, `${slug}: card_12x deveria ser > 0`)
    assert.ok(tp.feitoPraVoce.card_12x > 0, `${slug}: FPVC card_12x deveria ser > 0`)
  }
})

// ═══════════════════════════════════════════════════════════════
// Network expansion
// ═══════════════════════════════════════════════════════════════

test('NETWORK_EXPANSION_UNIT_OPTIONS: 5 opções', () => {
  assert.equal(NETWORK_EXPANSION_UNIT_OPTIONS.length, 5)
})

test('formatNetworkExpansionLabel singular', () => {
  assert.equal(formatNetworkExpansionLabel(1), '1 unidade extra')
})

test('formatNetworkExpansionLabel plural', () => {
  assert.equal(formatNetworkExpansionLabel(10), '10 unidades extras')
})
