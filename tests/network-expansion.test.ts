import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateNetworkPrice,
  getDiscountTierLabel,
  getVolumeDiscountTiers,
} from '@/lib/domains/core/network-expansion'

test('3 filiais aplica bloco Rede com 10%', () => {
  const pricing = calculateNetworkPrice(3, 200)
  assert.equal(pricing.discountRate, 0.1)
  assert.equal(pricing.monthlyPrice, 180)
  assert.equal(getDiscountTierLabel(3), 'Rede')
})

test('5 filiais aplica bloco Rede grande com 15%', () => {
  const pricing = calculateNetworkPrice(5, 200)
  assert.equal(pricing.discountRate, 0.15)
  assert.equal(pricing.monthlyPrice, 170)
  assert.equal(getDiscountTierLabel(5), 'Rede grande')
})

test('10 filiais aplica bloco Enterprise com 20%', () => {
  const pricing = calculateNetworkPrice(10, 200)
  assert.equal(pricing.discountRate, 0.2)
  assert.equal(pricing.monthlyPrice, 160)
  assert.equal(getDiscountTierLabel(10), 'Enterprise')
})

test('20 filiais aplica bloco Franquia com 25%', () => {
  const pricing = calculateNetworkPrice(20, 200)
  assert.equal(pricing.discountRate, 0.25)
  assert.equal(pricing.monthlyPrice, 150)
  assert.equal(getDiscountTierLabel(20), 'Franquia')
})

test('4 filiais nao reaproveita desconto do bloco de 3', () => {
  const pricing = calculateNetworkPrice(4, 200)
  assert.equal(pricing.discountRate, 0)
  assert.equal(pricing.monthlyPrice, 200)
  assert.equal(getDiscountTierLabel(4), 'Padrão')
})

test('Faixas retornadas pelo helper usam blocos exatos', () => {
  assert.deepEqual(
    getVolumeDiscountTiers().map((tier) => tier.branchCount),
    [20, 10, 5, 3]
  )
})

