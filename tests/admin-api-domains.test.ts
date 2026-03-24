import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  ADMIN_ROUTE_REGISTRY,
  API_DOMAINS,
  ROUTES_BY_DOMAIN,
  getRouteDefinition,
} from '../lib/admin/api-domains'

const ADMIN_API_DIR = resolve(__dirname, '..', 'app', 'api', 'admin')

function listAdminRoutePaths(): string[] {
  const paths: string[] = []
  function walk(dir: string, prefix: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(join(dir, entry.name), prefix ? `${prefix}/${entry.name}` : entry.name)
      } else if (entry.name === 'route.ts') {
        paths.push(prefix)
      }
    }
  }
  walk(ADMIN_API_DIR, '')
  return paths.sort()
}

describe('admin api-domains', () => {
  it('every route file on disk has a registry entry', () => {
    const diskPaths = listAdminRoutePaths()
    const registryPaths = ADMIN_ROUTE_REGISTRY.map((r) => r.path).sort()
    const missing = diskPaths.filter((p) => !registryPaths.includes(p))
    assert.deepStrictEqual(
      missing,
      [],
      `Routes on disk without registry entry: ${missing.join(', ')}`
    )
  })

  it('every registry entry has a route file on disk', () => {
    for (const route of ADMIN_ROUTE_REGISTRY) {
      const routeFile = join(ADMIN_API_DIR, ...route.path.split('/'), 'route.ts')
      assert.ok(existsSync(routeFile), `Registry entry "${route.path}" has no file at ${routeFile}`)
    }
  })

  it('every domain has at least one route', () => {
    for (const domain of API_DOMAINS) {
      assert.ok(
        ROUTES_BY_DOMAIN[domain].length > 0,
        `Domain "${domain}" has no routes`
      )
    }
  })

  it('ROUTES_BY_DOMAIN covers all registry entries', () => {
    const domainTotal = API_DOMAINS.reduce((s, d) => s + ROUTES_BY_DOMAIN[d].length, 0)
    assert.strictEqual(domainTotal, ADMIN_ROUTE_REGISTRY.length)
  })

  it('getRouteDefinition returns the correct route', () => {
    const route = getRouteDefinition('metrics')
    assert.ok(route)
    assert.strictEqual(route.domain, 'observability')
    assert.strictEqual(route.rateLimited, true)
  })

  it('getRouteDefinition returns undefined for unknown path', () => {
    assert.strictEqual(getRouteDefinition('nonexistent'), undefined)
  })

  it('all routes have valid methods', () => {
    const validMethods = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
    for (const route of ADMIN_ROUTE_REGISTRY) {
      for (const method of route.methods) {
        assert.ok(validMethods.has(method), `Invalid method "${method}" in route "${route.path}"`)
      }
    }
  })
})
