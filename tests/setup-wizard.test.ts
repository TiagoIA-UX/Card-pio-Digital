import test from 'node:test'
import assert from 'node:assert/strict'
import { getCreateDeliveryWizardProgress, getCreateDeliveryWizardSteps } from '@/lib/setup-wizard'

test('setup wizard starts on business identity step', () => {
  const steps = getCreateDeliveryWizardSteps(
    {
      nome: '',
      slug: '',
      telefone: '',
    },
    1
  )

  assert.equal(steps[0]?.status, 'current')
  assert.equal(steps[1]?.status, 'upcoming')
  assert.equal(steps[2]?.status, 'upcoming')
  assert.equal(getCreateDeliveryWizardProgress(steps), 0)
})

test('setup wizard advances to whatsapp step after business data', () => {
  const steps = getCreateDeliveryWizardSteps(
    {
      nome: 'Delivery Centro',
      slug: 'delivery-centro',
      telefone: '',
    },
    1
  )

  assert.equal(steps[0]?.status, 'complete')
  assert.equal(steps[1]?.status, 'current')
  assert.equal(getCreateDeliveryWizardProgress(steps), 1)
})

test('setup wizard enables final publication step when required fields exist', () => {
  const steps = getCreateDeliveryWizardSteps(
    {
      nome: 'Delivery Centro',
      slug: 'delivery-centro',
      telefone: '5511999999999',
    },
    1
  )

  assert.equal(steps[0]?.status, 'complete')
  assert.equal(steps[1]?.status, 'complete')
  assert.equal(steps[2]?.status, 'current')
  assert.equal(getCreateDeliveryWizardProgress(steps), 2)
})

test('setup wizard keeps publication unavailable when credits are exhausted', () => {
  const steps = getCreateDeliveryWizardSteps(
    {
      nome: 'Delivery Centro',
      slug: 'delivery-centro',
      telefone: '5511999999999',
    },
    0
  )

  assert.equal(steps[2]?.status, 'upcoming')
})
