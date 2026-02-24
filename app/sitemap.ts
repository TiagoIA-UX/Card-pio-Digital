import type { MetadataRoute } from 'next'

import { getSiteUrl } from '@/lib/site-url'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl()

  return [
    {
      url: `${baseUrl}/`,
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}
