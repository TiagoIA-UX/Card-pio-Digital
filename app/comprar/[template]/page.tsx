'use client'

import { useState, Suspense, useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  AlertCircle,
  Apple,
  ArrowLeft,
  Cake,
  Check,
  CreditCard,
  Croissant,
  Fish,
  Flame,
  IceCream,
  Loader2,
  PawPrint,
  Pizza,
  QrCode,
  Shield,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  UtensilsCrossed,
  Beer,
  Coffee,
  Wine,
  Zap,
  X,
} from 'lucide-react'
import { getTemplatePricing } from '@/lib/pricing'
import { PAYMENT_DESCRIPTOR_NOTE } from '@/lib/brand'
import { createClient } from '@/lib/supabase/client'
import { normalizePhone } from '@/lib/restaurant-onboarding'

const TEMPLATES = {
  restaurante: {
    nome: 'Restaurante',
    descricao: 'Marmitaria, self-service, pratos executivos',
    icon: Store,
    cor: 'bg-orange-500',
    imagem:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop&q=80',
  },
  pizzaria: {
    nome: 'Pizzaria',
    descricao: 'Pizzas, bordas recheadas, combos',
    icon: Pizza,
    cor: 'bg-red-500',
    imagem:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80',
  },
  lanchonete: {
    nome: 'Hamburgueria / Lanchonete',
    descricao: 'Burgers, hot dogs, lanches artesanais',
    icon: UtensilsCrossed,
    cor: 'bg-yellow-500',
    imagem:
      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&auto=format&fit=crop&q=80',
  },
  bar: {
    nome: 'Bar / Pub',
    descricao: 'Drinks, cervejas, petiscos',
    icon: Beer,
    cor: 'bg-amber-600',
    imagem:
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&auto=format&fit=crop&q=80',
  },
  cafeteria: {
    nome: 'Cafeteria',
    descricao: 'Cafés, doces, salgados',
    icon: Coffee,
    cor: 'bg-amber-800',
    imagem:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&auto=format&fit=crop&q=80',
  },
  acai: {
    nome: 'Açaíteria',
    descricao: 'Açaí, tigelas, smoothies',
    icon: IceCream,
    cor: 'bg-purple-600',
    imagem:
      'https://images.unsplash.com/photo-1590080874088-eec64895b423?w=400&auto=format&fit=crop&q=80',
  },
  sushi: {
    nome: 'Japonês / Sushi',
    descricao: 'Sushis, sashimis, temakis',
    icon: Fish,
    cor: 'bg-rose-600',
    imagem:
      'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&auto=format&fit=crop&q=80',
  },
  adega: {
    nome: 'Adega / Delivery de Bebidas',
    descricao: 'Cervejas, vinhos, destilados, kits',
    icon: Wine,
    cor: 'bg-purple-700',
    imagem:
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&auto=format&fit=crop&q=80',
  },
  mercadinho: {
    nome: 'Mercadinho / Minimercado',
    descricao: 'Bebidas, mercearia, frios, higiene, limpeza',
    icon: ShoppingCart,
    cor: 'bg-green-600',
    imagem:
      'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&auto=format&fit=crop&q=80',
  },
  padaria: {
    nome: 'Padaria / Confeitaria',
    descricao: 'Pães artesanais, salgados, bolos, cafés',
    icon: Croissant,
    cor: 'bg-amber-700',
    imagem:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80',
  },
  sorveteria: {
    nome: 'Sorveteria',
    descricao: 'Sorvetes artesanais, picolés, milkshakes',
    icon: IceCream,
    cor: 'bg-pink-500',
    imagem:
      'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&auto=format&fit=crop&q=80',
  },
  acougue: {
    nome: 'Açougue / Casa de Carnes',
    descricao: 'Cortes nobres, kits churrasco, embutidos',
    icon: Flame,
    cor: 'bg-red-800',
    imagem:
      'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&auto=format&fit=crop&q=80',
  },
  hortifruti: {
    nome: 'Hortifruti',
    descricao: 'Frutas, verduras, legumes, orgânicos',
    icon: Apple,
    cor: 'bg-green-700',
    imagem:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80',
  },
  petshop: {
    nome: 'Petshop',
    descricao: 'Rações, petiscos, higiene, acessórios',
    icon: PawPrint,
    cor: 'bg-sky-600',
    imagem:
      'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&auto=format&fit=crop&q=80',
  },
  doceria: {
    nome: 'Doceria / Confeitaria',
    descricao: 'Brigadeiros, bolos, trufas, encomendas',
    icon: Cake,
    cor: 'bg-pink-600',
    imagem:
      'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=400&auto=format&fit=crop&q=80',
  },
}

