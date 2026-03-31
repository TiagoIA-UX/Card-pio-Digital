import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolvePanelCapabilities } from '../lib/panel/capabilities'
import { getPanelNavigationItems } from '../lib/panel/navigation'
import {
  buildCustomizationFromDraft,
  buildDisplayCategories,
  buildPreviewRestaurant,
} from '../lib/editor/draft-adapter'
import {
  canTransition,
  resolveOrderLifecycleState,
  lifecycleStateToDbFields,
} from '../lib/lifecycle/template-lifecycle'
import {
  ADMIN_ROUTE_REGISTRY,
  getRouteDefinition,
  ROUTES_BY_DOMAIN,
} from '../lib/admin/api-domains'
import {
  EDITOR_BLOCK_SCHEMA,
  getBlockDefinition,
  PREVIEW_TO_EDITOR_BLOCK,
} from '../lib/editor/block-schema'
import { INITIAL_FORM, DATA_BLOCK_TO_EDITOR } from '../lib/editor/types'
import type { CardapioRestaurant } from '../lib/cardapio-renderer'

/**
 * Testes de regressão cruzada que validam a integração entre os módulos
 * criados nas fases 2-4 da reimplementação do editor/painel.
 */

describe('regression: capability → navigation', () => {
  it('user without commercial access sees zero navigation items', () => {
    const caps = resolvePanelCapabilities({
      activePurchasesCount: 0,
      approvedOrdersCount: 0,
      restaurantsCount: 0,
    })
    const items = getPanelNavigationItems(caps, undefined)
    assert.strictEqual(items.length, 0)
  })

  it('user with commercial access and restaurant sees all standard items', () => {
    const caps = resolvePanelCapabilities({
      activePurchasesCount: 1,
      approvedOrdersCount: 0,
      restaurantsCount: 1,
    })
    const items = getPanelNavigationItems(caps, 'r-123')
    assert.ok(items.length >= 5, `Expected at least 5 menu items, got ${items.length}`)
    const labels = items.map((i) => i.label)
    assert.ok(labels.includes('Editor Visual'), 'Missing "Editor Visual"')
  })
})

describe('regression: editor draft → preview roundtrip', () => {
  const restaurant: CardapioRestaurant = {
    id: 'r1',
    user_id: 'u1',
    nome: 'DB Nome',
    slug: 'test',
    telefone: '11999',
    logo_url: null,
    banner_url: null,
    slogan: null,
    cor_primaria: '#f00',
    cor_secundaria: '#00f',
    template_slug: 'pizzaria',
    ativo: true,
  }

  it('form changes flow through customization to preview', () => {
    const form = { ...INITIAL_FORM, heroTitle: 'Título Customizado', nome: 'Minha Pizza' }
    const cust = buildCustomizationFromDraft(form, [])
    const preview = buildPreviewRestaurant(restaurant, form, cust)!

    assert.strictEqual(preview.nome, 'Minha Pizza')
    assert.strictEqual(
      (preview.customizacao as Record<string, unknown>).heroTitle,
      'Título Customizado'
    )
  })

  it('custom categories flow through to display and customization', () => {
    const cats = ['Pizzas', 'Bebidas']
    const cust = buildCustomizationFromDraft(INITIAL_FORM, cats)
    const display = buildDisplayCategories(cats, ['Pizzas', 'Sobremesas'])

    assert.deepStrictEqual(cust.customCategories, ['Pizzas', 'Bebidas'])
    assert.deepStrictEqual(display, ['Pizzas', 'Bebidas', 'Sobremesas'])
  })
})

describe('regression: block schema ↔ editor types consistency', () => {
  it('DATA_BLOCK_TO_EDITOR equals PREVIEW_TO_EDITOR_BLOCK from schema', () => {
    assert.strictEqual(DATA_BLOCK_TO_EDITOR, PREVIEW_TO_EDITOR_BLOCK)
  })

  it('every schema block has a unique id', () => {
    const ids = EDITOR_BLOCK_SCHEMA.map((b) => b.id)
    assert.strictEqual(new Set(ids).size, ids.length, 'Duplicate block ids found')
  })

  it('getBlockDefinition returns undefined for bogus id', () => {
    assert.strictEqual(getBlockDefinition('nonexistent' as never), undefined)
  })
})

describe('regression: lifecycle → capabilities flow', () => {
  it('ready lifecycle state maps to DB fields that grant commercial access', () => {
    const fields = lifecycleStateToDbFields('ready')
    assert.strictEqual(fields.payment_status, 'approved')
    // approved payment_status → approvedOrdersCount > 0 → hasCommercialAccess
    const caps = resolvePanelCapabilities({
      activePurchasesCount: 0,
      approvedOrdersCount: 1,
      restaurantsCount: 1,
    })
    assert.ok(caps.hasCommercialAccess)
    assert.ok(caps.canAccessVisualEditor)
  })

  it('payment_rejected lifecycle state resolves correctly from DB round-trip', () => {
    const fields = lifecycleStateToDbFields('payment_rejected')
    const resolved = resolveOrderLifecycleState({
      status: fields.status,
      payment_status: fields.payment_status,
      metadata: { onboarding_status: fields.onboarding_status },
    })
    assert.strictEqual(resolved, 'payment_rejected')
  })

  it('cancelled order cannot transition to any state', () => {
    assert.strictEqual(canTransition('cancelled', 'awaiting_payment'), false)
    assert.strictEqual(canTransition('cancelled', 'ready'), false)
  })
})

describe('regression: admin route registry integrity', () => {
  it('all 18 admin routes are registered', () => {
    assert.strictEqual(ADMIN_ROUTE_REGISTRY.length, 18)
  })

  it('every domain has routes', () => {
    for (const [domain, routes] of Object.entries(ROUTES_BY_DOMAIN)) {
      assert.ok(routes.length > 0, `Domain "${domain}" has no routes`)
    }
  })

  it('metrics route is rate limited', () => {
    const r = getRouteDefinition('metrics')
    assert.ok(r?.rateLimited)
  })
})
