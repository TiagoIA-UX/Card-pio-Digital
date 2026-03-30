import test from 'node:test'
import assert from 'node:assert/strict'
import { GET as getPrimaryVerification } from '@/app/api/google-verification/route'
import { GET as getSecondaryVerification } from '@/app/api/google-verification-2/route'

test('google verification routes return the expected verification payloads', async () => {
  const [primary, secondary] = await Promise.all([
    getPrimaryVerification(),
    getSecondaryVerification(),
  ])

  assert.equal(primary.headers.get('Content-Type'), 'text/html; charset=utf-8')
  assert.equal(secondary.headers.get('Content-Type'), 'text/html; charset=utf-8')
  assert.equal(
    await primary.text(),
    'google-site-verification: google1a0b3e572aae5f34.html'
  )
  assert.equal(
    await secondary.text(),
    'google-site-verification: google97080e0a7b8aa4f2.html'
  )
})
