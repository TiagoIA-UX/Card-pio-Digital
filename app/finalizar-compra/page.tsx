'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowLeft, Loader2, Lock, ShieldCheck, Store, Tag, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  ONBOARDING_PLAN_CONFIG,
  getOnboardingPriceByTemplate,
  normalizePhone,
} from '@/lib/restaurant-onboarding'
import { TEMPLATE_PRESETS, normalizeTemplateSlug } from '@/lib/restaurant-customization'

type StoredPlan = keyof typeof ONBOARDING_PLAN_CONFIG
type StoredPaymentMethod = 'pix' | 'card'

function FinalizarCompraContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [template, setTemplate] = useState('restaurante')
  const [plan, setPlan] = useState<StoredPlan>('feito-pra-voce')
  const [billingCycle, setBillingCycle] = useState<string>('unico')
  const [paymentMethod, setPaymentMethod] = useState<StoredPaymentMethod>('card')
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
  useEffect(() => {
    const loadCheckoutContext = async () => {
      const templateFromUrl = searchParams.get('template')?.trim().toLowerCase()
      const storedTemplate = localStorage.getItem('checkout_template')
      const storedPlan = localStorage.getItem('checkout_plan') as StoredPlan | null
      const storedPayment = localStorage.getItem('checkout_payment') as StoredPaymentMethod | null
      const storedBillingCycle = localStorage.getItem('checkout_billing_cycle') || 'unico'
      const resolvedTemplate = templateFromUrl || storedTemplate
      if (!resolvedTemplate || !storedPlan || !storedPayment) {
        setError('Dados da compra não encontrados. Escolha um template novamente.')
        setLoading(false)
        return
      }

      if (storedBillingCycle === 'mensal' || storedBillingCycle === 'anual') {
        setTemplate(resolvedTemplate)
        setPlan(storedPlan)
        setPaymentMethod(storedPayment)
        setError('checkout_assinatura_em_breve')
        setLoading(false)
        return
      }

      setBillingCycle(storedBillingCycle)

      const { data } = await supabase.auth.getSession()
      const sessionUser = data.session?.user

      setTemplate(resolvedTemplate)
      if (templateFromUrl) {
        localStorage.setItem('checkout_template', resolvedTemplate)
      }
      setPlan(storedPlan)
      setPaymentMethod(storedPayment)
      setForm((current) => ({
        ...current,
        email: sessionUser?.email || current.email,
        customerName:
          sessionUser?.user_metadata?.name ||
          sessionUser?.user_metadata?.full_name ||
          current.customerName,
      }))
      setLoading(false)
    }

    loadCheckoutContext()
  }, [supabase, searchParams])

  const templateSlug = normalizeTemplateSlug(template)
  const templatePreset = TEMPLATE_PRESETS[templateSlug]
  const planConfig = ONBOARDING_PLAN_CONFIG[plan]
  const subtotal = useMemo(
    () => getOnboardingPriceByTemplate(templateSlug, plan, paymentMethod),
    [templateSlug, plan, paymentMethod]
  )
  const discount = appliedCoupon?.discountValue ?? 0
  const price = Math.max(0, subtotal - discount)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await fetch('/api/checkout/validar-cupom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal }),
      })
      const data = await res.json()
      if (data.valid && data.coupon) {
        setAppliedCoupon({
          id: data.coupon.id,
          code: data.coupon.code,
          discountValue: data.coupon.discountValue,
        })
        setCouponError('')
      } else {
        setAppliedCoupon(null)
        setCouponError(data.error || 'Cupom inválido')
      }
    } catch {
      setAppliedCoupon(null)
      setCouponError('Erro ao validar cupom')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setProcessing(true)
    setError('')

    try {
      const response = await fetch('/api/pagamento/iniciar-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: templateSlug,
          plan,
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

      localStorage.removeItem('checkout_template')
      localStorage.removeItem('checkout_plan')
      localStorage.removeItem('checkout_payment')
      localStorage.removeItem('checkout_billing_cycle')

      window.location.href = data.init_point || data.sandbox_init_point
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erro ao processar pagamento')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error && !form.restaurantName && !form.customerName && !form.email && !form.phone) {
    const isAssinaturaEmBreve = error === 'checkout_assinatura_em_breve'
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="max-w-md px-4 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-foreground mb-2 text-xl font-bold">
            {isAssinaturaEmBreve ? 'Assinatura em breve' : 'Checkout indisponível'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isAssinaturaEmBreve
              ? 'O checkout por assinatura (mensal/anual) está em desenvolvimento. Volte e selecione "Pagamento único" para continuar.'
              : error}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {isAssinaturaEmBreve && template && (
              <Link
                href={`/comprar/${template}?plano=${plan}`}
                className="bg-primary text-primary-foreground rounded-xl px-6 py-3 font-medium"
              >
                Voltar e escolher pagamento único
              </Link>
            )}
            <button
              onClick={() => router.push('/')}
              className="border-border text-foreground rounded-xl border px-6 py-3 font-medium"
            >
              Voltar para a vitrine
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="from-background to-secondary/20 min-h-screen bg-gradient-to-b">
      <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link
            href={`/comprar/${templateSlug}`}
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4 text-green-600" />
            Checkout seguro via Mercado Pago
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="border-border bg-card rounded-3xl border p-6 md:p-8">
          <div className="mb-6">
            <div className="bg-primary/10 text-primary mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
              <Store className="h-3.5 w-3.5" />
              Criação automática do cardápio após pagamento aprovado
            </div>
            <h1 className="text-foreground text-3xl font-bold">Finalize seu onboarding</h1>
            <p className="text-muted-foreground mt-2">
              Após o pagamento aprovado, o sistema cria seu cardápio digital, instala o template e
              libera o acesso ao painel. Se escolheu o plano Feito Pra Você, você será redirecionado
              para preencher o formulário com as informações do seu negócio.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {error ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={processing}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-base font-semibold transition disabled:opacity-60"
            >
              {processing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
              {processing ? 'Redirecionando para o Mercado Pago...' : 'Criar pagamento e continuar'}
            </button>
          </form>
        </section>

        <aside className="space-y-4">
          <div
            className={`rounded-3xl bg-linear-to-br ${templatePreset.accentClassName} p-6 text-white`}
          >
            <p className="text-xs font-semibold tracking-[0.18em] text-white/75 uppercase">
              Template escolhido
            </p>
            <h2 className="mt-2 text-2xl font-bold">{templatePreset.label}</h2>
            <p className="mt-3 text-sm leading-6 text-white/85">{templatePreset.heroDescription}</p>
          </div>

          <div className="border-border bg-card rounded-3xl border p-6">
            <h3 className="text-foreground text-lg font-semibold">Resumo da compra</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Plano</span>
                <span className="text-foreground font-medium">{planConfig.name}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Pagamento</span>
                <span className="text-foreground font-medium">
                  {paymentMethod === 'pix' ? 'PIX' : `${planConfig.installments}x no cartão`}
                </span>
              </div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-3 text-green-600">
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4" />
                    Cupom {appliedCoupon.code}
                  </span>
                  <span className="font-medium">-R$ {appliedCoupon.discountValue.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="border-border flex items-center justify-between gap-3 border-t pt-3">
                <span className="text-muted-foreground">Total</span>
                <span className="text-foreground text-2xl font-bold">R$ {price.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-border mt-4 border-t pt-4">
              <label className="text-muted-foreground mb-2 block text-xs font-medium">
                Cupom de desconto
              </label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-green-500/30 bg-green-500/5 px-3 py-2">
                  <span className="text-sm font-medium text-green-700">{appliedCoupon.code}</span>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
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
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase())
                      setCouponError('')
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                    placeholder="Digite o código"
                    className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                    disabled={couponLoading}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="bg-primary text-primary-foreground shrink-0 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                  </button>
                </div>
              )}
              {couponError ? (
                <p className="mt-1.5 text-xs text-red-600">{couponError}</p>
              ) : null}
            </div>
          </div>

          <div className="border-border bg-card rounded-3xl border p-6">
            <h3 className="text-foreground text-lg font-semibold">
              O que acontece depois do approval
            </h3>
            <ul className="text-muted-foreground mt-4 space-y-3 text-sm">
              <li>1. O webhook valida a assinatura do Mercado Pago.</li>
              <li>2. O sistema cria ou vincula seu usuário administrador.</li>
              <li>3. O cardápio é provisionado com slug automático.</li>
              <li>4. O template instala categorias, produtos exemplo, cores e estrutura visual.</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  )
}

export default function FinalizarCompraPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      }
    >
      <FinalizarCompraContent />
    </Suspense>
  )
}
