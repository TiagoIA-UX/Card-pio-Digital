const DEFAULT_SITE_URL = 'https://zairyx.com.br'

function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, '')
}

function getRequestHeader(headers: Headers, key: string): string | null {
  const value = headers.get(key)?.trim()
  return value ? value : null
}

export function getRequestSiteUrl(request: Request | { headers: Headers }): string {
  const forwardedProto = getRequestHeader(request.headers, 'x-forwarded-proto')
  const forwardedHost = getRequestHeader(request.headers, 'x-forwarded-host')
  const host = forwardedHost || getRequestHeader(request.headers, 'host')

  if (host) {
    const proto = forwardedProto || (/localhost|127\.0\.0\.1/.test(host) ? 'http' : 'https')
    return stripTrailingSlashes(`${proto}://${host}`)
  }

  return getSiteUrl()
}

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return stripTrailingSlashes(explicit)

  const prodHost = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (prodHost) return stripTrailingSlashes(`https://${prodHost}`)

  const deployHost = process.env.VERCEL_URL
  if (deployHost) return stripTrailingSlashes(`https://${deployHost}`)

  if (typeof window !== 'undefined' && window.location.origin) {
    return stripTrailingSlashes(window.location.origin)
  }

  return DEFAULT_SITE_URL
}
