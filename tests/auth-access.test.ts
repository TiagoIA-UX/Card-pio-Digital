import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getAuthFailureRedirect,
  getPostAuthSuccessRedirect,
  getSafeAuthRedirect,
  parseAuthCallbackFlowType,
  requiresPasswordSetup,
} from '@/lib/auth-access'
import {
  getLoginMethodGuidance,
  listLoginMethodGuidance,
  resolveRecommendedLoginMethod,
} from '@/lib/login-guidance'

test('getSafeAuthRedirect blocks unsafe and legacy targets', () => {
  assert.equal(getSafeAuthRedirect('/painel'), '/painel')
  assert.equal(getSafeAuthRedirect('/checkout'), '/painel')
  assert.equal(getSafeAuthRedirect('/api/admin'), '/painel')
  assert.equal(getSafeAuthRedirect('//evil.test'), '/painel')
  assert.equal(getSafeAuthRedirect(null), '/painel')
})

test('requiresPasswordSetup reads checkout-provisioned metadata safely', () => {
  assert.equal(requiresPasswordSetup({ requires_password_setup: true }), true)
  assert.equal(requiresPasswordSetup({ requires_password_setup: false }), false)
  assert.equal(requiresPasswordSetup(null), false)
  assert.equal(requiresPasswordSetup('invalid'), false)
})

test('parseAuthCallbackFlowType accepts only supported auth flow types', () => {
  assert.equal(parseAuthCallbackFlowType('magiclink'), 'magiclink')
  assert.equal(parseAuthCallbackFlowType('recovery'), 'recovery')
  assert.equal(parseAuthCallbackFlowType('invalid'), null)
  assert.equal(parseAuthCallbackFlowType(null), null)
})

test('getAuthFailureRedirect distinguishes recovery errors from generic auth errors', () => {
  assert.equal(getAuthFailureRedirect('recovery'), '/login?error=recovery')
  assert.equal(getAuthFailureRedirect('magiclink'), '/login?error=auth')
  assert.equal(getAuthFailureRedirect(null), '/login?error=auth')
})

test('getPostAuthSuccessRedirect routes recovery and first-access flows explicitly', () => {
  assert.equal(
    getPostAuthSuccessRedirect({
      next: '/painel',
      flowType: 'recovery',
      requiresPasswordSetup: false,
    }),
    '/redefinir-senha?next=%2Fpainel'
  )

  assert.equal(
    getPostAuthSuccessRedirect({
      next: '/painel',
      flowType: 'magiclink',
      requiresPasswordSetup: true,
    }),
    '/primeiro-acesso?next=%2Fpainel'
  )

  assert.equal(
    getPostAuthSuccessRedirect({
      next: '/painel/pedidos',
      flowType: 'magiclink',
      requiresPasswordSetup: false,
    }),
    '/painel/pedidos'
  )
})

test('resolveRecommendedLoginMethod highlights the safest path for each auth error', () => {
  assert.equal(resolveRecommendedLoginMethod(null), 'google')
  assert.equal(resolveRecommendedLoginMethod('auth'), 'magiclink')
  assert.equal(resolveRecommendedLoginMethod('recovery'), 'reset')
})

test('login guidance exposes stable labels for the interface', () => {
  const guidance = getLoginMethodGuidance('magiclink')
  assert.equal(guidance.ctaLabel, 'Receber link de acesso')
  assert.equal(listLoginMethodGuidance().length, 3)
})
