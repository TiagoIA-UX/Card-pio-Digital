'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Quote, Star, TrendingUp, Users, Zap } from 'lucide-react'

// ─── TESTIMONIALS DATA ──────────────────────────────────────────────────────
interface Testimonial {
  id: number
  name: string
  role: string
  business: string
  avatar: string
  rating: number
  text: string
  metric: string
  metricLabel: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'Carlos Mendes',
    role: 'Proprietário',
    business: 'Pizzaria Bella Napoli',
    avatar: '/testimonials/avatar-1.webp',
    rating: 5,
    text: 'Antes eu pagava quase R$ 800/mês de comissão pro iFood só nos clientes que já eram meus. Hoje esses pedidos vêm pelo meu cardápio digital e o dinheiro fica no meu caixa. Montei tudo em 20 minutos.',
    metric: 'R$ 2.400',
    metricLabel: 'economia em 3 meses',
  },
  {
    id: 2,
    name: 'Ana Lucia Santos',
    role: 'Gerente',
    business: 'Hamburgueria The Burguer',
    avatar: '/testimonials/avatar-2.webp',
    rating: 5,
    text: 'A IA atende até de madrugada. Já peguei pedido que entrou 2h da manhã porque o cliente navegou no cardápio e a IA tirou a dúvida dele na hora. Antes eu perdia essas vendas.',
    metric: '+35%',
    metricLabel: 'aumento nos pedidos',
  },
  {
    id: 3,
    name: 'Roberto Almeida',
    role: 'Proprietário',
    business: 'Açaíteria Tropical Mix',
    avatar: '/testimonials/avatar-3.webp',
    rating: 5,
    text: 'No verão o movimento triplica e antes era um caos no WhatsApp. Agora os pedidos chegam organizados, com tudo detalhado. Minha equipe atende o triplo sem estresse.',
    metric: '3x',
    metricLabel: 'mais pedidos no verão',
  },
  {
    id: 4,
    name: 'Fernanda Costa',
    role: 'Proprietária',
    business: 'Café & Confeitaria Doce Aroma',
    avatar: '/testimonials/avatar-4.webp',
    rating: 5,
    text: 'Eu tinha medo de tecnologia, achava que ia ser complicado. Em 15 minutos meu cardápio estava no ar com fotos e tudo. Se eu sei usar WhatsApp, sei usar o painel.',
    metric: '15 min',
    metricLabel: 'para colocar no ar',
  },
  {
    id: 5,
    name: 'Marcos Oliveira',
    role: 'Sócio',
    business: 'Espetaria & Bar do Marcos',
    avatar: '/testimonials/avatar-5.webp',
    rating: 5,
    text: 'Coloquei QR Code nas mesas e o pessoal pede direto pelo celular. Economizo em garçom, o cliente fica mais satisfeito e meu ticket médio subiu porque ele vê o cardápio completo com fotos.',
    metric: '+22%',
    metricLabel: 'ticket médio maior',
  },
]

const STATS = [
  { icon: Users, value: '500+', label: 'Deliverys ativos' },
  { icon: TrendingUp, value: 'R$ 2M+', label: 'Economia gerada' },
  { icon: Zap, value: '4.9/5', label: 'Nota média' },
] as const

// ─── AUTOPLAY CONFIG ────────────────────────────────────────────────────────
const AUTOPLAY_INTERVAL = 6_000

// ─── COMPONENT ──────────────────────────────────────────────────────────────
export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const goTo = useCallback((index: number) => {
    setCurrent((index + TESTIMONIALS.length) % TESTIMONIALS.length)
  }, [])

  const next = useCallback(() => goTo(current + 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1), [current, goTo])

  // Autoplay
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(next, AUTOPLAY_INTERVAL)
    return () => clearInterval(timer)
  }, [next, isPaused])

  const testimonial = TESTIMONIALS[current]

  return (
    <section
      data-testid="testimonials-section"
      aria-label="Depoimentos de clientes"
      className="border-t border-zinc-100 bg-zinc-50 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-14 text-center">
          <p className="text-sm font-bold tracking-[0.2em] text-orange-600 uppercase">
            Quem usa, recomenda
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Donos de delivery que{' '}
            <span className="text-orange-500">pararam de perder dinheiro</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-zinc-600">
            Veja o que donos de pizzaria, hamburgueria, açaíteria e bar dizem sobre a Zairyx.
          </p>
        </div>

        {/* Carousel */}
        <div
          className="relative mx-auto max-w-3xl"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          role="region"
          aria-roledescription="carousel"
          aria-label="Depoimentos de clientes"
        >
          {/* Card */}
          <div
            className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-lg md:p-10"
            role="group"
            aria-roledescription="slide"
            aria-label={`Depoimento ${current + 1} de ${TESTIMONIALS.length}`}
          >
            <Quote className="mb-4 h-8 w-8 text-orange-200" aria-hidden="true" />

            {/* Stars */}
            <div className="mb-4 flex gap-1" aria-label={`${testimonial.rating} estrelas`}>
              {Array.from({ length: testimonial.rating }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-orange-400 text-orange-400" />
              ))}
            </div>

            {/* Quote text */}
            <blockquote className="text-lg leading-relaxed text-zinc-700 md:text-xl">
              &ldquo;{testimonial.text}&rdquo;
            </blockquote>

            {/* Author + Metric */}
            <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-orange-200 bg-zinc-100">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                    onError={(e) => {
                      const target = e.currentTarget
                      target.style.display = 'none'
                    }}
                  />
                  {/* Fallback initials */}
                  <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-orange-600">
                    {testimonial.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                </div>
                <div>
                  <p className="text-base font-bold text-zinc-900">{testimonial.name}</p>
                  <p className="text-sm text-zinc-500">
                    {testimonial.role} · {testimonial.business}
                  </p>
                </div>
              </div>

              {/* Metric badge */}
              <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-center">
                <p className="text-xl font-bold text-green-700">{testimonial.metric}</p>
                <p className="text-xs font-medium text-green-600">{testimonial.metricLabel}</p>
              </div>
            </div>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={prev}
            aria-label="Depoimento anterior"
            className="absolute top-1/2 -left-4 -translate-y-1/2 rounded-full border border-zinc-200 bg-white p-2.5 shadow-md transition-colors hover:bg-zinc-50 md:-left-6"
          >
            <ChevronLeft className="h-5 w-5 text-zinc-700" />
          </button>
          <button
            onClick={next}
            aria-label="Próximo depoimento"
            className="absolute top-1/2 -right-4 -translate-y-1/2 rounded-full border border-zinc-200 bg-white p-2.5 shadow-md transition-colors hover:bg-zinc-50 md:-right-6"
          >
            <ChevronRight className="h-5 w-5 text-zinc-700" />
          </button>

          {/* Dots */}
          <div
            className="mt-6 flex justify-center gap-2"
            role="tablist"
            aria-label="Selecionar depoimento"
          >
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                role="tab"
                aria-selected={i === current}
                aria-label={`Depoimento ${i + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  i === current ? 'w-8 bg-orange-500' : 'w-2.5 bg-zinc-300 hover:bg-zinc-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-14 grid grid-cols-3 gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="mx-auto mb-2 h-6 w-6 text-orange-500" aria-hidden="true" />
              <p className="text-2xl font-bold text-zinc-900 md:text-3xl">{stat.value}</p>
              <p className="mt-1 text-sm text-zinc-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
