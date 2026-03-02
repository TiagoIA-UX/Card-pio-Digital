"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  ShoppingCart, 
  MessageCircle,
  X,
  Wine
} from "lucide-react"
import { OrderForm, OrderInfo, defaultOrderInfo, canSubmitOrder, formatOrderMessage } from "@/components/order-form"
import { DemoLocation } from "@/components/templates/demo-location"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
}

interface CartItem extends MenuItem {
  quantity: number
}

const menuItems: MenuItem[] = [
  // Cervejas
  {
    id: "cerv-1",
    name: "Cerveja Long Neck",
    description: "Heineken, Budweiser ou Corona",
    price: 12.90,
    image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&auto=format&fit=crop&q=80",
    category: "Cervejas"
  },
  {
    id: "cerv-2",
    name: "Cerveja Artesanal",
    description: "IPA, Pilsen ou Weiss - 500ml",
    price: 22.90,
    image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&auto=format&fit=crop&q=80",
    category: "Cervejas"
  },
  {
    id: "cerv-3",
    name: "Balde de Cerveja (5un)",
    description: "5 long necks no gelo",
    price: 55.00,
    image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&auto=format&fit=crop&q=80",
    category: "Cervejas"
  },
  // Drinks
  {
    id: "drink-1",
    name: "Caipirinha",
    description: "Cachaça, limão, açúcar e gelo",
    price: 18.90,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop&q=80",
    category: "Drinks"
  },
  {
    id: "drink-2",
    name: "Moscow Mule",
    description: "Vodka, espuma de gengibre, limão e hortelã",
    price: 28.90,
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&auto=format&fit=crop&q=80",
    category: "Drinks"
  },
  {
    id: "drink-3",
    name: "Gin Tônica",
    description: "Gin, água tônica, especiarias e frutas",
    price: 32.90,
    image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&auto=format&fit=crop&q=80",
    category: "Drinks"
  },
  {
    id: "drink-4",
    name: "Mojito",
    description: "Rum, hortelã, limão, açúcar e água com gás",
    price: 26.90,
    image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&auto=format&fit=crop&q=80",
    category: "Drinks"
  },
  // Porções
  {
    id: "porcao-1",
    name: "Batata Frita com Cheddar",
    description: "Batata frita coberta com cheddar e bacon",
    price: 38.90,
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=80",
    category: "Porções"
  },
  {
    id: "porcao-2",
    name: "Isca de Peixe",
    description: "Iscas de tilápia empanadas com molho tártaro",
    price: 45.90,
    image: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&auto=format&fit=crop&q=80",
    category: "Porções"
  },
  {
    id: "porcao-3",
    name: "Bolinho de Bacalhau (8un)",
    description: "Bolinhos artesanais de bacalhau",
    price: 42.90,
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&auto=format&fit=crop&q=80",
    category: "Porções"
  },
  {
    id: "porcao-4",
    name: "Frango a Passarinho",
    description: "Pedaços de frango temperados e fritos",
    price: 39.90,
    image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=400&auto=format&fit=crop&q=80",
    category: "Porções"
  },
  // Sem Álcool
  {
    id: "sem-1",
    name: "Refrigerante",
    description: "Coca-Cola, Guaraná ou água tônica",
    price: 7.00,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80",
    category: "Sem Álcool"
  },
  {
    id: "sem-2",
    name: "Suco Natural",
    description: "Laranja, limão, abacaxi ou maracujá",
    price: 12.00,
    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&auto=format&fit=crop&q=80",
    category: "Sem Álcool"
  },
  {
    id: "sem-3",
    name: "Água de Coco",
    description: "Água de coco natural gelada",
    price: 8.00,
    image: "https://images.unsplash.com/photo-1544252890-c21d8c95a743?w=400&auto=format&fit=crop&q=80",
    category: "Sem Álcool"
  }
]

const categories = [...new Set(menuItems.map(item => item.category))]
const WHATSAPP_NUMBER = "5512996887993"

export default function BarTemplate() {
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
    const message = formatOrderMessage(cart, orderInfo, totalPrice, "Bar", "🍺")
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const closeCart = () => { setIsCartOpen(false); setStep("cart") }

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Voltar</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Wine className="h-5 w-5 text-primary" />
            <h1 className="font-bold text-foreground">Bar Demo</h1>
          </div>
          
          <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-foreground hover:text-primary transition-colors">
            <ShoppingCart className="h-6 w-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="relative h-40 md:h-52 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1200&auto=format&fit=crop&q=80" alt="Bar" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-sm text-muted-foreground">📍 Demonstração de Cardápio</p>
          <h2 className="text-2xl font-bold text-foreground">Boteco do Zé</h2>
          <p className="text-sm text-muted-foreground mt-1">O melhor happy hour da cidade</p>
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
                      <button onClick={() => addToCart(item)} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                        <Plus className="h-4 w-4" />Adicionar
                      </button>
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
