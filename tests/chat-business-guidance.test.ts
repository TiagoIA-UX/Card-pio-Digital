import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildBusinessTypeGuidance,
  detectBusinessTypeHint,
} from '@/lib/domains/marketing/chat-business-guidance'

test('detectBusinessTypeHint reconhece nicho digitado em uma palavra', () => {
  assert.deepEqual(detectBusinessTypeHint('acai'), {
    templateSlug: 'acai',
    businessLabel: 'açaíteria',
  })
})

test('guidance de marketing indica template correto para nicho', () => {
  const reply = buildBusinessTypeGuidance({ message: 'acai', pageType: 'marketing' })

  assert.match(reply || '', /template mais indicado/i)
  assert.match(reply || '', /Açaíteria/i)
})

test('guidance de preview corrige mismatch entre template atual e nicho', () => {
  const reply = buildBusinessTypeGuidance({
    message: 'acai',
    pageType: 'template-preview',
    currentTemplateSlug: 'minimercado',
  })

  assert.match(reply || '', /Você está vendo o template/i)
  assert.match(reply || '', /Minimercado/i)
  assert.match(reply || '', /Açaíteria/i)
})

test('guidance de checkout confirma quando o template atual é o correto', () => {
  const reply = buildBusinessTypeGuidance({
    message: 'acai',
    pageType: 'checkout',
    currentTemplateSlug: 'acai',
  })

  assert.match(reply || '', /template ideal/i)
  assert.match(reply || '', /planos/i)
})

test('guidance não sequestra perguntas genéricas com palavra de categoria', () => {
  const reply = buildBusinessTypeGuidance({
    message: 'como funciona o pagamento para vender bebidas?',
    pageType: 'checkout',
    currentTemplateSlug: 'minimercado',
  })

  assert.equal(reply, null)
})

test('guidance só ativa quando existe intenção comercial explícita em mensagem longa', () => {
  const reply = buildBusinessTypeGuidance({
    message: 'tenho uma adega e quero saber qual template faz mais sentido',
    pageType: 'marketing',
  })

  assert.match(reply || '', /template/i)
  assert.match(reply || '', /Adega/i)
})