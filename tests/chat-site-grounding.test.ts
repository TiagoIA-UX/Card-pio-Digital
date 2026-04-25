import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildSiteOnlyFallbackReply,
  buildSiteOnlyGroundingPrompt,
  hasOutsideSiteClaimRisk,
} from '@/lib/domains/marketing/chat-site-grounding'

test('prompt de grounding cita pagina e restricao ao site', () => {
  const prompt = buildSiteOnlyGroundingPrompt('checkout', '/comprar/pizzaria')
  assert.match(prompt, /checkout/i)
  assert.match(prompt, /somente com informacoes presentes neste site/i)
})

test('detecta risco de resposta com fonte externa', () => {
  const reply = 'Segundo o Google, esse segmento converte 42% e vi na internet um benchmark.'
  assert.equal(hasOutsideSiteClaimRisk(reply), true)
})

test('fallback orienta limite de escopo no site', () => {
  const fallback = buildSiteOnlyFallbackReply()
  assert.match(fallback, /apenas com informacoes publicadas neste site/i)
})