const PLAN_META = {
  'self-service': {
    nome: 'Você configura',
    descricao: 'Você configura e publica pelo painel, no seu ritmo.',
    icon: Zap,
    cor: 'border-blue-500 bg-blue-500/5',
    corIcone: 'text-blue-500 bg-blue-500/10',
    beneficios: [
      '1 restaurante ativo',
      'Editor visual completo',
      'Cardápio com fotos, categorias e organização profissional',
      'Link próprio para compartilhar',
      'Atualizações ilimitadas',
      'Suporte por WhatsApp',
    ],
  },
  'feito-pra-voce': {
    nome: 'Equipe configura',
    descricao: 'A equipe da Zairyx conduz a configuração inicial para você.',
    icon: Sparkles,
    cor: 'border-primary bg-primary/5',
    corIcone: 'text-primary bg-primary/10',
    recomendado: true,
    beneficios: [
      'Tudo da opção Você configura',
      'Implantação feita pela nossa equipe',
      'Você pode mandar fotos e preços após a compra',
      'Publicação em até 2 dias úteis após envio completo do onboarding',
      'Suporte prioritário',
      'Domínio personalizado incluso',
    ],
  },
}

function ComprarContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const templateId = String(params.template || '')
    .trim()
    .toLowerCase()
  const purchaseDraftKey = `purchase_draft:${templateId}`
  const template = TEMPLATES[templateId as keyof typeof TEMPLATES]

  // Lê ?plano= da URL — vindo da SecaoConversao na landing page
  const planoParam = searchParams.get('plano')
  const planoInicial: 'self-service' | 'feito-pra-voce' =
    planoParam === 'self-service' ? 'self-service' : 'feito-pra-voce'

  const [selectedPlan, setSelectedPlan] = useState<'self-service' | 'feito-pra-voce'>(planoInicial)
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('card')
  const [processing, setProcessing] = useState(false)
  const [loadingSession, setLoadingSession] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    restaurantName: '',
    customerName: '',
    email: '',
    phone: '',
  })
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string
    code: string
    discountValue: number
  } | null>(null)

  // Mantém seleção sincronizada ao usar voltar/avançar do navegador (async para evitar cascading renders)
  useEffect(() => {
    const p = searchParams.get('plano')
    if (p === 'self-service' || p === 'feito-pra-voce') {
      queueMicrotask(() => {
        setSelectedPlan(p)
        setAppliedCoupon(null)
        setCouponError('')
      })
    }
  }, [searchParams])

  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedDraft = window.localStorage.getItem(purchaseDraftKey)
        if (storedDraft) {
          const draft = JSON.parse(storedDraft) as {
            selectedPlan?: 'self-service' | 'feito-pra-voce'
            paymentMethod?: 'pix' | 'card'
            couponCode?: string
            form?: typeof form
          }
          if (draft.selectedPlan) setSelectedPlan(draft.selectedPlan)
          if (draft.paymentMethod) setPaymentMethod(draft.paymentMethod)
          if (draft.couponCode) setCouponCode(draft.couponCode)
          if (draft.form) {
            setForm((current) => ({ ...current, ...draft.form }))
          }
        }
      } catch {
        window.localStorage.removeItem(purchaseDraftKey)
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      const user = session?.user
      setIsAuthenticated(!!user)
      if (user) {
        setForm((current) => ({
          ...current,
          email: user.email || current.email,
          customerName:
            user.user_metadata?.name || user.user_metadata?.full_name || current.customerName,
        }))
      }

      setLoadingSession(false)
    }

    void loadSession()
  }, [purchaseDraftKey, supabase])

  const pricing = useMemo(
    () => getTemplatePricing((templateId || 'restaurante') as keyof typeof TEMPLATES),
    [templateId]
  )

  if (!template) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Template não encontrado</p>
      </div>
    )
  }
  const planMeta = PLAN_META[selectedPlan]
  const planPrices = selectedPlan === 'feito-pra-voce' ? pricing.feitoPraVoce : pricing.selfService
  const totalPix = planPrices.pix
  const totalCartao = planPrices.card
  const parcelas = planPrices.parcelas
  const parcelasMax = planPrices.parcelas_max
  const parcelaTotal = paymentMethod === 'card' ? planPrices.card_12x.toFixed(2) : '0.00'

  const subtotal = paymentMethod === 'pix' ? totalPix : totalCartao
  const discount = appliedCoupon?.discountValue ?? 0
  const total = Math.max(0, subtotal - discount)

  const resetCoupon = () => {
    setAppliedCoupon(null)
    setCouponError('')
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return

    setCouponLoading(true)
    setCouponError('')

    try {
      const response = await fetch('/api/checkout/validar-cupom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      })

      const data = await response.json()
      if (!data.valid || !data.coupon) {
        setAppliedCoupon(null)
        setCouponError(data.error || 'Cupom inválido')
        return
      }

      setAppliedCoupon({
        id: data.coupon.id,
        code: data.coupon.code,
        discountValue: data.coupon.discountValue,
      })
    } catch {
      setAppliedCoupon(null)
      setCouponError('Erro ao validar cupom')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isAuthenticated) {
      window.localStorage.setItem(
        purchaseDraftKey,
        JSON.stringify({
          selectedPlan,
          paymentMethod,
          couponCode,
          form,
        })
      )
      const redirectTarget = `/comprar/${templateId}?plano=${selectedPlan}`
      window.location.href = `/login?redirect=${encodeURIComponent(redirectTarget)}`
      return
    }

    setProcessing(true)
    setError('')

    try {
      const response = await fetch('/api/pagamento/iniciar-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: templateId,
          plan: selectedPlan,
          paymentMethod,
          restaurantName: form.restaurantName.trim(),
          customerName: form.customerName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: normalizePhone(form.phone),
          couponCode: appliedCoupon?.code,
          couponId: appliedCoupon?.id,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao iniciar pagamento')
      }

      window.localStorage.removeItem(purchaseDraftKey)

      window.location.href = data.init_point || data.sandbox_init_point
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erro ao processar pagamento')
      setProcessing(false)
    }
  }

  return (
    <div className="from-background to-secondary/20 min-h-screen bg-linear-to-b">
      {/* Header */}
      <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href={`/templates/${templateId}`}
            className="text-foreground/75 hover:text-foreground flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="flex items-center gap-2">
            <Store className="text-primary h-5 w-5" />
            <span className="text-foreground font-semibold">Cardápio Digital</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        {/* Template Escolhido */}
        <div className="mb-8 text-center">
          <p className="text-foreground/75 mb-2 text-sm">Template escolhido</p>
          <div className="border-border bg-card inline-flex items-center gap-3 rounded-full border px-4 py-2">
            <div className={`rounded-lg p-1.5 ${template.cor}`}>
              <template.icon className="h-4 w-4 text-white" />
            </div>
            <span className="text-foreground font-semibold">{template.nome}</span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Coluna Esquerda - Escolha do Plano */}
          <div className="space-y-4 lg:col-span-2">
            <h2 className="text-foreground mb-4 text-xl font-bold">Escolha o plano</h2>

            <button
              onClick={() => {
                setSelectedPlan('self-service')
                resetCoupon()
              }}
              className={`w-full rounded-2xl border-2 p-5 text-left transition-all ${
                selectedPlan === 'self-service'
                  ? PLAN_META['self-service'].cor + ' border-blue-500'
                  : 'border-border hover:border-blue-500/50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-xl p-3 ${PLAN_META['self-service'].corIcone}`}>
                  <Zap className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-foreground text-lg font-bold">
                      {PLAN_META['self-service'].nome}
                    </span>
                    {selectedPlan === 'self-service' && <Check className="h-5 w-5 text-blue-500" />}
                  </div>
                  <p className="text-foreground/75 mb-3 text-sm">
                    {PLAN_META['self-service'].descricao}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-foreground text-2xl font-bold">
                      R$ {pricing.selfService.pix}
                    </span>
                    <span className="text-foreground/70 text-sm">hoje no PIX</span>
                  </div>
                  <p className="text-foreground/65 mt-1 text-xs">
                    Hoje: PIX R$ {pricing.selfService.pix} ou R$ {pricing.selfService.card} nos
                    demais meios do Mercado Pago. No crédito, até {pricing.selfService.parcelas_max}
                    x de R$ {pricing.selfService.card_12x.toFixed(2)}. Depois: R${' '}
                    {pricing.selfService.monthly}/mês.
                  </p>
                </div>
              </div>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {PLAN_META['self-service'].beneficios.map((b, i) => (
                  <li key={i} className="text-foreground/80 flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 shrink-0 text-blue-500" />
                    {b}
                  </li>
                ))}
              </ul>
            </button>

            {/* Configuração pela equipe */}
            <button
              onClick={() => {
                setSelectedPlan('feito-pra-voce')
                resetCoupon()
              }}
              className={`relative w-full rounded-2xl border-2 p-5 text-left transition-all ${
                selectedPlan === 'feito-pra-voce'
                  ? PLAN_META['feito-pra-voce'].cor + ' border-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="absolute -top-3 left-4">
                <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-bold">
                  RECOMENDADO
                </span>
              </div>
              <div className="mt-2 flex items-start gap-4">
                <div className={`rounded-xl p-3 ${PLAN_META['feito-pra-voce'].corIcone}`}>
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-foreground text-lg font-bold">
                      {PLAN_META['feito-pra-voce'].nome}
                    </span>
                    {selectedPlan === 'feito-pra-voce' && (
                      <Check className="text-primary h-5 w-5" />
                    )}
                  </div>
                  <p className="text-foreground/75 mb-3 text-sm">
                    {PLAN_META['feito-pra-voce'].descricao}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-foreground text-2xl font-bold">
                      R$ {pricing.feitoPraVoce.pix}
                    </span>
                    <span className="text-foreground/70 text-sm">hoje no PIX</span>
                  </div>
                  <p className="text-foreground/65 mt-1 text-xs">
                    Hoje: PIX R$ {pricing.feitoPraVoce.pix} ou R$ {pricing.feitoPraVoce.card} nos
                    demais meios do Mercado Pago. No crédito, até{' '}
                    {pricing.feitoPraVoce.parcelas_max}x de R${' '}
                    {pricing.feitoPraVoce.card_12x.toFixed(2)}. Depois: R${' '}
                    {pricing.feitoPraVoce.monthly}/mês.
                  </p>
                </div>
              </div>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {PLAN_META['feito-pra-voce'].beneficios.map((b, i) => (
                  <li key={i} className="text-foreground/80 flex items-center gap-2 text-sm">
                    <Check className="text-primary h-4 w-4 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </button>

            {selectedPlan === 'feito-pra-voce' && (
              <div className="border-primary/20 bg-primary/5 rounded-2xl border p-4">
                <p className="text-foreground text-sm font-semibold">
                  Sem agenda para tocar isso agora? Esse plano resolve.
                </p>
                <p className="text-foreground/75 mt-1 text-sm leading-6">
                  Você conclui a compra, envia o material no seu tempo e a equipe publica após o
                  onboarding completo.
                </p>
              </div>
            )}

            {/* Forma de Pagamento */}
            <div className="mt-6">
              <h3 className="text-foreground mb-3 font-semibold">Forma de pagamento</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => {
                    setPaymentMethod('card')
                    resetCoupon()
                  }}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    paymentMethod === 'card'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard
                      className={`h-5 w-5 ${paymentMethod === 'card' ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                    <div>
                      <p className="text-foreground font-medium">
                        Cartão, boleto, débito e carteira MP
                      </p>
                      <p className="text-foreground/70 text-sm">
                        No valor desta opção · até 12x no crédito
                      </p>
                    </div>
                    {paymentMethod === 'card' && <Check className="text-primary ml-auto h-4 w-4" />}
                  </div>
                </button>

                <button
                  onClick={() => {
                    setPaymentMethod('pix')
                    resetCoupon()
                  }}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    paymentMethod === 'pix'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <QrCode
                      className={`h-5 w-5 ${paymentMethod === 'pix' ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                    <div>
                      <p className="text-foreground font-medium">PIX</p>
                      <p className="text-sm text-green-600">
                        Menor valor total · pagamento à vista
                      </p>
                    </div>
                    {paymentMethod === 'pix' && <Check className="text-primary ml-auto h-4 w-4" />}
                  </div>
                </button>
              </div>
              <p className="text-foreground/65 mt-3 text-xs leading-5">
                No Mercado Pago você pode concluir com PIX, boleto, cartão de crédito, débito ou
                carteira MP. O PIX mantém o menor valor total; os demais meios seguem o valor desta
                opção.
              </p>
            </div>

            <form
              id="purchase-form"
              onSubmit={handleSubmit}
              className="border-border bg-card space-y-4 rounded-2xl border p-6"
            >
              <div>
                <div className="bg-primary/10 text-primary mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
                  <Shield className="h-3.5 w-3.5" />
                  Compra segura com liberação automática do painel
                </div>
                <h3 className="text-foreground text-xl font-bold">Dados para liberar o painel</h3>
                <p className="text-foreground/75 mt-1 text-sm">
                  O painel é liberado após a confirmação do pagamento. Use o e-mail do acesso.
                </p>
                {!loadingSession && !isAuthenticated ? (
                  <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
                    Faça login antes do pagamento. Isso garante a liberação correta do painel na sua
                    conta.
                  </div>
                ) : null}
              </div>

              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  Nome do negócio
                </label>
                <input
                  type="text"
                  value={form.restaurantName}
                  onChange={(event) => setForm({ ...form, restaurantName: event.target.value })}
                  className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-4 py-3 transition outline-none"
                  placeholder="Ex: Pizzaria do Centro"
                  required
                />
              </div>

              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  Nome do responsável
                </label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(event) => setForm({ ...form, customerName: event.target.value })}
                  className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-4 py-3 transition outline-none"
                  placeholder="Seu nome"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">E-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-4 py-3 transition outline-none"
                    placeholder="voce@empresa.com"
                    readOnly={isAuthenticated}
                    required
                  />
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">WhatsApp</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-4 py-3 transition outline-none"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
              </div>

              <div className="border-border bg-background rounded-xl border p-4">
                <label className="text-foreground mb-2 block text-sm font-medium">
                  Cupom de desconto
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-green-500/30 bg-green-500/5 px-3 py-2">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                      <Tag className="h-4 w-4" />
                      {appliedCoupon.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCouponCode('')
                        resetCoupon()
                      }}
                      className="text-muted-foreground hover:text-foreground rounded p-1 transition"
                      aria-label="Remover cupom"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(event) => {
                        setCouponCode(event.target.value.toUpperCase())
                        setCouponError('')
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          void handleApplyCoupon()
                        }
                      }}
                      placeholder="Digite o código"
                      className="border-border bg-card text-foreground focus:border-primary w-full rounded-xl border px-3 py-2 text-sm transition outline-none"
                      disabled={couponLoading}
                    />
                    <button
                      type="button"
                      onClick={() => void handleApplyCoupon()}
                      disabled={couponLoading || !couponCode.trim()}
                      className="bg-primary text-primary-foreground shrink-0 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                    </button>
                  </div>
                )}
                {couponError ? <p className="mt-2 text-xs text-red-600">{couponError}</p> : null}
              </div>

              <div className="border-border bg-background rounded-xl border p-4 text-sm">
                <p className="text-foreground font-medium">
                  Como funciona a cobrança neste checkout
                </p>
                <p className="text-foreground/75 mt-1 leading-6">
                  Aqui você aprova o valor de hoje. Depois da liberação, o cardápio segue no valor
                  mensal da plataforma.
                </p>
              </div>

              {loadingSession ? (
                <p className="text-foreground/70 text-xs">Carregando dados da sua conta...</p>
              ) : null}

              {error ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              ) : null}
            </form>
          </div>

          {/* Coluna Direita - Resumo */}
          <div className="lg:col-span-1">
            <div className="border-border bg-card sticky top-24 rounded-2xl border p-6">
              <h3 className="text-foreground mb-4 font-bold">Resumo do pedido</h3>

              {/* Preview do Template */}
              <div className="relative mb-4 h-32 overflow-hidden rounded-xl">
                <Image
                  src={template.imagem}
                  alt={template.nome}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 384px"
                />
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/75">Template</span>
                  <span className="text-foreground font-medium">{template.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/75">Plano</span>
                  <span className="text-foreground font-medium">{planMeta.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/75">Pagamento</span>
                  <span className="text-foreground font-medium">
                    {paymentMethod === 'pix' ? 'PIX' : 'Cartão / boleto / débito / carteira MP'}
                  </span>
                </div>
                {appliedCoupon ? (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-4 w-4" />
                      Cupom {appliedCoupon.code}
                    </span>
                    <span className="font-medium">
                      -R$ {appliedCoupon.discountValue.toFixed(2)}
                    </span>
                  </div>
                ) : null}

                <div className="border-border mt-3 border-t pt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-foreground/75">Hoje</span>
                    <div className="text-right">
                      <span className="text-foreground text-2xl font-bold">
                        R$ {total.toFixed(2)}
                      </span>
                      <p className="text-foreground/70 text-xs">
                        {paymentMethod === 'pix'
                          ? 'À vista no PIX'
                          : `Nesta opção: boleto, débito, carteira MP ou até ${parcelasMax}x de R$ ${parcelaTotal} no crédito`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-foreground/75">Por mês</span>
                    <div className="text-right">
                      <span className="text-foreground text-base font-semibold">
                        R$ {planPrices.monthly.toFixed(2)}/mês
                      </span>
                      <p className="text-foreground/70 max-w-44 text-xs">
                        Valor mensal após a ativação.
                      </p>
                    </div>
                  </div>
                  <p className="text-foreground/70 mt-3 text-xs leading-5">
                    🔒 Pagamento via MercadoPago · PIX · Boleto · Cartão até 12x · Débito · Carteira
                    MP
                  </p>
                </div>
              </div>

              <button
                type="submit"
                form="purchase-form"
                disabled={processing || loadingSession}
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-semibold transition-all disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Redirecionando...
                  </>
                ) : (
                  <>{isAuthenticated ? 'Ir para o Mercado Pago' : 'Entrar para continuar'}</>
                )}
              </button>

              <div className="text-foreground/70 mt-4 flex items-center justify-center gap-2 text-xs">
                <Shield className="h-4 w-4" />
                Pagamento seguro. O acesso é liberado após a aprovação do webhook.
              </div>

              <p className="text-foreground/65 mt-2 text-center text-xs leading-5">
                {PAYMENT_DESCRIPTOR_NOTE}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ComprarPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ComprarContent />
    </Suspense>
  )
}
