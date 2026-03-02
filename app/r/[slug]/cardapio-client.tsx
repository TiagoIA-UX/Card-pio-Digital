"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Minus, ShoppingCart, MessageCircle, X, Store, Loader2 } from "lucide-react"
import { createClient, type Product, type Restaurant, type CartItem } from "@/lib/supabase/client"

interface CardapioClientProps {
  restaurant: Restaurant
  products: Product[]
}

export default function CardapioClient({ restaurant, products }: CardapioClientProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Agrupar produtos por categoria
  const categories = [...new Set(products.map(p => p.categoria))]
  const productsByCategory = categories.reduce((acc, cat) => {
    acc[cat] = products.filter(p => p.categoria === cat)
    return acc
  }, {} as Record<string, Product[]>)

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id)
      if (existing) {
        return prev.map(i => i.product_id === product.id ? { ...i, quantidade: i.quantidade + 1 } : i)
      }
      return [...prev, { 
        product_id: product.id, 
        nome: product.nome, 
        preco: product.preco, 
        quantidade: 1,
        imagem_url: product.imagem_url
      }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === productId)
      if (existing && existing.quantidade > 1) {
        return prev.map(i => i.product_id === productId ? { ...i, quantidade: i.quantidade - 1 } : i)
      }
      return prev.filter(i => i.product_id !== productId)
    })
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantidade, 0)
  const totalPrice = cart.reduce((sum, item) => sum + (item.preco * item.quantidade), 0)

  const submitOrder = async () => {
    if (cart.length === 0) return
    
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          items: cart.map(item => ({
            product_id: item.product_id,
            quantidade: item.quantidade
          })),
          tipo_entrega: 'retirada'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar pedido')
      }

      // Limpar carrinho e redirecionar para WhatsApp
      setCart([])
      setIsCartOpen(false)
      window.open(data.whatsapp_url, '_blank')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Banner */}
      {restaurant.banner_url && (
        <div className="relative h-40 sm:h-52 overflow-hidden">
          <img 
            src={restaurant.banner_url} 
            alt={restaurant.nome} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt={restaurant.nome} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary">
                <Store className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-foreground">{restaurant.nome}</h1>
              {restaurant.slogan && <p className="text-xs text-muted-foreground">{restaurant.slogan}</p>}
            </div>
          </div>
          
          <button 
            onClick={() => setIsCartOpen(true)} 
            title="Abrir carrinho"
            aria-label="Abrir carrinho"
            className="relative p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <ShoppingCart className="h-6 w-6" />
            {totalItems > 0 && (
              <span 
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs text-white flex items-center justify-center bg-primary"
              >
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Menu */}
      <div className="mx-auto max-w-4xl px-4 py-6">
        {categories.map(category => (
          <section key={category} className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border">{category}</h2>
            <div className="grid gap-4">
              {productsByCategory[category].map(product => (
                <div 
                  key={product.id} 
                  className="flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                >
                  {product.imagem_url && (
                    <img 
                      src={product.imagem_url} 
                      alt={product.nome} 
                      className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{product.nome}</h3>
                    {product.descricao && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.descricao}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-primary">
                        R$ {product.preco.toFixed(2).replace('.', ',')}
                      </span>
                      <button
                        onClick={() => addToCart(product)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-sm font-medium transition-colors bg-primary"
                        title={`Adicionar ${product.nome}`}
                        aria-label={`Adicionar ${product.nome}`}
                      >
                        <Plus className="h-4 w-4" /> Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {products.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum produto disponível no momento</p>
          </div>
        )}
      </div>

      {/* Botão flutuante do carrinho */}
      {totalItems > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-4 right-4 z-40">
          <button 
            onClick={() => setIsCartOpen(true)} 
            className="w-full max-w-md mx-auto flex items-center justify-between px-6 py-4 rounded-xl text-white font-semibold shadow-lg bg-primary"
            title="Abrir carrinho"
            aria-label="Abrir carrinho"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Ver carrinho ({totalItems})
            </span>
            <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
          </button>
        </div>
      )}

      {/* Drawer do Carrinho */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsCartOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">Seu Pedido</h3>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-secondary rounded-lg" title="Fechar carrinho" aria-label="Fechar carrinho">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Seu carrinho está vazio</p>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.product_id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                      {item.imagem_url && (
                        <img src={item.imagem_url} alt={item.nome} className="w-16 h-16 rounded-lg object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{item.nome}</h4>
                        <p className="text-sm font-semibold text-primary">
                          R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => removeFromCart(item.product_id)} 
                          title={`Remover uma unidade de ${item.nome}`}
                          aria-label={`Remover uma unidade de ${item.nome}`}
                          className="p-1.5 rounded-full bg-secondary"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center font-medium">{item.quantidade}</span>
                        <button 
                          onClick={() => {
                            const product = products.find(p => p.id === item.product_id)
                            if (product) addToCart(product)
                          }} 
                          className="p-1.5 rounded-full text-white bg-primary"
                          title={`Adicionar uma unidade de ${item.nome}`}
                          aria-label={`Adicionar uma unidade de ${item.nome}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="p-4 border-t border-border space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">
                    R$ {totalPrice.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <button
                  onClick={submitOrder}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#25D366] text-white font-semibold hover:bg-[#20bd5a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <MessageCircle className="h-5 w-5" />
                  )}
                  {isSubmitting ? 'Enviando...' : 'Fazer pedido pelo WhatsApp'}
                </button>
                <p className="text-xs text-center text-muted-foreground">
                  O pedido será salvo automaticamente
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
