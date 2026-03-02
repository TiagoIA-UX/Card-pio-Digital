"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { 
  CreditCard, 
  QrCode, 
  Check, 
  Shield, 
  Clock,
  Store,
  Loader2,
  ArrowLeft,
  Sparkles
} from "lucide-react"
import Link from "next/link"

const PRICES = {
  pix: { amount: 497, label: "R$ 497", description: "à vista no PIX" },
  card: { amount: 597, label: "6x R$ 99,50", description: "sem juros no cartão" }
}

function CheckoutContent() {
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [restaurant, setRestaurant] = useState<{ id: string; nome: string } | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<'pix' | 'card'>('card')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login?redirect=/checkout')
        return
      }

      const { data } = await supabase
        .from('restaurants')
        .select('id, nome, status_pagamento')
        .eq('user_id', session.user.id)
        .single()

      if (!data) {
        router.push('/painel/criar-restaurante')
        return
      }

      if (data.status_pagamento === 'ativo') {
        router.push('/painel')
        return
      }

      setRestaurant(data)
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const handlePayment = async () => {
    if (!restaurant) return
    
    setProcessing(true)

    try {
      const response = await fetch('/api/pagamento/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          paymentMethod: selectedMethod
        })
      })

      const data = await response.json()

      if (data.initPoint) {
        // Redirecionar para o checkout do Mercado Pago
        window.location.href = data.initPoint
      } else {
        alert('Erro ao criar pagamento. Tente novamente.')
        setProcessing(false)
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao processar. Tente novamente.')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Cardápio Digital</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        {/* Título */}
        <div className="text-center mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Último passo
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Ative seu Cardápio Digital
          </h1>
          <p className="text-muted-foreground">
            {restaurant?.nome}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Coluna Esquerda - Escolha do Pagamento */}
          <div className="space-y-4">
            <h2 className="font-semibold text-foreground">Escolha a forma de pagamento</h2>
            
            {/* Opção Cartão */}
            <button
              onClick={() => setSelectedMethod('card')}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                selectedMethod === 'card' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${selectedMethod === 'card' ? 'bg-primary/10' : 'bg-secondary'}`}>
                  <CreditCard className={`h-6 w-6 ${selectedMethod === 'card' ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Cartão de Crédito</span>
                    {selectedMethod === 'card' && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    6x R$ 99,50 <span className="text-sm font-normal text-green-600">sem juros</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total: R$ 597,00
                  </p>
                </div>
              </div>
            </button>

            {/* Opção PIX */}
            <button
              onClick={() => setSelectedMethod('pix')}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                selectedMethod === 'pix' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${selectedMethod === 'pix' ? 'bg-primary/10' : 'bg-secondary'}`}>
                  <QrCode className={`h-6 w-6 ${selectedMethod === 'pix' ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">PIX</span>
                    <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                      -R$100
                    </span>
                    {selectedMethod === 'pix' && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    R$ 497,00 <span className="text-sm font-normal text-muted-foreground">à vista</span>
                  </p>
                  <p className="text-sm text-green-600">
                    Economize R$ 100
                  </p>
                </div>
              </div>
            </button>

            {/* Botão de Pagamento */}
            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full mt-4 py-4 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-lg transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  {selectedMethod === 'pix' ? (
                    <>Pagar R$ 497 com PIX</>
                  ) : (
                    <>Pagar 6x R$ 99,50</>
                  )}
                </>
              )}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Pagamento seguro processado pelo Mercado Pago
            </p>
          </div>

          {/* Coluna Direita - O que está incluso */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-4">O que está incluso</h2>
            
            <ul className="space-y-3">
              <IncludedItem text="Site profissional com seu cardápio" />
              <IncludedItem text="Pedidos direto no seu WhatsApp" />
              <IncludedItem text="Painel para editar produtos" />
              <IncludedItem text="Alterar preços, fotos e descrições" />
              <IncludedItem text="Adicionar/remover itens do cardápio" />
              <IncludedItem text="Personalizar cores e logo" />
              <IncludedItem text="QR Code para divulgação" />
              <IncludedItem text="Sem comissão por pedido" />
              <IncludedItem text="Suporte por WhatsApp" />
            </ul>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Shield className="h-5 w-5 text-green-500" />
                <span>Pagamento 100% seguro</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>Acesso liberado imediatamente após o pagamento</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function IncludedItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <Check className="h-5 w-5 text-green-500 shrink-0" />
      <span className="text-foreground">{text}</span>
    </li>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
