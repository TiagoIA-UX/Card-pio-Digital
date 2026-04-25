import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveChatPageContext } from '@/lib/domains/marketing/chat-page-context'
import {
  buildCheckoutAssistantSystemPrompt,
  buildMarketingAssistantSystemPrompt,
  buildTemplatePreviewAssistantSystemPrompt,
} from '@/lib/domains/core/delivery-assistant'

test('resolveChatPageContext detecta preview de template com slug', () => {
  assert.deepEqual(resolveChatPageContext('/templates/minimercado'), {
    pageType: 'template-preview',
    templateSlug: 'minimercado',
    pathname: '/templates/minimercado',
  })
})

test('resolveChatPageContext detecta checkout com slug', () => {
  assert.deepEqual(resolveChatPageContext('/comprar/acai'), {
    pageType: 'checkout',
    templateSlug: 'acai',
    pathname: '/comprar/acai',
  })
})

test('resolveChatPageContext detecta delivery real por slug', () => {
  assert.deepEqual(resolveChatPageContext('/r/loja-do-bairro'), {
    pageType: 'delivery',
    restaurantSlug: 'loja-do-bairro',
    pathname: '/r/loja-do-bairro',
  })
})

test('prompt de marketing não se comporta como cardápio', () => {
  const prompt = buildMarketingAssistantSystemPrompt()

  assert.match(prompt, /Não aja como atendente de cardápio/i)
  assert.match(prompt, /Se a pessoa disser o tipo de negócio/i)
})

test('prompt de preview cita o template atual', () => {
  const prompt = buildTemplatePreviewAssistantSystemPrompt({ templateSlug: 'minimercado' })

  assert.match(prompt, /template minimercado/i)
  assert.match(prompt, /Não aja como atendente de um cardápio real/i)
})

test('prompt de checkout assume papel de fechamento', () => {
  const prompt = buildCheckoutAssistantSystemPrompt({ templateSlug: 'acai' })

  assert.match(prompt, /página de compra/i)
  assert.match(prompt, /Não aja como atendente de cardápio/i)
})
