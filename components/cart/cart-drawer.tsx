"use client"

import { useEffect } from "react"
import Link from "next/link"
import { X, ShoppingBag, ArrowRight, Trash2 } from "lucide-react"
import { useCartStore, useCartTotals } from "@/store/cart-store"
import { CartItem } from "./cart-item"
import { cn } from "@/lib/utils"

export function CartDrawer() {
  const isOpen = useCartStore((state) => state.isOpen)
  const closeCart = useCartStore((state) => state.closeCart)
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const { subtotal, discount, total, itemCount } = useCartTotals()

  // Bloquear scroll do body quando aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [closeCart])

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background shadow-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-label="Carrinho de compras"
        aria-modal="true"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Carrinho
                {itemCount > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
                  </span>
                )}
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
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
                <div className="mb-4 rounded-full bg-muted p-6">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-foreground">
                  Seu carrinho está vazio
                </h3>
                <p className="mb-6 text-sm text-muted-foreground max-w-xs">
                  Adicione templates ao seu carrinho para continuar com a compra
                </p>
                <Link
                  href="/templates"
                  onClick={closeCart}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Ver Templates
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              /* Items List */
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-border px-6 py-4 space-y-4">
              {/* Limpar carrinho */}
              <button
                onClick={clearCart}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Limpar carrinho
              </button>

              {/* Totais */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto</span>
                    <span>- R$ {discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold text-foreground pt-2 border-t border-border">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>

              {/* CTA */}
              <Link
                href="/meus-templates"
                onClick={closeCart}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Finalizar Compra
                <ArrowRight className="h-5 w-5" />
              </Link>

              <p className="text-center text-xs text-muted-foreground">
                Pagamento seguro via Mercado Pago
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
