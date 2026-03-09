import test from 'node:test'
import assert from 'node:assert/strict'
import { buildRestaurantInstallation, getOnboardingPrice } from '@/lib/restaurant-onboarding'
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
    'Monte tigelas e complementos sem travar o pedido.'
  )
  assert.ok(installation.sampleProducts.length >= 3)
})

test('template demo data reuses the real cardapio renderer shape', () => {
  const demo = buildTemplateDemoData('restaurante')

  assert.equal(demo.restaurant.template_slug, 'restaurante')
  assert.equal(demo.restaurant.slug, 'demo-restaurante')
  assert.ok(demo.products.every((product) => product.restaurant_id === demo.restaurant.id))
})

test('onboarding prices are deterministic for each plan and payment method', () => {
  assert.equal(getOnboardingPrice('self-service', 'pix'), 247)
  assert.equal(getOnboardingPrice('self-service', 'card'), 297)
  assert.equal(getOnboardingPrice('feito-pra-voce', 'pix'), 497)
  assert.equal(getOnboardingPrice('feito-pra-voce', 'card'), 597)
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
