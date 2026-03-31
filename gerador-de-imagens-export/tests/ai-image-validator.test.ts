/**
 * Testes unitários — lib/ai-image-validator.ts
 *
 * Cobre o parser de resposta do Gemini Vision (função pura, sem network).
 * A função analyzeWithGemini em si não é testada aqui pois requer API key.
 */
import test, { describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseAnalysisResponse,
  shouldRetryGeneration,
  type ImageValidationResult,
} from '@/lib/ai-image-validator'

// ── parseAnalysisResponse ─────────────────────────────────────────────────

describe('parseAnalysisResponse', () => {
  test('parseia resposta válida do Gemini Vision', () => {
    const raw = JSON.stringify({
      score: 85,
      matches_prompt: true,
      has_unwanted_text: false,
      has_visible_people: false,
      is_blurry_or_distorted: false,
      issues: [],
      suggestion: null,
    })
    const result = parseAnalysisResponse(raw)
    assert.equal(result.valid, true)
    assert.equal(result.score, 85)
    assert.deepEqual(result.issues, [])
    assert.equal(result.skipped, false)
  })

  test('marca como inválida quando score < 40', () => {
    const raw = JSON.stringify({
      score: 20,
      matches_prompt: false,
      has_unwanted_text: false,
      has_visible_people: false,
      is_blurry_or_distorted: false,
      issues: ['Conteúdo não corresponde ao prompt'],
      suggestion: 'Seja mais específico no prompt',
    })
    const result = parseAnalysisResponse(raw)
    assert.equal(result.valid, false)
    assert.equal(result.score, 20)
    assert.ok(result.suggestion)
  })

  test('adiciona issue de texto quando has_unwanted_text = true', () => {
    const raw = JSON.stringify({
      score: 55,
      matches_prompt: true,
      has_unwanted_text: true,
      has_visible_people: false,
      is_blurry_or_distorted: false,
      issues: [],
      suggestion: null,
    })
    const result = parseAnalysisResponse(raw)
    assert.ok(result.issues.some((i) => i.toLowerCase().includes('texto')))
  })

  test('adiciona issue de pessoas quando has_visible_people = true', () => {
    const raw = JSON.stringify({
      score: 70,
      matches_prompt: true,
      has_unwanted_text: false,
      has_visible_people: true,
      is_blurry_or_distorted: false,
      issues: [],
      suggestion: null,
    })
    const result = parseAnalysisResponse(raw)
    assert.ok(result.issues.some((i) => i.toLowerCase().includes('pessoa')))
  })

  test('adiciona issue de qualidade quando is_blurry_or_distorted = true', () => {
    const raw = JSON.stringify({
      score: 40,
      matches_prompt: true,
      has_unwanted_text: false,
      has_visible_people: false,
      is_blurry_or_distorted: true,
      issues: [],
      suggestion: null,
    })
    const result = parseAnalysisResponse(raw)
    assert.ok(
      result.issues.some(
        (i) => i.toLowerCase().includes('borrad') || i.toLowerCase().includes('distorcid')
      )
    )
  })

  test('score é limitado a 0–100 mesmo que API retorne fora do range', () => {
    const raw = JSON.stringify({ score: 150, issues: [], suggestion: null })
    const result = parseAnalysisResponse(raw)
    assert.ok(result.score <= 100)
  })

  test('score mínimo é 0', () => {
    const raw = JSON.stringify({ score: -10, issues: [], suggestion: null })
    const result = parseAnalysisResponse(raw)
    assert.ok(result.score >= 0)
  })

  test('retorna skipped=true para JSON inválido (não bloqueia a geração)', () => {
    const result = parseAnalysisResponse('resposta totalmente inválida')
    assert.equal(result.skipped, true)
    assert.equal(result.valid, true)  // bypass: não rejeita
  })

  test('extrai JSON mesmo quando está envolto em markdown code block', () => {
    const raw = '```json\n' + JSON.stringify({ score: 90, issues: [], suggestion: null }) + '\n```'
    const result = parseAnalysisResponse(raw)
    assert.equal(result.score, 90)
    assert.equal(result.skipped, false)
  })

  test('preserva issues existentes sem duplicar', () => {
    const raw = JSON.stringify({
      score: 60,
      matches_prompt: true,
      has_unwanted_text: true,
      has_visible_people: false,
      is_blurry_or_distorted: false,
      issues: ['Texto ou watermark indesejado visível na imagem'],
      suggestion: null,
    })
    const result = parseAnalysisResponse(raw)
    const textIssues = result.issues.filter((i) => i.toLowerCase().includes('texto'))
    assert.equal(textIssues.length, 1, 'Issue de texto não deve ser duplicada')
  })

  test('não inclui suggestion quando API retorna null', () => {
    const raw = JSON.stringify({ score: 80, issues: [], suggestion: null })
    const result = parseAnalysisResponse(raw)
    assert.equal(result.suggestion, undefined)
  })

  test('inclui suggestion quando API retorna texto', () => {
    const raw = JSON.stringify({
      score: 35,
      issues: [],
      suggestion: 'Adicione mais detalhes sobre a iluminação',
    })
    const result = parseAnalysisResponse(raw)
    assert.equal(result.suggestion, 'Adicione mais detalhes sobre a iluminação')
  })
})

// ── shouldRetryGeneration ─────────────────────────────────────────────────

describe('shouldRetryGeneration', () => {
  function makeResult(overrides: Partial<ImageValidationResult>): ImageValidationResult {
    return {
      valid: true,
      score: 80,
      issues: [],
      skipped: false,
      ...overrides,
    }
  }

  test('não faz retry se validação foi pulada (bypass)', () => {
    const result = makeResult({ skipped: true, valid: false })
    assert.equal(shouldRetryGeneration(result), false)
  })

  test('faz retry se imagem inválida (score < 40)', () => {
    const result = makeResult({ valid: false, score: 30 })
    assert.equal(shouldRetryGeneration(result), true)
  })

  test('faz retry se score muito baixo mesmo sendo "válida"', () => {
    const result = makeResult({ valid: false, score: 38 })
    assert.equal(shouldRetryGeneration(result), true)
  })

  test('faz retry se há texto/watermark indesejado (problema do provider)', () => {
    const result = makeResult({
      valid: true,
      score: 65,
      issues: ['Texto ou watermark indesejado visível na imagem'],
    })
    assert.equal(shouldRetryGeneration(result), true)
  })

  test('não faz retry para imagem boa', () => {
    const result = makeResult({ valid: true, score: 85, issues: [] })
    assert.equal(shouldRetryGeneration(result), false)
  })

  test('não faz retry para imagem com issue de pessoa (não é problema do provider)', () => {
    const result = makeResult({
      valid: true,
      score: 72,
      issues: ['Pessoas visíveis (indesejável para produto)'],
    })
    assert.equal(shouldRetryGeneration(result), false)
  })
})
