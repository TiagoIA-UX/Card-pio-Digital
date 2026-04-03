import type { MetadataRoute } from 'next'

import { getSiteUrl } from '@/lib/site-url'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl()

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/templates`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/precos`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/templates/restaurante`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/templates/pizzaria`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/templates/sushi`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/templates/bar`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/templates/lanchonete`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/templates/acai`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/templates/cafeteria`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/google-meu-negocio`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/login`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/cadastro`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/politica`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/privacidade`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/termos`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/cookies`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/beneficios`, changeFrequency: 'weekly', priority: 0.8 },
  ]

  return staticPages
}
