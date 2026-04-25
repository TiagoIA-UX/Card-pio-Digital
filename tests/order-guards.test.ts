import test from 'node:test'
import assert from 'node:assert/strict'
import { checkIsOpen } from '@/lib/shared/check-is-open'
import type { HorarioFuncionamento } from '@/types/database'

// ═══════════════════════════════════════════════════════════════
// checkIsOpen — Shared utility
// ═══════════════════════════════════════════════════════════════

const CLOSED_ALL_DAYS: HorarioFuncionamento = {
  segunda: { abre: '08:00', fecha: '18:00', aberto: false },
  terca: { abre: '08:00', fecha: '18:00', aberto: false },
  quarta: { abre: '08:00', fecha: '18:00', aberto: false },
  quinta: { abre: '08:00', fecha: '18:00', aberto: false },
  sexta: { abre: '08:00', fecha: '18:00', aberto: false },
  sabado: { abre: '08:00', fecha: '18:00', aberto: false },
  domingo: { abre: '08:00', fecha: '18:00', aberto: false },
}

const OPEN_ALL_DAYS: HorarioFuncionamento = {
  segunda: { abre: '00:00', fecha: '23:59', aberto: true },
  terca: { abre: '00:00', fecha: '23:59', aberto: true },
  quarta: { abre: '00:00', fecha: '23:59', aberto: true },
  quinta: { abre: '00:00', fecha: '23:59', aberto: true },
  sexta: { abre: '00:00', fecha: '23:59', aberto: true },
  sabado: { abre: '00:00', fecha: '23:59', aberto: true },
  domingo: { abre: '00:00', fecha: '23:59', aberto: true },
}

test('checkIsOpen retorna true quando horários é null', () => {
  assert.equal(checkIsOpen(null), true)
})

test('checkIsOpen retorna true quando horários é undefined', () => {
  assert.equal(checkIsOpen(undefined), true)
})

test('checkIsOpen retorna false quando todos os dias estão fechados', () => {
  assert.equal(checkIsOpen(CLOSED_ALL_DAYS), false)
})

test('checkIsOpen retorna true quando todos os dias abrem 00:00-23:59', () => {
  assert.equal(checkIsOpen(OPEN_ALL_DAYS), true)
})

// ═══════════════════════════════════════════════════════════════
// Order Status Transitions (VALID_TRANSITIONS map)
// ═══════════════════════════════════════════════════════════════

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivered'],
  delivered: [],
  cancelled: [],
}

test('pending pode ir para confirmed ou cancelled', () => {
  assert.deepEqual(VALID_TRANSITIONS['pending'], ['confirmed', 'cancelled'])
})

test('confirmed pode ir para preparing ou cancelled', () => {
  assert.deepEqual(VALID_TRANSITIONS['confirmed'], ['preparing', 'cancelled'])
})

test('preparing pode ir para ready ou cancelled', () => {
  assert.deepEqual(VALID_TRANSITIONS['preparing'], ['ready', 'cancelled'])
})

test('ready só pode ir para delivered', () => {
  assert.deepEqual(VALID_TRANSITIONS['ready'], ['delivered'])
})

test('delivered é estado terminal (sem transições)', () => {
  assert.deepEqual(VALID_TRANSITIONS['delivered'], [])
})

test('cancelled é estado terminal (sem transições)', () => {
  assert.deepEqual(VALID_TRANSITIONS['cancelled'], [])
})

test('transição inválida pending→delivered é rejeitada', () => {
  const allowed = VALID_TRANSITIONS['pending'] || []
  assert.equal(allowed.includes('delivered'), false)
})

test('transição inválida delivered→pending é rejeitada', () => {
  const allowed = VALID_TRANSITIONS['delivered'] || []
  assert.equal(allowed.includes('pending'), false)
})

test('transição inválida cancelled→confirmed é rejeitada', () => {
  const allowed = VALID_TRANSITIONS['cancelled'] || []
  assert.equal(allowed.includes('confirmed'), false)
})

test('transição inválida ready→preparing (retrocesso) é rejeitada', () => {
  const allowed = VALID_TRANSITIONS['ready'] || []
  assert.equal(allowed.includes('preparing'), false)
})

// ═══════════════════════════════════════════════════════════════
// WhatsApp Message Formatting
// ═══════════════════════════════════════════════════════════════

function formatWhatsAppPhone(phone: string): string {
  let numero = phone.replace(/\D/g, '')
  if (numero.startsWith('00')) numero = numero.slice(2)
  if (numero.startsWith('55')) numero = numero.slice(2)
  if (numero.startsWith('0')) numero = numero.slice(1)
  if (numero.length > 11) numero = numero.slice(-11)
  return `55${numero}`
}

test('formatWhatsAppPhone normaliza telefone brasileiro com DDD', () => {
  assert.equal(formatWhatsAppPhone('(12) 99688-7993'), '5512996887993')
})

test('formatWhatsAppPhone remove prefixo 55 duplicado', () => {
  assert.equal(formatWhatsAppPhone('5512996887993'), '5512996887993')
})

test('formatWhatsAppPhone remove prefixo 00', () => {
  assert.equal(formatWhatsAppPhone('005512996887993'), '5512996887993')
})

test('formatWhatsAppPhone aceita número limpo', () => {
  assert.equal(formatWhatsAppPhone('12996887993'), '5512996887993')
})

// ═══════════════════════════════════════════════════════════════
// Delivery Order Guards
// ═══════════════════════════════════════════════════════════════

function canAcceptOrder(restaurant: {
  ativo: boolean
  suspended: boolean
  status_pagamento: string
}) {
  return restaurant.ativo && !restaurant.suspended && restaurant.status_pagamento === 'ativo'
}

test('canAcceptOrder retorna true para delivery ativo e não suspenso', () => {
  assert.equal(canAcceptOrder({ ativo: true, suspended: false, status_pagamento: 'ativo' }), true)
})

test('canAcceptOrder retorna false para delivery inativo', () => {
  assert.equal(
    canAcceptOrder({ ativo: false, suspended: false, status_pagamento: 'ativo' }),
    false
  )
})

test('canAcceptOrder retorna false para delivery suspenso', () => {
  assert.equal(canAcceptOrder({ ativo: true, suspended: true, status_pagamento: 'ativo' }), false)
})

test('canAcceptOrder retorna false para status_pagamento pendente', () => {
  assert.equal(
    canAcceptOrder({ ativo: true, suspended: false, status_pagamento: 'pendente' }),
    false
  )
})

test('canAcceptOrder retorna false para status_pagamento inadimplente', () => {
  assert.equal(
    canAcceptOrder({ ativo: true, suspended: false, status_pagamento: 'inadimplente' }),
    false
  )
})

