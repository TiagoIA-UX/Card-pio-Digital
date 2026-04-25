import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildNfcePayload,
  validateNfceFiscalConfig,
  validateNfceOrderItems,
  type NfceOrderData,
  type NfceOrderItem,
  type NfceFiscalConfig,
} from '@/lib/domains/core/nfce-payload'

// ── Fixtures ─────────────────────────────────────────

const VALID_ORDER: NfceOrderData = {
  id: 'order-uuid-123',
  restaurant_id: 'rest-uuid-456',
  numero_pedido: 42,
  total: 89.9,
  forma_pagamento: 'pix',
  cliente_nome: 'João Silva',
}

const VALID_ITEMS: NfceOrderItem[] = [
  { nome_snapshot: 'Pizza Calabresa G', preco_snapshot: 45.0, quantidade: 1 },
  { nome_snapshot: 'Refrigerante 2L', preco_snapshot: 12.0, quantidade: 2 },
]

const VALID_FISCAL: NfceFiscalConfig = {
  cnpj: '12345678000190',
  razao_social: 'Pizzaria Exemplo LTDA',
  nome_fantasia: 'Pizzaria Exemplo',
  inscricao_estadual: '123456789',
  regime_tributario: 1,
  logradouro: 'Rua das Pizzas',
  numero: '100',
  bairro: 'Centro',
  municipio: 'São Paulo',
  codigo_municipio: '3550308',
  uf: 'SP',
  cep: '01001000',
  ncm_padrao: '21069090',
  cfop_padrao: '5102',
  csosn_padrao: '102',
  ambiente: 'homologacao',
  serie_nfce: 1,
  certificado_senha_encrypted: 'senhaSegura123',
}

const CERT_BASE64 = 'dGVzdC1jZXJ0aWZpY2F0ZQ==' // "test-certificate" em base64

// ── buildNfcePayload ────────────────────────────────

test('buildNfcePayload gera payload completo com dados corretos', () => {
  const payload = buildNfcePayload(VALID_ORDER, VALID_ITEMS, VALID_FISCAL, CERT_BASE64, 1)

  assert.equal(payload.restaurant_id, 'rest-uuid-456')
  assert.equal(payload.order_id, 'order-uuid-123')
  assert.equal(payload.numero_pedido, 42)
  assert.equal(payload.valor_total, 89.9)
  assert.equal(payload.forma_pagamento, 'pix')
  assert.equal(payload.numero_nfce, 1)
  assert.equal(payload.serie, 1)
  assert.equal(payload.ambiente, 'homologacao')
  assert.equal(payload.certificado_base64, CERT_BASE64)
  assert.equal(payload.certificado_senha, 'senhaSegura123')
})

test('buildNfcePayload mapeia emitente corretamente', () => {
  const payload = buildNfcePayload(VALID_ORDER, VALID_ITEMS, VALID_FISCAL, CERT_BASE64, 1)

  assert.equal(payload.emitente.cnpj, '12345678000190')
  assert.equal(payload.emitente.razao_social, 'Pizzaria Exemplo LTDA')
  assert.equal(payload.emitente.nome_fantasia, 'Pizzaria Exemplo')
  assert.equal(payload.emitente.inscricao_estadual, '123456789')
  assert.equal(payload.emitente.regime_tributario, 1)
  assert.equal(payload.emitente.uf, 'SP')
  assert.equal(payload.emitente.cep, '01001000')
})

test('buildNfcePayload usa razao_social como fallback para nome_fantasia', () => {
  const fiscal = { ...VALID_FISCAL, nome_fantasia: null }
  const payload = buildNfcePayload(VALID_ORDER, VALID_ITEMS, fiscal, CERT_BASE64, 1)

  assert.equal(payload.emitente.nome_fantasia, 'Pizzaria Exemplo LTDA')
})

test('buildNfcePayload mapeia itens com NCM/CFOP/CSOSN corretos', () => {
  const payload = buildNfcePayload(VALID_ORDER, VALID_ITEMS, VALID_FISCAL, CERT_BASE64, 1)

  assert.equal(payload.itens.length, 2)
  assert.equal(payload.itens[0].nome, 'Pizza Calabresa G')
  assert.equal(payload.itens[0].ncm, '21069090')
  assert.equal(payload.itens[0].cfop, '5102')
  assert.equal(payload.itens[0].unidade, 'UN')
  assert.equal(payload.itens[0].quantidade, 1)
  assert.equal(payload.itens[0].valor_unitario, 45.0)
  assert.equal(payload.itens[0].csosn, '102')

  assert.equal(payload.itens[1].nome, 'Refrigerante 2L')
  assert.equal(payload.itens[1].quantidade, 2)
  assert.equal(payload.itens[1].valor_unitario, 12.0)
})

test('buildNfcePayload usa defaults quando config fiscal tem valores nulos', () => {
  const fiscal = {
    ...VALID_FISCAL,
    ncm_padrao: null,
    cfop_padrao: null,
    csosn_padrao: null,
    ambiente: null,
    serie_nfce: null,
    certificado_senha_encrypted: null,
  }
  const payload = buildNfcePayload(VALID_ORDER, VALID_ITEMS, fiscal, CERT_BASE64, 5)

  assert.equal(payload.itens[0].ncm, '21069090')
  assert.equal(payload.itens[0].cfop, '5102')
  assert.equal(payload.itens[0].csosn, '102')
  assert.equal(payload.ambiente, 'homologacao')
  assert.equal(payload.serie, 1)
  assert.equal(payload.certificado_senha, '')
  assert.equal(payload.numero_nfce, 5)
})

