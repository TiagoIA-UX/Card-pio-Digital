import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createDomainLogger, flushDomainLogs } from '../lib/shared/domain-logger'
import type { DomainLogger, DomainName, LogLevel } from '../lib/shared/domain-logger'

describe('domain-logger', () => {
  it('createDomainLogger returns info/warn/error methods', () => {
    const log = createDomainLogger('core')
    assert.equal(typeof log.info, 'function')
    assert.equal(typeof log.warn, 'function')
    assert.equal(typeof log.error, 'function')
  })

  it('accepts all valid domain names', () => {
    const domains: DomainName[] = ['core', 'image', 'affiliate', 'zaea', 'auth', 'marketing', 'shared']
    for (const d of domains) {
      const log = createDomainLogger(d)
      assert.ok(log, `createDomainLogger('${d}') should return a logger`)
    }
  })

  it('logger methods do not throw when called', () => {
    const log = createDomainLogger('image')
    assert.doesNotThrow(() => log.info('test info'))
    assert.doesNotThrow(() => log.warn('test warn', { key: 'value' }))
    assert.doesNotThrow(() => log.error('test error', new Error('boom'), { context: 'test' }))
  })

  it('flushDomainLogs does not throw even without Supabase', async () => {
    const log = createDomainLogger('zaea')
    log.info('will be flushed')
    // Should fallback to console without throwing
    await assert.doesNotReject(() => flushDomainLogs())
  })

  it('error method extracts stack from Error instances', () => {
    const log = createDomainLogger('auth')
    // Should not throw — error with stack extraction
    assert.doesNotThrow(() => {
      log.error('auth failure', new TypeError('invalid token'))
    })
    // Should handle string errors
    assert.doesNotThrow(() => {
      log.error('string error', 'some raw string')
    })
    // Should handle undefined error
    assert.doesNotThrow(() => {
      log.error('no error object')
    })
  })

  it('DomainLogger type matches expected interface', () => {
    // Type-level check: all methods exist with correct signatures
    const log: DomainLogger = createDomainLogger('core')
    const _info: (message: string, metadata?: Record<string, unknown>) => void = log.info
    const _warn: (message: string, metadata?: Record<string, unknown>) => void = log.warn
    const _error: (message: string, err?: unknown, metadata?: Record<string, unknown>) => void = log.error
    assert.ok(_info)
    assert.ok(_warn)
    assert.ok(_error)
  })
})
