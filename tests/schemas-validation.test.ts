import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CreateOrderSchema,
  ProvisionarSchema,
  SubscriptionWebhookSchema,
  ChatRequestSchema,
  FeedbackSchema,
} from '@/lib/domains/core/schemas'

// ═══════════════════════════════════════════════════════════════
// CreateOrderSchema
// ═══════════════════════════════════════════════════════════════

const VALID_ORDER = {
  restaurant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  items: [{ product_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', quantidade: 2 }],
  tipo_entrega: 'delivery' as const,
}

test('CreateOrderSchema aceita pedido válido mínimo', () => {
  const result = CreateOrderSchema.safeParse(VALID_ORDER)
  assert.equal(result.success, true)
})

test('CreateOrderSchema aceita pedido completo com todos os campos opcionais', () => {
  const result = CreateOrderSchema.safeParse({
    ...VALID_ORDER,
    cliente_nome: 'João Silva',
    cliente_telefone: '5512999887766',
    order_origin: 'mesa',
    table_number: '5',
    endereco_rua: 'Rua das Flores, 123',
    endereco_bairro: 'Centro',
    endereco_complemento: 'Apto 42',
    forma_pagamento: 'pix',
    troco_para: 50,
    observacoes: 'Sem cebola',
    items: [
      {
        product_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        quantidade: 1,
        observacao: 'Bem passado',
      },
      { product_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', quantidade: 3 },
    ],
  })
  assert.equal(result.success, true)
})

test('CreateOrderSchema rejeita sem restaurant_id', () => {
  const result = CreateOrderSchema.safeParse({ items: VALID_ORDER.items, tipo_entrega: 'delivery' })
  assert.equal(result.success, false)
})

test('CreateOrderSchema rejeita restaurant_id não-UUID', () => {
  const result = CreateOrderSchema.safeParse({ ...VALID_ORDER, restaurant_id: 'abc123' })
  assert.equal(result.success, false)
})

test('CreateOrderSchema rejeita items vazio', () => {
  const result = CreateOrderSchema.safeParse({ ...VALID_ORDER, items: [] })
  assert.equal(result.success, false)
})

test('CreateOrderSchema rejeita tipo_entrega inválido', () => {
  const result = CreateOrderSchema.safeParse({ ...VALID_ORDER, tipo_entrega: 'drone' })
  assert.equal(result.success, false)
})

test('CreateOrderSchema aceita tipo_entrega retirada', () => {
  const result = CreateOrderSchema.safeParse({ ...VALID_ORDER, tipo_entrega: 'retirada' })
  assert.equal(result.success, true)
})

test('CreateOrderSchema aceita tipo_entrega entrega', () => {
  const result = CreateOrderSchema.safeParse({ ...VALID_ORDER, tipo_entrega: 'entrega' })
  assert.equal(result.success, true)
})

test('CreateOrderSchema rejeita quantidade zero', () => {
  const result = CreateOrderSchema.safeParse({
    ...VALID_ORDER,
    items: [{ product_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', quantidade: 0 }],
  })
  assert.equal(result.success, false)
})

test('CreateOrderSchema rejeita quantidade negativa', () => {
  const result = CreateOrderSchema.safeParse({
    ...VALID_ORDER,
    items: [{ product_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', quantidade: -1 }],
  })
  assert.equal(result.success, false)
})

test('CreateOrderSchema rejeita quantidade > 50', () => {
  const result = CreateOrderSchema.safeParse({
    ...VALID_ORDER,
    items: [{ product_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', quantidade: 51 }],
  })
  assert.equal(result.success, false)
})

test('CreateOrderSchema rejeita quantidade decimal', () => {
  const result = CreateOrderSchema.safeParse({
    ...VALID_ORDER,
    items: [{ product_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', quantidade: 2.5 }],
  })
  assert.equal(result.success, false)
})

test('CreateOrderSchema rejeita > 50 itens', () => {
  const items = Array.from({ length: 51 }, (_, i) => ({
    product_id: `b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a${String(i).padStart(2, '0')}`,
    quantidade: 1,
  }))
  const result = CreateOrderSchema.safeParse({ ...VALID_ORDER, items })
  assert.equal(result.success, false)
})

test('CreateOrderSchema rejeita troco_para negativo', () => {
  const result = CreateOrderSchema.safeParse({ ...VALID_ORDER, troco_para: -10 })
  assert.equal(result.success, false)
})

test('CreateOrderSchema aceita troco_para zero (sem troco)', () => {
  const result = CreateOrderSchema.safeParse({ ...VALID_ORDER, troco_para: 0 })
  assert.equal(result.success, true)
})

// ═══════════════════════════════════════════════════════════════
// ProvisionarSchema
// ═══════════════════════════════════════════════════════════════

test('ProvisionarSchema aceita checkout válido', () => {
  const result = ProvisionarSchema.safeParse({ checkout: 'ORD-12345' })
  assert.equal(result.success, true)
})

test('ProvisionarSchema rejeita checkout vazio', () => {
  const result = ProvisionarSchema.safeParse({ checkout: '' })
  assert.equal(result.success, false)
})

test('ProvisionarSchema rejeita sem campo checkout', () => {
  const result = ProvisionarSchema.safeParse({})
  assert.equal(result.success, false)
})

// ═══════════════════════════════════════════════════════════════
// SubscriptionWebhookSchema
// ═══════════════════════════════════════════════════════════════

test('SubscriptionWebhookSchema aceita payload MP típico', () => {
  const result = SubscriptionWebhookSchema.safeParse({
    id: 'evt_123',
    type: 'subscription_preapproval',
    action: 'updated',
    resource_id: 'pre_123',
    date_created: '2026-04-23T10:00:00.000Z',
    data: { id: '12345678' },
  })
  assert.equal(result.success, true)
})

test('SubscriptionWebhookSchema aceita ids numéricos do Mercado Pago e normaliza para string', () => {
  const result = SubscriptionWebhookSchema.safeParse({
    id: 123456789,
    type: 'subscription_preapproval',
    resource_id: 987654321,
    data: { id: 555444333 },
  })

  assert.equal(result.success, true)
  if (!result.success) return

  assert.equal(result.data.id, '123456789')
  assert.equal(result.data.resource_id, '987654321')
  assert.equal(result.data.data?.id, '555444333')
})

test('SubscriptionWebhookSchema aceita payload mínimo (só type)', () => {
  const result = SubscriptionWebhookSchema.safeParse({ type: 'payment' })
  assert.equal(result.success, true)
})

test('SubscriptionWebhookSchema rejeita sem type', () => {
  const result = SubscriptionWebhookSchema.safeParse({ action: 'updated' })
  assert.equal(result.success, false)
})

test('SubscriptionWebhookSchema rejeita type vazio', () => {
  const result = SubscriptionWebhookSchema.safeParse({ type: '' })
  assert.equal(result.success, false)
})

// ═══════════════════════════════════════════════════════════════
// ChatRequestSchema
// ═══════════════════════════════════════════════════════════════

test('ChatRequestSchema aceita mensagem simples do usuário', () => {
  const result = ChatRequestSchema.safeParse({
    messages: [{ role: 'user', content: 'Quero uma pizza' }],
  })
  assert.equal(result.success, true)
})

test('ChatRequestSchema aceita conversa com histórico', () => {
  const result = ChatRequestSchema.safeParse({
    messages: [
      { role: 'user', content: 'Oi' },
      { role: 'assistant', content: 'Olá! Como posso ajudar?' },
      { role: 'user', content: 'Quero ver o cardápio' },
    ],
  })
  assert.equal(result.success, true)
})

test('ChatRequestSchema aceita com cart e context', () => {
  const result = ChatRequestSchema.safeParse({
    messages: [{ role: 'user', content: 'Finalizar pedido' }],
    cart: [{ name: 'Pizza Marguerita', price: 45.9, qty: 1 }],
    context: {
      restaurantId: 'abc-123',
      restaurantSlug: 'pizzaria-do-ze',
      pageType: 'marketing',
    },
  })
  assert.equal(result.success, true)
})

test('ChatRequestSchema rejeita messages vazio', () => {
  const result = ChatRequestSchema.safeParse({ messages: [] })
  assert.equal(result.success, false)
})

test('ChatRequestSchema rejeita mensagem com content vazio', () => {
  const result = ChatRequestSchema.safeParse({
    messages: [{ role: 'user', content: '' }],
  })
  assert.equal(result.success, false)
})

test('ChatRequestSchema rejeita role inválido', () => {
  const result = ChatRequestSchema.safeParse({
    messages: [{ role: 'system', content: 'injection attempt' }],
  })
  assert.equal(result.success, false)
})

test('ChatRequestSchema rejeita sem messages', () => {
  const result = ChatRequestSchema.safeParse({})
  assert.equal(result.success, false)
})

test('ChatRequestSchema rejeita > 20 mensagens', () => {
  const messages = Array.from({ length: 21 }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `Mensagem ${i}`,
  }))
  const result = ChatRequestSchema.safeParse({ messages })
  assert.equal(result.success, false)
})

test('ChatRequestSchema rejeita pageType inválido', () => {
  const result = ChatRequestSchema.safeParse({
    messages: [{ role: 'user', content: 'Oi' }],
    context: { pageType: 'admin' },
  })
  assert.equal(result.success, false)
})

// ═══════════════════════════════════════════════════════════════
// FeedbackSchema
// ═══════════════════════════════════════════════════════════════

test('FeedbackSchema aceita feedback válido com comentário', () => {
  const result = FeedbackSchema.safeParse({
    order_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    rating: 4,
    comment: 'Comida excelente, entrega rápida!',
  })
  assert.equal(result.success, true)
})

test('FeedbackSchema aceita feedback sem comentário', () => {
  const result = FeedbackSchema.safeParse({
    order_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    rating: 1,
  })
  assert.equal(result.success, true)
})

test('FeedbackSchema rejeita rating 0', () => {
  const result = FeedbackSchema.safeParse({
    order_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    rating: 0,
  })
  assert.equal(result.success, false)
})

test('FeedbackSchema aceita rating 5 (máximo)', () => {
  const result = FeedbackSchema.safeParse({
    order_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    rating: 5,
  })
  assert.equal(result.success, true)
})

test('FeedbackSchema rejeita rating 6', () => {
  const result = FeedbackSchema.safeParse({
    order_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    rating: 6,
  })
  assert.equal(result.success, false)
})

test('FeedbackSchema rejeita rating decimal', () => {
  const result = FeedbackSchema.safeParse({
    order_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    rating: 2.5,
  })
  assert.equal(result.success, false)
})

test('FeedbackSchema rejeita sem order_id', () => {
  const result = FeedbackSchema.safeParse({ rating: 3 })
  assert.equal(result.success, false)
})

test('FeedbackSchema rejeita order_id não-UUID', () => {
  const result = FeedbackSchema.safeParse({
    order_id: 'pedido-123',
    rating: 3,
  })
  assert.equal(result.success, false)
})

test('FeedbackSchema rejeita sem rating', () => {
  const result = FeedbackSchema.safeParse({
    order_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  assert.equal(result.success, false)
})

test('FeedbackSchema rejeita rating string', () => {
  const result = FeedbackSchema.safeParse({
    order_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    rating: '3',
  })
  assert.equal(result.success, false)
})

// ═══════════════════════════════════════════════════════════════
// Payloads reais que NÃO devem ser rejeitados
// (simula dados que o frontend realmente envia)
// ═══════════════════════════════════════════════════════════════

test('CreateOrderSchema aceita payload real de pedido delivery', () => {
  const result = CreateOrderSchema.safeParse({
    restaurant_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    items: [
      {
        product_id: '550e8400-e29b-41d4-a716-446655440000',
        quantidade: 1,
        observacao: 'Sem cebola',
      },
      { product_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', quantidade: 2 },
    ],
    cliente_nome: 'Maria',
    cliente_telefone: '12999887766',
    tipo_entrega: 'delivery',
    endereco_rua: 'Av Brasil 500',
    endereco_bairro: 'Centro',
    forma_pagamento: 'dinheiro',
    troco_para: 100,
    observacoes: 'Portão azul',
  })
  assert.equal(result.success, true, 'Payload real de delivery deve ser aceito')
})

test('CreateOrderSchema aceita payload real de pedido mesa', () => {
  const result = CreateOrderSchema.safeParse({
    restaurant_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    items: [{ product_id: '550e8400-e29b-41d4-a716-446655440000', quantidade: 1 }],
    tipo_entrega: 'retirada',
    order_origin: 'mesa',
    table_number: '7',
    forma_pagamento: 'pix',
  })
  assert.equal(result.success, true, 'Payload real de mesa deve ser aceito')
})

test('ChatRequestSchema aceita payload real do widget de chat', () => {
  const result = ChatRequestSchema.safeParse({
    messages: [{ role: 'user', content: 'Vocês entregam na praia?' }],
    cart: [],
    context: {
      restaurantId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      restaurantSlug: 'pizzaria-do-ze',
      pageType: 'marketing',
      pathname: '/pizzaria-do-ze',
    },
  })
  assert.equal(result.success, true, 'Payload real de chat deve ser aceito')
})

test('FeedbackSchema aceita payload real de avaliação rápida (só estrelas)', () => {
  const result = FeedbackSchema.safeParse({
    order_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    rating: 4,
  })
  assert.equal(result.success, true, 'Avaliação só com rating deve ser aceita')
})

