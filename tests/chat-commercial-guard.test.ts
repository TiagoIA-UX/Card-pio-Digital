import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildCanonicalPricingAndLimitsReply,
  hasCommercialHallucinationRisk,
  isPricingOrLimitQuestion,
} from '@/lib/domains/marketing/chat-commercial-guard'

test('detecta pergunta de preco e limite de produtos', () => {
  const message = 'Posso pagar 147 por mes e cadastrar quantos produtos?'
  assert.equal(isPricingOrLimitQuestion(message), true)
})

test('detecta risco de alucinacao com numero absurdo de produtos', () => {
  const reply = 'No plano de R$ 147/mes voce pode cadastrar 300000 produtos.'
  assert.equal(hasCommercialHallucinationRisk(reply), true)
})

test('resposta canonica inclui limites oficiais e bloqueio de numero absurdo', () => {
  const reply = buildCanonicalPricingAndLimitsReply()
  assert.match(reply, /Plano Basico: R\$ 147\/mes/i)
  assert.match(reply, /Nao existe plano oficial com 300000 produtos/i)
})

