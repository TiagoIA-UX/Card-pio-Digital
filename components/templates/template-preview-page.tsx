'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, Loader2 } from 'lucide-react'
import CardapioClient from '@/app/r/[slug]/cardapio-client'
import {
  buildTemplateDemoData,
  getRestaurantTemplateConfig,
} from '@/lib/domains/marketing/templates-config'
import {
  getTemplatePlans,
  getTemplatePlanCheckoutHref,
} from '@/lib/domains/marketing/template-plans'
import type { RestaurantTemplateSlug } from '@/lib/domains/core/restaurant-customization'

export function TemplatePreviewPage({ slug }: { slug: RestaurantTemplateSlug }) {
  const template = getRestaurantTemplateConfig(slug)
  const preview = buildTemplateDemoData(slug)
  const plans = getTemplatePlans(slug)

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>

          <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-600">
            <Eye className="h-3.5 w-3.5" />
            Prévia real
          </div>

          <div className="flex items-center gap-2">
            {plans.map((plan) => (
              <Link
                key={plan.id}
                href={getTemplatePlanCheckoutHref(slug, plan.name, 'self-service')}
                className={
                  plan.popular
                    ? 'rounded-full bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-700'
                    : 'rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50'
                }
              >
                Até {plan.maxProducts} · R$ {plan.priceMonthly % 1 === 0 ? plan.priceMonthly : plan.priceMonthly.toFixed(2).replace('.', ',')}/mês
              </Link>
            ))}
          </div>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        }
      >
        <CardapioClient restaurant={preview.restaurant} products={preview.products} isDemoPreview />
      </Suspense>
    </div>
  )
}
