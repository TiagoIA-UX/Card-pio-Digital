export interface HeaderReader {
  get(name: string): string | null
}

const PRIORITY_IP_HEADERS = ['x-vercel-forwarded-for', 'cf-connecting-ip', 'x-real-ip']

function normalizeIpCandidate(rawValue: string): string {
  let candidate = rawValue.trim().replace(/^for=/i, '').replace(/^"|"$/g, '')

  if (candidate.startsWith('[')) {
    const closingBracketIndex = candidate.indexOf(']')
    if (closingBracketIndex > 0) {
      candidate = candidate.slice(1, closingBracketIndex)
    }
  }

  const hasSinglePortSeparator =
    candidate.includes('.') &&
    candidate.includes(':') &&
    candidate.indexOf(':') === candidate.lastIndexOf(':')

  if (hasSinglePortSeparator) {
    candidate = candidate.slice(0, candidate.lastIndexOf(':'))
  }

  return candidate.trim()
}

function isValidIpv4(candidate: string): boolean {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(candidate)) {
    return false
  }

  return candidate.split('.').every((segment) => {
    const value = Number(segment)
    return Number.isInteger(value) && value >= 0 && value <= 255
  })
}

function isValidIpv6(candidate: string): boolean {
  if (candidate.startsWith('::ffff:')) {
    return isValidIpv4(candidate.slice(7))
  }

  return candidate.includes(':') && /^[0-9a-f:]+$/i.test(candidate) && !candidate.includes(':::')
}

export function isValidClientIp(rawValue: string | null | undefined): boolean {
  if (!rawValue) {
    return false
  }

  const candidate = normalizeIpCandidate(rawValue)
  if (!candidate || candidate.toLowerCase() === 'unknown') {
    return false
  }

  return isValidIpv4(candidate) || isValidIpv6(candidate)
}

export function extractClientIpFromHeaders(headers: HeaderReader): string {
  for (const headerName of PRIORITY_IP_HEADERS) {
    const headerValue = headers.get(headerName)
    if (isValidClientIp(headerValue)) {
      return normalizeIpCandidate(headerValue as string)
    }
  }

  const forwardedChain = headers.get('x-forwarded-for')
  if (forwardedChain) {
    for (const part of forwardedChain.split(',')) {
      if (isValidClientIp(part)) {
        return normalizeIpCandidate(part)
      }
    }
  }

  return 'unknown'
}

export function isAdminRoute(path: string): boolean {
  return path === '/admin' || path.startsWith('/admin/')
}
