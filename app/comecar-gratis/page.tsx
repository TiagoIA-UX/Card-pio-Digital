'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  MessageCircle,
  QrCode,
  Sprout,
  Store,
} from 'lucide-react'
import {
  TEMPLATE_PRESETS,
  type RestaurantTemplateSlug,
} from '@/lib/domains/core/restaurant-customization'

const TEMPLATE_OPTIONS: RestaurantTemplateSlug[] = [
  'lanchonete',
  'acai',
  'cafeteria',
  'sorveteria',
  'doceria',
]

export default function ComecarGratisPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [restaurantName, setRestaurantName] = useState('')
  const [phone, setPhone] = useState('')
  const [templateSlug, setTemplateSlug] = useState<RestaurantTemplateSlug>('lanchonete')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      const response = await fetch('/api/onboarding/semente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantName, phone, templateSlug }),
      })

      const payload = await response.json()

      if (response.status === 401) {
        router.push('/login?next=/comecar-gratis')
        return
      }

      if (!response.ok) {
        setError(payload.error || 'Não foi possível ativar o Plano Começo agora.')
        return
      }

      const checkoutUrl = payload.init_point || payload.sandbox_init_point

      if (!checkoutUrl) {
        setError('Checkout indisponível no momento. Tente novamente em instantes.')
        return
      }

      router.push(checkoutUrl)
    })
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ecfccb,transparent_35%),linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#f7fee7_100%)] px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-zinc-900">
            <Store className="h-6 w-6 text-emerald-700" />
            <span className="text-lg font-bold">Zairyx</span>
          </Link>
          <Link href="/precos" className="text-sm font-medium text-zinc-700 hover:text-zinc-950">
            Ver planos pagos
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-4xl border border-emerald-200 bg-white/90 p-8 shadow-[0_20px_80px_rgba(16,185,129,0.08)] backdrop-blur">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
              <Sprout className="h-4 w-4" />
              Plano Começo
            </div>
            <h1 className="max-w-2xl text-4xl font-black tracking-tight text-zinc-950 md:text-5xl">
              Valide seu canal digital com entrada simbólica e suba de plano sem susto quando o
              negócio pedir.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-700">
              O Começo foi desenhado para microoperações com catálogo enxuto. Ele serve para validar
              o canal, não para substituir o plano profissional do seu delivery.
            </p>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                  Etapa 1 · Cabe no seu caso?
                </p>
                <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" /> Até 15 produtos
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" /> Nichos simples e catálogo enxuto
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" /> Link compartilhável pronto
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" /> Marca Zairyx no rodapé
                  </li>
                </ul>
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Se você precisa de
                    pizzaria, sushi, restaurante, adega ou catálogo grande, pule direto para o plano
                    profissional.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                  Etapa 2 · Como valida
                </p>
                <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" /> Pedido automático no WhatsApp
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" /> Sem taxa por pedido
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" /> Sem cobrança variável por volume
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" /> Entrada simbólica só para ativar
                  </li>
                </ul>
                <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
                  <p className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Se você precisar de
                    pagamento online, IA, suporte humano ou catálogo mais amplo, o plano correto já
                    é o Básico.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase">
                  Etapa 3 · Quando subir
                </p>
                <ul className="mt-3 space-y-2 text-sm text-amber-900">
                  <li className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" /> Ativação simbólica de R$ 19,90 via PIX
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" /> Mensalidade simbólica de R$ 14,90
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" /> Até 60 pedidos por mês como guardrail
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" /> Sem taxa extra por pedido ao crescer
                  </li>
                </ul>
                <div className="mt-4 rounded-2xl border border-orange-200 bg-white/70 p-3 text-sm text-amber-950">
                  <p className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Ao encostar em 12 produtos
                    ou 45 pedidos/mês, o alerta correto é upgrade de plano, não cobrança por pedido.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-6 max-w-2xl text-sm leading-6 text-zinc-600">
              Esse plano foi rebaixado de propósito para não colidir com os templates profissionais
              simples. Ele serve para testar o canal com custo baixo e escopo controlado.
            </p>
          </section>

          <section className="rounded-4xl border border-zinc-200 bg-white p-8 shadow-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-zinc-950 p-3 text-white">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-950">Ativar meu Plano Começo</h2>
                <p className="text-sm text-zinc-600">
                  Faça login com Google se ainda não tiver conta. A cobrança inicial é simbólica.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="restaurantName"
                  className="mb-1.5 block text-sm font-medium text-zinc-800"
                >
                  Nome do delivery
                </label>
                <input
                  id="restaurantName"
                  value={restaurantName}
                  onChange={(event) => setRestaurantName(event.target.value)}
                  className="w-full rounded-2xl border border-zinc-300 px-4 py-3 transition outline-none focus:border-emerald-500"
                  placeholder="Ex.: Açaí do Bairro"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-zinc-800">
                  WhatsApp do negócio
                </label>
                <input
                  id="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-2xl border border-zinc-300 px-4 py-3 transition outline-none focus:border-emerald-500"
                  placeholder="(12) 99999-9999"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="templateSlug"
                  className="mb-1.5 block text-sm font-medium text-zinc-800"
                >
                  Template inicial
                </label>
                <select
                  id="templateSlug"
                  value={templateSlug}
                  onChange={(event) =>
                    setTemplateSlug(event.target.value as RestaurantTemplateSlug)
                  }
                  className="w-full rounded-2xl border border-zinc-300 px-4 py-3 transition outline-none focus:border-emerald-500"
                >
                  {TEMPLATE_OPTIONS.map((slug) => (
                    <option key={slug} value={slug}>
                      {TEMPLATE_PRESETS[slug].label}
                    </option>
                  ))}
                </select>
              </div>

              {error ? (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
              ) : null}

              <button
                type="submit"
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? 'Gerando checkout...' : 'Ativar por R$ 19,90'}
              </button>
            </form>

            <div className="mt-5 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
              Um canal de entrada por usuário. O cliente monta o pedido no canal digital e o pedido
              chega formatado no WhatsApp do delivery.
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
