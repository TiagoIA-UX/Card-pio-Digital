'use client'

import { useState, Suspense, useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CreditCard,
  Fish,
  IceCream,
  Loader2,
  Pizza,
  QrCode,
  Shield,
  Sparkles,
  Store,
  Tag,
  UtensilsCrossed,
  Beer,
  Coffee,
  Zap,
  X,
} from 'lucide-react'
import { getTemplatePricing } from '@/lib/pricing'
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
}

const PLAN_META = {
  'self-service': {
    nome: 'Start',
    descricao: 'Cardápio online ativo em minutos. Edite tudo no painel com autonomia total.',
    icon: Zap,
    cor: 'border-blue-500 bg-blue-500/5',
    corIcone: 'text-blue-500 bg-blue-500/10',
    mensal: 79,
    beneficios: [
      '1 restaurante ativo',
      'Editor visual completo',
      'Cardápio com fotos e categorias',
      'Link próprio para compartilhar',
      'Atualizações ilimitadas',
      'Suporte por WhatsApp',
    ],
  },
  'feito-pra-voce': {
    nome: 'Pro + Implantação',
    descricao: 'Nossa equipe monta o cardápio para você entrar no ar mais rápido.',
    icon: Sparkles,
    cor: 'border-primary bg-primary/5',
    corIcone: 'text-primary bg-primary/10',
    recomendado: true,
    mensal: 129,
    beneficios: [
      'Tudo do plano Start',
      'Implantação feita pela nossa equipe',
      'Cardápio montado com suas fotos e preços',
      'Pronto em até 48 h úteis',
      'Suporte prioritário',
      'Domínio personalizado incluso',
    ],
  },
}

function ComprarContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const templateId = String(params.template || '').trim().toLowerCase()
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
  const parcelaTotal = paymentMethod === 'card' ? Math.round(totalCartao / parcelas) : 0

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
    <div className="min-h-screen bg-linear-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href={`/templates/${templateId}`}
            className="flex items-center gap-2 text-foreground/75 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Cardápio Digital</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        {/* Template Escolhido */}
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm text-foreground/75">Template escolhido</p>
          <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2">
            <div className={`p-1.5 rounded-lg ${template.cor}`}>
              <template.icon className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">{template.nome}</span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Coluna Esquerda - Escolha do Plano */}
          <div className="space-y-4 lg:col-span-2">
            <h2 className="mb-4 text-xl font-bold text-foreground">Escolha o plano</h2>

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
                    <span className="text-lg font-bold text-foreground">
                      {PLAN_META['self-service'].nome}
                    </span>
                    {selectedPlan === 'self-service' && (
                      <Check className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <p className="mb-3 text-sm text-foreground/75">
                    {PLAN_META['self-service'].descricao}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">
                      R$ {PLAN_META['self-service'].mensal}
                    </span>
                    <span className="text-sm text-foreground/70">/mês</span>
                  </div>
                </div>
              </div>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {PLAN_META['self-service'].beneficios.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                    <Check className="h-4 w-4 shrink-0 text-blue-500" />
                    {b}
                  </li>
                ))}
              </ul>
            </button>

            {/* Plano Pro + Implantação */}
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
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                  RECOMENDADO
                </span>
              </div>
              <div className="mt-2 flex items-start gap-4">
                <div className={`rounded-xl p-3 ${PLAN_META['feito-pra-voce'].corIcone}`}>
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground">
                      {PLAN_META['feito-pra-voce'].nome}
                    </span>
                    {selectedPlan === 'feito-pra-voce' && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <p className="mb-3 text-sm text-foreground/75">
                    {PLAN_META['feito-pra-voce'].descricao}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">
                      R$ {PLAN_META['feito-pra-voce'].mensal}
                    </span>
                    <span className="text-sm text-foreground/70">/mês</span>
                  </div>
                </div>
              </div>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {PLAN_META['feito-pra-voce'].beneficios.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {b}
                  </li>
                ))}
              </ul>
            </button>

            {/* Forma de Pagamento */}
            <div className="mt-6">
              <h3 className="mb-3 font-semibold text-foreground">Forma de pagamento</h3>
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
                      <p className="font-medium text-foreground">Cartão de Crédito</p>
                      <p className="text-sm text-foreground/70">3x sem juros</p>
                    </div>
                    {paymentMethod === 'card' && <Check className="ml-auto h-4 w-4 text-primary" />}
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
                      <p className="font-medium text-foreground">PIX</p>
                      <p className="text-sm text-green-600">Pagamento à vista</p>
                    </div>
                    {paymentMethod === 'pix' && <Check className="ml-auto h-4 w-4 text-primary" />}
                  </div>
                </button>
              </div>
            </div>

            <form id="purchase-form" onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Shield className="h-3.5 w-3.5" />
                  Compra segura com liberação automática do painel
                </div>
                <h3 className="text-xl font-bold text-foreground">Dados para liberar o painel</h3>
                <p className="mt-1 text-sm text-foreground/75">
                  O painel é liberado após a confirmação do pagamento. Use o mesmo e-mail que você
                  vai usar no acesso.
                </p>
                {!loadingSession && !isAuthenticated ? (
                  <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
                    Faça login antes do pagamento. Isso garante a liberação correta do painel na sua
                    conta.
                  </div>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Nome do negócio
                </label>
                <input
                  type="text"
                  value={form.restaurantName}
                  onChange={(event) => setForm({ ...form, restaurantName: event.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary"
                  placeholder="Ex: Pizzaria do Centro"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Nome do responsável
                </label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(event) => setForm({ ...form, customerName: event.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary"
                  placeholder="Seu nome"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">E-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary"
                    placeholder="voce@empresa.com"
                    readOnly={isAuthenticated}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">WhatsApp</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <label className="mb-2 block text-sm font-medium text-foreground">
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
                      className="rounded p-1 text-muted-foreground transition hover:text-foreground"
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
                      className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
                      disabled={couponLoading}
                    />
                    <button
                      type="button"
                      onClick={() => void handleApplyCoupon()}
                      disabled={couponLoading || !couponCode.trim()}
                      className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                    >
                      {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                    </button>
                  </div>
                )}
                {couponError ? <p className="mt-2 text-xs text-red-600">{couponError}</p> : null}
              </div>

              {loadingSession ? (
                <p className="text-xs text-foreground/70">Carregando dados da sua conta...</p>
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
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 font-bold text-foreground">Resumo do pedido</h3>

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
                  <span className="font-medium text-foreground">{template.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/75">Plano</span>
                  <span className="font-medium text-foreground">{planMeta.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/75">Pagamento</span>
                  <span className="font-medium text-foreground">
                    {paymentMethod === 'pix' ? 'PIX' : `${parcelas}x Cartão`}
                  </span>
                </div>
                {appliedCoupon ? (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-4 w-4" />
                      Cupom {appliedCoupon.code}
                    </span>
                    <span className="font-medium">-R$ {appliedCoupon.discountValue.toFixed(2)}</span>
                  </div>
                ) : null}

                <div className="mt-3 border-t border-border pt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-foreground/75">Total</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-foreground">
                        R$ {planMeta.mensal}/mês
                      </span>
                      <p className="text-xs text-foreground/70">Assinatura mensal recorrente</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                form="purchase-form"
                disabled={processing || loadingSession}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
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

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-foreground/70">
                <Shield className="h-4 w-4" />
                Pagamento seguro. O painel é liberado após a aprovação do webhook.
              </div>
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
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ComprarContent />
    </Suspense>
  )
}
