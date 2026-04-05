'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react'
import { useCartStore, useCartTotals } from '@/store/cart-store'
import { CartItem } from './cart-item'
import { cn } from '@/lib/shared/utils'

export function CartDrawer() {
  const pathname = usePathname()
  const isOpen = useCartStore((state) => state.isOpen)
  const closeCart = useCartStore((state) => state.closeCart)
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const { subtotal, discount, total, itemCount } = useCartTotals()
  const shouldHideOnRoute =
    pathname?.startsWith('/pagamento') || pathname?.startsWith('/onboarding') || false

  useEffect(() => {
    if (shouldHideOnRoute && isOpen) {
      closeCart()
    }
  }, [closeCart, isOpen, shouldHideOnRoute])

  // Bloquear scroll do body quando aberto
  useEffect(() => {
    if (shouldHideOnRoute) {
      document.body.style.overflow = ''
      return
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, shouldHideOnRoute])

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart()
    }

    if (shouldHideOnRoute) {
      return
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [closeCart, shouldHideOnRoute])

  if (shouldHideOnRoute) {
    return null
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          'bg-background fixed top-0 right-0 z-50 h-full w-full max-w-md shadow-2xl transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-label="Carrinho de compras"
        aria-modal="true"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-border flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className="text-primary h-5 w-5" />
              <h2 className="text-foreground text-lg font-semibold">
                Carrinho
                {itemCount > 0 && (
                  <span className="text-muted-foreground ml-2 text-sm font-normal">
                    ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
                  </span>
                )}
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-full p-2 transition-colors"
              aria-label="Fechar carrinho"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              /* Empty State */
              <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
                <div className="bg-muted mb-4 rounded-full p-6">
                  <ShoppingBag className="text-muted-foreground h-12 w-12" />
                </div>
                <h3 className="text-foreground mb-2 text-lg font-medium">
                  Seu carrinho está vazio
                </h3>
                <p className="text-muted-foreground mb-6 max-w-xs text-sm">
                  Adicione templates ao seu carrinho para continuar com a compra
                </p>
                <Link
                  href="/templates"
                  onClick={closeCart}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-colors"
                >
                  Ver Templates
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              /* Items List */
              <div className="divide-border divide-y">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-border space-y-4 border-t px-6 py-4">
              {/* Limpar carrinho */}
              <button
                onClick={clearCart}
                className="text-muted-foreground flex items-center gap-2 text-sm transition-colors hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
                Limpar carrinho
              </button>

              {/* Totais */}
              <div className="space-y-2 text-sm">
                <div className="text-muted-foreground flex justify-between">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto</span>
                    <span>- R$ {discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="text-foreground border-border flex justify-between border-t pt-2 text-lg font-semibold">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>

              {/* CTA */}
              <Link
                href="/meus-templates"
                onClick={closeCart}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-semibold transition-colors"
              >
                Finalizar Compra
                <ArrowRight className="h-5 w-5" />
              </Link>

              <p className="text-muted-foreground text-center text-xs">
                Pagamento seguro via Mercado Pago
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
