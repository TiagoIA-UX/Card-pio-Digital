import type { Metadata } from 'next'
import { GeradorImagensClient } from './client'
import { BRAND_SHORT } from '@/lib/brand'

export const metadata: Metadata = {
  title: `Gerador de Imagens IA — ${BRAND_SHORT}`,
  description:
    'Gere imagens profissionais de produtos, comidas, logos e muito mais com Inteligência Artificial. Ideal para cardápios digitais, e-commerce e redes sociais.',
  openGraph: {
    title: `Gerador de Imagens IA — ${BRAND_SHORT}`,
    description: 'Crie imagens profissionais com IA em segundos. Comidas, produtos, logos e muito mais.',
  },
}

export default function GeradorImagensPage() {
  return <GeradorImagensClient />
}
