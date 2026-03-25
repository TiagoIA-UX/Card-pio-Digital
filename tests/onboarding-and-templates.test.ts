import test from 'node:test'
import assert from 'node:assert/strict'
import { buildRestaurantInstallation, getOnboardingPrice } from '@/lib/restaurant-onboarding'
import { buildCardapioViewModel } from '@/lib/cardapio-renderer'
import { buildRestaurantCustomizationSeed } from '@/lib/restaurant-customization'
import { buildTemplateDemoData, getRestaurantTemplateConfig } from '@/lib/templates-config'
import { mapMercadoPagoStatus } from '@/lib/payment-status'

test('template config central exposes consistent preview and pricing data', () => {
  const template = getRestaurantTemplateConfig('pizzaria')

  assert.equal(template.slug, 'pizzaria')
  assert.equal(template.previewUrl, '/templates/pizzaria')
  assert.ok(template.sampleProducts.length > 0)
  assert.equal(template.preset.slug, 'pizzaria')
})

test('restaurant installation is built from central template config', () => {
  const installation = buildRestaurantInstallation('acai', 'Açaí do Centro')

  assert.equal(installation.templateSlug, 'acai')
  assert.equal(installation.restaurantUpdate.template_slug, 'acai')
  assert.equal(
    installation.restaurantUpdate.slogan,
    'Monte seu açaí: copos, tigelas e pitaya no litoral.'
  )
  assert.ok(installation.sampleProducts.length >= 3)
})

test('restaurant customization seed centralizes template defaults', () => {
  const seed = buildRestaurantCustomizationSeed('bar', 'Bar do Centro')

  assert.equal(seed.badge, 'Petiscos, drinks e consumo local')
  assert.equal(seed.heroTitle, 'Bar do Centro com canal digital — veja os produtos e peça agora.')
  assert.equal(seed.primaryCtaLabel, '')
  assert.equal(seed.deliveryLabel, 'Entrega')
})

test('template demo data reuses the real cardapio renderer shape', () => {
  const demo = buildTemplateDemoData('restaurante')

  assert.equal(demo.restaurant.template_slug, 'restaurante')
  assert.equal(demo.restaurant.slug, 'demo-restaurante')
  assert.ok(demo.products.every((product) => product.restaurant_id === demo.restaurant.id))
})

test('cardapio view model centralizes active products, categories and presentation', () => {
  const preview = buildTemplateDemoData('pizzaria')
  const inactiveProduct = {
    ...preview.products[0],
    id: 'inactive-product',
    ativo: false,
    categoria: 'Ocultos',
  }

  const viewModel = buildCardapioViewModel(preview.restaurant, [
    ...preview.products,
    inactiveProduct,
  ])

  assert.equal(viewModel.presentation.template.slug, 'pizzaria')
  assert.ok(viewModel.categories.includes('Combos'))
  assert.ok(!viewModel.categories.includes('Ocultos'))
  assert.equal(viewModel.activeProducts.length, preview.products.length)
  assert.equal(viewModel.productsByCategory['Combos']?.length, 6)
})

test('onboarding prices are deterministic for each plan and payment method', () => {
  // Preços do template restaurante (fallback de getOnboardingPrice)
  assert.equal(getOnboardingPrice('self-service', 'pix'), 247)
  assert.equal(getOnboardingPrice('self-service', 'card'), 297)
  assert.equal(getOnboardingPrice('feito-pra-voce', 'pix'), 597)
  assert.equal(getOnboardingPrice('feito-pra-voce', 'card'), 717)
})

test('mercado pago statuses are mapped to internal statuses safely', () => {
  assert.deepEqual(mapMercadoPagoStatus('approved'), {
    paymentStatus: 'approved',
    orderStatus: 'completed',
    restaurantPaymentStatus: 'ativo',
  })

  assert.deepEqual(mapMercadoPagoStatus('pending'), {
    paymentStatus: 'pending',
    orderStatus: 'processing',
    restaurantPaymentStatus: 'aguardando',
  })

  assert.deepEqual(mapMercadoPagoStatus('rejected'), {
    paymentStatus: 'rejected',
    orderStatus: 'cancelled',
    restaurantPaymentStatus: 'cancelado',
  })
})
