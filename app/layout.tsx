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
    'Cardápio digital para restaurantes, lanchonetes e delivery. Mais pedidos no WhatsApp, Google Maps integrado e site profissional. Cardápio bonito, rápido e simples de compartilhar.',
  keywords: [
    'cardápio digital',
    'cardápio online',
    'cardápio para restaurante',
    'cardápio para delivery',
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
      'Cardápio digital para restaurantes, lanchonetes e delivery. Mais pedidos no WhatsApp, Google Maps integrado e site profissional. Cardápio bonito, rápido e simples de compartilhar.',
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
      'Cardápio digital para restaurantes, lanchonetes e delivery. Mais pedidos no WhatsApp, Google Maps integrado e site profissional. Cardápio bonito, rápido e simples de compartilhar.',
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} font-sans antialiased`}>
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
                'Cardápio digital para restaurantes, lanchonetes e delivery. Site profissional com Google Maps integrado.',
            }),
          }}
        />
      </body>
    </html>
  )
}
