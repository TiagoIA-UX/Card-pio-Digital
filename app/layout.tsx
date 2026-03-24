import React from 'react'
import type { Metadata, Viewport } from 'next'
import { Outfit, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CookieBanner } from '@/components/cookie-banner'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { Toaster } from '@/components/ui/toaster'
import { ChatWidget } from '@/components/chat-widget'
import './globals.css'
import { getSiteUrl } from '@/lib/site-url'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-heading', display: 'swap', weight: ['500', '600', '700'] })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap', weight: ['400', '500', '700'] })

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  verification: {
    google: 'google1a0b3e572aae5f34',
  },
  title: 'Zairyx | Cardápio Digital Profissional para Vender Direto',
  description:
    'Zairyx — Cardápio digital profissional para restaurantes, pizzarias, hamburguerias, quiosques e operações de alimentação. Edite tudo pelo painel, receba pedidos no seu canal e tenha 0% de comissão por pedido.',
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
    title: 'Zairyx | Cardápio Digital Profissional para Vender Direto',
    description:
      'Zairyx — Cardápio digital profissional para restaurantes e operações de alimentação. Edite pelo painel, receba pedidos no seu canal e venda sem comissão por pedido.',
    url: siteUrl,
    siteName: 'Zairyx — Cardápio Digital',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Zairyx — Cardápio Digital',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zairyx | Cardápio Digital Profissional para Vender Direto',
    description:
      'Zairyx — Cardápio digital profissional para restaurantes e operações de alimentação. Edite pelo painel, receba pedidos no seu canal e venda sem comissão por pedido.',
    images: [`${siteUrl}/og-image.jpg`],
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
      <body className={`${outfit.variable} ${dmSans.variable} min-w-0 overflow-x-hidden font-sans antialiased`}>
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
              '@type': 'SoftwareApplication',
              name: 'Zairyx — Cardápio Digital',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              url: siteUrl,
              sameAs: [siteUrl],
              logo: `${siteUrl}/icon.png`,
              description:
                'Cardápio digital profissional para vender direto no seu canal, com painel visual simples e 0% de comissão sobre pedidos.',
            }),
          }}
        />
      </body>
    </html>
  )
}
