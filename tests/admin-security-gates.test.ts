import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { ADMIN_ROUTE_REGISTRY } from '../lib/admin/api-domains'

const ADMIN_API_DIR = resolve(__dirname, '..', 'app', 'api', 'admin')

function readRouteSource(routePath: string): string {
  const filePath = join(ADMIN_API_DIR, ...routePath.split('/'), 'route.ts')
  return readFileSync(filePath, 'utf-8')
}

describe('admin security gates', () => {
  it('every admin route calls requireAdmin()', () => {
    const missing: string[] = []
    for (const route of ADMIN_ROUTE_REGISTRY) {
      const src = readRouteSource(route.path)
      if (!src.includes('requireAdmin')) {
        missing.push(route.path)
      }
    }
    assert.deepStrictEqual(
      missing,
      [],
      `Routes missing requireAdmin: ${missing.join(', ')}`
    )
  })

  it('every admin route imports from admin-auth', () => {
    const missing: string[] = []
    for (const route of ADMIN_ROUTE_REGISTRY) {
      const src = readRouteSource(route.path)
      if (!src.includes('admin-auth')) {
        missing.push(route.path)
      }
    }
    assert.deepStrictEqual(
      missing,
      [],
      `Routes not importing admin-auth: ${missing.join(', ')}`
    )
  })

  it('routes marked rateLimited actually use withRateLimit', () => {
    const missing: string[] = []
    for (const route of ADMIN_ROUTE_REGISTRY) {
      if (!route.rateLimited) continue
      const src = readRouteSource(route.path)
      if (!src.includes('withRateLimit') && !src.includes('checkRateLimit')) {
        missing.push(route.path)
      }
    }
    assert.deepStrictEqual(
      missing,
      [],
      `Routes marked rateLimited but missing withRateLimit: ${missing.join(', ')}`
    )
  })

  it('every POST/DELETE route validates request body or has explicit action pattern', () => {
    // Rotas que são triggers (POST sem body) — apenas executam uma ação
    const bodylessActions = new Set(['provisionar-pendentes'])

    const suspect: string[] = []
    for (const route of ADMIN_ROUTE_REGISTRY) {
      const hasMutatingMethod = route.methods.some((m) => m === 'POST' || m === 'DELETE')
      if (!hasMutatingMethod) continue
      if (bodylessActions.has(route.path)) continue

      const src = readRouteSource(route.path)
      const hasValidation =
        src.includes('.parse(') ||
        src.includes('.safeParse(') ||
        src.includes('z.object') ||
        src.includes('request.json()') ||
        src.includes('req.json()')

      if (!hasValidation) {
        suspect.push(route.path)
      }
    }
    assert.deepStrictEqual(
      suspect,
      [],
      `Mutating routes without body validation: ${suspect.join(', ')}`
    )
  })

  it('routes with minRole owner actually enforce owner role', () => {
    const missing: string[] = []
    for (const route of ADMIN_ROUTE_REGISTRY) {
      if (route.minRole !== 'owner') continue
      const src = readRouteSource(route.path)
      if (!src.includes("'owner'")) {
        missing.push(route.path)
      }
    }
    assert.deepStrictEqual(
      missing,
      [],
      `Owner routes not enforcing owner role: ${missing.join(', ')}`
    )
  })
})
