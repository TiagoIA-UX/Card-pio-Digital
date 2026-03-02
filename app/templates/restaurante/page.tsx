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
  Utensils,
  MapPin,
  CreditCard,
  User,
  Phone,
  FileText
} from "lucide-react"
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

interface OrderInfo {
  nome: string
  telefone: string
  tipoAtendimento: "entrega" | "retirada"
  endereco: string
  bairro: string
  complemento: string
  pagamento: string
  observacoes: string
}

const menuItems: MenuItem[] = [
  // Pratos Executivos
  {
    id: "exec-1",
    name: "Prato Executivo Completo",
    description: "Arroz, feijão, bife acebolado, batata frita e salada",
    price: 32.90,
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop&q=80",
    category: "Pratos Executivos"
  },
  {
    id: "exec-2",
    name: "Frango Grelhado",
    description: "Arroz, feijão, filé de frango grelhado, legumes e salada",
    price: 29.90,
    image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&auto=format&fit=crop&q=80",
    category: "Pratos Executivos"
  },
  {
    id: "exec-3",
    name: "Peixe do Dia",
    description: "Arroz, pirão, filé de peixe frito, vinagrete e salada",
    price: 35.90,
    image: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&auto=format&fit=crop&q=80",
    category: "Pratos Executivos"
  },
  // Marmitas
  {
    id: "marmita-1",
    name: "Marmita P (300g)",
    description: "Arroz, feijão, 1 proteína e salada",
    price: 18.90,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80",
    category: "Marmitas"
  },
  {
    id: "marmita-2",
    name: "Marmita M (450g)",
    description: "Arroz, feijão, 1 proteína, farofa e salada",
    price: 22.90,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80",
    category: "Marmitas"
  },
  {
    id: "marmita-3",
    name: "Marmita G (600g)",
    description: "Arroz, feijão, 2 proteínas, farofa e salada",
    price: 28.90,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80",
    category: "Marmitas"
  },
  // Porções
  {
    id: "porcao-1",
    name: "Porção de Batata Frita",
    description: "500g de batata frita crocante",
    price: 25.90,
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=80",
    category: "Porções"
  },
  {
    id: "porcao-2",
    name: "Porção de Frango à Passarinho",
    description: "600g de frango temperado e frito",
    price: 35.90,
    image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=400&auto=format&fit=crop&q=80",
    category: "Porções"
  },
  // Bebidas
  {
    id: "bebida-1",
    name: "Refrigerante Lata",
    description: "Coca-Cola, Guaraná ou Fanta",
    price: 6.00,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80",
    category: "Bebidas"
  },
  {
    id: "bebida-2",
    name: "Suco Natural 500ml",
    description: "Laranja, limão, maracujá ou abacaxi",
    price: 10.00,
    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&auto=format&fit=crop&q=80",
    category: "Bebidas"
  },
  {
    id: "bebida-3",
    name: "Água Mineral",
    description: "Com ou sem gás - 500ml",
    price: 4.00,
    image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&auto=format&fit=crop&q=80",
    category: "Bebidas"
  }
]

const categories = [...new Set(menuItems.map(item => item.category))]

const WHATSAPP_NUMBER = "5512996887993"

