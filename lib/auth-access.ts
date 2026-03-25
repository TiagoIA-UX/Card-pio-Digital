const DEFAULT_AUTH_REDIRECT = '/painel'
const DISALLOWED_REDIRECT_PREFIXES = ['/api', '/auth/callback', '/_next']
const LEGACY_PURCHASE_REDIRECTS = ['/checkout', '/checkout-novo', '/finalizar-compra']

export type AuthCallbackFlowType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email'

function matchesRoute(path: string, route: string): boolean {
  return path === route || path.startsWith(`${route}/`)
}

export function getSafeAuthRedirect(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return DEFAULT_AUTH_REDIRECT
  }

  if (next.includes('\r') || next.includes('\n')) {
    return DEFAULT_AUTH_REDIRECT
  }

  if (DISALLOWED_REDIRECT_PREFIXES.some((route) => matchesRoute(next, route))) {
    return DEFAULT_AUTH_REDIRECT
  }

  if (LEGACY_PURCHASE_REDIRECTS.some((route) => matchesRoute(next, route))) {
    return DEFAULT_AUTH_REDIRECT
  }

  return next
}

export function requiresPasswordSetup(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return false
  }

  return Boolean((metadata as Record<string, unknown>).requires_password_setup)
}

export function parseAuthCallbackFlowType(
  value: string | null | undefined
): AuthCallbackFlowType | null {
  if (
    value === 'signup' ||
    value === 'invite' ||
    value === 'magiclink' ||
    value === 'recovery' ||
    value === 'email'
  ) {
    return value
  }

  return null
}

export function getAuthFailureRedirect(flowType: AuthCallbackFlowType | null): string {
  return flowType === 'recovery' ? '/login?error=recovery' : '/login?error=auth'
}

export function getPostAuthSuccessRedirect(options: {
  next: string
  flowType: AuthCallbackFlowType | null
  requiresPasswordSetup: boolean
}): string {
  if (options.flowType === 'recovery') {
    return `/redefinir-senha?next=${encodeURIComponent(options.next)}`
  }

  if (options.requiresPasswordSetup) {
    return `/primeiro-acesso?next=${encodeURIComponent(options.next)}`
  }

  return options.next
}
