"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Minus, ShoppingCart, MessageCircle, X, Fish } from "lucide-react"
import { OrderForm, OrderInfo, defaultOrderInfo, canSubmitOrder, formatOrderMessage } from "@/components/order-form"
import { DemoLocation } from "@/components/templates/demo-location"

interface MenuItem { id: string; name: string; description: string; price: number; image: string; category: string }
interface CartItem extends MenuItem { quantity: number }

const menuItems: MenuItem[] = [
  // Sushis
  { id: "sushi-1", name: "Sushi de Salmão (8 un)", description: "Sushi tradicional de salmão fresco", price: 32.90, image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&auto=format&fit=crop&q=80", category: "Sushis" },
  { id: "sushi-2", name: "Sushi de Atum (8 un)", description: "Sushi de atum premium", price: 36.90, image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&auto=format&fit=crop&q=80", category: "Sushis" },
  { id: "sushi-3", name: "Sushi Misto (10 un)", description: "Seleção de sushis variados", price: 42.90, image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&auto=format&fit=crop&q=80", category: "Sushis" },
  // Sashimis
  { id: "sash-1", name: "Sashimi de Salmão (10 fatias)", description: "Fatias de salmão fresco", price: 48.90, image: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400&auto=format&fit=crop&q=80", category: "Sashimis" },
  { id: "sash-2", name: "Sashimi de Atum (10 fatias)", description: "Fatias de atum premium", price: 54.90, image: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400&auto=format&fit=crop&q=80", category: "Sashimis" },
  { id: "sash-3", name: "Sashimi Misto (12 fatias)", description: "Mix de sashimis variados", price: 58.90, image: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400&auto=format&fit=crop&q=80", category: "Sashimis" },
  // Rolls Especiais
  { id: "roll-1", name: "Hot Philadelphia", description: "Roll empanado com salmão e cream cheese", price: 34.90, image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&auto=format&fit=crop&q=80", category: "Rolls Especiais" },
  { id: "roll-2", name: "Dragon Roll", description: "Roll com camarão, abacate e cobertura de salmão", price: 46.90, image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&auto=format&fit=crop&q=80", category: "Rolls Especiais" },
  { id: "roll-3", name: "Uramaki Skin", description: "Roll com pele de salmão crocante e cream cheese", price: 32.90, image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&auto=format&fit=crop&q=80", category: "Rolls Especiais" },
  { id: "roll-4", name: "Vulcão de Salmão", description: "Roll gratinado com cobertura especial de salmão", price: 52.90, image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&auto=format&fit=crop&q=80", category: "Rolls Especiais" },
  // Temakis
  { id: "temaki-1", name: "Temaki Salmão", description: "Cone de nori com arroz e salmão fresco", price: 24.90, image: "https://images.unsplash.com/photo-1534256958597-7fe685cbd745?w=400&auto=format&fit=crop&q=80", category: "Temakis" },
  { id: "temaki-2", name: "Temaki Atum", description: "Cone de nori com arroz e atum premium", price: 26.90, image: "https://images.unsplash.com/photo-1534256958597-7fe685cbd745?w=400&auto=format&fit=crop&q=80", category: "Temakis" },
  { id: "temaki-3", name: "Temaki Camarão", description: "Cone de nori com arroz e camarão empanado", price: 28.90, image: "https://images.unsplash.com/photo-1534256958597-7fe685cbd745?w=400&auto=format&fit=crop&q=80", category: "Temakis" },
  { id: "temaki-4", name: "Temaki Philadelphia", description: "Cone de nori com salmão e cream cheese", price: 26.90, image: "https://images.unsplash.com/photo-1534256958597-7fe685cbd745?w=400&auto=format&fit=crop&q=80", category: "Temakis" },
  // Combos
  { id: "combo-1", name: "Combo Individual", description: "8 peças + 4 sashimis + 1 temaki", price: 65.90, image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&auto=format&fit=crop&q=80", category: "Combos" },
  { id: "combo-2", name: "Combo Casal", description: "20 peças + 8 sashimis + 2 temakis", price: 119.90, image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&auto=format&fit=crop&q=80", category: "Combos" },
  { id: "combo-3", name: "Combo Família", description: "40 peças + 16 sashimis + 4 temakis", price: 219.90, image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&auto=format&fit=crop&q=80", category: "Combos" },
  // Bebidas
  { id: "beb-1", name: "Saquê quente", description: "Dose de saquê tradicional", price: 18.90, image: "https://images.unsplash.com/photo-1567767292786-bc2db0305c1f?w=400&auto=format&fit=crop&q=80", category: "Bebidas" },
  { id: "beb-2", name: "Chá Gelado", description: "Chá verde ou de jasmim", price: 9.90, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop&q=80", category: "Bebidas" }
]

const categories = [...new Set(menuItems.map(item => item.category))]
const WHATSAPP_NUMBER = "5512996887993"

export default function SushiTemplate() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [step, setStep] = useState<"cart" | "form">("cart")
  const [orderInfo, setOrderInfo] = useState<OrderInfo>(defaultOrderInfo)

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId)
      if (existing && existing.quantity > 1) return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i)
      return prev.filter(i => i.id !== itemId)
    })
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const sendToWhatsApp = () => {
    const message = formatOrderMessage(cart, orderInfo, totalPrice, "Japonês / Sushi", "🍣")
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const closeCart = () => { setIsCartOpen(false); setStep("cart") }

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /><span className="hidden sm:inline">Voltar</span></Link>
          <div className="flex items-center gap-2"><Fish className="h-5 w-5 text-primary" /><h1 className="font-bold text-foreground">Sushi Demo</h1></div>
          <button onClick={() => setIsCartOpen(true)} className="relative p-2">
            <ShoppingCart className="h-6 w-6" />
            {totalItems > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">{totalItems}</span>}
          </button>
        </div>
      </header>

      <div className="relative h-40 md:h-52 overflow-hidden bg-gray-900">
        <img src="https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=1200&auto=format&fit=crop&q=80" alt="Sushi" className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-sm text-muted-foreground">📍 Demonstração de Cardápio</p>
          <h2 className="text-2xl font-bold text-foreground">Sushi Zen</h2>
          <p className="text-sm text-muted-foreground mt-1">Culinária japonesa autêntica</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {categories.map(category => (
          <div key={category} className="mb-8">
            <h3 className="text-lg font-bold text-foreground mb-4 pb-2 border-b border-border">{category}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {menuItems.filter(item => item.category === category).map(item => (
                <div key={item.id} className="flex gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
                  <img src={item.image} alt={item.name} className="w-24 h-24 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground truncate">{item.name}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">R$ {item.price.toFixed(2).replace('.', ',')}</span>
                      <button onClick={() => addToCart(item)} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"><Plus className="h-4 w-4" />Adicionar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <DemoLocation />

      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
          <button onClick={() => setIsCartOpen(true)} className="w-full max-w-md mx-auto flex items-center justify-between px-6 py-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg">
            <span className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" />Ver carrinho ({totalItems})</span>
            <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
          </button>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={closeCart} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                {step === "form" && <button onClick={() => setStep("cart")} className="p-2 hover:bg-secondary rounded-lg"><ArrowLeft className="h-5 w-5" /></button>}
                <h3 className="text-lg font-bold text-foreground">{step === "cart" ? "Seu Pedido" : "Dados do Pedido"}</h3>
              </div>
              <button onClick={closeCart} className="p-2 hover:bg-secondary rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {step === "cart" ? (
                cart.length === 0 ? <p className="text-center text-muted-foreground py-8">Seu carrinho está vazio</p> : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">{item.name}</h4>
                          <p className="text-sm text-primary font-semibold">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => removeFromCart(item.id)} className="p-1.5 rounded-full bg-secondary"><Minus className="h-4 w-4" /></button>
                          <span className="w-6 text-center font-medium">{item.quantity}</span>
                          <button onClick={() => addToCart(item)} className="p-1.5 rounded-full bg-primary text-primary-foreground"><Plus className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <OrderForm orderInfo={orderInfo} setOrderInfo={setOrderInfo} />
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t border-border space-y-4">
                <div className="flex items-center justify-between text-lg font-bold"><span>Total</span><span className="text-primary">R$ {totalPrice.toFixed(2).replace('.', ',')}</span></div>
                {step === "cart" ? (
                  <button onClick={() => setStep("form")} className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90">Continuar</button>
                ) : (
                  <button onClick={sendToWhatsApp} disabled={!canSubmitOrder(orderInfo)} className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#25D366] text-white font-semibold hover:bg-[#20bd5a] disabled:opacity-50 disabled:cursor-not-allowed"><MessageCircle className="h-5 w-5" />Enviar pedido pelo WhatsApp</button>
                )}
                <p className="text-xs text-center text-muted-foreground">Este é um cardápio de demonstração</p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
