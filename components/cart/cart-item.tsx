'use client'

import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import { useCartStore } from '@/store/cart-store'
import type { CartItem as CartItemType } from '@/types/cart'

interface CartItemProps {
  item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
  const removeItem = useCartStore((state) => state.removeItem)
  const { template } = item

  const hasDiscount = template.originalPrice && template.originalPrice > template.price
  const discountPercent = hasDiscount
    ? Math.round(((template.originalPrice! - template.price) / template.originalPrice!) * 100)
    : 0

  return (
    <div className="hover:bg-muted/50 flex gap-4 px-6 py-4 transition-colors">
      {/* Imagem */}
      <div className="bg-muted relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
        <Image
          src={template.imageUrl}
          alt={template.name}
          fill
          className="h-full w-full object-cover"
        />
        {hasDiscount && (
          <div className="absolute top-1 left-1 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            -{discountPercent}%
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <h3 className="text-foreground truncate font-medium">{template.name}</h3>
          <p className="text-muted-foreground mt-0.5 text-xs">Template de canal digital — Zairyx</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-foreground font-semibold">R$ {template.price.toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-muted-foreground text-xs line-through">
                R$ {template.originalPrice?.toFixed(2)}
              </span>
            )}
          </div>

          {/* Remover */}
          <button
            onClick={() => removeItem(template.id)}
            className="text-muted-foreground rounded-full p-2 transition-colors hover:bg-red-500/10 hover:text-red-500"
            aria-label={`Remover ${template.name} do carrinho`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
