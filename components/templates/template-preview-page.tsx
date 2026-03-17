'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, Loader2, Sparkles, Zap } from 'lucide-react'
import CardapioClient from '@/app/r/[slug]/cardapio-client'
import { getTemplatePricing } from '@/lib/pricing'
import { buildTemplateDemoData, getRestaurantTemplateConfig } from '@/lib/templates-config'
import type { RestaurantTemplateSlug } from '@/lib/restaurant-customization'

export function TemplatePreviewPage({ slug }: { slug: RestaurantTemplateSlug }) {
  const template = getRestaurantTemplateConfig(slug)
  const preview = buildTemplateDemoData(slug)
  const pricing = getTemplatePricing(slug)

  return (
    <div className="bg-background min-h-screen">
      <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link
            href="/templates"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para templates
          </Link>
          <div className="bg-primary/10 text-primary flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold">
            <Eye className="h-4 w-4" />
            Prévia real do cardápio
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href={`/comprar/${template.slug}?plano=self-service`}
              className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
            >
              <Zap className="h-4 w-4" />
              Você configura · hoje R$ {pricing.selfService.pix} · depois R${' '}
              {pricing.selfService.monthly}/mês
            </Link>
            <Link
              href={`/comprar/${template.slug}?plano=feito-pra-voce`}
              className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Equipe configura · hoje R$ {pricing.feitoPraVoce.pix} · depois R${' '}
              {pricing.feitoPraVoce.monthly}/mês
            </Link>
          </div>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="bg-background flex min-h-[60vh] items-center justify-center">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
          </div>
        }
      >
        <CardapioClient restaurant={preview.restaurant} products={preview.products} />
      </Suspense>
    </div>
  )
}
