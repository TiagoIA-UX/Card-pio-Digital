export type LoginMethod = 'google' | 'magiclink' | 'reset'

export interface LoginMethodGuidance {
  method: LoginMethod
  title: string
  summary: string
  whenToUse: string
  ctaLabel: string
}

const LOGIN_METHOD_GUIDANCE: Record<LoginMethod, LoginMethodGuidance> = {
  google: {
    method: 'google',
    title: 'Entrar com Google',
    summary: 'Melhor opção para quem já usa a conta Google no dia a dia.',
    whenToUse:
      'Use quando sua conta já está vinculada ao Google ou você quer o caminho mais rápido.',
    ctaLabel: 'Continuar com Google',
  },
  magiclink: {
    method: 'magiclink',
    title: 'Receber link de acesso',
    summary: 'Ideal para quem comprou no checkout e ainda não vinculou o Google.',
    whenToUse: 'Use quando você quer entrar pelo e-mail sem depender de senha salva no momento.',
    ctaLabel: 'Receber link de acesso',
  },
  reset: {
    method: 'reset',
    title: 'Redefinir senha',
    summary: 'Use quando você já tinha uma senha e perdeu o acesso.',
    whenToUse: 'Esse caminho envia um e-mail para escolher uma nova senha.',
    ctaLabel: 'Esqueci minha senha',
  },
}

export function resolveRecommendedLoginMethod(errorCode: string | null | undefined): LoginMethod {
  if (errorCode === 'recovery') {
    return 'reset'
  }

  if (errorCode === 'auth') {
    return 'magiclink'
  }

  return 'google'
}

export function getLoginMethodGuidance(method: LoginMethod): LoginMethodGuidance {
  return LOGIN_METHOD_GUIDANCE[method]
}

export function listLoginMethodGuidance(): LoginMethodGuidance[] {
  return [
    LOGIN_METHOD_GUIDANCE.google,
    LOGIN_METHOD_GUIDANCE.magiclink,
    LOGIN_METHOD_GUIDANCE.reset,
  ]
}
