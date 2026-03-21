'use client'

import { useEffect } from 'react'

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[]
}

/**
 * Componente para injetar Schema.org JSON-LD
 */
export function JsonLd({ data }: JsonLdProps) {
  const jsonLd = JSON.stringify(data)

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
}

/**
 * Schema.org para a organização (usar no layout)
 */
export function OrganizationJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zairyx.com'
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Zairyx — Cardápio Digital',
    url: siteUrl,
    logo: `${siteUrl}/icon.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'Portuguese',
    },
    areaServed: {
      '@type': 'State',
      name: 'São Paulo',
      containsPlace: [
        { '@type': 'City', name: 'Caraguatatuba' },
        { '@type': 'City', name: 'São Sebastião' },
        { '@type': 'City', name: 'Ubatuba' },
        { '@type': 'City', name: 'Ilhabela' },
      ],
    },
  }

  return <JsonLd data={schema} />
}

/**
 * Schema.org para produto/template
 */
export function ProductJsonLd({
  name,
  description,
  price,
  image,
  url,
  ratingValue,
  reviewCount,
}: {
  name: string
  description: string
  price: number
  image: string
  url: string
  ratingValue?: number
  reviewCount?: number
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    url,
    brand: {
      '@type': 'Brand',
      name: 'Zairyx — Cardápio Digital',
    },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
    },
  }

  if (ratingValue && reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  return <JsonLd data={schema} />
}

/**
 * Schema.org para FAQ
 */
export function FAQJsonLd({
  questions,
}: {
  questions: Array<{ question: string; answer: string }>
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  }

  return <JsonLd data={schema} />
}

/**
 * Schema.org para Breadcrumbs
 */
export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return <JsonLd data={schema} />
}

/**
 * Schema.org para Software/SaaS
 */
export function SoftwareJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Zairyx — Cardápio Digital',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '247',
      priceCurrency: 'BRL',
    },
  }

  return <JsonLd data={schema} />
}
