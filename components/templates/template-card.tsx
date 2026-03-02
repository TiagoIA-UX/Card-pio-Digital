"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  ShoppingCart, 
  Zap, 
  Eye, 
  Check,
  Sparkles,
  TrendingUp,
  Star
} from "lucide-react"
import { useCartStore } from "@/store/cart-store"
import { StarRatingCompact } from "@/components/shared/star-rating"
import { cn } from "@/lib/utils"

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
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const addItem = useCartStore((state) => state.addItem)
  const items = useCartStore((state) => state.items)
  
  const isInCart = items.some((item) => item.templateId === template.id)
  
  const hasDiscount = template.originalPrice && template.originalPrice > template.price
  const discountPercent = hasDiscount
    ? Math.round(((template.originalPrice! - template.price) / template.originalPrice!) * 100)
    : 0

  const handleAddToCart = async () => {
    if (isInCart) return
    
    setIsAddingToCart(true)
    
    // Simular pequeno delay para feedback visual
    await new Promise((resolve) => setTimeout(resolve, 300))
    
    addItem({
      id: template.id,
      slug: template.slug,
      name: template.name,
      price: template.price,
      originalPrice: template.originalPrice,
      imageUrl: template.imageUrl
    })
    
    setIsAddingToCart(false)
    setAddedToCart(true)
    
    // Reset estado após 2 segundos
    setTimeout(() => setAddedToCart(false), 2000)
  }

  return (
    <div 
      className={cn(
        "group relative rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300",
        "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
        variant === 'featured' && "border-primary/30 bg-primary/5"
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
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={template.imageUrl}
          alt={template.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Overlay com preview */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Link
            href={`/templates/${template.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white hover:bg-white/30 transition-colors"
          >
            <Eye className="h-4 w-4" />
            Ver detalhes
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Category & Rating */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {template.category}
          </span>
          {template.ratingAvg !== undefined && template.ratingAvg > 0 && (
            <StarRatingCompact 
              rating={template.ratingAvg} 
              count={template.ratingCount} 
            />
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {template.name}
        </h3>

        {/* Description */}
        {template.description && variant !== 'compact' && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {template.description}
          </p>
        )}

        {/* Sales count */}
        {template.salesCount !== undefined && template.salesCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {template.salesCount.toLocaleString()} vendas
          </p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-2xl font-bold text-foreground">
            R$ {template.price.toFixed(0)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              R$ {template.originalPrice?.toFixed(0)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {/* Comprar Agora */}
          <Link
            href={`/comprar/${template.slug}`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Zap className="h-4 w-4" />
            Comprar
          </Link>

          {/* Adicionar ao Carrinho */}
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || isInCart}
            className={cn(
              "inline-flex items-center justify-center rounded-xl p-3 transition-all",
              isInCart || addedToCart
                ? "bg-green-500/10 text-green-600"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            )}
            aria-label={isInCart ? "Já está no carrinho" : "Adicionar ao carrinho"}
          >
            {isAddingToCart ? (
              <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isInCart || addedToCart ? (
              <Check className="h-5 w-5" />
            ) : (
              <ShoppingCart className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Grid de templates
export function TemplateGrid({ 
  templates,
  className 
}: { 
  templates: TemplateCardProps['template'][]
  className?: string 
}) {
  return (
    <div className={cn(
      "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
      className
    )}>
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} />
      ))}
    </div>
  )
}
