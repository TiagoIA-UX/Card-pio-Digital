"use client"

import { ShoppingCart } from "lucide-react"
import { useCartStore, useCartTotals } from "@/store/cart-store"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

interface CartButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  showLabel?: boolean
}

export function CartButton({ 
  className, 
  variant = 'default',
  showLabel = false 
}: CartButtonProps) {
  const toggleCart = useCartStore((state) => state.toggleCart)
  const { itemCount } = useCartTotals()
  const [isAnimating, setIsAnimating] = useState(false)
  const [mounted, setMounted] = useState(false)
  const prevCountRef = useRef(itemCount)
  const mountedRef = useRef(false)

  // Evitar hydration mismatch - use ref to track
  useEffect(() => {
    mountedRef.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    return () => { mountedRef.current = false }
  }, [])

  // Animar quando adicionar item
  useEffect(() => {
    if (mountedRef.current && itemCount > prevCountRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAnimating(true)
      const timer = setTimeout(() => {
        if (mountedRef.current) setIsAnimating(false)
      }, 300)
      return () => clearTimeout(timer)
    }
    prevCountRef.current = itemCount
  }, [itemCount])

  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-border bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground'
  }

  return (
    <button
      onClick={toggleCart}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-full p-3 transition-all",
        variantClasses[variant],
        isAnimating && "scale-110",
        className
      )}
      aria-label={`Carrinho${mounted && itemCount > 0 ? ` com ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}` : ''}`}
    >
      <ShoppingCart className="h-5 w-5" />
      
      {showLabel && <span className="hidden sm:inline">Carrinho</span>}

      {/* Badge de contador */}
      {mounted && itemCount > 0 && (
        <span 
          className={cn(
            "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white",
            isAnimating && "animate-bounce"
          )}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  )
}