export default function RestauranteTemplate() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [step, setStep] = useState<"cart" | "form">("cart")
  const [orderInfo, setOrderInfo] = useState<OrderInfo>({
    nome: "",
    telefone: "",
    tipoAtendimento: "entrega",
    endereco: "",
    bairro: "",
    complemento: "",
    pagamento: "PIX",
    observacoes: ""
  })

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

  const formatDate = () => {
    const now = new Date()
    return now.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const sendToWhatsApp = () => {
    // Agrupar itens por categoria
    const itemsByCategory: { [key: string]: CartItem[] } = {}
    cart.forEach(item => {
      if (!itemsByCategory[item.category]) {
        itemsByCategory[item.category] = []
      }
      itemsByCategory[item.category].push(item)
    })

    let itemsList = ""
    Object.entries(itemsByCategory).forEach(([category, items]) => {
      itemsList += `*Categoria: ${category}*\n`
      items.forEach(item => {
        itemsList += `- ${item.quantity}x ${item.name} (R$ ${item.price.toFixed(2).replace('.', ',')})\n`
      })
      itemsList += "\n"
    })

    const enderecoInfo = orderInfo.tipoAtendimento === "entrega" 
      ? `*Endereço:* ${orderInfo.endereco}\n*Bairro:* ${orderInfo.bairro}${orderInfo.complemento ? `\n*Complemento:* ${orderInfo.complemento}` : ""}`
      : "_Retirada no local_"

    const message = `🍽️ *Pedido via Cardápio Digital*
*Template:* Restaurante
*Data:* ${formatDate()}

*Cliente:* ${orderInfo.nome}
*Telefone:* ${orderInfo.telefone}
*Atendimento:* ${orderInfo.tipoAtendimento === "entrega" ? "Entrega" : "Retirada"}
${enderecoInfo}
*Pagamento:* ${orderInfo.pagamento}

*Itens do Pedido:*
${itemsList}
💰 *Total: R$ ${totalPrice.toFixed(2).replace('.', ',')}*
${orderInfo.observacoes ? `\n📝 *Observações:* ${orderInfo.observacoes}` : ""}

_(Pedido de demonstração)_`
    
    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank')
  }

  const canSubmit = orderInfo.nome && orderInfo.telefone && 
    (orderInfo.tipoAtendimento === "retirada" || (orderInfo.endereco && orderInfo.bairro))

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
            <Utensils className="h-5 w-5 text-primary" />
            <h1 className="font-bold text-foreground">Restaurante Demo</h1>
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
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80"
          alt="Restaurante"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-sm text-muted-foreground">📍 Demonstração de Cardápio</p>
          <h2 className="text-2xl font-bold text-foreground">Restaurante Sabor Caseiro</h2>
          <p className="text-sm text-muted-foreground mt-1">Comida caseira feita com carinho</p>
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

      <DemoLocation />

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
          <div className="absolute inset-0 bg-black/50" onClick={() => { setIsCartOpen(false); setStep("cart"); }} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                {step === "form" && (
                  <button onClick={() => setStep("cart")} className="p-1 hover:bg-secondary rounded-lg">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                <h3 className="text-lg font-bold text-foreground">
                  {step === "cart" ? "Seu Pedido" : "Dados para Entrega"}
                </h3>
              </div>
              <button onClick={() => { setIsCartOpen(false); setStep("cart"); }} className="p-2 hover:bg-secondary rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {step === "cart" ? (
                <>
                  {cart.length === 0 ? (
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
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  {/* Dados do Cliente */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <User className="h-4 w-4" /> Dados do Cliente
                    </h4>
                    <input
                      type="text"
                      placeholder="Nome completo *"
                      value={orderInfo.nome}
                      onChange={(e) => setOrderInfo({...orderInfo, nome: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="tel"
                      placeholder="Telefone com DDD *"
                      value={orderInfo.telefone}
                      onChange={(e) => setOrderInfo({...orderInfo, telefone: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Tipo de Atendimento */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Tipo de Atendimento
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setOrderInfo({...orderInfo, tipoAtendimento: "entrega"})}
                        className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                          orderInfo.tipoAtendimento === "entrega" 
                            ? "border-primary bg-primary/10 text-primary" 
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        🛵 Entrega
                      </button>
                      <button
                        onClick={() => setOrderInfo({...orderInfo, tipoAtendimento: "retirada"})}
                        className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                          orderInfo.tipoAtendimento === "retirada" 
                            ? "border-primary bg-primary/10 text-primary" 
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        🏪 Retirada
                      </button>
                    </div>
                  </div>

                  {/* Endereço (só aparece se for entrega) */}
                  {orderInfo.tipoAtendimento === "entrega" && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-foreground">Endereço de Entrega</h4>
                      <input
                        type="text"
                        placeholder="Rua e número *"
                        value={orderInfo.endereco}
                        onChange={(e) => setOrderInfo({...orderInfo, endereco: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="text"
                        placeholder="Bairro *"
                        value={orderInfo.bairro}
                        onChange={(e) => setOrderInfo({...orderInfo, bairro: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="text"
                        placeholder="Complemento (apto, bloco, referência)"
                        value={orderInfo.complemento}
                        onChange={(e) => setOrderInfo({...orderInfo, complemento: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  )}

                  {/* Forma de Pagamento */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <CreditCard className="h-4 w-4" /> Forma de Pagamento
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {["PIX", "Dinheiro", "Cartão Crédito", "Cartão Débito"].map((opcao) => (
                        <button
                          key={opcao}
                          onClick={() => setOrderInfo({...orderInfo, pagamento: opcao})}
                          className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                            orderInfo.pagamento === opcao 
                              ? "border-primary bg-primary/10 text-primary" 
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {opcao}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Observações
                    </h4>
                    <textarea
                      placeholder="Alguma observação sobre o pedido? (opcional)"
                      value={orderInfo.observacoes}
                      onChange={(e) => setOrderInfo({...orderInfo, observacoes: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="p-4 border-t border-border space-y-4">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                </div>
                {step === "cart" ? (
                  <button
                    onClick={() => setStep("form")}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Continuar para dados de entrega
                  </button>
                ) : (
                  <button
                    onClick={sendToWhatsApp}
                    disabled={!canSubmit}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-colors ${
                      canSubmit 
                        ? "bg-[#25D366] text-white hover:bg-[#20bd5a]" 
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
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
