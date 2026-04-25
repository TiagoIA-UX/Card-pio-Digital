import test from 'node:test'
import assert from 'node:assert/strict'

import { validateCreateDeliveryApiResult } from '@/app/painel/criar-delivery/page'

test('create delivery page aceita resposta válida da API', () => {
  assert.deepEqual(
    validateCreateDeliveryApiResult(true, {
      restaurantId: 'rest-1',
      remainingCredits: 2,
      networkExtraUnits: 1,
    }),
    {
      restaurantId: 'rest-1',
      remainingCredits: 2,
      networkExtraUnits: 1,
    }
  )
})

test('create delivery page rejeita resposta sem restaurantId ou com erro explícito', () => {
  assert.throws(
    () => validateCreateDeliveryApiResult(false, { error: 'Slug em uso' }),
    /Slug em uso/
  )

  assert.throws(
    () => validateCreateDeliveryApiResult(true, { remainingCredits: 2, networkExtraUnits: 1 }),
    /Erro ao criar canal digital/
  )
})

test('create delivery page rejeita payload de sucesso com métricas inválidas', () => {
  assert.throws(
    () =>
      validateCreateDeliveryApiResult(true, {
        restaurantId: 'rest-1',
        remainingCredits: Number.NaN,
        networkExtraUnits: 1,
      }),
    /Resposta inválida ao criar canal digital/
  )
})

