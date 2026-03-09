'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, Loader2 } from 'lucide-react'
import CardapioClient from '@/app/r/[slug]/cardapio-client'
import { buildTemplateDemoData, getRestaurantTemplateConfig } from '@/lib/templates-config'
import type { RestaurantTemplateSlug } from '@/lib/restaurant-customization'

export function TemplatePreviewPage({ slug }: { slug: RestaurantTemplateSlug }) {
  const template = getRestaurantTemplateConfig(slug)
  const demo = buildTemplateDemoData(slug)

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
            Demo real reutilizando o renderer do cardápio
          </div>
          <Link
            href={`/comprar/${template.slug}`}
            className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-colors"
          >
            Escolher este template
          </Link>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="bg-background flex min-h-[60vh] items-center justify-center">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
          </div>
        }
      >
        <CardapioClient restaurant={demo.restaurant} products={demo.products} />
      </Suspense>
    </div>
  )
}
