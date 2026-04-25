import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CATALOG_CAPACITY_OPTIONS,
  getCatalogCapacityOption,
} from '@/lib/domains/marketing/checkout-catalog-capacity'

test('capacidade de catalogo expoe 4 opcoes oficiais', () => {
  assert.equal(CATALOG_CAPACITY_OPTIONS.length, 4)
  assert.deepEqual(
    CATALOG_CAPACITY_OPTIONS.map((option) => option.slug),
    ['semente', 'basico', 'pro', 'premium']
  )
})

test('retorna opcao escolhida por slug', () => {
  const option = getCatalogCapacityOption('premium')
  assert.equal(option.slug, 'premium')
  assert.equal(option.maxProducts, 1200)
})

