function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, '')
}

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return stripTrailingSlashes(explicit)

  const prodHost = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (prodHost) return stripTrailingSlashes(`https://${prodHost}`)

  const deployHost = process.env.VERCEL_URL
  if (deployHost) return stripTrailingSlashes(`https://${deployHost}`)

  return 'http://localhost:3000'
}
