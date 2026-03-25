import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  extractClientIpFromHeaders,
  isAdminRoute,
  isValidClientIp,
} from '../lib/middleware-security'

function createHeaders(values: Record<string, string>) {
  return {
    get(name: string) {
      return values[name] ?? values[name.toLowerCase()] ?? null
    },
  }
}

describe('middleware-security', () => {
  it('accepts valid IPv4 and IPv6 candidates', () => {
    assert.equal(isValidClientIp('203.0.113.42'), true)
    assert.equal(isValidClientIp('2001:db8::10'), true)
    assert.equal(isValidClientIp('::ffff:127.0.0.1'), true)
  })

  it('rejects invalid or placeholder IP candidates', () => {
    assert.equal(isValidClientIp(null), false)
    assert.equal(isValidClientIp('unknown'), false)
    assert.equal(isValidClientIp('999.1.1.1'), false)
    assert.equal(isValidClientIp('not-an-ip'), false)
  })

  it('prefers trusted proxy headers over forwarded chain', () => {
    const ip = extractClientIpFromHeaders(
      createHeaders({
        'x-forwarded-for': '198.51.100.30, 203.0.113.7',
        'x-real-ip': '203.0.113.9',
        'x-vercel-forwarded-for': '203.0.113.11',
      })
    )

    assert.equal(ip, '203.0.113.11')
  })

  it('falls back to the first valid forwarded address', () => {
    const ip = extractClientIpFromHeaders(
      createHeaders({
        'x-forwarded-for': 'unknown, 198.51.100.30:443, 203.0.113.7',
      })
    )

    assert.equal(ip, '198.51.100.30')
  })

  it('detects admin routes consistently', () => {
    assert.equal(isAdminRoute('/admin'), true)
    assert.equal(isAdminRoute('/admin/usuarios'), true)
    assert.equal(isAdminRoute('/painel/admin'), false)
  })
})
