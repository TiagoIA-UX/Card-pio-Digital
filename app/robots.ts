import type { MetadataRoute } from 'next'

import { getSiteUrl } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        disallow: [
          '/painel',
          '/admin',
          '/api',
          '/dev',
          '/auth',
          '/onboarding',
          '/status',
        ],
        allow: ['/', '/templates', '/precos'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
