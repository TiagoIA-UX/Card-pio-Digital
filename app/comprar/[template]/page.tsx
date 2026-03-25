'use client'

import { useState, Suspense, useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowLeft,
  Circle,
  Check,
  CreditCard,
  Fish,
  IceCream,
  Loader2,
  MessageCircle,
  Pizza,
  QrCode,
  Shield,
  Sparkles,
  Store,
  Tag,
  UtensilsCrossed,
  Beer,
  Coffee,
  Wrench,
  X,
  Wine,
  ShoppingCart,
  Croissant,
  Flame,
  Apple,
  PawPrint,
  Cake,
} from 'lucide-react'
import { getTemplatePricing } from '@/lib/pricing'
import { createClient } from '@/lib/supabase/client'
import { normalizePhone } from '@/lib/restaurant-onboarding'
import { seoConfig } from '@/lib/seo'
import { getCheckoutWizardProgress, getCheckoutWizardSteps } from '@/lib/checkout-wizard'

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
    nome: 'Adega / Bebidas',
    descricao: 'Cervejas, vinhos, destilados, kits',
    icon: Wine,
    cor: 'bg-purple-800',
    imagem:
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&auto=format&fit=crop&q=80',
  },
  mercadinho: {
    nome: 'Mercadinho / Minimercado',
    descricao: 'Bebidas, mercearia, frios, higiene',
    icon: ShoppingCart,
    cor: 'bg-emerald-600',
    imagem:
      'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&auto=format&fit=crop&q=80',
  },
  padaria: {
    nome: 'Padaria / Confeitaria',
    descricao: 'Pães, bolos, salgados, cafés',
    icon: Croissant,
    cor: 'bg-amber-700',
    imagem:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80',
  },
  sorveteria: {
    nome: 'Sorveteria',
    descricao: 'Sorvetes, picolés, açaí, milkshakes',
    icon: IceCream,
    cor: 'bg-pink-500',
    imagem:
      'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&auto=format&fit=crop&q=80',
  },
  acougue: {
    nome: 'Açougue / Churrascaria',
    descricao: 'Carnes, cortes nobres, kits churrasco',
    icon: Flame,
    cor: 'bg-red-700',
    imagem:
      'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400&auto=format&fit=crop&q=80',
  },
  hortifruti: {
    nome: 'Hortifruti',
    descricao: 'Frutas, verduras, legumes, orgânicos',
    icon: Apple,
    cor: 'bg-green-600',
    imagem:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80',
  },
  petshop: {
    nome: 'Pet Shop',
    descricao: 'Rações, petiscos, acessórios pet',
    icon: PawPrint,
    cor: 'bg-sky-500',
    imagem:
      'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&auto=format&fit=crop&q=80',
  },
  doceria: {
    nome: 'Doceria / Confeitaria',
    descricao: 'Doces, bolos, brownies, tortas',
    icon: Cake,
    cor: 'bg-rose-500',
    imagem:
      'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&auto=format&fit=crop&q=80',
  },
}

const PLAN_META = {
  'self-service': {
    nome: 'Faça Você Mesmo',
    descricao: 'Edite tudo no painel e publique com autonomia.',
    icon: Wrench,
    cor: 'border-blue-500 bg-blue-500/5',
    corIcone: 'text-blue-500 bg-blue-500/10',
    beneficios: [
      'Template profissional pronto para uso',
      'Editor visual simples',
      'Cadastro de produtos e categorias',
      'Atualização de fotos e preços sem desenvolvedor',
      'Suporte por WhatsApp',
      'Hospedagem inclusa',
    ],
  },
  'feito-pra-voce': {
    nome: 'Feito Pra Você',
    descricao: 'Você envia as fotos e dados dos produtos. Nossa equipe monta tudo pra você.',
    icon: Sparkles,
    cor: 'border-primary bg-primary/5',
    corIcone: 'text-primary bg-primary/10',
    recomendado: true,
    beneficios: [
      'Tudo do plano Faça Você Mesmo',
      'Implantação completa pela equipe',
      'Você envia as fotos dos produtos por WhatsApp ou e-mail',
      'Organizamos categorias, descrições e preços',
      'Pronto em até 48h úteis após receber suas fotos e dados',
      'Suporte prioritário',
    ],
  },
}

