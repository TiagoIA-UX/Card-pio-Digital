import { getSiteUrl } from './site-url'

const siteUrl = getSiteUrl()

/**
 * Configuração SEO centralizada
 */
export const seoConfig = {
  siteName: 'Cardápio Digital',
  siteUrl,
  defaultTitle: 'Cardápio Digital | Templates Profissionais para Restaurantes',
  defaultDescription: 'Templates de cardápio digital profissionais para restaurantes, pizzarias, lanchonetes e delivery. WhatsApp e Google Maps integrados. Aumente suas vendas com cardápios bonitos e funcionais.',
  defaultImage: `${siteUrl}/og-image.jpg`,
  
  // Contato
  supportEmail: 'suporte@cardapiodigital.com.br',
  supportWhatsApp: '5511999999999',
  
  // Social
  twitterHandle: '@cardapiodigital',
  
  // Negócio
  priceRange: '$$',
  currency: 'BRL',
}

/**
 * Gera Schema.org para a organização
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: seoConfig.siteName,
    url: seoConfig.siteUrl,
    logo: `${siteUrl}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: `+${seoConfig.supportWhatsApp}`,
      contactType: 'customer service',
      availableLanguage: 'Portuguese'
    },
    sameAs: [
      // Adicionar redes sociais
    ]
  }
}

/**
 * Gera Schema.org para produto (template)
 */
export function generateProductSchema(template: {
  name: string
  description: string
  price: number
  originalPrice?: number
  image: string
  slug: string
  ratingAvg?: number
  ratingCount?: number
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: template.name,
    description: template.description,
    image: template.image,
    url: `${siteUrl}/templates/${template.slug}`,
    brand: {
      '@type': 'Brand',
      name: seoConfig.siteName
    },
    offers: {
      '@type': 'Offer',
      price: template.price,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: seoConfig.siteName
      }
    },
    ...(template.ratingAvg && template.ratingCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: template.ratingAvg,
        reviewCount: template.ratingCount,
        bestRating: 5,
        worstRating: 1
      }
    })
  }
}

/**
 * Gera Schema.org para FAQ
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
}

/**
 * Gera Schema.org para Software/SaaS
 */
export function generateSoftwareSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: seoConfig.siteName,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '247',
      priceCurrency: 'BRL'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '200',
      bestRating: '5',
      worstRating: '1'
    }
  }
}

/**
 * Gera meta tags para template específico
 */
export function generateTemplateMetadata(template: {
  name: string
  description: string
  image: string
  slug: string
  price: number
}) {
  return {
    title: `${template.name} | Template de Cardápio Digital`,
    description: template.description,
    openGraph: {
      title: `${template.name} | Cardápio Digital`,
      description: template.description,
      url: `${siteUrl}/templates/${template.slug}`,
      images: [
        {
          url: template.image,
          width: 1200,
          height: 630,
          alt: template.name
        }
      ]
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `${template.name} | Cardápio Digital`,
      description: template.description,
      images: [template.image]
    }
  }
}
