import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getPasswordRuleStatuses,
  isPasswordReady,
  validatePasswordStrength,
} from '@/lib/password-rules'

test('validatePasswordStrength enforces minimum practical rules', () => {
  assert.deepEqual(validatePasswordStrength('abc'), {
    minLength: false,
    hasLetter: true,
    hasNumber: false,
  })

  assert.deepEqual(validatePasswordStrength('abc12345'), {
    minLength: true,
    hasLetter: true,
    hasNumber: true,
  })
})

test('getPasswordRuleStatuses returns stable UI-friendly labels', () => {
  const rules = getPasswordRuleStatuses('abc12345')
  assert.equal(rules.length, 3)
  assert.equal(rules[0]?.label, 'Pelo menos 8 caracteres')
  assert.equal(
    rules.every((rule) => rule.valid),
    true
  )
})

test('isPasswordReady requires strong password and matching confirmation', () => {
  assert.equal(isPasswordReady('abc12345', 'abc12345'), true)
  assert.equal(isPasswordReady('abc12345', 'abc1234'), false)
  assert.equal(isPasswordReady('abcdefgh', 'abcdefgh'), false)
})
