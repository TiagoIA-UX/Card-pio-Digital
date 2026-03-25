import test from 'node:test'
import assert from 'node:assert/strict'
import { getCheckoutWizardProgress, getCheckoutWizardSteps } from '@/lib/checkout-wizard'

test('checkout wizard starts on account data after default offer selection', () => {
  const steps = getCheckoutWizardSteps({
    selectedPlan: 'feito-pra-voce',
    paymentMethod: 'card',
    isAuthenticated: false,
    form: {
      restaurantName: '',
      customerName: '',
      phone: '',
    },
  })

  assert.equal(steps[0]?.status, 'complete')
  assert.equal(steps[1]?.status, 'current')
  assert.equal(steps[2]?.status, 'upcoming')
  assert.equal(getCheckoutWizardProgress(steps), 1)
})

test('checkout wizard unlocks payment when account is authenticated and form is ready', () => {
  const steps = getCheckoutWizardSteps({
    selectedPlan: 'self-service',
    paymentMethod: 'pix',
    isAuthenticated: true,
    form: {
      restaurantName: 'Delivery Centro',
      customerName: 'Tiago',
      phone: '(11) 99999-9999',
    },
  })

  assert.equal(steps[1]?.status, 'complete')
  assert.equal(steps[2]?.status, 'current')
  assert.equal(getCheckoutWizardProgress(steps), 2)
})

test('checkout wizard keeps account step current when form is incomplete', () => {
  const steps = getCheckoutWizardSteps({
    selectedPlan: 'self-service',
    paymentMethod: 'card',
    isAuthenticated: true,
    form: {
      restaurantName: 'Delivery Centro',
      customerName: '',
      phone: '(11) 99999-9999',
    },
  })

  assert.equal(steps[1]?.status, 'current')
  assert.equal(steps[2]?.status, 'upcoming')
})
