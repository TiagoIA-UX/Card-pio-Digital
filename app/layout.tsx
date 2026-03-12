import React from 'react'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CookieBanner } from '@/components/cookie-banner'
import { CartDrawer } from '@/components/cart/cart-drawer'
import './globals.css'
import { getSiteUrl } from '@/lib/site-url'

const inter = Inter({ subsets: ['latin'] })

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Cardápio Digital | Cardápio Online Rápido e Fácil',
  description:
    'Cardápio digital profissional para delivery e negócios alimentícios. Pizzarias, hamburguerias, lanchonetes. Mais pedidos no WhatsApp, Google Maps integrado e site profissional.',
  keywords: [
    'cardápio digital',
    'cardápio online',
    'cardápio para delivery',
    'cardápio para restaurante',
    'cardápio whatsapp',
    'google maps cardápio',
  ],
  alternates: {
    canonical: siteUrl,
    languages: {
      'pt-BR': siteUrl,
    },
  },
  openGraph: {
    title: 'Cardápio Digital | Cardápio Online Rápido e Fácil',
    description:
      'Cardápio digital profissional para delivery e negócios alimentícios. Pizzarias, hamburguerias, lanchonetes. Mais pedidos no WhatsApp e Google Maps integrado.',
    url: siteUrl,
    siteName: 'Cardápio Digital',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/placeholder.jpg`,
        width: 1200,
        height: 630,
        alt: 'Cardápio Digital',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cardápio Digital | Cardápio Online Rápido e Fácil',
    description:
      'Cardápio digital profissional para delivery e negócios alimentícios. Pizzarias, hamburguerias, lanchonetes. Mais pedidos no WhatsApp e Google Maps integrado.',
    images: [`${siteUrl}/placeholder.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="overflow-x-hidden">
      <body className={`${inter.className} font-sans antialiased overflow-x-hidden min-w-0`}>
        {children}
        <CartDrawer />
        <CookieBanner />
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Restaurant',
              name: 'Cardápio Digital',
              url: siteUrl,
              sameAs: [siteUrl],
              logo: `${siteUrl}/placeholder-logo.png`,
              description:
                'Cardápio digital profissional para delivery e negócios alimentícios. Site com Google Maps integrado.',
            }),
          }}
        />
      </body>
    </html>
  )
}
