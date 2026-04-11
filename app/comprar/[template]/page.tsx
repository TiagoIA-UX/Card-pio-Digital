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
  QrCode,
  Shield,
  Sparkles,
  Store,
  Tag,
  Wrench,
  X,
} from 'lucide-react'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { COMMERCIAL_COPY } from '@/lib/domains/marketing/commercial-copy'
import { resolveRestaurantTemplateSlug } from '@/lib/domains/core/restaurant-customization'
import { TEMPLATE_CHECKOUT_VISUALS } from '@/lib/domains/marketing/template-checkout'
import { getTemplatePricing } from '@/lib/domains/marketing/pricing'
import { getRestaurantTemplateConfig } from '@/lib/domains/marketing/templates-config'
import { createClient } from '@/lib/shared/supabase/client'
import { normalizePhone } from '@/lib/domains/core/restaurant-onboarding'
import { seoConfig } from '@/lib/domains/marketing/seo'
import {
  getCheckoutWizardProgress,
  getCheckoutWizardSteps,
} from '@/lib/domains/core/checkout-wizard'
import {
  formatTaxDocument,
  isValidTaxDocument,
  normalizeTaxDocument,
} from '@/lib/domains/core/tax-document'
import {
  buildCheckoutContractSummary,
  CHECKOUT_CONTRACT_SUMMARY_VERSION,
} from '@/lib/domains/marketing/checkout-contract-summary'

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
      COMMERCIAL_COPY.prioritizedSupport,
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
  const templateSlug = resolveRestaurantTemplateSlug(templateId)
  const purchaseDraftKey = `purchase_draft:${templateId}`
  const template = useMemo(() => {
    if (!templateSlug) return null

    const config = getRestaurantTemplateConfig(templateSlug)
    const visual = TEMPLATE_CHECKOUT_VISUALS[templateSlug]

    return {
      slug: config.slug,
      nome: config.name,
      descricao: config.shortDescription || config.description,
      imagem: config.imageUrl,
      icon: visual.icon,
      cor: visual.color,
    }
  }, [templateSlug])

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
    customerDocument: '',
  })
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [includeTaxDocument, setIncludeTaxDocument] = useState(false)
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

  const normalizedAccountEmail = accountEmail.trim()
  const loginRedirectTarget = `/comprar/${templateId}?plano=${selectedPlan}`
  const loginHref = `/login?redirect=${encodeURIComponent(loginRedirectTarget)}&context=checkout`

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
    let mounted = true

    const syncSession = (user: User | null | undefined) => {
      if (!mounted) return

      const resolvedEmail =
        user?.email ||
        (typeof user?.user_metadata?.email === 'string' ? user.user_metadata.email : '') ||
        ''

      setIsAuthenticated(!!user)
      setAccountEmail(resolvedEmail)

      if (user) {
        setForm((current) => ({
          ...current,
          customerName:
            user.user_metadata?.name || user.user_metadata?.full_name || current.customerName,
        }))
      }
    }

    const loadSession = async () => {
      try {
        const storedDraft = window.localStorage.getItem(purchaseDraftKey)
        if (storedDraft) {
          const draft = JSON.parse(storedDraft) as {
            selectedPlan?: 'self-service' | 'feito-pra-voce'
            paymentMethod?: 'pix' | 'card'
            couponCode?: string
            acceptedTerms?: boolean
            includeTaxDocument?: boolean
            form?: typeof form
          }
          if (draft.selectedPlan) setSelectedPlan(draft.selectedPlan)
          if (draft.paymentMethod) setPaymentMethod(draft.paymentMethod)
          if (draft.couponCode) setCouponCode(draft.couponCode)
          if (typeof draft.acceptedTerms === 'boolean') setAcceptedTerms(draft.acceptedTerms)
          if (typeof draft.includeTaxDocument === 'boolean') {
            setIncludeTaxDocument(draft.includeTaxDocument)
          } else if (draft.form?.customerDocument) {
            setIncludeTaxDocument(true)
          }
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

      syncSession(session?.user)

      if (mounted) {
        setLoadingSession(false)
      }
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      syncSession(session?.user)
      if (mounted) {
        setLoadingSession(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [purchaseDraftKey, supabase])

  const pricing = useMemo(() => getTemplatePricing(templateSlug ?? 'restaurante'), [templateSlug])

  if (!templateSlug || !template) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-semibold text-zinc-900">Template não encontrado</p>
        <p className="max-w-md text-sm text-zinc-600">
          O link de compra está incompleto ou usa um nome antigo de template. Volte para a vitrine e
          escolha novamente.
        </p>
        <Link
          href="/templates"
          className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Voltar para templates
        </Link>
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
  const contractSummary = useMemo(
    () =>
      buildCheckoutContractSummary({
        templateName: template.nome,
        planSlug: selectedPlan,
        planName: planMeta.nome,
        paymentMethod,
        installments: parcelas,
        initialChargeAmount: total,
        monthlyChargeAmount: planPrices.monthly,
        accountEmail: normalizedAccountEmail || undefined,
      }),
    [
      normalizedAccountEmail,
      parcelas,
      paymentMethod,
      planMeta.nome,
      planPrices.monthly,
      selectedPlan,
      template.nome,
      total,
    ]
  )

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

    const normalizedCustomerDocument = includeTaxDocument
      ? normalizeTaxDocument(form.customerDocument)
      : ''

    if (normalizedCustomerDocument && !isValidTaxDocument(normalizedCustomerDocument)) {
      setError('Informe um CPF ou CNPJ válido para continuar.')
      return
    }

    if (!acceptedTerms) {
      setError('Confirme o resumo contratual e aceite os termos para continuar.')
      return
    }

    if (!isAuthenticated) {
      window.localStorage.setItem(
        purchaseDraftKey,
        JSON.stringify({
          selectedPlan,
          paymentMethod,
          couponCode,
          acceptedTerms,
          includeTaxDocument,
          form,
        })
      )
      window.location.href = loginHref
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
          customerDocument: normalizedCustomerDocument || undefined,
          couponCode: appliedCoupon?.code,
          acceptedTerms: true,
          acceptedTermsVersion: CHECKOUT_CONTRACT_SUMMARY_VERSION,
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
                <li className="text-foreground/80 flex items-center gap-2 text-sm">
                  <Check className="text-primary h-4 w-4 shrink-0" />
                  Até {pricing.maxSetupProducts} produtos no setup inicial
                </li>
              </ul>
              <p className="text-muted-foreground mt-3 text-xs">
                * Produtos acima de {pricing.maxSetupProducts} sob consulta. Você pode adicionar os
                demais sozinho pelo painel após ativação.
              </p>
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
                  Compra segura com liberação após confirmação do pagamento
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
                  <p className="text-foreground font-medium">Quer seguir com mais clareza?</p>
                  <p className="text-muted-foreground mt-1">
                    A Zai conduz o fluxo de compra de forma automática. Se surgir uma exceção em
                    preço, plano ou pagamento, você ainda pode acionar suporte sem sair da compra.
                  </p>
                  <Link
                    href={supportHref}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary mt-3 inline-flex items-center gap-2 font-medium hover:underline"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Acionar suporte em caso de exceção
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
                  {loadingSession ? (
                    <div className="border-border bg-background text-foreground rounded-xl border px-4 py-3 text-sm">
                      <span className="text-foreground/60 inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando conta...
                      </span>
                    </div>
                  ) : isAuthenticated && normalizedAccountEmail ? (
                    <div className="border-border bg-background text-foreground rounded-xl border px-4 py-3 text-sm">
                      <span className="block font-medium break-all">{normalizedAccountEmail}</span>
                    </div>
                  ) : isAuthenticated ? (
                    <div className="border-border bg-background rounded-xl border px-4 py-3 text-sm text-amber-600">
                      Sua conta está autenticada, mas o e-mail não foi carregado. Atualize a página
                      ou entre novamente.
                    </div>
                  ) : (
                    <Link
                      href={loginHref}
                      className="border-border bg-background hover:border-primary/50 hover:bg-primary/5 block rounded-xl border px-4 py-3 text-sm transition-colors"
                    >
                      <span className="text-foreground block font-medium">
                        Faça login para vincular a compra à sua conta
                      </span>
                      <span className="text-primary mt-1 inline-flex items-center gap-2 text-xs font-semibold">
                        Entrar com a conta que vai receber o template
                      </span>
                    </Link>
                  )}
                  <p className="text-foreground/60 mt-1 text-xs">
                    O template entra em Meus Templates da conta usada nesta compra.
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

              <div className="border-border bg-background space-y-3 rounded-xl border p-4">
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={includeTaxDocument}
                    onChange={(event) => setIncludeTaxDocument(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />
                  <span>
                    <span className="text-foreground block font-medium">
                      Informar CPF ou CNPJ do comprador
                    </span>
                    <span className="text-foreground/70 mt-1 block leading-5">
                      Opcional. Se informado, o documento segue com os dados do pedido para
                      identificação fiscal do comprador quando aplicável.
                    </span>
                  </span>
                </label>

                {includeTaxDocument ? (
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      CPF ou CNPJ do comprador
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.customerDocument}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          customerDocument: formatTaxDocument(event.target.value),
                        })
                      }
                      className="border-border bg-card text-foreground focus:border-primary w-full rounded-xl border px-4 py-3 transition outline-none"
                      placeholder="Digite o CPF ou CNPJ"
                    />
                    <p className="text-foreground/60 mt-1 text-xs">
                      A emissão fiscal não depende deste campo para existir; ele serve para
                      identificar o comprador no documento quando necessário.
                    </p>
                  </div>
                ) : (
                  <p className="text-foreground/60 text-xs leading-5">
                    Se preferir, você pode seguir sem preencher esse dado agora.
                  </p>
                )}
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

              <div className="border-border bg-background space-y-3 rounded-xl border p-4">
                <div>
                  <p className="text-foreground text-sm font-semibold">Resumo contratual</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Versão {contractSummary.version}. Este resumo acompanha o pedido registrado.
                  </p>
                </div>

                <div className="text-foreground/80 space-y-2 text-xs leading-5">
                  <p>
                    <span className="text-foreground font-semibold">Template e plano:</span>{' '}
                    {contractSummary.templateName} no plano {contractSummary.planName}.
                  </p>
                  <p>
                    <span className="text-foreground font-semibold">Cobrança agora:</span>{' '}
                    {contractSummary.initialChargeLabel} via {contractSummary.paymentMethodLabel}.
                  </p>
                  <p>
                    <span className="text-foreground font-semibold">
                      Mensalidade após ativação:
                    </span>{' '}
                    {contractSummary.monthlyChargeLabel}.
                  </p>
                  <p>
                    <span className="text-foreground font-semibold">Vinculação da compra:</span>{' '}
                    {contractSummary.accountBindingLabel}
                  </p>
                  <p>
                    <span className="text-foreground font-semibold">Renovação:</span>{' '}
                    {contractSummary.renewalPolicy}
                  </p>
                  <p>
                    <span className="text-foreground font-semibold">Cancelamento:</span>{' '}
                    {contractSummary.cancellationPolicy}
                  </p>
                  <p>
                    <span className="text-foreground font-semibold">Arrependimento:</span>{' '}
                    {contractSummary.withdrawalPolicy}
                  </p>
                  <p>
                    <span className="text-foreground font-semibold">Escopo desta contratação:</span>{' '}
                    {contractSummary.scopeLabel}
                  </p>
                </div>

                <label className="flex items-start gap-3 rounded-xl border border-slate-200/70 px-3 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />
                  <span className="text-foreground/80 leading-6">
                    Li e aceito o resumo contratual desta compra, os{' '}
                    <Link
                      href={contractSummary.termsPath}
                      target="_blank"
                      className="text-primary font-medium hover:underline"
                    >
                      Termos de Uso
                    </Link>{' '}
                    e a{' '}
                    <Link
                      href={contractSummary.privacyPath}
                      target="_blank"
                      className="text-primary font-medium hover:underline"
                    >
                      Política de Privacidade
                    </Link>
                    .
                  </span>
                </label>
              </div>
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
                  <p>2. O template é liberado na conta usada nesta compra.</p>
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
                  <>
                    {isAuthenticated ? 'Ir para o Mercado Pago' : 'Entrar para continuar a compra'}
                  </>
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
