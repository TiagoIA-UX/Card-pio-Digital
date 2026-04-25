import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildUnsubscribeToken,
  getIsoWeekKey,
  parseUnsubscribeToken,
  personalizeNewsletter,
} from '@/lib/domains/marketing/newsletter-automation'

test('getIsoWeekKey retorna chave ISO da semana', () => {
  const week = getIsoWeekKey(new Date('2026-04-11T12:00:00.000Z'))
  assert.equal(week, '2026-W15')
})

test('unsubscribe token assina e valida email', () => {
  const oldSecret = process.env.INTERNAL_API_SECRET
  process.env.INTERNAL_API_SECRET = 'segredo-teste-newsletter'

  try {
    const token = buildUnsubscribeToken('Lead@Teste.com')
    const parsed = parseUnsubscribeToken(token)
    assert.equal(parsed, 'lead@teste.com')
  } finally {
    process.env.INTERNAL_API_SECRET = oldSecret
  }
})

test('personalizeNewsletter injeta link de descadastro', () => {
  const oldSite = process.env.NEXT_PUBLIC_SITE_URL
  process.env.NEXT_PUBLIC_SITE_URL = 'https://zairyx.com.br'

  try {
    const draft = {
      title: 'Teste',
      subject: 'Assunto',
      bodyText: 'Corpo texto',
      bodyHtml: '<p>Corpo html</p>',
    }

    const result = personalizeNewsletter(
      draft,
      { name: 'Tiago Owner', email: 'tiago@zairyx.com.br' },
      'token-123'
    )

    assert.match(result.bodyText, /Cancelar inscricao/)
    assert.match(result.bodyHtml, /token-123/)
    assert.match(result.bodyText, /Ola, Tiago!/)
  } finally {
    process.env.NEXT_PUBLIC_SITE_URL = oldSite
  }
})

