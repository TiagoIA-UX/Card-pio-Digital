import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPartner, getAllPartnerSlugs } from '@/lib/ai-image-generator-partners'
import { GeradorImagensPartnerClient } from './client'

interface Props {
  params: Promise<{ partnerSlug: string }>
}

export async function generateStaticParams() {
  return getAllPartnerSlugs().map((slug) => ({ partnerSlug: slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { partnerSlug } = await params
  const partner = getPartner(partnerSlug)
  if (!partner) return {}

  const title = `Gerador de Imagens IA — ${partner.displayName} × Zairyx`
  const description = partner.description

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  }
}

export default async function PartnerGeradorImagensPage({ params }: Props) {
  const { partnerSlug } = await params
  const partner = getPartner(partnerSlug)

  if (!partner) notFound()

  return <GeradorImagensPartnerClient partner={partner} />
}
