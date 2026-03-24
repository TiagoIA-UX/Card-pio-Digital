import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Eye, MessageCircle, Sparkles } from 'lucide-react'
import {
  HERO_TEMPLATE_SLUG,
  NICHE_TEMPLATES,
  SCREENSHOT_EDITOR,
  WHATSAPP_LINK,
} from '@/components/home/home-data'

function DarkMetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/12 bg-white/10 p-4 shadow-sm backdrop-blur-md">
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm text-white/70">{label}</div>
    </div>
  )
}

export function HeroSection() {
  const heroTemplate =
    NICHE_TEMPLATES.find((template) => template.slug === HERO_TEMPLATE_SLUG) ?? NICHE_TEMPLATES[0]

  return (
    <section className="relative isolate overflow-hidden px-4 pt-6 pb-20 md:pt-8 md:pb-24">
      <div className="absolute inset-0">
        <Image
          src={heroTemplate.image}
          alt={heroTemplate.name}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(15,23,42,0.92)_0%,rgba(15,23,42,0.78)_42%,rgba(15,23,42,0.3)_72%,rgba(15,23,42,0.45)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.32),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.22),transparent_24%)]" />
      </div>

      <div className="container-premium relative">
        <div className="grid min-h-170 gap-12 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:py-16">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-orange-300" />
              15 Templates para Negócios de Alimentação
            </div>

            <h1 className="max-w-3xl text-4xl leading-[0.95] font-semibold tracking-tight text-balance text-white md:text-6xl lg:text-7xl">
              Zairyx — Cardápio Digital Profissional Para Vender Mais Rápido.
              <span className="mt-3 block text-orange-300">
                Sem Comissão por Pedido. O Lucro É Todo Seu.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90 md:text-xl">
              Seu canal próprio de vendas com painel visual.{' '}
              <span className="font-semibold text-white">
                Atualize preços, fotos e promoções sem depender de ninguém.
              </span>
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/templates"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-500/30 transition-colors hover:bg-orange-600"
              >
                <Eye className="h-5 w-5" />
                Ver os 15 Modelos
              </Link>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                <MessageCircle className="h-5 w-5 text-green-400" />
                Falar com Especialista
              </a>
            </div>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              <DarkMetricCard value="0%" label="de comissão por pedido" />
              <DarkMetricCard value="15" label="modelos profissionais" />
              <DarkMetricCard value="+vendas" label="em alta temporada" />
            </div>
          </div>

          <div className="flex items-end justify-end">
            <div className="w-full max-w-xl rounded-4xl border border-white/12 bg-black/20 p-4 shadow-2xl shadow-black/30 backdrop-blur-md md:p-5">
              <div className="overflow-hidden rounded-[1.6rem] border border-white/12 bg-white/95 shadow-xl">
                <Image
                  src={SCREENSHOT_EDITOR}
                  alt="Painel de edição visual do cardápio digital"
                  width={960}
                  height={576}
                  className="h-64 w-full object-cover object-top md:h-72"
                />
                <div className="p-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-foreground/70 text-xs font-semibold tracking-[0.18em] uppercase">
                        Por Que Escolher o Seu Canal Próprio
                      </p>
                      <h2 className="text-foreground mt-1 text-2xl font-semibold">
                        Vantagens Reais para o Seu Negócio
                      </h2>
                    </div>
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                      Sem Comissão
                    </span>
                  </div>

                  <ul className="text-foreground/80 space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✔</span> Nenhuma taxa por pedido recebido
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✔</span> Venda mais em alta temporada sem
                      sobrecarga
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✔</span> Painel visual — fácil como usar
                      WhatsApp
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✔</span> QR Code e link direto para seus
                      clientes
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✔</span> Pedidos organizados no seu WhatsApp
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✔</span> Funciona no celular e no computador
                    </li>
                  </ul>

                  <div className="mt-6">
                    <Link
                      href="/templates"
                      className="bg-foreground text-background inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
                    >
                      Ver os 15 Modelos
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-2 flex flex-wrap gap-2 lg:-mt-8">
          {NICHE_TEMPLATES.map((template) => {
            const Icon = template.icon

            return (
              <Link
                key={template.slug}
                href={`/templates/${template.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/15"
              >
                <Icon className="h-4 w-4" />
                {template.name}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
