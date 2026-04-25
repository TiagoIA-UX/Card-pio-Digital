import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildSeoPracticalChecklistReply,
  isSeoGuidanceRequest,
} from '@/lib/domains/marketing/chat-seo-guidance'

test('detecta pedido SEO por sinais fortes', () => {
  const message =
    'Quero checklist de SEO com Core Web Vitals, EEAT, backlinks, sitemap e robots.txt para aumentar CTR.'

  assert.equal(isSeoGuidanceRequest(message), true)
})

test('nao marca mensagem comum como SEO', () => {
  const message = 'Qual o tempo de entrega e pedido minimo?'
  assert.equal(isSeoGuidanceRequest(message), false)
})

test('resposta de SEO inclui checklist e regra de integridade', () => {
  const reply = buildSeoPracticalChecklistReply()

  assert.match(reply, /Checklist pratico/i)
  assert.match(reply, /Core Web Vitals/i)
  assert.match(reply, /Regra de integridade/i)
})

