'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Zap, Eye, Sparkles, TrendingUp } from 'lucide-react'
import { StarRatingCompact } from '@/components/shared/star-rating'
import { getTemplatePricing } from '@/lib/pricing'
import { cn } from '@/lib/utils'

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

export function TemplateCard({ template, variant = 'default' }: TemplateCardProps) {
  const detailedPricing = getTemplatePricing(
    template.slug as Parameters<typeof getTemplatePricing>[0]
  )

  return (
    <div
      className={cn(
        'group border-border bg-card relative overflow-hidden rounded-2xl border transition-all duration-300',
        'hover:border-primary/50 hover:shadow-primary/5 hover:shadow-lg',
        variant === 'featured' && 'border-primary/30 bg-primary/5'
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
      <div className="bg-muted relative aspect-[4/3] overflow-hidden">
        <Image
          src={template.imageUrl}
          alt={template.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Overlay com preview */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Link
            href={`/templates/${template.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            <Eye className="h-4 w-4" />
            Ver detalhes
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 p-5">
        {/* Category & Rating */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {template.category}
          </span>
          {template.ratingAvg !== undefined && template.ratingAvg > 0 && (
            <StarRatingCompact rating={template.ratingAvg} count={template.ratingCount} />
          )}
        </div>

        {/* Title */}
        <h3 className="text-foreground group-hover:text-primary line-clamp-1 text-lg font-semibold transition-colors">
          {template.name}
        </h3>

        {/* Description */}
        {template.description && variant !== 'compact' && (
          <p className="text-muted-foreground line-clamp-2 text-sm">{template.description}</p>
        )}

        {/* Sales count */}
        {template.salesCount !== undefined && template.salesCount > 0 && (
          <p className="text-muted-foreground text-xs">
            {template.salesCount.toLocaleString()} vendas
          </p>
        )}

        {/* Price */}
        <div className="space-y-1 pt-1">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Hoje
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-foreground text-2xl font-bold">
              R$ {detailedPricing.selfService.pix}
            </span>
            <span className="text-muted-foreground text-sm">no PIX</span>
          </div>
          <p className="text-muted-foreground text-sm">
            PIX no menor valor · outros meios via Mercado Pago · crédito até 12x
          </p>
          <p className="text-foreground/70 text-sm">
            Depois:{' '}
            <span className="text-foreground font-semibold">
              R$ {detailedPricing.selfService.monthly}/mês
            </span>
          </p>
          <p className="text-foreground/70 text-sm">
            Equipe configura: hoje{' '}
            <span className="text-foreground font-semibold">
              R$ {detailedPricing.feitoPraVoce.pix}
            </span>{' '}
            + depois{' '}
            <span className="text-foreground font-semibold">
              R$ {detailedPricing.feitoPraVoce.monthly}/mês
            </span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <Link
            href={`/templates/${template.slug}`}
            className="border-border hover:bg-muted inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <Eye className="h-4 w-4" />
            Testar demonstração
          </Link>
          <Link
            href={`/comprar/${template.slug}?plano=self-service`}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
          >
            <Zap className="h-4 w-4" />
            Você configura
          </Link>
          <Link
            href={`/comprar/${template.slug}?plano=feito-pra-voce`}
            className="border-border hover:bg-muted inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Equipe configura
          </Link>
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
