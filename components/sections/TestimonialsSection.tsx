'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Star, Quote, ChevronLeft, ChevronRight, Flame, MapPin, TrendingUp } from 'lucide-react'

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Carlos Mendes',
    business: 'Pizzaria do Carlos',
    location: 'São Paulo, SP',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    revenue: 'R$ 25.000/mês',
    savings: 'R$ 3.750/mês',
    quote: 'Antes eu pagava quase R$ 4 mil de comissão pro iFood. Agora mando meus clientes fiéis pro meu cardápio e esse dinheiro fica comigo. A IA responde até de madrugada!',
    highlight: 'economia',
  },
  {
    id: 2,
    name: 'Ana Paula Silva',
    business: 'Açaí da Ana',
    location: 'Rio de Janeiro, RJ',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    revenue: 'R$ 18.000/mês',
    savings: 'R$ 2.700/mês',
    quote: 'Em 20 minutos meu cardápio estava no ar. Meus clientes amaram o visual e a facilidade de pedir. O painel é mais fácil que o WhatsApp!',
    highlight: 'facilidade',
  },
  {
    id: 3,
    name: 'Roberto Tanaka',
    business: 'Sushi Tanaka',
    location: 'Curitiba, PR',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    revenue: 'R$ 35.000/mês',
    savings: 'R$ 5.250/mês',
    quote: 'A IA entende as perguntas dos clientes sobre ingredientes e alergias. Antes eu perdia pedidos porque não conseguia responder rápido. Agora vendo até às 2h da manhã!',
    highlight: 'ia',
  },
  {
    id: 4,
    name: 'Fernanda Costa',
    business: 'Burguer da Fê',
    location: 'Belo Horizonte, MG',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    revenue: 'R$ 22.000/mês',
    savings: 'R$ 3.300/mês',
    quote: 'Migrei 60% dos meus pedidos do iFood pro meu cardápio. São R$ 3 mil a mais no bolso todo mês. E o melhor: os clientes nem percebem diferença!',
    highlight: 'economia',
  },
  {
    id: 5,
    name: 'João Barbosa',
    business: 'Espetinho do João',
    location: 'Fortaleza, CE',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    revenue: 'R$ 15.000/mês',
    savings: 'R$ 2.250/mês',
    quote: 'Eu achava que ia ser complicado, mas foi mais fácil que postar no Instagram. Coloquei no ar sozinho e minha esposa ficou impressionada!',
    highlight: 'facilidade',
  },
] as const

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? 'fill-orange-400 text-orange-400' : 'fill-zinc-200 text-zinc-200'}`}
        />
      ))}
    </div>
  )
}

function HighlightBadge({ type }: { type: string }) {
  const config = {
    economia: { label: 'Economia Real', color: 'bg-green-100 text-green-700 border-green-200' },
    facilidade: { label: 'Fácil de Usar', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    ia: { label: 'IA 24h', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  }[type] || { label: type, color: 'bg-zinc-100 text-zinc-700 border-zinc-200' }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.color}`}>
      <Flame className="h-3 w-3" />
      {config.label}
    </span>
  )
}

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const goToPrev = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
  }

  const goToNext = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length)
  }

  const current = TESTIMONIALS[currentIndex]

  return (
    <section
      data-testid="testimonials-section"
      className="relative overflow-hidden border-t border-zinc-100 bg-zinc-50 py-20 md:py-28"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(249,115,22,0.05),transparent)]" />

      <div className="container-premium relative">
        <div className="mb-14 text-center">
          <p className="text-sm font-bold tracking-[0.2em] text-orange-600 uppercase">
            Quem usa, recomenda
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Donos de delivery que <span className="text-orange-500">pararam de perder dinheiro</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-600">
            Histórias reais de quem migrou clientes fiéis pro canal próprio e viu a diferença no caixa.
          </p>
        </div>

        {/* Main testimonial card */}
        <div className="mx-auto max-w-4xl">
          <div className="relative rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl md:p-12">
            {/* Quote icon */}
            <Quote className="absolute top-6 right-6 h-12 w-12 text-orange-100 md:top-8 md:right-8 md:h-16 md:w-16" />

            <div className="relative">
              {/* Header with avatar and info */}
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <Image
                    src={current.image}
                    alt={current.name}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full object-cover ring-4 ring-orange-100"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">{current.name}</h3>
                    <p className="text-sm font-medium text-orange-600">{current.business}</p>
                    <p className="flex items-center gap-1 text-xs text-zinc-500">
                      <MapPin className="h-3 w-3" />
                      {current.location}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <StarRating rating={current.rating} />
                  <HighlightBadge type={current.highlight} />
                </div>
              </div>

              {/* Quote */}
              <blockquote className="mb-8 text-lg leading-relaxed text-zinc-700 md:text-xl md:leading-relaxed">
                &ldquo;{current.quote}&rdquo;
              </blockquote>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 rounded-2xl bg-zinc-50 p-4">
                <div className="text-center">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Faturamento</p>
                  <p className="mt-1 text-xl font-bold text-zinc-900">{current.revenue}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Economia</p>
                  <p className="mt-1 flex items-center justify-center gap-1 text-xl font-bold text-green-600">
                    <TrendingUp className="h-5 w-5" />
                    {current.savings}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={goToPrev}
                data-testid="testimonial-prev"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition-all hover:border-orange-200 hover:text-orange-600"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Dots */}
              <div className="flex gap-2">
                {TESTIMONIALS.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsAutoPlaying(false)
                      setCurrentIndex(index)
                    }}
                    data-testid={`testimonial-dot-${index}`}
                    className={`h-2.5 w-2.5 rounded-full transition-all ${
                      index === currentIndex
                        ? 'w-8 bg-orange-500'
                        : 'bg-zinc-300 hover:bg-zinc-400'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={goToNext}
                data-testid="testimonial-next"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition-all hover:border-orange-200 hover:text-orange-600"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-4 text-center">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="text-2xl font-bold text-green-700 md:text-3xl">R$ 17k+</p>
            <p className="mt-1 text-xs text-green-600 md:text-sm">economia mensal média</p>
          </div>
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-2xl font-bold text-orange-700 md:text-3xl">4.9/5</p>
            <p className="mt-1 text-xs text-orange-600 md:text-sm">satisfação dos clientes</p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-2xl font-bold text-blue-700 md:text-3xl">30min</p>
            <p className="mt-1 text-xs text-blue-600 md:text-sm">tempo médio de setup</p>
          </div>
        </div>
      </div>
    </section>
  )
}
