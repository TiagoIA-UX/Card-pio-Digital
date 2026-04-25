import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildOperationalGhostAlertBody,
  buildOperationalGhostFingerprint,
  getOperationalGhostSeverity,
  type OperationalGhostReport,
} from '@/lib/domains/ops/operational-ghosts'

function buildReport(overrides?: Partial<OperationalGhostReport>): OperationalGhostReport {
  return {
    scanned_active_restaurants: 10,
    hours_threshold: 24,
    flagged_count: 1,
    rows: [
      {
        tenant_id: 'tenant-1',
        slug: 'pizzaria-do-jose',
        nome: 'Pizzaria do Jose',
        created_at: '2026-04-15T00:00:00.000Z',
        status_pagamento: 'pendente',
        origin_sale: 'organic',
        plan_slug: 'basico',
        plano: 'free',
        valor_pago: 0,
        data_pagamento: null,
        subscription_status: null,
        mp_subscription_status: null,
        last_payment_date: null,
        mp_preapproval_id: null,
        classification: 'operational_ghost',
      },
    ],
    ...overrides,
  }
}

test('operational ghost severity escala com a quantidade de casos', () => {
  assert.equal(getOperationalGhostSeverity(0), 'info')
  assert.equal(getOperationalGhostSeverity(1), 'warning')
  assert.equal(getOperationalGhostSeverity(3), 'critical')
})

test('operational ghost fingerprint muda quando muda a lista de tenants', () => {
  const base = buildReport()
  const changed = buildReport({
    flagged_count: 2,
    rows: [
      ...base.rows,
      {
        ...base.rows[0],
        tenant_id: 'tenant-2',
        slug: 'pizzaria-italiana',
        nome: 'Pizzaria Italiana',
      },
    ],
  })

  assert.notEqual(buildOperationalGhostFingerprint(base), buildOperationalGhostFingerprint(changed))
})

test('operational ghost alert body resume os casos encontrados', () => {
  const body = buildOperationalGhostAlertBody(buildReport())

  assert.match(body, /1 deliverys ativos sem assinatura/i)
  assert.match(body, /pizzaria-do-jose/i)
  assert.match(body, /origem=organic/i)
  assert.match(body, /acao recomendada/i)
  assert.match(body, /1\. Conferir se houve pagamento real/i)
})

