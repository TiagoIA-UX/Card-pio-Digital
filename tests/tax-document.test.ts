import test from 'node:test'
import assert from 'node:assert/strict'
import {
  detectTaxDocumentType,
  formatTaxDocument,
  isValidTaxDocument,
  normalizeTaxDocument,
  normalizeValidatedTaxDocument,
} from '@/lib/domains/core/tax-document'

test('tax document helpers normalize and detect cpf/cnpj correctly', () => {
  assert.equal(normalizeTaxDocument(' 123.456.789-09 '), '12345678909')
  assert.equal(detectTaxDocumentType('123.456.789-09'), 'cpf')
  assert.equal(detectTaxDocumentType('61.699.939/0001-80'), 'cnpj')
})

test('tax document helpers validate real cpf/cnpj checksums', () => {
  assert.equal(isValidTaxDocument('529.982.247-25'), true)
  assert.equal(isValidTaxDocument('61.699.939/0001-80'), true)
  assert.equal(isValidTaxDocument('111.111.111-11'), false)
  assert.equal(isValidTaxDocument('61.699.939/0001-81'), false)
})

test('tax document helpers format and normalize only validated values', () => {
  assert.equal(formatTaxDocument('52998224725'), '529.982.247-25')
  assert.equal(formatTaxDocument('61699939000180'), '61.699.939/0001-80')
  assert.equal(normalizeValidatedTaxDocument('61.699.939/0001-80'), '61699939000180')
  assert.equal(normalizeValidatedTaxDocument('61.699.939/0001-81'), null)
})
