import React from 'react'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CookieBanner } from '@/components/cookie-banner'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { Toaster } from '@/components/ui/toaster'
import { ChatWidget } from '@/components/chat-widget'
import './globals.css'
import { getSiteUrl } from '@/lib/site-url'

const inter = Inter({ subsets: ['latin'] })

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  verification: {
    google: 'google1a0b3e572aae5f34',
  },
  title: 'Cardápio Digital | Cardápio digital profissional para vender direto',
  description:
    'Cardápio digital profissional para restaurantes, pizzarias, hamburguerias, quiosques e operações de alimentação. Edite tudo pelo painel, receba pedidos no seu canal e tenha 0% de comissão por pedido.',
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
    title: 'Cardápio Digital | Cardápio digital profissional para vender direto',
    description:
      'Cardápio digital profissional para restaurantes e operações de alimentação. Edite pelo painel, receba pedidos no seu canal e venda sem comissão por pedido.',
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
    title: 'Cardápio Digital | Cardápio digital profissional para vender direto',
    description:
      'Cardápio digital profissional para restaurantes e operações de alimentação. Edite pelo painel, receba pedidos no seu canal e venda sem comissão por pedido.',
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
      <body className={`${inter.className} min-w-0 overflow-x-hidden font-sans antialiased`}>
        {children}
        <Toaster />
        <CartDrawer />
        <CookieBanner />
        <ChatWidget />
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
                'Cardápio digital profissional para vender direto no seu canal, com painel visual simples e 0% de comissão sobre pedidos.',
            }),
          }}
        />
      </body>
    </html>
  )
}
