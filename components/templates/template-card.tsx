'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Zap, Eye, Sparkles, TrendingUp } from 'lucide-react'
import { StarRatingCompact } from '@/components/shared/star-rating'
import { cn } from '@/lib/utils'

interface TemplateCardProps {
  template: {
    id: string
    slug: string
    name: string
    description?: string
    price: number
    originalPrice?: number
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
  const hasDiscount = template.originalPrice && template.originalPrice > template.price
  const discountPercent = hasDiscount
    ? Math.round(((template.originalPrice! - template.price) / template.originalPrice!) * 100)
    : 0

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
        {hasDiscount && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
            -{discountPercent}%
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
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-foreground text-2xl font-bold">R$ {template.price.toFixed(0)}</span>
          {hasDiscount && (
            <span className="text-muted-foreground text-sm line-through">
              R$ {template.originalPrice?.toFixed(0)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2">
          <Link
            href={`/comprar/${template.slug}`}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
          >
            <Zap className="h-4 w-4" />
            Escolher plano
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
