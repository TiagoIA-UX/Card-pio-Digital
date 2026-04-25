import test from 'node:test'
import assert from 'node:assert/strict'
import { formatCurrency } from '@/lib/shared/format-currency'

test('formatCurrency formata R$ 10,50', () => {
  const result = formatCurrency(10.5)
  assert.ok(result.includes('10,50'))
  assert.ok(result.includes('R$'))
})

test('formatCurrency formata zero', () => {
  const result = formatCurrency(0)
  assert.ok(result.includes('0,00'))
})

test('formatCurrency formata centavos', () => {
  const result = formatCurrency(0.99)
  assert.ok(result.includes('0,99'))
})

test('formatCurrency formata milhares', () => {
  const result = formatCurrency(1250.5)
  assert.ok(result.includes('1.250,50') || result.includes('1250,50'))
})

test('formatCurrency formata valor inteiro', () => {
  const result = formatCurrency(100)
  assert.ok(result.includes('100,00'))
})

test('formatCurrency formata negativo', () => {
  const result = formatCurrency(-15.9)
  assert.ok(result.includes('15,90'))
})

