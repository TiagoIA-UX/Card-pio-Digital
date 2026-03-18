import type { MetadataRoute } from 'next'

import { getSiteUrl } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        disallow: ['/painel', '/admin', '/api', '/dev', '/checkout', '/auth', '/onboarding', '/status'],
        allow: ['/', '/templates', '/ofertas', '/precos'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
