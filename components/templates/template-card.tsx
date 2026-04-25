'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Eye, Sparkles, TrendingUp } from 'lucide-react'
import {
  getTemplatePlans,
  getTemplatePlanCheckoutHref,
} from '@/lib/domains/marketing/template-plans'
import { TEMPLATE_PRICING } from '@/lib/domains/marketing/pricing'
import type { RestaurantTemplateSlug } from '@/lib/domains/core/restaurant-customization'
import { cn } from '@/lib/shared/utils'

interface TemplateCardProps {
  template: {
    id: string
    slug: string
    name: string
    description?: string
    price: number
    originalPrice?: number
    priceMonthly?: number
    priceAnnual?: number
    imageUrl: string
    category: string
    isNew?: boolean
    isBestseller?: boolean
    isFeatured?: boolean
    salesCount?: number
    ratingAvg?: number
    ratingCount?: number
  }
  variant?: 'default' | 'compact' | 'featured'
}

const monthlyPriceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const setupPriceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function TemplateCard({ template, variant = 'default' }: TemplateCardProps) {
  const plans = getTemplatePlans(template.slug)
  const pricing = TEMPLATE_PRICING[template.slug as RestaurantTemplateSlug]

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-300',
        'hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100/50',
        variant === 'featured' && 'border-orange-200 bg-orange-50/30'
      )}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {template.isNew && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-2.5 py-1 text-xs font-bold text-white">
            <Sparkles className="h-3 w-3" />
            NOVO
          </span>
        )}
        {template.isBestseller && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white">
            <TrendingUp className="h-3 w-3" />
            MAIS VENDIDO
          </span>
        )}
      </div>

      {/* Imagem */}
      <Link href={`/templates/${template.slug}`} className="block">
        <div className="relative aspect-4/3 overflow-hidden bg-zinc-100">
          <Image
            src={template.imageUrl}
            alt={template.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
              <Eye className="h-4 w-4" />
              Ver demonstração
            </span>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-5">
        <span className="text-xs font-medium tracking-wider text-zinc-400 uppercase">
          {template.category}
        </span>
        <h3 className="mt-1 text-lg font-semibold text-zinc-950">{template.name}</h3>
        {template.description && variant !== 'compact' && (
          <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{template.description}</p>
        )}

        {/* Ativação profissional — valor de implantação do template */}
        {pricing && (
          <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50/60 px-4 py-3">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-orange-700 uppercase">
              Ativação profissional deste template
            </p>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-zinc-950">
              <span className="text-xs font-medium text-zinc-500">a partir de</span>
              <span className="text-xl font-bold leading-none">
                {setupPriceFormatter.format(pricing.selfService.pix)}
              </span>
              <span className="text-xs font-medium text-zinc-500">à vista no PIX</span>
            </p>
            <p className="mt-1.5 text-[11px] leading-snug text-zinc-600">
              Pagamento único de implantação — seu canal entra no ar configurado. A mensalidade só
              passa a contar depois da ativação.
            </p>
          </div>
        )}

        {/* Seletor de plano */}
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-zinc-500">Quantos produtos você vai vender?</p>
          {plans.map((plan) => (
            <Link
              key={plan.id}
              href={getTemplatePlanCheckoutHref(template.slug, plan.name, 'self-service')}
              className={cn(
                'flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition-colors',
                plan.popular
                  ? 'border-orange-300 bg-orange-50 font-semibold text-zinc-950 hover:bg-orange-100'
                  : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
              )}
            >
              <span className="flex flex-col text-left leading-tight">
                <span>{plan.displayName}</span>
                <span className="text-xs font-normal text-zinc-500">
                  Até {plan.maxProducts} produtos
                </span>
              </span>
              <span className="font-semibold text-zinc-950">
                {monthlyPriceFormatter.format(plan.priceMonthly)}/mês
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// Grid de templates
export function TemplateGrid({
  templates,
  className,
}: {
  templates: TemplateCardProps['template'][]
  className?: string
}) {
  return (
    <div className={cn('grid gap-6 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} />
      ))}
    </div>
  )
}
