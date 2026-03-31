import React from 'react'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gerador de Imagens IA',
  description:
    'Gere imagens profissionais de produtos, comidas, logos e muito mais com Inteligência Artificial. Ideal para cardápios digitais, e-commerce e redes sociais.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