const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatCurrency(value: number) {
  return BRL_FORMATTER.format(value)
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
  const [accountEmail, setAccountEmail] = useState('')
  const [error, setError] = useState('')
  const [sandboxCheckout, setSandboxCheckout] = useState<string | null>(null)
  const [form, setForm] = useState({
    restaurantName: '',
    customerName: '',
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

  const checkoutSteps = useMemo(
    () =>
      getCheckoutWizardSteps({
        selectedPlan,
        paymentMethod,
        isAuthenticated,
        form,
      }),
    [form, isAuthenticated, paymentMethod, selectedPlan]
  )
  const completedCheckoutSteps = useMemo(
    () => getCheckoutWizardProgress(checkoutSteps),
    [checkoutSteps]
  )
  const supportHref = useMemo(() => {
    const message =
      `Olá, preciso de ajuda para fechar a compra do template ${template?.nome || templateId}.` +
      ` Plano: ${PLAN_META[selectedPlan].nome}.` +
      ` Pagamento: ${paymentMethod === 'pix' ? 'PIX' : 'Cartão'}.`

    return `https://api.whatsapp.com/send?phone=${seoConfig.supportWhatsApp}&text=${encodeURIComponent(message)}`
  }, [paymentMethod, selectedPlan, template?.nome, templateId])

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
      setAccountEmail(user?.email || '')
      if (user) {
        setForm((current) => ({
          ...current,
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

  const subtotal = paymentMethod === 'pix' ? totalPix : totalCartao
  const discount = appliedCoupon?.discountValue ?? 0
  const total = Math.max(0, subtotal - discount)
  const monthlyPriceLabel = `${formatCurrency(planPrices.monthly)}/mês`

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
          phone: normalizePhone(form.phone),
          couponCode: appliedCoupon?.code,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao iniciar pagamento')
      }

      window.localStorage.removeItem(purchaseDraftKey)

      const isSandbox = process.env.NEXT_PUBLIC_MERCADO_PAGO_ENV === 'sandbox'
      const checkoutUrl = isSandbox
        ? data.sandbox_init_point || data.init_point
        : data.init_point || data.sandbox_init_point

      if (isSandbox) {
        // Em sandbox, abrir MP em nova aba e mostrar botão de verificação local
        window.open(checkoutUrl, '_blank')
        setSandboxCheckout(data.checkout)
        setProcessing(false)
      } else {
        window.location.href = checkoutUrl
      }
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
            <span className="text-foreground font-semibold">Zairyx — Canal Digital</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        {/* Banner Sandbox — só aparece em modo teste */}
        {process.env.NEXT_PUBLIC_MERCADO_PAGO_ENV === 'sandbox' && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            <p className="mb-1 font-bold text-amber-400">🧪 Modo Sandbox (teste)</p>
            <p className="text-amber-300/80">
              Este ambiente está em modo de teste. Pagamentos não são cobrados. Consulte as
              credenciais de teste na documentação interna do Mercado Pago.
            </p>
          </div>
        )}

        {/* Banner pós-pagamento sandbox — mostra após abrir checkout em nova aba */}
        {sandboxCheckout && (
          <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center">
            <p className="mb-2 font-bold text-green-400">✅ Checkout aberto em outra aba</p>
            <p className="mb-3 text-sm text-green-300/80">
              Após concluir o pagamento no Mercado Pago, clique abaixo para ativar seu canal
              digital:
            </p>
            <Link
              href={`/pagamento/sucesso?checkout=${sandboxCheckout}&collection_status=approved`}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700"
            >
              <Check className="h-4 w-4" />
              Já paguei — Ativar meu canal
            </Link>
          </div>
        )}

        {/* Template Escolhido */}
        <div className="mb-8 text-center">
          <p className="text-primary mb-2 text-xs font-semibold tracking-[0.24em] uppercase">
            Checkout guiado
          </p>
          <p className="text-foreground/75 mb-2 text-sm">Template escolhido</p>
          <div className="border-border bg-card inline-flex items-center gap-3 rounded-full border px-4 py-2">
            <div className={`rounded-lg p-1.5 ${template.cor}`}>
              <template.icon className="h-4 w-4 text-white" />
            </div>
            <span className="text-foreground font-semibold">{template.nome}</span>
          </div>
        </div>

        <div className="border-border bg-card mb-8 rounded-2xl border p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-foreground text-sm font-semibold">Progresso da compra</p>
              <p className="text-muted-foreground text-xs">
                {completedCheckoutSteps} de {checkoutSteps.length} etapas concluídas nesta página.
              </p>
            </div>
            <span className="bg-secondary text-foreground rounded-full px-3 py-1 text-xs font-medium">
              Etapa {Math.min(completedCheckoutSteps + 1, checkoutSteps.length)}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {checkoutSteps.map((step, index) => {
              const isComplete = step.status === 'complete'
              const isCurrent = step.status === 'current'

              return (
                <div key={step.id} className="bg-secondary/20 rounded-xl p-4">
                  <div className="mb-2 flex items-center gap-2">
                    {isComplete ? (
                      <Check className="text-primary h-4 w-4" />
                    ) : isCurrent ? (
                      <span className="border-primary text-primary flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-semibold">
                        {index + 1}
                      </span>
                    ) : (
                      <Circle className="text-muted-foreground h-4 w-4" />
                    )}
                    <p className="text-foreground text-sm font-medium">{step.title}</p>
                  </div>
                  <p className="text-muted-foreground text-xs leading-5">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Coluna Esquerda - Escolha do Plano */}
          <div className="space-y-4 lg:col-span-2">
            <h2 className="text-foreground mb-4 text-xl font-bold">Escolha o plano</h2>

            {/* Plano Self-Service */}
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
                  <Wrench className="h-6 w-6" />
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
                  <div className="flex items-baseline gap-2">
                    <span className="text-foreground text-2xl font-bold">
                      {pricing.selfService.parcelas}x de{' '}
                      {formatCurrency(pricing.selfService.card / pricing.selfService.parcelas)}
                    </span>
                    <span className="text-foreground/70 text-sm">
                      ou {formatCurrency(pricing.selfService.pix)} no PIX
                    </span>
                  </div>
                  <p className="text-foreground/70 mt-2 text-sm">
                    Mensalidade após ativação: {formatCurrency(pricing.selfService.monthly)}/mês
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

            {/* Plano Feito Pra Você */}
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
                  <div className="flex items-baseline gap-2">
                    <span className="text-foreground text-2xl font-bold">
                      {pricing.feitoPraVoce.parcelas}x de{' '}
                      {formatCurrency(pricing.feitoPraVoce.card / pricing.feitoPraVoce.parcelas)}
                    </span>
                    <span className="text-foreground/70 text-sm">
                      ou {formatCurrency(pricing.feitoPraVoce.pix)} no PIX
                    </span>
                  </div>
                  <p className="text-foreground/70 mt-2 text-sm">
                    Mensalidade após ativação: {formatCurrency(pricing.feitoPraVoce.monthly)}/mês
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
                      <p className="text-foreground font-medium">Cartão de Crédito</p>
                      <p className="text-foreground/70 text-sm">3x sem juros</p>
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
                        Economize {formatCurrency(totalCartao - totalPix)}
                      </p>
                    </div>
                    {paymentMethod === 'pix' && <Check className="text-primary ml-auto h-4 w-4" />}
                  </div>
                </button>
              </div>
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
                  O template é liberado após a confirmação do pagamento na conta que estiver logada
                  agora. O e-mail abaixo é o da conta que vai receber a compra.
                </p>
                {!loadingSession && !isAuthenticated ? (
                  <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
                    Faça login antes do pagamento. Isso garante a liberação correta do painel na sua
                    conta.
                  </div>
                ) : null}

                <div className="mt-3 rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-sm">
                  <p className="text-foreground font-medium">Quer fechar com ajuda humana?</p>
                  <p className="text-muted-foreground mt-1">
                    Se bater dúvida em preço, plano ou pagamento, fale com a equipe no WhatsApp sem
                    sair da compra.
                  </p>
                  <Link
                    href={supportHref}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary mt-3 inline-flex items-center gap-2 font-medium hover:underline"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Falar com suporte agora
                  </Link>
                </div>
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
                  <span className="text-foreground mb-1 block text-sm font-medium">
                    Conta que vai receber o template
                  </span>
                  <div className="border-border bg-background text-foreground rounded-xl border px-4 py-3 text-sm">
                    {isAuthenticated ? (
                      <span>{accountEmail}</span>
                    ) : (
                      <span className="text-foreground/60">
                        Faça login para vincular a compra à sua conta
                      </span>
                    )}
                  </div>
                  <p className="text-foreground/60 mt-1 text-xs">
                    A compra aparece em Meus Templates da conta autenticada no momento do pagamento.
                  </p>
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

              <details className="border-border bg-background rounded-xl border">
                <summary className="text-foreground/70 hover:text-foreground cursor-pointer px-4 py-3 text-sm font-medium transition select-none">
                  Tem cupom de desconto?
                </summary>
                <div className="px-4 pb-4">
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
              </details>

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
                  <span className="text-foreground/75">Implantação inicial</span>
                  <span className="text-foreground font-medium">
                    {paymentMethod === 'card'
                      ? `${parcelas}x de ${formatCurrency(subtotal / parcelas)}`
                      : formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/75">Mensalidade após ativação</span>
                  <span className="text-foreground font-medium">{monthlyPriceLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/75">Pagamento</span>
                  <span className="text-foreground font-medium">
                    {paymentMethod === 'pix' ? 'PIX' : `${parcelas}x Cartão`}
                  </span>
                </div>
                {appliedCoupon ? (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-4 w-4" />
                      Cupom {appliedCoupon.code}
                    </span>
                    <span className="font-medium">
                      -{formatCurrency(appliedCoupon.discountValue)}
                    </span>
                  </div>
                ) : null}

                <div className="border-border mt-3 border-t pt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-foreground/75">Total</span>
                    <div className="text-right">
                      <span className="text-foreground text-2xl font-bold">
                        {paymentMethod === 'card'
                          ? `${parcelas}x de ${formatCurrency(total / parcelas)}`
                          : `${formatCurrency(total)}`}
                      </span>
                      <p className="text-foreground/70 text-xs">
                        {paymentMethod === 'card'
                          ? `ou ${formatCurrency(Math.max(0, totalPix - discount))} no PIX`
                          : `Economia de ${formatCurrency(Math.max(0, totalCartao - total))}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-foreground/75 space-y-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-3 text-xs leading-5">
                  <p>
                    <span className="text-foreground font-semibold">Cobrança deste checkout:</span>{' '}
                    implantação inicial do plano {planMeta.nome}.
                  </p>
                  <p>
                    <span className="text-foreground font-semibold">Após a ativação:</span>{' '}
                    continuidade no plano mensal de {monthlyPriceLabel}, com zero taxa por pedido.
                  </p>
                </div>

                <div className="text-muted-foreground rounded-xl border border-slate-200/70 px-3 py-3 text-xs leading-5">
                  <p className="text-foreground font-semibold">O que acontece após pagar</p>
                  <p className="mt-1">1. O pagamento é confirmado no Mercado Pago.</p>
                  <p>2. O template é vinculado à conta autenticada nesta compra.</p>
                  <p>3. Você entra no painel para publicar e ajustar seu delivery.</p>
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
        <div className="bg-background flex min-h-screen items-center justify-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ComprarContent />
    </Suspense>
  )
}
