import test from 'node:test'
import assert from 'node:assert/strict'
import { getTemplateCatalog } from '@/lib/domains/marketing/templates-config'
import {
  decorateTemplateCatalog,
  TEMPLATE_PUBLIC_META,
  TEMPLATE_PUBLIC_ORDER,
} from '@/lib/domains/marketing/template-public-meta'
import {
  getEntryPlan,
  getPopularPlan,
  PLAN_METRICS,
  TEMPLATE_PLANS,
} from '@/lib/domains/marketing/template-plans'

test('metadados públicos cobrem todos os 16 nichos da vitrine', () => {
  assert.equal(TEMPLATE_PUBLIC_ORDER.length, 16)
  assert.equal(Object.keys(TEMPLATE_PUBLIC_META).length, 16)
})

test('cada nicho público possui 3 planos comerciais', () => {
  for (const slug of TEMPLATE_PUBLIC_ORDER) {
    assert.equal(TEMPLATE_PLANS[slug].length, 3, `${slug} deveria ter 3 planos`)
    assert.ok(getEntryPlan(slug), `${slug} deveria ter plano de entrada`)
    assert.ok(getPopularPlan(slug), `${slug} deveria ter plano popular`)
  }
})

test('métricas públicas refletem 16 nichos e 48 planos', () => {
  assert.equal(PLAN_METRICS.totalTemplates, 16)
  assert.equal(PLAN_METRICS.totalPlans, 48)
})

test('catálogo decorado expõe famílias públicas legíveis', () => {
  const catalog = decorateTemplateCatalog(getTemplateCatalog())
  const names = new Set(catalog.map((item) => item.name))

  assert.ok(names.has('Lanches e burgers'))
  assert.ok(names.has('Conveniência'))
  assert.ok(names.has('Mercado de bairro'))
})

