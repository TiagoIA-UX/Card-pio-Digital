'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  MessageCircle,
  Sparkles,
  Store,
  Utensils,
} from 'lucide-react'

// ─── CENÁRIOS REAIS DE USO ──────────────────────────────────────────────────
// Exemplos ilustrativos baseados nas funcionalidades reais do sistema.
// Não são depoimentos de clientes reais — são cenários do que o sistema entrega.

interface Scenario {
  id: number
  icon: typeof Store
  niche: string
  situation: string
  text: string
  benefit: string
  benefitLabel: string
}

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    icon: Utensils,
    niche: 'Pizzaria com entregador próprio',
    situation: 'Fatura R$ 20.000/mês no iFood',
    text: 'Se uma pizzaria com entregador fixo fatura R$ 20.000/mês no iFood, paga cerca de R$ 3.150 em taxas (12% + 3,2% online + mensalidade). Migrando os clientes recorrentes para o canal próprio da Zairyx, essa taxa cai para R$ 147/mês — fixo, sem comissão por pedido.',
    benefit: 'Até R$ 3.000+',
    benefitLabel: 'que voltam pro caixa/mês',
  },
  {
    id: 2,
    icon: Sparkles,
    niche: 'Hamburgueria com pedidos à noite',
    situation: 'Perde vendas de madrugada',
    text: 'Com a IA da Zairyx ativa 24h dentro do cardápio, o cliente que acessa de madrugada recebe sugestões e tira dúvidas na hora — sem precisar de atendente acordado. Pedidos que antes eram perdidos passam a entrar pelo WhatsApp automaticamente.',
    benefit: 'IA 24h',
    benefitLabel: 'sem custo extra',
  },
  {
    id: 3,
    icon: Store,
    niche: 'Açaíteria no Litoral Norte',
    situation: 'Temporada de verão caótica',
    text: 'Na temporada, turistas pesquisam "açaí perto de mim" no Google. Com o cardápio digital + Google Meu Negócio configurado, os pedidos chegam organizados pelo WhatsApp — sem confusão de mensagem avulsa e sem depender de marketplace.',
    benefit: 'Pedidos organizados',
    benefitLabel: 'mesmo no pico do verão',
  },
  {
    id: 4,
    icon: MessageCircle,
    niche: 'Cafeteria ou confeitaria',
    situation: 'Nunca mexeu com tecnologia',
    text: 'O catálogo já vem pronto com produtos do nicho. É só trocar nome, preço e foto pelo painel visual — funciona no celular. Se sabe usar WhatsApp, sabe usar o editor. Em minutos o cardápio está no ar.',
    benefit: 'Pronto em minutos',
    benefitLabel: 'sem programador',
  },
  {
    id: 5,
    icon: Lightbulb,
    niche: 'Bar ou espetaria com mesas',
    situation: 'Quer reduzir filas e erros',
    text: 'QR Code nas mesas + cardápio digital com fotos = cliente pede direto pelo celular. Pedido chega certo, sem erro de anotação. O cardápio completo com fotos tende a aumentar o ticket médio porque o cliente vê todas as opções.',
    benefit: 'Sem erro de anotação',
    benefitLabel: 'pedido direto pelo celular',
  },
]

// ─── AUTOPLAY CONFIG ────────────────────────────────────────────────────────
const AUTOPLAY_INTERVAL = 6_000

// ─── COMPONENT ──────────────────────────────────────────────────────────────
export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const goTo = useCallback((index: number) => {
    setCurrent((index + SCENARIOS.length) % SCENARIOS.length)
  }, [])

  const next = useCallback(() => goTo(current + 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1), [current, goTo])

  // Autoplay
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(next, AUTOPLAY_INTERVAL)
    return () => clearInterval(timer)
  }, [next, isPaused])

  const scenario = SCENARIOS[current]
  const Icon = scenario.icon

  return (
    <section
      data-testid="testimonials-section"
      aria-label="Cenários de uso"
      className="border-t border-zinc-100 bg-zinc-50 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-14 text-center">
          <p className="text-sm font-bold tracking-[0.2em] text-orange-600 uppercase">
            Essa poderia ser a sua história
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Veja o que a Zairyx resolve{' '}
            <span className="text-orange-500">no dia a dia do delivery</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-zinc-600">
            Cenários reais baseados nas funcionalidades do sistema. Qual deles é o seu?
          </p>
        </div>

        {/* Carousel */}
        <div
          className="relative mx-auto max-w-3xl"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          role="region"
          aria-roledescription="carousel"
          aria-label="Cenários de uso do Zairyx"
        >
          {/* Card */}
          <div
            className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-lg md:p-10"
            role="group"
            aria-roledescription="slide"
            aria-label={`Cenário ${current + 1} de ${SCENARIOS.length}`}
          >
            {/* Niche badge */}
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                <Icon className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">{scenario.niche}</p>
                <p className="text-xs text-zinc-500">{scenario.situation}</p>
              </div>
            </div>

            {/* Scenario text */}
            <p className="text-lg leading-relaxed text-zinc-700 md:text-xl">{scenario.text}</p>

            {/* Benefit badge */}
            <div className="mt-8 flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                Cenário ilustrativo · funcionalidades reais do sistema
              </p>
              <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-center">
                <p className="text-xl font-bold text-green-700">{scenario.benefit}</p>
                <p className="text-xs font-medium text-green-600">{scenario.benefitLabel}</p>
              </div>
            </div>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={prev}
            aria-label="Cenário anterior"
            className="absolute top-1/2 -left-4 -translate-y-1/2 rounded-full border border-zinc-200 bg-white p-2.5 shadow-md transition-colors hover:bg-zinc-50 md:-left-6"
          >
            <ChevronLeft className="h-5 w-5 text-zinc-700" />
          </button>
          <button
            onClick={next}
            aria-label="Próximo cenário"
            className="absolute top-1/2 -right-4 -translate-y-1/2 rounded-full border border-zinc-200 bg-white p-2.5 shadow-md transition-colors hover:bg-zinc-50 md:-right-6"
          >
            <ChevronRight className="h-5 w-5 text-zinc-700" />
          </button>

          {/* Dots */}
          <div
            className="mt-6 flex justify-center gap-2"
            role="tablist"
            aria-label="Selecionar cenário"
          >
            {SCENARIOS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                role="tab"
                aria-selected={i === current}
                aria-label={`Cenário ${i + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  i === current ? 'w-8 bg-orange-500' : 'w-2.5 bg-zinc-300 hover:bg-zinc-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* CTA — convite para ser o próximo */}
        <div className="mt-14 rounded-2xl border border-orange-200 bg-orange-50 p-6 text-center md:p-8">
          <p className="text-lg font-bold text-zinc-900">
            Quer ser o primeiro a contar sua história com a Zairyx?
          </p>
          <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-600">
            Quando nossos clientes tiverem resultados reais, os depoimentos vão aparecer aqui — com
            nome, negócio e números de verdade. Sem inventar.
          </p>
        </div>
      </div>
    </section>
  )
}