test('buildNfcePayload usa pix como default quando forma_pagamento é nula', () => {
  const order = { ...VALID_ORDER, forma_pagamento: null }
  const payload = buildNfcePayload(order, VALID_ITEMS, VALID_FISCAL, CERT_BASE64, 1)

  assert.equal(payload.forma_pagamento, 'pix')
})

test('buildNfcePayload omite nome do consumidor quando nulo', () => {
  const order = { ...VALID_ORDER, cliente_nome: null }
  const payload = buildNfcePayload(order, VALID_ITEMS, VALID_FISCAL, CERT_BASE64, 1)

  assert.equal(payload.consumidor.nome, undefined)
})

// ── validateNfceFiscalConfig ────────────────────────

test('validateNfceFiscalConfig retorna array vazio para config válida', () => {
  const errors = validateNfceFiscalConfig(VALID_FISCAL)
  assert.equal(errors.length, 0)
})

test('validateNfceFiscalConfig detecta CNPJ inválido', () => {
  const fiscal = { ...VALID_FISCAL, cnpj: '123' }
  const errors = validateNfceFiscalConfig(fiscal)
  assert.ok(errors.some((e) => e.includes('CNPJ')))
})

test('validateNfceFiscalConfig detecta CNPJ vazio', () => {
  const fiscal = { ...VALID_FISCAL, cnpj: '' }
  const errors = validateNfceFiscalConfig(fiscal)
  assert.ok(errors.some((e) => e.includes('CNPJ')))
})

test('validateNfceFiscalConfig detecta razão social faltando', () => {
  const fiscal = { ...VALID_FISCAL, razao_social: '' }
  const errors = validateNfceFiscalConfig(fiscal)
  assert.ok(errors.some((e) => e.includes('Razão social')))
})

test('validateNfceFiscalConfig detecta IE faltando', () => {
  const fiscal = { ...VALID_FISCAL, inscricao_estadual: '' }
  const errors = validateNfceFiscalConfig(fiscal)
  assert.ok(errors.some((e) => e.includes('Inscrição estadual')))
})

test('validateNfceFiscalConfig detecta regime tributário inválido', () => {
  const fiscal = { ...VALID_FISCAL, regime_tributario: 5 }
  const errors = validateNfceFiscalConfig(fiscal)
  assert.ok(errors.some((e) => e.includes('Regime tributário')))
})

test('validateNfceFiscalConfig detecta UF inválido', () => {
  const fiscal = { ...VALID_FISCAL, uf: 'SPP' }
  const errors = validateNfceFiscalConfig(fiscal)
  assert.ok(errors.some((e) => e.includes('UF')))
})

test('validateNfceFiscalConfig detecta CEP inválido', () => {
  const fiscal = { ...VALID_FISCAL, cep: '1234' }
  const errors = validateNfceFiscalConfig(fiscal)
  assert.ok(errors.some((e) => e.includes('CEP')))
})

test('validateNfceFiscalConfig detecta código IBGE inválido', () => {
  const fiscal = { ...VALID_FISCAL, codigo_municipio: '123' }
  const errors = validateNfceFiscalConfig(fiscal)
  assert.ok(errors.some((e) => e.includes('IBGE')))
})

test('validateNfceFiscalConfig detecta campos de endereço vazios', () => {
  const fiscal = { ...VALID_FISCAL, logradouro: '', bairro: '', municipio: '' }
  const errors = validateNfceFiscalConfig(fiscal)
  assert.ok(errors.some((e) => e.includes('Logradouro')))
  assert.ok(errors.some((e) => e.includes('Bairro')))
  assert.ok(errors.some((e) => e.includes('Município')))
})

test('validateNfceFiscalConfig detecta múltiplos erros simultaneamente', () => {
  const fiscal = { ...VALID_FISCAL, cnpj: '', razao_social: '', uf: '', cep: '' }
  const errors = validateNfceFiscalConfig(fiscal)
  assert.ok(errors.length >= 4)
})

// ── validateNfceOrderItems ──────────────────────────

test('validateNfceOrderItems retorna vazio para itens válidos', () => {
  const errors = validateNfceOrderItems(VALID_ITEMS)
  assert.equal(errors.length, 0)
})

test('validateNfceOrderItems detecta lista vazia', () => {
  const errors = validateNfceOrderItems([])
  assert.ok(errors.some((e) => e.includes('sem itens')))
})

test('validateNfceOrderItems detecta preço zero ou negativo', () => {
  const items = [{ nome_snapshot: 'Pizza', preco_snapshot: 0, quantidade: 1 }]
  const errors = validateNfceOrderItems(items)
  assert.ok(errors.some((e) => e.includes('preço')))
})

test('validateNfceOrderItems detecta quantidade zero ou negativa', () => {
  const items = [{ nome_snapshot: 'Pizza', preco_snapshot: 30, quantidade: -1 }]
  const errors = validateNfceOrderItems(items)
  assert.ok(errors.some((e) => e.includes('quantidade')))
})

test('validateNfceOrderItems detecta nome vazio', () => {
  const items = [{ nome_snapshot: '', preco_snapshot: 30, quantidade: 1 }]
  const errors = validateNfceOrderItems(items)
  assert.ok(errors.some((e) => e.includes('nome')))
})

test('validateNfceOrderItems indica item correto no erro', () => {
  const items = [
    { nome_snapshot: 'Pizza', preco_snapshot: 30, quantidade: 1 },
    { nome_snapshot: '', preco_snapshot: -5, quantidade: 0 },
  ]
  const errors = validateNfceOrderItems(items)
  assert.ok(errors.every((e) => e.includes('Item 2')))
})

