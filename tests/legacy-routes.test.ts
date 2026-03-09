import test from 'node:test'
import assert from 'node:assert/strict'
import { POST as createLegacyCheckout } from '@/app/api/pagamento/criar/route'
import { POST as createLegacyPackageCheckout } from '@/app/api/pagamento/criar-pacote/route'
import { POST as createLegacyTemplateSession } from '@/app/api/checkout/criar-sessao/route'
import { POST as legacyTemplateWebhook } from '@/app/api/webhook/templates/route'

test('legacy package checkout route is disabled', async () => {
  const response = await createLegacyPackageCheckout()
  const body = await response.json()

  assert.equal(response.status, 410)
  assert.match(body.error, /desativado/i)
})

test('legacy unitary checkout session route is disabled', async () => {
  const response = await createLegacyTemplateSession()
  const body = await response.json()

  assert.equal(response.status, 410)
  assert.match(body.error, /desativado/i)
})

test('legacy payment creation route is disabled', async () => {
  const response = await createLegacyCheckout()
  const body = await response.json()

  assert.equal(response.status, 410)
  assert.match(body.error, /desativado/i)
})

test('legacy templates webhook is disabled', async () => {
  const response = await legacyTemplateWebhook(
    new Request('https://example.com/api/webhook/templates', { method: 'POST' }) as any
  )
  const body = await response.json()

  assert.equal(response.status, 410)
  assert.match(body.error, /desativado|legado|saas/i)
})
