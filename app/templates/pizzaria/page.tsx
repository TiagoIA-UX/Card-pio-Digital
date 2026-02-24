"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Minus, ShoppingCart, MessageCircle, X, Pizza } from "lucide-react"
import { OrderForm, OrderInfo, defaultOrderInfo, canSubmitOrder, formatOrderMessage } from "@/components/order-form"

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
  // Pizzas Tradicionais
  {
    id: "pizza-1",
    name: "Calabresa",
    description: "Molho de tomate, mussarela, calabresa fatiada e cebola",
    price: 45.90,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=80",
    category: "Pizzas Tradicionais"
  },
  {
    id: "pizza-2",
    name: "Mussarela",
    description: "Molho de tomate, mussarela e orégano",
    price: 42.90,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&auto=format&fit=crop&q=80",
    category: "Pizzas Tradicionais"
  },
  {
    id: "pizza-3",
    name: "Portuguesa",
    description: "Molho de tomate, mussarela, presunto, ovos, cebola e azeitona",
    price: 49.90,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80",
    category: "Pizzas Tradicionais"
  },
  {
    id: "pizza-4",
    name: "Frango com Catupiry",
    description: "Molho de tomate, mussarela, frango desfiado e catupiry",
    price: 52.90,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=80",
    category: "Pizzas Tradicionais"
  },
  // Pizzas Especiais
  {
    id: "esp-1",
    name: "Quatro Queijos",
    description: "Mussarela, provolone, gorgonzola e parmesão",
    price: 58.90,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&auto=format&fit=crop&q=80",
    category: "Pizzas Especiais"
  },
  {
    id: "esp-2",
    name: "Pepperoni",
    description: "Molho de tomate, mussarela e pepperoni importado",
    price: 56.90,
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&auto=format&fit=crop&q=80",
    category: "Pizzas Especiais"
  },
  {
    id: "esp-3",
    name: "Margherita",
    description: "Molho de tomate, mussarela de búfala, tomate e manjericão fresco",
    price: 54.90,
    image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400&auto=format&fit=crop&q=80",
    category: "Pizzas Especiais"
  },
  // Pizzas Doces
  {
    id: "doce-1",
    name: "Chocolate com Morango",
    description: "Chocolate ao leite, morangos frescos e leite condensado",
    price: 48.90,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=80",
    category: "Pizzas Doces"
  },
  {
    id: "doce-2",
    name: "Romeu e Julieta",
    description: "Mussarela e goiabada cremosa",
    price: 44.90,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80",
    category: "Pizzas Doces"
  },
  // Bordas
  {
    id: "borda-1",
    name: "Borda de Catupiry",
    description: "Adicional para qualquer pizza",
    price: 8.00,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&auto=format&fit=crop&q=80",
    category: "Bordas Recheadas"
  },
  {
    id: "borda-2",
    name: "Borda de Cheddar",
    description: "Adicional para qualquer pizza",
    price: 8.00,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&auto=format&fit=crop&q=80",
    category: "Bordas Recheadas"
  },
  // Bebidas
  {
    id: "bebida-1",
    name: "Refrigerante 2L",
    description: "Coca-Cola, Guaraná ou Fanta",
    price: 14.00,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80",
    category: "Bebidas"
  },
  {
    id: "bebida-2",
    name: "Suco Natural 1L",
    description: "Laranja, limão ou maracujá",
    price: 16.00,
    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&auto=format&fit=crop&q=80",
    category: "Bebidas"
  }
]

const categories = [...new Set(menuItems.map(item => item.category))]
const WHATSAPP_NUMBER = "5512996887993"

export default function PizzariaTemplate() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [step, setStep] = useState<"cart" | "form">("cart")
  const [orderInfo, setOrderInfo] = useState<OrderInfo>(defaultOrderInfo)

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId)
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i)
      }
      return prev.filter(i => i.id !== itemId)
    })
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const sendToWhatsApp = () => {
    const message = formatOrderMessage(cart, orderInfo, totalPrice, "Pizzaria", "🍕")
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const closeCart = () => { setIsCartOpen(false); setStep("cart") }

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Voltar</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Pizza className="h-5 w-5 text-primary" />
            <h1 className="font-bold text-foreground">Pizzaria Demo</h1>
          </div>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-foreground hover:text-primary transition-colors"
          >
            <ShoppingCart className="h-6 w-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Banner */}
      <div className="relative h-40 md:h-52 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1579751626657-72bc17010498?w=1200&auto=format&fit=crop&q=80"
          alt="Pizzaria"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-sm text-muted-foreground">📍 Demonstração de Cardápio</p>
          <h2 className="text-2xl font-bold text-foreground">Pizzaria Bella Napoli</h2>
          <p className="text-sm text-muted-foreground mt-1">As melhores pizzas da região</p>
        </div>
      </div>

      {/* Menu */}
      <div className="mx-auto max-w-4xl px-4 py-6">
        {categories.map(category => (
          <div key={category} className="mb-8">
            <h3 className="text-lg font-bold text-foreground mb-4 pb-2 border-b border-border">
              {category}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {menuItems.filter(item => item.category === category).map(item => (
                <div key={item.id} className="flex gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
                  <img 
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground truncate">{item.name}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">
                        R$ {item.price.toFixed(2).replace('.', ',')}
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Fixed Cart Button */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full max-w-md mx-auto flex items-center justify-between px-6 py-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Ver carrinho ({totalItems})
            </span>
            <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={closeCart} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                {step === "form" && <button onClick={() => setStep("cart")} className="p-1 hover:bg-secondary rounded-lg"><ArrowLeft className="h-5 w-5" /></button>}
                <h3 className="text-lg font-bold text-foreground">{step === "cart" ? "Seu Pedido" : "Dados para Entrega"}</h3>
              </div>
              <button onClick={closeCart} className="p-2 hover:bg-secondary rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {step === "cart" ? (
                cart.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Seu carrinho está vazio</p>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">{item.name}</h4>
                          <p className="text-sm text-primary font-semibold">
                            R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 rounded-full bg-secondary hover:bg-secondary/80"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-6 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <OrderForm orderInfo={orderInfo} setOrderInfo={setOrderInfo} onBack={() => setStep("cart")} />
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="p-4 border-t border-border space-y-4">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                </div>
                {step === "cart" ? (
                  <button onClick={() => setStep("form")} className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
                    Continuar para dados de entrega
                  </button>
                ) : (
                  <button
                    onClick={sendToWhatsApp}
                    disabled={!canSubmitOrder(orderInfo)}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-colors ${canSubmitOrder(orderInfo) ? "bg-[#25D366] text-white hover:bg-[#20bd5a]" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
                  >
                    <MessageCircle className="h-5 w-5" />
                    Enviar pedido pelo WhatsApp
                  </button>
                )}
                <p className="text-xs text-center text-muted-foreground">
                  Este é um cardápio de demonstração
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
