import test from 'node:test'
import assert from 'node:assert/strict'
import { resolvePanelCapabilities } from '@/lib/panel/capabilities'
import { getGroupedNavigationItems, getPanelNavigationItems } from '@/lib/panel/navigation'

test('panel navigation scopes painel routes to the active restaurant', () => {
  const capabilities = resolvePanelCapabilities({
    activePurchasesCount: 1,
    approvedOrdersCount: 0,
    restaurantsCount: 1,
  })

  const items = getPanelNavigationItems(capabilities, 'rest_123')
  const dashboard = items.find((item) => item.id === 'dashboard')
  const editor = items.find((item) => item.id === 'editor')
  const templates = items.find((item) => item.id === 'templates')

  assert.equal(dashboard?.href, '/painel?restaurant=rest_123')
  assert.equal(editor?.href, '/painel/editor?restaurant=rest_123')
  assert.equal(templates?.href, '/meus-templates')
})

test('panel navigation hides items when required capabilities are missing', () => {
  const capabilities = resolvePanelCapabilities({
    activePurchasesCount: 0,
    approvedOrdersCount: 0,
    restaurantsCount: 0,
  })

  const items = getPanelNavigationItems(capabilities, 'rest_123')

  assert.equal(items.length, 0)
})

test('dashboard matching stays exact and métricas appears in overview', () => {
  const capabilities = resolvePanelCapabilities({
    activePurchasesCount: 1,
    approvedOrdersCount: 3,
    restaurantsCount: 1,
  })

  const items = getPanelNavigationItems(capabilities, 'rest_123')
  const dashboard = items.find((item) => item.id === 'dashboard')
  const groups = getGroupedNavigationItems(capabilities, 'rest_123')
  const overview = groups.find((group) => group.id === 'overview')

  assert.deepEqual(dashboard?.matchPrefixes, ['/painel/'])
  assert.ok(overview?.items.some((item) => item.id === 'metricas'))
})
