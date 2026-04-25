import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildQuickOrderMessage,
  getQuickOrderWhatsAppUrl,
  getWhatsAppUrl,
  openWhatsApp,
} from '@/lib/domains/core/whatsapp'

function withFakeBrowserEnvironment(
  run: (ctx: { assignedUrls: string[]; runTimer: () => void }) => void
) {
  const originalWindow = globalThis.window
  const originalDocument = globalThis.document

  const assignedUrls: string[] = []
  let timerCallback: (() => void) | null = null
  let timerCleared = false

  const fakeDocument = {
    visibilityState: 'visible',
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as Document

  const fakeWindow = {
    location: {
      assign: (url: string | URL) => {
        assignedUrls.push(String(url))
      },
    },
    setTimeout: (callback: TimerHandler, delay?: number) => {
      assert.equal(delay, 1800)
      timerCallback = callback as () => void
      return 1
    },
    clearTimeout: (_id: number) => {
      timerCleared = true
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as Window & typeof globalThis

  Object.assign(globalThis, {
    window: fakeWindow,
    document: fakeDocument,
  })

  try {
    run({
      assignedUrls,
      runTimer: () => {
        assert.ok(timerCallback)
        if (!timerCleared) {
          timerCallback()
        }
      },
    })
  } finally {
    Object.assign(globalThis, {
      window: originalWindow,
      document: originalDocument,
    })
  }
}

test('buildQuickOrderMessage soma itens e inclui total formatado', () => {
  const message = buildQuickOrderMessage([
    { nome: 'Pizza Calabresa', preco: 49.9, quantidade: 2 },
    { nome: 'Refrigerante 2L', preco: 12 },
  ])

  assert.match(message, /1\. 2x Pizza Calabresa - R\$\s?99,80/)
  assert.match(message, /2\. 1x Refrigerante 2L - R\$\s?12,00/)
  assert.match(message, /\*Total:\* R\$\s?111,80/)
})

test('getWhatsAppUrl e alias legado usam wa.me com telefone normalizado', () => {
  const message = 'Olá delivery'

  assert.equal(
    getWhatsAppUrl('(11) 99887-7766', message),
    'https://wa.me/5511998877766?text=Ol%C3%A1%20delivery'
  )
  assert.equal(
    getQuickOrderWhatsAppUrl('11998877766', message),
    'https://wa.me/5511998877766?text=Ol%C3%A1%20delivery'
  )
})

test('openWhatsApp falha explicitamente sem telefone configurado', () => {
  assert.throws(() => openWhatsApp('', 'teste'), /Este restaurante não configurou o WhatsApp\./)
})

test('openWhatsApp tenta app nativo primeiro e cai para wa.me no fallback', () => {
  withFakeBrowserEnvironment(({ assignedUrls, runTimer }) => {
    openWhatsApp('(11) 99887-7766', 'Olá delivery')

    assert.equal(assignedUrls[0], 'whatsapp://send?phone=5511998877766&text=Ol%C3%A1%20delivery')

    runTimer()

    assert.equal(assignedUrls[1], 'https://wa.me/5511998877766?text=Ol%C3%A1%20delivery')
  })
})

