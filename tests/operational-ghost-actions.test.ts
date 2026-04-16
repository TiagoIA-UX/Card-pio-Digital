import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildOperationalGhostAlertActions,
  type OperationalGhostReport,
} from '@/lib/domains/ops/operational-ghosts'

const report: OperationalGhostReport = {
  scanned_active_restaurants: 3,
  hours_threshold: 24,
  flagged_count: 1,
  rows: [
    {
      tenant_id: '7b13e7ff-95ec-4346-b9cb-683cdaaf070c',
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
}

test('operational ghost actions criam atalhos seguros para regularizacao', () => {
  const actions = buildOperationalGhostAlertActions(report)

  assert.equal(actions.length, 3)
  assert.equal(actions[0]?.endpoint, '/api/admin/operational-ghosts/regularize')
  assert.equal(actions[0]?.payload.action, 'start_trial')
  assert.equal(actions[1]?.payload.action, 'block_until_payment')
  assert.equal(actions[2]?.payload.action, 'register_manual_review')
})
