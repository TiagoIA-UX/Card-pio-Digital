import test from 'node:test'
import assert from 'node:assert/strict'
import { POST as legacyTemplateWebhook } from '@/app/api/webhook/templates/route'

test('legacy templates webhook is disabled', async () => {
  const response = await legacyTemplateWebhook(
    new Request('https://example.com/api/webhook/templates', { method: 'POST' }) as any
  )
  const body = await response.json()

  assert.equal(response.status, 410)
  assert.match(body.error, /desativado|legado|saas/i)
})
