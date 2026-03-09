"use client"

import { useEffect, useState, Suspense } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useCartStore, useCartTotals } from "@/store/cart-store"
import { 
  CreditCard, 
  QrCode, 
  Shield, 
  Lock,
  ArrowLeft,
  Loader2,
  Tag,
  X,
  Check,
  ShoppingBag,
  Trash2,
  AlertCircle
} from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { CheckoutSkeleton } from "@/components/shared/loading-skeleton"

function CheckoutPageContent() {
  const router = useRouter()
  const supabase = createClient()
  
  // Cart state
  const items = useCartStore((state) => state.items)
  const coupon = useCartStore((state) => state.coupon)
  const applyCoupon = useCartStore((state) => state.applyCoupon)
  const removeCoupon = useCartStore((state) => state.removeCoupon)
  const removeItem = useCartStore((state) => state.removeItem)
  const clearCart = useCartStore((state) => state.clearCart)
  const { subtotal, discount, total, itemCount } = useCartTotals()
  
  // Local state
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('card')
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState('')

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login?redirect=/painel')
        return
      }
      
      setUser(session.user)
      setLoading(false)
    }
    
    checkAuth()
  }, [router, supabase])

  // Handle coupon application
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    
    setCouponLoading(true)
    setCouponError('')
    
    const success = await applyCoupon(couponCode)
    
    if (!success) {
      setCouponError('Cupom inválido ou expirado')
    } else {
      setCouponCode('')
    }
    
    setCouponLoading(false)
  }

  // Handle checkout
  const handleCheckout = async () => {
    if (!acceptTerms) {
      setError('Você precisa aceitar os termos de uso')
      return
    }

    if (items.length === 0) {
      setError('Seu carrinho está vazio')
      return
    }

    setProcessing(true)
    setError('')

    try {
      // Criar preferência no Mercado Pago
      const response = await fetch('/api/checkout/criar-sessao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            templateId: item.templateId,
            name: item.template.name,
            price: item.template.price,
            quantity: item.quantity
          })),
          couponId: coupon?.id,
          paymentMethod,
          userId: user?.id,
          email: user?.email
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar sessão de pagamento')
      }

      // Redirecionar para o Mercado Pago
      if (data.init_point) {
        window.location.href = data.init_point
      } else if (data.sandbox_init_point) {
        window.location.href = data.sandbox_init_point
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento')
      setProcessing(false)
    }
  }

  // Calcular valores com método de pagamento
  const pixDiscount = Math.round(subtotal * 0.15) // 15% desconto no PIX
  const finalSubtotal = paymentMethod === 'pix' ? subtotal - pixDiscount : subtotal
  const finalTotal = paymentMethod === 'pix' ? total - pixDiscount : total
  const installmentValue = Math.round(finalTotal / 6)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <CheckoutSkeleton />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <EmptyState 
          variant="cart"
          action={{ 
            label: "Ver Templates", 
            href: "/templates" 
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link 
            href="/templates" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Continuar comprando
          </Link>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">Checkout Seguro</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">Finalizar Compra</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Itens do Carrinho */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Itens ({itemCount})
                </h2>
                <button
                  onClick={clearCart}
                  className="text-sm text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpar
                </button>
              </div>

              <div className="divide-y divide-border">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={item.template.imageUrl}
                        alt={item.template.name}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {item.template.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Template de cardápio digital
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        R$ {item.template.price.toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeItem(item.templateId)}
                        className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cupom de Desconto */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Cupom de desconto
              </h2>

              {coupon ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-green-700 dark:text-green-400">
                      {coupon.code}
                    </span>
                    <span className="text-sm text-green-600">
                      (-R$ {coupon.discountValue.toFixed(2)})
                    </span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="p-1 text-green-600 hover:text-green-800 transition-colors"
                    aria-label="Remover cupom"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Digite o código"
                    className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-6 py-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 disabled:opacity-50 transition-colors"
                  >
                    {couponLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      'Aplicar'
                    )}
                  </button>
                </div>
              )}

              {couponError && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {couponError}
                </p>
              )}
            </div>

            {/* Método de Pagamento */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Forma de pagamento
              </h2>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* PIX */}
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    paymentMethod === 'pix'
                      ? 'border-green-500 bg-green-500/5'
                      : 'border-border hover:border-green-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <QrCode className={`h-6 w-6 ${paymentMethod === 'pix' ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <span className="font-semibold text-foreground">PIX</span>
                    {paymentMethod === 'pix' && (
                      <Check className="h-5 w-5 text-green-500 ml-auto" />
                    )}
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    R$ {(subtotal - pixDiscount - discount).toFixed(2)}
                  </p>
                  <p className="text-xs text-green-600">
                    15% de desconto à vista
                  </p>
                </button>

                {/* Cartão */}
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    paymentMethod === 'card'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className={`h-6 w-6 ${paymentMethod === 'card' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-semibold text-foreground">Cartão</span>
                    {paymentMethod === 'card' && (
                      <Check className="h-5 w-5 text-primary ml-auto" />
                    )}
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    6x R$ {installmentValue.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sem juros
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Coluna Resumo */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card rounded-2xl border border-border p-6">
              <h2 className="font-semibold text-foreground mb-4">Resumo do pedido</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'itens'})</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                
                {paymentMethod === 'pix' && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto PIX (15%)</span>
                    <span>- R$ {pixDiscount.toFixed(2)}</span>
                  </div>
                )}

                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Cupom ({coupon?.code})</span>
                    <span>- R$ {discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-lg font-bold text-foreground">
                    <span>Total</span>
                    <span>R$ {finalTotal.toFixed(2)}</span>
                  </div>
                  {paymentMethod === 'card' && (
                    <p className="text-xs text-muted-foreground text-right mt-1">
                      ou 6x de R$ {installmentValue.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {/* Termos */}
              <label className="flex items-start gap-3 mt-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-xs text-muted-foreground">
                  Li e aceito os{' '}
                  <Link href="/termos" className="text-primary hover:underline">
                    Termos de Uso
                  </Link>{' '}
                  e{' '}
                  <Link href="/privacidade" className="text-primary hover:underline">
                    Política de Privacidade
                  </Link>
                </span>
              </label>

              {/* Erro */}
              {error && (
                <p className="mt-4 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}

              {/* CTA */}
              <button
                onClick={handleCheckout}
                disabled={processing || !acceptTerms}
                className="w-full mt-6 py-4 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-lg transition-all hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Pagar com Mercado Pago
                  </>
                )}
              </button>

              {/* Segurança */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-4 w-4 text-green-500" />
                Pagamento 100% seguro
              </div>

              {/* Badges de segurança */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-center gap-4 opacity-60">
                  <Image
                    src="https://www.mercadopago.com/v2/security/assets/images/shields-logos.png"
                    alt="Segurança Mercado Pago"
                    width={160}
                    height={24}
                    unoptimized
                    className="h-6 w-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <CheckoutPageContent />
    </Suspense>
  )
}
