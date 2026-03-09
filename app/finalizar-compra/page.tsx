'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, Loader2, Lock, ShieldCheck, Store } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  ONBOARDING_PLAN_CONFIG,
  getOnboardingPrice,
  normalizePhone,
} from '@/lib/restaurant-onboarding'
import { TEMPLATE_PRESETS, normalizeTemplateSlug } from '@/lib/restaurant-customization'

type StoredPlan = keyof typeof ONBOARDING_PLAN_CONFIG
type StoredPaymentMethod = 'pix' | 'card'

function FinalizarCompraContent() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [template, setTemplate] = useState('restaurante')
  const [plan, setPlan] = useState<StoredPlan>('feito-pra-voce')
  const [paymentMethod, setPaymentMethod] = useState<StoredPaymentMethod>('card')
  const [form, setForm] = useState({
    restaurantName: '',
    customerName: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    const loadCheckoutContext = async () => {
      const storedTemplate = localStorage.getItem('checkout_template')
      const storedPlan = localStorage.getItem('checkout_plan') as StoredPlan | null
      const storedPayment = localStorage.getItem('checkout_payment') as StoredPaymentMethod | null

      if (!storedTemplate || !storedPlan || !storedPayment) {
        setError('Dados da compra não encontrados. Escolha um template novamente.')
        setLoading(false)
        return
      }

      const { data } = await supabase.auth.getSession()
      const sessionUser = data.session?.user

      setTemplate(storedTemplate)
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
  }, [supabase])

  const templateSlug = normalizeTemplateSlug(template)
  const templatePreset = TEMPLATE_PRESETS[templateSlug]
  const planConfig = ONBOARDING_PLAN_CONFIG[plan]
  const price = useMemo(() => getOnboardingPrice(plan, paymentMethod), [paymentMethod, plan])

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
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao iniciar pagamento')
      }

      localStorage.removeItem('checkout_template')
      localStorage.removeItem('checkout_plan')
      localStorage.removeItem('checkout_payment')

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
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="max-w-md px-4 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-foreground mb-2 text-xl font-bold">Checkout indisponível</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-primary text-primary-foreground rounded-xl px-6 py-3 font-medium"
          >
            Voltar para a vitrine
          </button>
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
              Criação automática do restaurante após pagamento aprovado
            </div>
            <h1 className="text-foreground text-3xl font-bold">Finalize seu onboarding</h1>
            <p className="text-muted-foreground mt-2">
              Assim que o pagamento for aprovado, o sistema cria seu restaurante, instala o template
              e libera o acesso ao painel.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Nome do restaurante
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
              <div className="border-border flex items-center justify-between gap-3 border-t pt-3">
                <span className="text-muted-foreground">Total</span>
                <span className="text-foreground text-2xl font-bold">R$ {price.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="border-border bg-card rounded-3xl border p-6">
            <h3 className="text-foreground text-lg font-semibold">
              O que acontece depois do approval
            </h3>
            <ul className="text-muted-foreground mt-4 space-y-3 text-sm">
              <li>1. O webhook valida a assinatura do Mercado Pago.</li>
              <li>2. O sistema cria ou vincula seu usuário administrador.</li>
              <li>3. O restaurante é provisionado com slug automático.</li>
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
