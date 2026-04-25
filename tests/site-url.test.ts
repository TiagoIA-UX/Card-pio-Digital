import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { getRequestSiteUrl, getSiteUrl } from '@/lib/shared/site-url'
import { proxy } from '@/proxy'

test('site-url falls back to zairyx.com.br when no runtime env is available', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const originalProdUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  const originalVercelUrl = process.env.VERCEL_URL

  delete process.env.NEXT_PUBLIC_SITE_URL
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL
  delete process.env.VERCEL_URL

  try {
    assert.equal(getSiteUrl(), 'https://zairyx.com.br')
  } finally {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl
    process.env.VERCEL_PROJECT_PRODUCTION_URL = originalProdUrl
    process.env.VERCEL_URL = originalVercelUrl
  }
})

test('request site-url respects forwarded host for canonical runtime resolution', () => {
  const request = new Request('https://internal.vercel.app/login', {
    headers: {
      'x-forwarded-host': 'zairyx.com.br',
      'x-forwarded-proto': 'https',
    },
  })

  assert.equal(getRequestSiteUrl(request), 'https://zairyx.com.br')
})

test('proxy redirects legacy hosts to the canonical zairyx.com.br domain', async () => {
  const request = new NextRequest('https://preview.vercel.app/precos?ref=abc', {
    headers: {
      'x-forwarded-host': 'www.zairyx.com.br',
      'x-forwarded-proto': 'https',
    },
  })
  const response = await proxy(request)

  assert.equal(response.status, 308)
  assert.equal(response.headers.get('location'), 'https://zairyx.com.br/precos?ref=abc')
})

