import test from 'node:test'
import assert from 'node:assert/strict'
import { RATE_LIMITS, getRateLimitIdentifier } from '@/lib/shared/rate-limit'

// ═══════════════════════════════════════════════════════════════
// RATE_LIMITS — presets coerentes
// ═══════════════════════════════════════════════════════════════

test('RATE_LIMITS contém todos os perfis esperados', () => {
  const keys = Object.keys(RATE_LIMITS)
  assert.ok(keys.includes('public'))
  assert.ok(keys.includes('auth'))
  assert.ok(keys.includes('checkout'))
  assert.ok(keys.includes('webhook'))
  assert.ok(keys.includes('cart'))
  assert.ok(keys.includes('chat'))
  assert.ok(keys.includes('admin'))
})

test('Auth tem limite mais restritivo que público', () => {
  assert.ok(RATE_LIMITS.auth.limit < RATE_LIMITS.public.limit)
})

test('Webhook tem limite mais alto (volume de eventos)', () => {
  assert.ok(RATE_LIMITS.webhook.limit > RATE_LIMITS.public.limit)
})

test('Chat protege créditos Groq com limite baixo', () => {
  assert.ok(RATE_LIMITS.chat.limit <= 10)
})

test('Todos os limits são inteiros positivos', () => {
  for (const [, cfg] of Object.entries(RATE_LIMITS)) {
    assert.ok(Number.isInteger(cfg.limit) && cfg.limit > 0, `limit deve ser inteiro positivo`)
    assert.ok(
      Number.isInteger(cfg.windowMs) && cfg.windowMs > 0,
      `windowMs deve ser inteiro positivo`
    )
  }
})

// ═══════════════════════════════════════════════════════════════
// getRateLimitIdentifier
// ═══════════════════════════════════════════════════════════════

test('getRateLimitIdentifier prefere userId quando fornecido', () => {
  const req = new Request('https://example.com', {
    headers: { 'x-forwarded-for': '1.2.3.4' },
  })
  const id = getRateLimitIdentifier(req, 'user-abc')
  assert.equal(id, 'user:user-abc')
})

test('getRateLimitIdentifier usa IP quando sem userId', () => {
  const req = new Request('https://example.com', {
    headers: { 'x-forwarded-for': '10.20.30.40' },
  })
  const id = getRateLimitIdentifier(req)
  assert.ok(id.includes('10.20.30.40'))
})

test('getRateLimitIdentifier retorna algo mesmo sem headers', () => {
  const req = new Request('https://example.com')
  const id = getRateLimitIdentifier(req)
  assert.ok(typeof id === 'string' && id.length > 0)
})

