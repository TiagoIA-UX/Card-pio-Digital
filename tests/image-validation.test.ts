import test from 'node:test'
import assert from 'node:assert/strict'
import { IMAGE_LIMITS, validateImageUrl } from '@/lib/domains/image/image-validation'

// ═══════════════════════════════════════════════════════════════
// IMAGE_LIMITS — constantes
// ═══════════════════════════════════════════════════════════════

test('IMAGE_LIMITS: max 5MB', () => {
  assert.equal(IMAGE_LIMITS.MAX_FILE_SIZE_BYTES, 5 * 1024 * 1024)
})

test('IMAGE_LIMITS: dimensão mínima 800px', () => {
  assert.equal(IMAGE_LIMITS.MIN_DIMENSION, 800)
})

test('IMAGE_LIMITS: aceita jpg, jpeg, png, webp', () => {
  assert.ok(IMAGE_LIMITS.ALLOWED_TYPES.includes('image/jpeg'))
  assert.ok(IMAGE_LIMITS.ALLOWED_TYPES.includes('image/png'))
  assert.ok(IMAGE_LIMITS.ALLOWED_TYPES.includes('image/webp'))
})

// ═══════════════════════════════════════════════════════════════
// validateImageUrl
// ═══════════════════════════════════════════════════════════════

test('URL com extensão .jpg → válida', () => {
  const result = validateImageUrl('https://cdn.example.com/photo.jpg')
  assert.equal(result.valid, true)
})

test('URL com extensão .png → válida', () => {
  const result = validateImageUrl('https://cdn.example.com/photo.png')
  assert.equal(result.valid, true)
})

test('URL com extensão .webp → válida', () => {
  const result = validateImageUrl('https://cdn.example.com/photo.webp')
  assert.equal(result.valid, true)
})

test('URL com extensão .gif → inválida', () => {
  const result = validateImageUrl('https://cdn.example.com/photo.gif')
  assert.equal(result.valid, false)
})

test('URL com extensão .svg → inválida', () => {
  const result = validateImageUrl('https://cdn.example.com/photo.svg')
  assert.equal(result.valid, false)
})

test('Unsplash URL sem extensão → válida (CDN conhecido)', () => {
  const result = validateImageUrl('https://images.unsplash.com/photo-abc123?w=800')
  assert.equal(result.valid, true)
})

test('Pexels URL → válida (CDN conhecido)', () => {
  const result = validateImageUrl('https://images.pexels.com/photos/123/pexels-photo-123')
  assert.equal(result.valid, true)
})

test('URL sem extensão e sem CDN conhecido → válida (sem ponto no path)', () => {
  const result = validateImageUrl('https://api.example.com/image/12345')
  assert.equal(result.valid, true)
})

test('URL com protocolo http → válida', () => {
  const result = validateImageUrl('http://cdn.example.com/photo.jpg')
  assert.equal(result.valid, true) // http is allowed
})

test('URL com protocolo ftp → inválida', () => {
  const result = validateImageUrl('ftp://cdn.example.com/photo.jpg')
  assert.equal(result.valid, false)
})

test('String vazia → válida (campo opcional)', () => {
  assert.equal(validateImageUrl('').valid, true)
})

test('Null/undefined-like → válida (campo opcional)', () => {
  assert.equal(validateImageUrl('   ').valid, true)
})

test('URL completamente inválida → inválida', () => {
  const result = validateImageUrl('not a url at all !!!')
  assert.equal(result.valid, false)
})

test('URL com query string preservada', () => {
  const result = validateImageUrl('https://cdn.example.com/photo.jpg?w=400&h=300')
  assert.equal(result.valid, true)
})

