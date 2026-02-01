import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://cardapio.digital'),
  title: 'Cardápio Digital | Cardápio Online Rápido e Fácil',
  description: 'Cardápio digital para restaurantes, lanchonetes e delivery. Mais pedidos no WhatsApp com um cardápio bonito, rápido e simples de compartilhar.',
  generator: 'v0.app',
  keywords: [
    'cardápio digital',
    'cardápio online',
    'cardápio para restaurante',
    'cardápio para delivery',
    'cardápio whatsapp',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Cardápio Digital | Cardápio Online Rápido e Fácil',
    description: 'Cardápio digital para restaurantes, lanchonetes e delivery. Mais pedidos no WhatsApp com um cardápio bonito, rápido e simples de compartilhar.',
    url: 'https://cardapio.digital',
    siteName: 'Cardápio Digital',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cardápio Digital | Cardápio Online Rápido e Fácil',
    description: 'Cardápio digital para restaurantes, lanchonetes e delivery. Mais pedidos no WhatsApp com um cardápio bonito, rápido e simples de compartilhar.',
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
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
