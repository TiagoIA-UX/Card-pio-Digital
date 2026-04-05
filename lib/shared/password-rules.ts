export interface PasswordRuleStatus {
  label: string
  valid: boolean
}

export function validatePasswordStrength(password: string) {
  return {
    minLength: password.length >= 8,
    hasLetter: /[A-Za-z]/.test(password),
    hasNumber: /\d/.test(password),
  }
}

export function getPasswordRuleStatuses(password: string): PasswordRuleStatus[] {
  const result = validatePasswordStrength(password)

  return [
    { label: 'Pelo menos 8 caracteres', valid: result.minLength },
    { label: 'Pelo menos 1 letra', valid: result.hasLetter },
    { label: 'Pelo menos 1 número', valid: result.hasNumber },
  ]
}

export function isPasswordReady(password: string, confirmPassword: string) {
  const result = validatePasswordStrength(password)
  return result.minLength && result.hasLetter && result.hasNumber && password === confirmPassword
}
