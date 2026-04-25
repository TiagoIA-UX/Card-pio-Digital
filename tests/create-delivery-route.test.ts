import test from 'node:test'
import assert from 'node:assert/strict'

import { buildExplicitRestaurantFinancialPayload } from '@/app/api/painel/create-delivery/route'

test('create delivery route define estado financeiro explícito no nascimento', () => {
  const payload = buildExplicitRestaurantFinancialPayload()

  assert.deepEqual(payload, {
    ativo: true,
    suspended: false,
    status_pagamento: 'ativo',
    plano: 'self-service',
    plan_slug: 'basico',
    origin_sale: 'organic',
  })
})

