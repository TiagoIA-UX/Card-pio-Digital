import { Suspense } from 'react'
import nextDynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgePercent,
  CheckCircle,
  ChevronRight,
  Eye,
  Flame,
  MapPin,
  MessageCircle,
  Pencil,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import { HomeHeader } from '@/components/home-header'
import { COMMERCIAL_COPY } from '@/lib/domains/marketing/commercial-copy'
import {
  HOME_TEMPLATE_CARDS,
  HOME_TEMPLATE_NICHES,
} from '@/lib/domains/marketing/home-template-catalog'
import { ScrollReveal } from '@/components/scroll-reveal'
import { TrackedLink } from '@/components/tracked-link'
import { HeroBadge, HeroHeading } from '@/components/hero-ab'
import { GuaranteeBadge } from '@/components/guarantee-badge'
import { HomeHeroAnimation } from '@/components/home-hero-animation'

function SectionLoadingFallback({ label }: { label: string }) {
  return (
    <div className="sr-only" aria-live="polite">
      {label}
    </div>
  )
}

const Footer = nextDynamic(
  () => import('@/components/footer').then((m) => ({ default: m.Footer })),
  {
    loading: () => <SectionLoadingFallback label="Carregando rodapé" />,
  }
)
const FaqSection = nextDynamic(() => import('@/components/sections/FaqSection'), {
  loading: () => <SectionLoadingFallback label="Carregando perguntas frequentes" />,
})
const SavingsCalculator = nextDynamic(() => import('@/components/sections/SavingsCalculator'), {
  loading: () => <SectionLoadingFallback label="Carregando calculadora" />,
})
const TestimonialsSection = nextDynamic(() => import('@/components/sections/TestimonialsSection'), {
  loading: () => <SectionLoadingFallback label="Carregando depoimentos" />,
})

const TOP_TEMPLATES = HOME_TEMPLATE_CARDS
const TOTAL_TEMPLATE_NICHES = HOME_TEMPLATE_NICHES.length

export const dynamic = 'force-static'

export default function Home() {
  if (TOTAL_TEMPLATE_NICHES === 0) {
    throw new Error('Nenhum nicho público configurado para a home.')
  }

  if (TOP_TEMPLATES.length === 0) {
    throw new Error('Nenhum template configurado para a home.')
  }

  return (
    <>
      <main className="min-h-screen bg-white text-zinc-900">
        <HomeHeroAnimation />
        <Suspense fallback={<SectionLoadingFallback label="Carregando navegação principal" />}>
          <HomeHeader />
        </Suspense>

        {/* ═══════════════════════════════════════════════════════════════
            HERO — Dor + Urgência + Prova em 5 segundos
        ═══════════════════════════════════════════════════════════════ */}
        <section
          data-testid="hero-section"
          className="relative overflow-hidden bg-zinc-950 px-4 pt-8 pb-16 md:pt-12 md:pb-24"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(249,115,22,0.18),transparent)]" />

          <div className="container-premium relative">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-300 backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                <HeroBadge />
              </div>

              <h1 className="text-4xl leading-[1.04] font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                <HeroHeading />
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-100 contain-layout md:text-lg">
                <strong className="text-white">Seu cardápio digital pronto em 30 minutos.</strong>{' '}
                Zero comissão por pedido e pedidos direto no WhatsApp.
              </p>

              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300">
                Estimativas de economia dependem do seu faturamento, percentual vindo do app e
                adesão do cliente ao canal próprio.
              </p>

              <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-zinc-300">
                iFood ajuda na descoberta. Seu canal próprio é o que protege margem, recompra e
                relacionamento.
              </p>

              <p className="mx-auto mt-3 max-w-3xl text-sm font-bold tracking-wide text-orange-300 uppercase">
                Sem comissão por pedido. Mais margem. Mais controle do seu canal.
              </p>

              <div className="mx-auto mt-5 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 backdrop-blur-sm">
                <span className="inline-flex items-center gap-2 font-semibold text-white">
                  <BadgePercent className="h-4 w-4 text-orange-400" />
                  iFood gera pedido
                </span>
                <span className="text-zinc-500">/</span>
                <span className="inline-flex items-center gap-2 font-semibold text-white">
                  <MessageCircle className="h-4 w-4 text-green-400" />
                  Seu canal gera margem, recompra e relacionamento
                </span>
              </div>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <TrackedLink
                  href="/templates"
                  trackCta="hero_ifood_calc"
                  trackPage="landing"
                  data-testid="hero-cta-primary"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-7 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-500/40"
                >
                  <Flame className="h-5 w-5 transition-transform group-hover:scale-110" />
                  Quero parar de perder dinheiro
                </TrackedLink>
                <TrackedLink
                  href="/templates"
                  trackCta="hero_templates_after_calc"
                  trackPage="landing"
                  data-testid="hero-cta-whatsapp"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-4 text-base font-semibold text-white transition-all hover:bg-white/5"
                >
                  <Eye className="h-5 w-5 text-zinc-300" />
                  Ver meu canal pronto
                </TrackedLink>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-orange-400" />
                  Canal proprio pronto em minutos
                </span>
                <span className="flex items-center gap-1.5">
                  <Pencil className="h-4 w-4 text-green-400" />
                  Reduza dependencia do app
                </span>
              </div>

              <GuaranteeBadge variant="dark" className="mt-4" />
            </div>
          </div>
        </section>

        <section className="cv-auto border-b border-zinc-200 bg-white px-4 py-14 md:py-20">
          <div className="container-premium">
            <div className="mb-8 max-w-3xl">
              <p className="text-sm font-bold tracking-[0.2em] text-orange-600 uppercase">
                Edição tão fácil que você mesmo faz
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
                Mude preços, crie combos e atualize produtos{' '}
                <span className="text-orange-500">em segundos — sem pagar desenvolvedor</span>
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-700">
                Cardápio de verão no litoral? Combo de páscoa? Promoção de happy hour? Ajuste de
                preço na segunda-feira? Você faz tudo direto no painel — rápido, intuitivo e sem
                custo extra.
              </p>
            </div>

            <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.72fr)]">
              <div className="rounded-4xl border border-zinc-200 bg-zinc-50 p-6 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)] md:p-8">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                    Você mesmo edita
                  </span>
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
                    Alteração em tempo real
                  </span>
                </div>

                <div className="relative mx-auto w-full max-w-90 rounded-[2.5rem] border border-zinc-900/10 bg-zinc-900/95 p-2.5 shadow-2xl shadow-black/20 sm:p-3">
                  <div className="overflow-hidden rounded-4xl bg-white ring-1 ring-black/5 sm:rounded-[2.25rem]">
                    <div className="hero-gif-container relative aspect-10/17 w-full overflow-hidden bg-zinc-100 sm:aspect-10/16 lg:aspect-10/15.5">
                      <div className="hero-track flex h-full w-full transition-transform duration-700 ease-out will-change-transform">
                        <div className="hero-frame relative h-full min-w-full bg-zinc-100">
                          <Image
                            src="/hero-frames/frame-1.png"
                            alt="Frame 1: Painel já logado"
                            fill
                            priority
                            fetchPriority="high"
                            sizes="(max-width: 640px) 100vw, 360px"
                            className="object-contain object-top"
                          />
                        </div>
                        <div className="hero-frame relative h-full min-w-full bg-zinc-100">
                          <Image
                            src="/hero-frames/frame-2.png"
                            alt="Frame 2: Catálogo já vem pronto"
                            fill
                            loading="lazy"
                            fetchPriority="low"
                            sizes="(max-width: 640px) 100vw, 360px"
                            className="object-contain object-top"
                          />
                        </div>
                        <div className="hero-frame relative h-full min-w-full bg-zinc-100">
                          <Image
                            src="/hero-frames/frame-3.png"
                            alt="Frame 3: Navegação para produtos"
                            fill
                            loading="lazy"
                            fetchPriority="low"
                            sizes="(max-width: 640px) 100vw, 360px"
                            className="object-contain object-top"
                          />
                        </div>
                        <div className="hero-frame relative h-full min-w-full bg-zinc-100">
                          <Image
                            src="/hero-frames/frame-4.png"
                            alt="Frame 4: Edição instantânea"
                            fill
                            loading="lazy"
                            fetchPriority="low"
                            sizes="(max-width: 640px) 100vw, 360px"
                            className="object-contain object-top"
                          />
                        </div>
                        <div className="hero-frame relative h-full min-w-full bg-zinc-100">
                          <Image
                            src="/hero-frames/frame-5.png"
                            alt="Frame 5: Publicação bem-sucedida"
                            fill
                            loading="lazy"
                            fetchPriority="low"
                            sizes="(max-width: 640px) 100vw, 360px"
                            className="object-contain object-top"
                          />
                        </div>
                        <div className="hero-frame relative h-full min-w-full bg-zinc-100">
                          <Image
                            src="/hero-frames/frame-6.png"
                            alt="Frame 6: Cardápio online e canal próprio"
                            fill
                            loading="lazy"
                            fetchPriority="low"
                            sizes="(max-width: 640px) 100vw, 360px"
                            className="object-contain object-top"
                          />
                        </div>
                      </div>
                      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r from-white to-transparent" />
                      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-white to-transparent" />
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-center text-xs leading-relaxed text-zinc-500">
                  Do login à publicação: edição rápida, visual real no celular, sem complicação.
                </p>
              </div>

              <div className="space-y-5">
                <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_-38px_rgba(15,23,42,0.32)] md:p-6">
                  <div className="absolute inset-y-0 left-0 w-1.5 bg-linear-to-b from-rose-400 to-orange-400" />
                  <div className="mb-3 flex items-start justify-between gap-3 pl-2">
                    <div>
                      <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-rose-700 uppercase">
                        Economia real
                      </span>
                      <p className="mt-2 text-base font-black tracking-tight text-zinc-950 md:text-lg">
                        🎯 Pare de pagar por cada ajuste do seu próprio cardápio
                      </p>
                    </div>
                    <div className="rounded-xl border border-rose-100 bg-rose-50 px-2.5 py-1.5 text-right shadow-sm transition-transform duration-300 group-hover:scale-105">
                      <p className="text-[10px] font-bold tracking-[0.16em] text-rose-600 uppercase">
                        Economia mensal
                      </p>
                      <p className="text-lg font-black text-rose-700 md:text-xl">R$ 750</p>
                    </div>
                  </div>
                  <p className="pl-2 text-sm leading-6 text-zinc-700 md:text-base">
                    Toda vez que você paga alguém para{' '}
                    <strong className="font-extrabold text-zinc-950">mudar preço</strong>,{' '}
                    <strong className="font-extrabold text-zinc-950">criar combo</strong> ou{' '}
                    <strong className="font-extrabold text-zinc-950">trocar foto</strong>, sai
                    dinheiro do caixa sem necessidade. Uma rotina de 5 ajustes no mês pode virar{' '}
                    <strong className="text-rose-700">R$ 750 indo embora</strong> só para manter o
                    básico funcionando.
                  </p>
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 pl-5">
                    <p className="text-xs font-bold text-emerald-800 md:text-sm">
                      ✓ Com o painel editor:{' '}
                      <span className="text-emerald-900">R$ 0 por ajuste</span>. Você altera quando
                      quiser, sem fila, sem intermediário e sem depender de desenvolvedor.
                    </p>
                  </div>
                </div>
                <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_-38px_rgba(15,23,42,0.32)] md:p-6">
                  <div className="absolute inset-y-0 left-0 w-1.5 bg-linear-to-b from-sky-400 to-cyan-400" />
                  <div className="mb-3 flex items-start justify-between gap-3 pl-2">
                    <div>
                      <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-sky-700 uppercase">
                        Operação multiunidade
                      </span>
                      <p className="mt-2 text-base font-black tracking-tight text-zinc-950 md:text-lg">
                        🏖️ Quem opera centro, bairro e litoral precisa de liberdade, não de
                        retrabalho
                      </p>
                    </div>
                    <div className="rounded-xl border border-sky-100 bg-sky-50 px-2.5 py-1.5 text-right shadow-sm transition-transform duration-300 group-hover:scale-105">
                      <p className="text-[10px] font-bold tracking-[0.16em] text-sky-600 uppercase">
                        Controle
                      </p>
                      <p className="text-lg font-black text-sky-700 md:text-xl">1 painel</p>
                    </div>
                  </div>
                  <p className="pl-2 text-sm leading-6 text-zinc-700 md:text-base">
                    Delivery no centro, quiosque no litoral, operação sazonal no verão, cardápio
                    diferente no inverno: tudo isso fica mais inteligente quando cada unidade pode
                    ser ajustada por você.{' '}
                    <strong className="text-sky-700">
                      Sem ligação, sem espera e sem ruído entre equipes.
                    </strong>
                  </p>
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 pl-5">
                    <p className="text-xs font-bold text-emerald-800 md:text-sm">
                      ✓ Controle centralizado para editar categorias, preços, combos e campanhas
                      sazonais em cada operação com muito mais clareza.
                    </p>
                  </div>
                </div>
                <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_-38px_rgba(15,23,42,0.32)] md:p-6">
                  <div className="absolute inset-y-0 left-0 w-1.5 bg-linear-to-b from-amber-400 to-orange-400" />
                  <div className="mb-3 flex items-start justify-between gap-3 pl-2">
                    <div>
                      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-amber-700 uppercase">
                        Agilidade comercial
                      </span>
                      <p className="mt-2 text-base font-black tracking-tight text-zinc-950 md:text-lg">
                        ⚡ Não perca vendas esperando alguém fazer o que você pode resolver agora
                      </p>
                    </div>
                    <div className="rounded-xl border border-amber-100 bg-amber-50 px-2.5 py-1.5 text-right shadow-sm transition-transform duration-300 group-hover:scale-105">
                      <p className="text-[10px] font-bold tracking-[0.16em] text-amber-600 uppercase">
                        Tempo de reação
                      </p>
                      <p className="text-lg font-black text-amber-700 md:text-xl">30 seg</p>
                    </div>
                  </div>
                  <p className="pl-2 text-sm leading-6 text-zinc-700 md:text-base">
                    Segunda vendeu pouco?{' '}
                    <strong className="font-extrabold text-zinc-950">Baixe o preço.</strong> Sexta
                    lotou? <strong className="font-extrabold text-zinc-950">Suba a margem.</strong>{' '}
                    Páscoa, feriado, verão no litoral ou promoção relâmpago?{' '}
                    <strong className="text-amber-700">Você publica no mesmo instante</strong> e
                    aproveita o momento certo de venda.
                  </p>
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 pl-5">
                    <p className="text-xs font-bold text-emerald-800 md:text-sm">
                      ✓ 2 cliques, atualização imediata e publicação no ar direto do celular ou
                      computador. Sem atraso, sem espera, sem perder timing de faturamento.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ScrollReveal>
          <section
            data-testid="google-business-proof-section"
            className="border-b border-blue-100 bg-[linear-gradient(180deg,#eff6ff,white)] px-4 py-14 md:py-20"
          >
            <div className="container-premium">
              <div className="mb-10 text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700">
                  <X className="h-4 w-4" />
                  Se você acha que o iFood é o forte do marketing, leia isso
                </div>
                <h2 className="mx-auto max-w-4xl text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl lg:text-5xl">
                  O marketing verdadeiro está no{' '}
                  <span className="text-blue-600">Google Meu Negócio</span> — não no iFood
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-zinc-700">
                  Dados oficiais provam: quem busca restaurante começa no Google. O iFood é apenas
                  um canal de <strong>conversão</strong> — não de <strong>descoberta</strong>.
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                {/* Lado esquerdo: Dados comprovados */}
                <div className="space-y-6">
                  <div className="rounded-3xl border-2 border-blue-200 bg-white p-6 shadow-[0_24px_70px_-36px_rgba(37,99,235,0.35)]">
                    <p className="text-sm font-bold tracking-[0.18em] text-blue-700 uppercase">
                      Dados oficiais do Google (2021-2024)
                    </p>

                    <div className="mt-6 space-y-4">
                      <div className="rounded-2xl bg-blue-50 p-5">
                        <p className="text-3xl font-bold text-blue-700">46%</p>
                        <p className="mt-2 font-semibold text-zinc-900">
                          Das buscas no Google têm intenção local
                        </p>
                        <p className="mt-1 text-sm text-zinc-600">
                          Quase metade das pessoas que abrem o Google estão procurando algo perto
                          delas — incluindo restaurantes, delivery e lanchonetes.
                        </p>
                        <p className="mt-2 text-xs text-zinc-500">
                          Fonte: Think with Google, 2021 (Local Search Consumer Behavior)
                        </p>
                      </div>

                      <div className="rounded-2xl bg-blue-50 p-5">
                        <p className="text-3xl font-bold text-blue-700">76%</p>
                        <p className="mt-2 font-semibold text-zinc-900">
                          Visitam o estabelecimento em 24 horas
                        </p>
                        <p className="mt-1 text-sm text-zinc-600">
                          Das pessoas que fazem busca local no celular, 3 em cada 4 visitam o local
                          físico no mesmo dia. Para delivery, ligam ou pedem online.
                        </p>
                        <p className="mt-2 text-xs text-zinc-500">
                          Fonte: Think with Google, 2021 (Mobile Local Search Studies)
                        </p>
                      </div>

                      <div className="rounded-2xl bg-blue-50 p-5">
                        <p className="text-3xl font-bold text-blue-700">28%</p>
                        <p className="mt-2 font-semibold text-zinc-900">Resultam em compra</p>
                        <p className="mt-1 text-sm text-zinc-600">
                          Mais de 1 em cada 4 buscas locais geram uma compra. No Google, a intenção
                          é alta — a pessoa já quer resolver o problema dela.
                        </p>
                        <p className="mt-2 text-xs text-zinc-500">
                          Fonte: Think with Google, 2021 (Local Search Conversion Data)
                        </p>
                      </div>

                      <div className="rounded-2xl bg-green-50 p-5">
                        <p className="text-3xl font-bold text-green-700">
                          R$ 0<span className="text-lg">,00</span>
                        </p>
                        <p className="mt-2 font-semibold text-zinc-900">
                          Custo do Google Meu Negócio
                        </p>
                        <p className="mt-1 text-sm text-zinc-600">
                          100% gratuito. Você não paga NADA para aparecer nas buscas locais do
                          Google e do Maps. Zero comissão por pedido, zero mensalidade, zero custo
                          de aquisição.
                        </p>
                        <p className="mt-2 text-xs text-zinc-500">
                          Fonte: business.google.com/br (verificado em 10/04/2026)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-zinc-200 bg-white p-6">
                    <p className="text-sm font-bold tracking-[0.18em] text-zinc-500 uppercase">
                      O que isso significa na prática
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-700">
                      Quando alguém busca &quot;pizzaria perto de mim&quot; ou &quot;lanchonete
                      delivery&quot;, ela <strong>começa no Google</strong> — não no iFood. O iFood
                      só entra depois, se ela não encontrar você no Google ou preferir a comodidade
                      do app (pagando 27% de comissão pra você).
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-700">
                      Se o seu <strong>Google Meu Negócio</strong> estiver configurado com link pro
                      seu cardápio digital, o cliente pode pedir <strong>direto de você</strong> —
                      sem intermediário, sem comissão, 100% da margem.
                    </p>
                  </div>
                </div>

                {/* Lado direito: Comparação direta */}
                <div className="space-y-6">
                  <div className="rounded-3xl border-2 border-orange-200 bg-orange-50 p-6">
                    <p className="text-sm font-bold tracking-[0.18em] text-orange-700 uppercase">
                      iFood vs Google: A verdade que ninguém te conta
                    </p>

                    <div className="mt-6 space-y-4">
                      <div className="rounded-2xl border border-orange-200 bg-white p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-zinc-900">iFood</p>
                            <p className="mt-1 text-xs text-zinc-600">Canal de conversão pago</p>
                          </div>
                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                            12-27% comissão
                          </span>
                        </div>
                        <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                          <li className="flex items-start gap-2">
                            <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                            Cobra 12-27% de comissão por pedido
                          </li>
                          <li className="flex items-start gap-2">
                            <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                            Você compete por visibilidade (quem paga mais aparece)
                          </li>
                          <li className="flex items-start gap-2">
                            <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                            Cliente é do iFood, não seu (você não tem o contato)
                          </li>
                          <li className="flex items-start gap-2">
                            <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                            Mudou o algoritmo? Suas vendas caem
                          </li>
                        </ul>
                      </div>

                      <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-zinc-900">Google Meu Negócio</p>
                            <p className="mt-1 text-xs text-zinc-600">
                              Canal de descoberta gratuito
                            </p>
                          </div>
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                            0% comissão
                          </span>
                        </div>
                        <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                            100% gratuito — zero comissão, zero taxa
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                            46% das buscas têm intenção local (dados oficiais)
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                            Cliente encontra VOCÊ, não um marketplace
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                            Você controla a experiência e o relacionamento
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl bg-white p-5">
                      <p className="font-semibold text-zinc-900">A estratégia correta:</p>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                        <strong className="text-blue-600">Google Meu Negócio</strong> para aparecer
                        nas buscas locais (gratuito) +{' '}
                        <strong className="text-green-600">Cardápio próprio</strong> para receber
                        pedidos sem comissão. Use o iFood{' '}
                        <strong>só para captar clientes novos</strong>, depois migre pro seu canal.
                      </p>

                      <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                        <p className="text-sm font-semibold text-green-800">
                          Dica prática para fortalecer seu canal próprio
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-green-700">
                          Mantenha Google Meu Negócio atualizado, divulgue seu link direto no
                          WhatsApp e capture recorrência no seu próprio canal para reduzir
                          dependência de marketplace.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-3xl border border-blue-200 bg-white p-6">
                      <p className="font-semibold text-zinc-900">
                        Como configurar (passo a passo):
                      </p>
                      <ol className="mt-3 space-y-2 text-sm text-zinc-700">
                        <li className="flex gap-2">
                          <span className="font-bold text-blue-600">1.</span>
                          Acesse business.google.com e cadastre seu estabelecimento
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold text-blue-600">2.</span>
                          Adicione fotos, horários, endereço e categorias
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold text-blue-600">3.</span>
                          Coloque o link do seu cardápio digital no campo &quot;Website&quot;
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold text-blue-600">4.</span>
                          Pronto! Agora você aparece em &quot;delivery perto de mim&quot;
                        </li>
                      </ol>
                    </div>

                    <div className="flex flex-col gap-3">
                      <TrackedLink
                        href="/google-meu-negocio"
                        trackCta="google_business_data_proof"
                        trackPage="landing"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5 hover:bg-blue-700"
                      >
                        <Search className="h-5 w-5" />
                        Guia completo: Google Meu Negócio
                      </TrackedLink>

                      <a
                        href="https://business.google.com/br/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-blue-200 px-6 py-4 text-base font-semibold text-blue-700 transition-all hover:bg-blue-50"
                      >
                        Cadastrar agora (gratuito)
                        <ArrowRight className="h-5 w-5" />
                      </a>

                      <p className="text-center text-xs text-zinc-500">
                        Fontes: Think with Google (2021-2024) | business.google.com (verificado em
                        10/04/2026)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call-out final */}
              <div className="mt-10 rounded-3xl border-2 border-orange-200 bg-orange-50 p-8 text-center">
                <p className="text-lg font-bold text-zinc-900">
                  <Sparkles className="mr-2 inline h-5 w-5 text-orange-500" />
                  Por que a Zairyx criou esta seção?
                </p>
                <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-zinc-700">
                  Muitos donos de delivery confundem os papéis dos canais. O iFood funciona como um{' '}
                  <strong>canal de conversão</strong>, enquanto o marketing de descoberta local
                  acontece com força no <strong>Google Meu Negócio</strong>. Quando você combina os
                  dois com estratégia e fortalece seu canal próprio, reduz dependência e melhora sua
                  margem com previsibilidade.
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ═══════════════════════════════════════════════════════════════
            SOCIAL PROOF — Números de impacto + urgência
        ═══════════════════════════════════════════════════════════════ */}
        <section data-testid="proof-section" className="border-b border-zinc-100 bg-zinc-50 py-8">
          <div className="container-premium">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              <ProofStat value="0%" label="de comissao da Zairyx por pedido" highlight />
              <ProofStat value={String(TOTAL_TEMPLATE_NICHES)} label="nichos com modelo pronto" />
              <ProofStat value="30 min" label="e seu cardápio está no ar" />
              <ProofStat
                value="+ margem"
                label="com canal proprio e menos intermediacao"
                highlight
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            VELOCIDADE — Tempo de ativação
        ═══════════════════════════════════════════════════════════════ */}
        <div className="border-b border-green-500/20 bg-zinc-950 py-4">
          <div className="container-premium flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-center text-sm font-semibold text-zinc-300 sm:text-left">
              <span className="font-bold text-green-400">⚡ Comece hoje mesmo:</span> escolha seu
              modelo, edite os produtos e{' '}
              <strong className="text-white">saia vendendo em minutos</strong> — sem esperar
              configuração, sem cadastrar nada do zero.
            </p>
            <TrackedLink
              href="/templates"
              trackCta="urgency_strip_comecar"
              trackPage="landing"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-green-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-green-600"
            >
              Começar agora
              <ArrowRight className="h-3.5 w-3.5" />
            </TrackedLink>
          </div>
        </div>

        <section className="border-b border-zinc-200 bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_100%)] px-4 py-14 md:py-16">
          <div className="container-premium">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
              <div>
                <p className="text-sm font-bold tracking-[0.2em] text-orange-600 uppercase">
                  Nova frente de receita
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 md:text-4xl">
                  Programa de afiliados <span className="text-orange-500">ativo</span> para quem
                  quer escalar comissão recorrente.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-700">
                  Indicou delivery, entrou pelo seu link e aprovou no fluxo operacional: você
                  monetiza com rastreio real e acompanhamento em painel. Sem planilha, sem achismo,
                  sem promessa vaga.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-orange-200 bg-white p-4 shadow-sm">
                    <p className="text-2xl font-black text-zinc-950">30%</p>
                    <p className="mt-1 text-xs text-zinc-600">comissão recorrente base</p>
                  </div>
                  <div className="rounded-2xl border border-orange-200 bg-white p-4 shadow-sm">
                    <p className="text-2xl font-black text-zinc-950">30d</p>
                    <p className="mt-1 text-xs text-zinc-600">janela de aprovação operacional</p>
                  </div>
                  <div className="rounded-2xl border border-orange-200 bg-white p-4 shadow-sm">
                    <p className="text-2xl font-black text-zinc-950">100%</p>
                    <p className="mt-1 text-xs text-zinc-600">rastreável no painel e ranking</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.28)]">
                <p className="text-sm font-bold tracking-[0.18em] text-zinc-500 uppercase">
                  Como ganhar de forma consistente
                </p>
                <ul className="mt-4 space-y-3 text-sm text-zinc-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    Gere seu link e distribua para donos de delivery com perfil de compra.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    Acompanhe indicação, aprovação e pagamento em trilha operacional transparente.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    Escale com consistência: volume qualificado &gt; comissão recorrente previsível.
                  </li>
                </ul>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <TrackedLink
                    href="/afiliados"
                    trackCta="home_affiliate_primary"
                    trackPage="landing"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-orange-600"
                  >
                    Quero ganhar com afiliados
                    <ArrowRight className="h-4 w-4" />
                  </TrackedLink>
                  <TrackedLink
                    href="/afiliados/ranking"
                    trackCta="home_affiliate_ranking"
                    trackPage="landing"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-900 transition-all hover:bg-zinc-50"
                  >
                    Ver ranking público
                  </TrackedLink>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                  Comissão condicionada a regras operacionais e validações do programa de afiliados.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            DIFERENCIAIS — 4 pilares que vendem
        ═══════════════════════════════════════════════════════════════ */}
        <ScrollReveal>
          <section data-testid="pain-solution-section" className="py-20 md:py-28">
            <div className="container-premium">
              <div className="mb-14 max-w-2xl">
                <p className="text-sm font-bold tracking-[0.2em] text-orange-600 uppercase">
                  Por que funciona
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                  Seu delivery pronto.{' '}
                  <span className="text-orange-500">Você só edita e vende.</span>
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-zinc-700">
                  Nada de começar do zero. Seu catálogo já vem com produtos reais, categorias
                  organizadas e estrutura pensada para vender. É só trocar o que quiser e publicar.
                </p>
              </div>

              {/* 4 Differentials */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border-2 border-orange-200 bg-orange-50/50 p-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-white">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900">Já vem pronto</h3>
                  <p className="mt-3 text-base leading-relaxed text-zinc-700">
                    Nada de cadastrar produto por produto. Seu catálogo já vem completo com
                    produtos, descrições, preços e categorias do seu nicho. Só trocar o que quiser.
                  </p>
                  <p className="mt-2 text-xs text-zinc-400">
                    * Algumas imagens dos templates são ilustrativas. Recomendamos substituí-las
                    pelas fotos reais dos seus produtos antes de publicar.
                  </p>
                </div>

                <div className="rounded-3xl border-2 border-green-200 bg-green-50/50 p-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 text-white">
                    <Pencil className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900">Edite tudo com poucos cliques</h3>
                  <p className="mt-3 text-base leading-relaxed text-zinc-700">
                    Altere nome, preço, imagens e categorias sem precisar de programador. Se você
                    usa WhatsApp, você usa nosso editor. Funciona no celular.
                  </p>
                </div>

                <div className="rounded-3xl border-2 border-green-200 bg-green-50/50 p-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-600 text-white">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900">Venda direto no WhatsApp</h3>
                  <p className="mt-3 text-base leading-relaxed text-zinc-700">
                    Receba pedidos organizados automaticamente no seu WhatsApp. Sem confusão, sem
                    erro. O cliente monta o pedido e você recebe tudo certinho.
                  </p>
                </div>

                <div className="rounded-3xl border-2 border-zinc-200 bg-zinc-50/50 p-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 text-white">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900">Economize com desenvolvimento</h3>
                  <p className="mt-3 text-base leading-relaxed text-zinc-700">
                    Nada de gastar com criação de site ou sistema do zero. Tudo já está pronto,
                    testado e funcionando. Mensalidade fixa, sem surpresas.
                  </p>
                </div>
              </div>

              {/* Catálogo estratégico callout */}
              <div className="mt-10 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center">
                <p className="text-lg font-bold text-zinc-900">
                  <Sparkles className="mr-2 inline h-5 w-5 text-blue-500" />
                  Não é só um catálogo
                </p>
                <p className="mt-2 text-sm text-zinc-600">
                  Seu sistema já vem organizado com produtos estratégicos para aumentar suas vendas.
                  Categorias pensadas, leitura rápida no celular e pedido organizado para o cliente
                  concluir sem confusão.
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ═══════════════════════════════════════════════════════════════
            CALCULADORA DE ECONOMIA — Conversão por dados
        ═══════════════════════════════════════════════════════════════ */}
        <SavingsCalculator />

        {/* ═══════════════════════════════════════════════════════════════
            COMO FUNCIONA — 3 passos com urgência
        ═══════════════════════════════════════════════════════════════ */}
        <ScrollReveal>
          <section
            id="como-funciona"
            data-testid="how-it-works-section"
            className="border-t border-zinc-100 bg-zinc-50 py-20 md:py-28"
          >
            <div className="container-premium">
              <div className="mb-14 text-center">
                <p className="text-sm font-bold tracking-[0.2em] text-orange-600 uppercase">
                  Leva menos de 30 minutos
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                  3 passos e seu delivery já está vendendo
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-base text-zinc-600">
                  Enquanto você lê isso, concorrentes seus já estão recebendo pedidos no canal
                  próprio com menor dependência de marketplaces.
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-3">
                <StepCard
                  step="01"
                  icon={<Sparkles className="h-6 w-6" />}
                  title="Escolha o modelo do seu nicho"
                  description={`${TOTAL_TEMPLATE_NICHES} nichos prontos: Pizzaria, Lanches e Burgers, Bar e Petiscos, Cafeteria e Brunch, Açaí e Cremes e mais. Já vêm com produtos reais de exemplo — só trocar.`}
                />
                <StepCard
                  step="02"
                  icon={<Pencil className="h-6 w-6" />}
                  title="Troque preço e foto em 5 segundos"
                  description="Editor visual feito pra quem não é de TI. Se usa WhatsApp, usa o painel. Funciona no celular, tablet ou PC."
                />
                <StepCard
                  step="03"
                  icon={<Send className="h-6 w-6" />}
                  title="Publique e comece a lucrar"
                  description="Envie seu link por WhatsApp, Instagram e QR Code. Pedidos chegam organizados. O valor do pedido entra no seu canal, sem comissao da Zairyx por venda."
                />
              </div>

              <div className="mt-10 text-center">
                <TrackedLink
                  href="/templates"
                  trackCta="howit_works_cta"
                  trackPage="landing"
                  className="group inline-flex items-center gap-2 text-base font-bold text-orange-600 hover:text-orange-700"
                >
                  Começar agora mesmo
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </TrackedLink>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ═══════════════════════════════════════════════════════════════
            BENEFÍCIOS — Grid de resultado + features novas
        ═══════════════════════════════════════════════════════════════ */}
        <ScrollReveal>
          <section id="beneficios" data-testid="benefits-section" className="py-20 md:py-28">
            <div className="container-premium">
              <div className="mb-14 max-w-2xl">
                <p className="text-sm font-bold tracking-[0.2em] text-orange-600 uppercase">
                  Tudo que você precisa para vender mais
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                  Seu diferencial:{' '}
                  <span className="text-orange-500">facilitar a compra do cliente</span>
                </h2>
                <p className="mt-4 text-base text-zinc-600">
                  Produto pronto, editor intuitivo e pedidos organizados. Você foca no que importa:
                  fazer comida boa e atender bem.
                </p>
                <Link
                  href="/beneficios"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700"
                >
                  Ver todos os benefícios
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <BenefitCard
                  icon={<Sparkles className="h-5 w-5" />}
                  title="Catálogo completo do seu nicho"
                  text="Seu cardápio já vem com produtos reais, descrições e categorias — pronto para editar e publicar. Zero trabalho de cadastro."
                  accent
                />
                <BenefitCard
                  icon={<Pencil className="h-5 w-5" />}
                  title="Editor intuitivo, fluido como WhatsApp"
                  text="Mude preço, foto e categoria em poucos cliques pelo celular. Se você manda áudio no WhatsApp, você usa nosso painel."
                  accent
                />
                <BenefitCard
                  icon={<Sparkles className="h-5 w-5" />}
                  title="IA que atende"
                  text="Assistente de IA responde dúvidas, sugere itens e ajuda o cliente a fechar o pedido. Atendimento 24h sem custo extra de equipe."
                />
                <BenefitCard
                  icon={<Zap className="h-5 w-5" />}
                  title="Venda no mesmo dia"
                  text="Escolha o modelo, edite o que quiser e publique. Pedidos chegam organizados no WhatsApp. Velocidade é dinheiro."
                  accent
                />
                <BenefitCard
                  icon={<MessageCircle className="h-5 w-5" />}
                  title="Pedidos organizados no WhatsApp"
                  text="Cliente monta o pedido no cardápio e envia tudo organizado no seu WhatsApp. Sem confusão de mensagem, sem pedido errado."
                />
                <BenefitCard
                  icon={<Sparkles className="h-5 w-5" />}
                  title="Pedido simples para o cliente"
                  text="O cliente encontra categoria, escolhe item, ajusta observação e envia tudo organizado. Menos atrito para pedir, menos retrabalho para atender."
                />
                <BenefitCard
                  icon={<CheckCircle className="h-5 w-5" />}
                  title="Pagamento online integrado"
                  text="Seu cliente paga com cartão, PIX ou parcelado direto no pedido. Confirmação automática — sem conferir manualmente."
                />
                <BenefitCard
                  icon={<Shield className="h-5 w-5" />}
                  title={`Mensalidade fixa, ${COMMERCIAL_COPY.noPlatformCommission.toLowerCase()}`}
                  text="Vendeu R$ 1.000 ou R$ 100.000? A mensalidade da Zairyx nao muda. Taxas de pagamento e entrega, quando existirem, seguem separadas."
                />
                <BenefitCard
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title={COMMERCIAL_COPY.withdrawalOnline}
                  text="Voce pode cancelar em até 7 dias corridos após a contratação online, conforme o CDC e os termos vigentes."
                />
                <BenefitCard
                  icon={<BadgePercent className="h-5 w-5" />}
                  title="Sua marca, não a de terceiros"
                  text="Cardápio com sua logo, suas cores e seu nome. O cliente lembra de você. É fidelização de verdade."
                />
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ═══════════════════════════════════════════════════════════════
            CTA MID-PAGE — Ancoragem de preço + FOMO
        ═══════════════════════════════════════════════════════════════ */}
        <section className="bg-linear-to-r from-orange-600 to-orange-500 py-14">
          <div className="container-premium flex flex-col items-center gap-6 text-center">
            <p className="text-sm font-bold tracking-[0.15em] text-orange-100 uppercase">
              Objetivo, profissional e pronto para usar
            </p>
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              R$ 147/mês fixo.{' '}
              <span className="text-orange-200">
                Catálogo pronto. {COMMERCIAL_COPY.noPlatformCommission}.
              </span>
            </h2>
            <p className="max-w-xl text-base text-orange-100">
              Você não precisa começar do zero. Escolha o modelo do seu nicho, edite o que quiser e
              comece a receber pedidos hoje mesmo.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <TrackedLink
                href="/templates"
                trackCta="mid_page_comecar"
                trackPage="landing"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-base font-bold text-orange-600 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Sparkles className="h-5 w-5" />
                Ver modelos prontos
              </TrackedLink>
              <TrackedLink
                href="/precos"
                trackCta="mid_page_precos"
                trackPage="landing"
                className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-7 py-4 text-base font-bold text-white transition-all hover:bg-white/10"
              >
                Ver preços e planos
              </TrackedLink>
            </div>
            <GuaranteeBadge variant="orange" className="mt-2" />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            DEPOIMENTOS — Prova social real
        ═══════════════════════════════════════════════════════════════ */}
        <TestimonialsSection />

        {/* ═══════════════════════════════════════════════════════════════
          PRODUTO — Screenshots reais + destaques do canal
        ═══════════════════════════════════════════════════════════════ */}
        <ScrollReveal>
          <section
            data-testid="product-section"
            className="border-t border-zinc-100 bg-zinc-50 py-20 md:py-28"
          >
            <div className="container-premium">
              <div className="mb-14 text-center">
                <p className="text-sm font-bold tracking-[0.2em] text-orange-600 uppercase">
                  O produto que reduz dependência do app
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                  Painel profissional.{' '}
                  <span className="text-orange-500">Leitura impecável no celular.</span>
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-700">
                  O objetivo não é só ter um painel bonito. É fazer você editar rápido, publicar sem
                  travar e entregar um canal próprio que o cliente consiga usar no celular sem
                  fricção.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.35)]">
                  <div className="flex flex-col gap-2 border-b border-zinc-100 bg-zinc-50 px-5 py-4">
                    <span className="text-sm font-semibold text-zinc-900">
                      Prova real de leitura no celular
                    </span>
                    <p className="text-sm text-zinc-600">
                      O cliente navega categorias e produtos com clareza, sem aperto visual.
                    </p>
                  </div>
                  <div className="relative aspect-10/14 bg-zinc-100 p-2 sm:p-3">
                    <Image
                      src="/screenshots/painel-editor-tablet.png"
                      alt="Versão em tela menor mostrando edição responsiva do cardápio digital"
                      fill
                      className="object-contain object-top"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </div>

                <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.35)]">
                  <div className="flex flex-col gap-2 border-b border-zinc-100 bg-zinc-50 px-5 py-4">
                    <span className="text-sm font-semibold text-zinc-900">
                      Dashboard para bater o olho e decidir rápido
                    </span>
                    <p className="text-sm text-zinc-600">
                      Visão geral do negócio, próximos passos e operação publicada sem telas
                      confusas.
                    </p>
                  </div>
                  <div className="relative aspect-9/14 overflow-hidden bg-white p-2 sm:p-3">
                    <Image
                      src="/screenshots/painel-dashboard-20260413.png"
                      alt="Dashboard do painel com visão geral do negócio e próximos passos"
                      fill
                      className="object-contain object-top"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>

              {/* Feature highlights strip */}
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-zinc-200 bg-white p-5 text-center">
                  <Sparkles className="mx-auto mb-2 h-6 w-6 text-orange-500" />
                  <p className="text-sm font-bold text-zinc-900">Pedido direto e organizado</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    O cliente monta tudo no cardápio e envia sem conversa picada
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-5 text-center">
                  <Smartphone className="mx-auto mb-2 h-6 w-6 text-orange-500" />
                  <p className="text-sm font-bold text-zinc-900">Mobile-first</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Edite tudo pelo celular, de qualquer lugar
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-5 text-center">
                  <Shield className="mx-auto mb-2 h-6 w-6 text-orange-500" />
                  <p className="text-sm font-bold text-zinc-900">Dados protegidos</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Infraestrutura segura, backups automáticos
                  </p>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ═══════════════════════════════════════════════════════════════
            TEMPLATES — Top 6 nichos com copy de urgência
        ═══════════════════════════════════════════════════════════════ */}
        <ScrollReveal>
          <section data-testid="templates-section" className="py-20 md:py-28">
            <div className="container-premium">
              <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-bold tracking-[0.2em] text-orange-600 uppercase">
                    {TOTAL_TEMPLATE_NICHES} nichos prontos — escolha o seu
                  </p>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                    Seu concorrente já tem um. <span className="text-orange-500">E você?</span>
                  </h2>
                </div>
                <Link
                  href="/templates"
                  data-testid="templates-view-all"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
                >
                  Ver todos os {TOTAL_TEMPLATE_NICHES} modelos
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {TOP_TEMPLATES.map((template) => (
                  <article
                    key={template.slug}
                    className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:border-orange-200 hover:shadow-lg"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={template.imageUrl}
                        alt={template.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                      <div className="absolute right-4 bottom-4 left-4">
                        <h3 className="text-lg font-bold text-white">{template.name}</h3>
                        <p className="mt-0.5 text-sm text-white/80">{template.eyebrow}</p>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-sm leading-relaxed text-zinc-700">
                        {template.description}
                      </p>
                      <div className="mt-4 flex gap-2">
                        <Link
                          href={`/templates/${template.slug}`}
                          data-testid={`template-view-${template.slug}`}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
                        >
                          <Eye className="h-4 w-4" />
                          Ver modelo
                        </Link>
                        <Link
                          href={`/comprar/${template.slug}?plano=self-service&capacidade=basico`}
                          data-testid={`template-buy-${template.slug}`}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
                        >
                          Quero esse
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* All niches strip */}
              <div className="mt-10 flex flex-wrap justify-center gap-2">
                {HOME_TEMPLATE_NICHES.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/templates/${t.slug}`}
                    className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition-colors hover:border-orange-300 hover:text-orange-600"
                  >
                    {t.name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ═══════════════════════════════════════════════════════════════
            FAQ — Redução de objeções (atualizado)
        ═══════════════════════════════════════════════════════════════ */}
        <FaqSection />

        {/* ═══════════════════════════════════════════════════════════════
            PRA QUEM É — Público-alvo claro
        ═══════════════════════════════════════════════════════════════ */}
        <ScrollReveal>
          <section
            data-testid="target-audience-section"
            className="border-t border-zinc-100 bg-zinc-50 py-16"
          >
            <div className="container-premium">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-sm font-bold tracking-[0.2em] text-orange-600 uppercase">
                  Para quem é a Zairyx
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                  Seu canal próprio. <span className="text-orange-500">Suas regras.</span>
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-700">
                  Ideal para quem já tem entrega própria e quer um canal digital profissional — com
                  sua marca, seus preços e seus clientes. Sem depender de terceiros.
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-green-200 bg-white p-5">
                    <p className="text-2xl font-bold text-green-600">✓</p>
                    <p className="mt-2 text-sm font-bold text-zinc-900">Tem entrega própria</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Já resolve a logística — só precisa do canal digital
                    </p>
                  </div>
                  <div className="rounded-xl border border-green-200 bg-white p-5">
                    <p className="text-2xl font-bold text-green-600">✓</p>
                    <p className="mt-2 text-sm font-bold text-zinc-900">Quer praticidade</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Catálogo pronto, editor intuitivo, tudo pelo celular
                    </p>
                  </div>
                  <div className="rounded-xl border border-green-200 bg-white p-5">
                    <p className="text-2xl font-bold text-green-600">✓</p>
                    <p className="mt-2 text-sm font-bold text-zinc-900">Quer sua própria marca</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Cardápio com sua identidade, QR Code e pedido organizado
                    </p>
                  </div>
                </div>
                <p className="mt-6 text-xs text-zinc-400">
                  A Zairyx é ideal para deliverys, mini mercados, bares, cafeterias e qualquer
                  negócio que queira vender online com praticidade e autonomia.
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ═══════════════════════════════════════════════════════════════
            COMPARAÇÃO CONCORRENTES — Marketplaces vs Canal Próprio
        ═══════════════════════════════════════════════════════════════ */}
        <ScrollReveal>
          <section
            data-testid="competitor-comparison-section"
            className="border-t border-zinc-100 bg-white py-20 md:py-28"
          >
            <div className="container-premium">
              <div className="mb-14 max-w-2xl">
                <p className="text-sm font-bold tracking-[0.2em] text-orange-600 uppercase">
                  Quem já tem entregador não precisa pagar taxa por pedido
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                  Marketplace para captar.{' '}
                  <span className="text-orange-500">Canal próprio para lucrar.</span>
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-zinc-700">
                  O iFood ajuda a ser encontrado. Mas quando o cliente já conhece seu delivery, cada
                  pedido intermediado é margem que você perde. Veja os números:
                </p>
              </div>

              {/* ── TABELA 1: Marketplaces vs Canal Próprio ──────────────── */}
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-bold text-zinc-800">
                  Marketplaces vs. seu canal próprio
                </h3>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                <table className="comparison-table w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50">
                      <th className="px-5 py-4 text-left font-bold text-zinc-700">Critério</th>
                      <th className="px-5 py-4 text-center font-bold text-red-600">iFood</th>
                      <th className="px-5 py-4 text-center font-bold text-zinc-500">
                        Apps regionais
                      </th>
                      <th className="px-5 py-4 text-center font-bold text-zinc-500">
                        WhatsApp informal
                      </th>
                      <th className="bg-green-50 px-5 py-4 text-center font-bold text-green-700">
                        Zairyx
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    <tr>
                      <td className="px-5 py-4 font-semibold text-zinc-900">Comissão por pedido</td>
                      <td className="px-5 py-4 text-center font-bold text-red-600">
                        ~15% (Básico)*
                      </td>
                      <td className="px-5 py-4 text-center text-zinc-700">Variável</td>
                      <td className="px-5 py-4 text-center text-zinc-500">0%</td>
                      <td className="bg-green-50/50 px-5 py-4 text-center font-bold text-green-700">
                        0%
                      </td>
                    </tr>
                    <tr className="bg-zinc-50/50">
                      <td className="px-5 py-4 font-semibold text-zinc-900">Mensalidade</td>
                      <td className="px-5 py-4 text-center text-zinc-700">R$ 110–150 + comissão</td>
                      <td className="px-5 py-4 text-center text-zinc-700">Variável</td>
                      <td className="px-5 py-4 text-center text-zinc-500">R$ 0</td>
                      <td className="bg-green-50/50 px-5 py-4 text-center font-bold text-green-700">
                        R$ 147 fixo
                      </td>
                    </tr>
                    <tr>
                      <td className="px-5 py-4 font-semibold text-zinc-900">
                        Custo real (R$ 20k/mês em vendas)
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-red-600">R$ 3.150*</td>
                      <td className="px-5 py-4 text-center text-zinc-700">Depende do app</td>
                      <td className="px-5 py-4 text-center text-zinc-500">R$ 0</td>
                      <td className="bg-green-50/50 px-5 py-4 text-center font-bold text-green-700">
                        R$ 147
                      </td>
                    </tr>
                    <tr className="bg-zinc-50/50">
                      <td className="px-5 py-4 font-semibold text-zinc-900">O cliente é seu?</td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-red-600">
                          <X className="h-4 w-4" /> Não — é do marketplace
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <X className="h-4 w-4" /> Não
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center text-zinc-500">Parcialmente</td>
                      <td className="bg-green-50/50 px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-green-700">
                          <CheckCircle className="h-4 w-4" /> 100% seu
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-5 py-4 font-semibold text-zinc-900">
                        Clientes veem concorrentes?
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-red-600">
                          <X className="h-4 w-4" /> Sim
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <X className="h-4 w-4" /> Sim
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center text-zinc-500">Não</td>
                      <td className="bg-green-50/50 px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-green-700">
                          <CheckCircle className="h-4 w-4" /> Não
                        </span>
                      </td>
                    </tr>
                    <tr className="bg-zinc-50/50">
                      <td className="px-5 py-4 font-semibold text-zinc-900">
                        Sua marca em destaque
                      </td>
                      <td className="px-5 py-4 text-center text-zinc-500">
                        Diluída entre milhares
                      </td>
                      <td className="px-5 py-4 text-center text-zinc-500">Diluída</td>
                      <td className="px-5 py-4 text-center text-zinc-500">Sem presença digital</td>
                      <td className="bg-green-50/50 px-5 py-4 text-center font-bold text-green-700">
                        100% sua marca
                      </td>
                    </tr>
                    <tr>
                      <td className="px-5 py-4 font-semibold text-zinc-900">
                        Pedido direto no próprio canal
                      </td>
                      <td className="px-5 py-4 text-center text-red-400">
                        <X className="mx-auto h-4 w-4" />
                      </td>
                      <td className="px-5 py-4 text-center text-red-400">
                        <X className="mx-auto h-4 w-4" />
                      </td>
                      <td className="px-5 py-4 text-center text-red-400">
                        <X className="mx-auto h-4 w-4" />
                      </td>
                      <td className="bg-green-50/50 px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-green-700">
                          <CheckCircle className="h-4 w-4" /> Inclusa no plano
                        </span>
                      </td>
                    </tr>
                    <tr className="bg-zinc-50/50">
                      <td className="px-5 py-4 font-semibold text-zinc-900">
                        Cardápio profissional
                      </td>
                      <td className="px-5 py-4 text-center text-zinc-500">Template genérico</td>
                      <td className="px-5 py-4 text-center text-zinc-500">Padrão do app</td>
                      <td className="px-5 py-4 text-center text-red-400">
                        <X className="mx-auto h-4 w-4" />
                      </td>
                      <td className="bg-green-50/50 px-5 py-4 text-center font-bold text-green-700">
                        {TOTAL_TEMPLATE_NICHES} modelos de nicho
                      </td>
                    </tr>
                    <tr>
                      <td className="px-5 py-4 font-semibold text-zinc-900">Garantia</td>
                      <td className="px-5 py-4 text-center text-red-400">
                        <X className="mx-auto h-4 w-4" />
                      </td>
                      <td className="px-5 py-4 text-center text-red-400">
                        <X className="mx-auto h-4 w-4" />
                      </td>
                      <td className="px-5 py-4 text-center text-zinc-500">N/A</td>
                      <td className="bg-green-50/50 px-5 py-4 text-center font-bold text-green-700">
                        {COMMERCIAL_COPY.withdrawalShort}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="mt-2 text-center text-[11px] text-zinc-400 md:hidden">
                Deslize para ver todas as colunas.
              </p>
              <p className="mt-3 text-center text-xs text-zinc-400">
                *Plano Básico iFood (entrega própria): 12% + 3,2% online + R$&nbsp;110/mês. O Plano
                Entrega (motoboy do iFood) cobra até 27%, mas inclui logística que a Zairyx não
                oferece. Fonte: blog-parceiros.ifood.com.br (consulta em abr/2026).
              </p>

              {/* ── TABELA 2: Sistemas SaaS concorrentes ─────────────────── */}
              <div className="mt-16 mb-6">
                <h3 className="mb-2 text-lg font-bold text-zinc-800">
                  Sistemas SaaS para deliverys — comparativo objetivo
                </h3>
                <p className="text-sm text-zinc-500">
                  Dados de reputação pública (Reclame Aqui) e pricing público (sites oficiais).
                </p>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                <table className="comparison-table w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50">
                      <th className="px-4 py-4 text-left font-bold text-zinc-700">Critério</th>
                      <th className="px-4 py-4 text-center font-bold text-zinc-600">Anota AI</th>
                      <th className="px-4 py-4 text-center font-bold text-zinc-600">Consumer</th>
                      <th className="px-4 py-4 text-center font-bold text-zinc-600">Saipos</th>
                      <th className="px-4 py-4 text-center font-bold text-zinc-600">Kyte</th>
                      <th className="bg-green-50 px-4 py-4 text-center font-bold text-green-700">
                        Zairyx
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-zinc-900">Preço mensal</td>
                      <td className="px-4 py-3 text-center text-zinc-600">~R$ 99–299*</td>
                      <td className="px-4 py-3 text-center text-zinc-600">R$ 49,90</td>
                      <td className="px-4 py-3 text-center text-zinc-600">~R$ 99–399*</td>
                      <td className="px-4 py-3 text-center text-zinc-600">R$ 49,90–99,90</td>
                      <td className="bg-green-50/50 px-4 py-3 text-center font-bold text-green-700">
                        R$ 147
                      </td>
                    </tr>
                    <tr className="bg-zinc-50/50">
                      <td className="px-4 py-3 font-semibold text-zinc-900">Preço público?</td>
                      <td className="px-4 py-3 text-center text-red-500">Não publicam</td>
                      <td className="px-4 py-3 text-center text-green-600">Sim</td>
                      <td className="px-4 py-3 text-center text-red-500">Não publicam</td>
                      <td className="px-4 py-3 text-center text-green-600">Sim</td>
                      <td className="bg-green-50/50 px-4 py-3 text-center font-bold text-green-700">
                        Sim — transparente
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-zinc-900">Comissão por pedido</td>
                      <td className="px-4 py-3 text-center text-zinc-600">0%</td>
                      <td className="px-4 py-3 text-center text-zinc-600">0%</td>
                      <td className="px-4 py-3 text-center text-zinc-600">0%</td>
                      <td className="px-4 py-3 text-center text-zinc-600">0%</td>
                      <td className="bg-green-50/50 px-4 py-3 text-center font-bold text-green-700">
                        0%
                      </td>
                    </tr>
                    <tr className="bg-zinc-50/50">
                      <td className="px-4 py-3 font-semibold text-zinc-900">Nota Reclame Aqui</td>
                      <td className="px-4 py-3 text-center font-bold text-red-600">
                        6.0 — Regular
                      </td>
                      <td className="px-4 py-3 text-center text-green-600">9.3 — Ótimo</td>
                      <td className="px-4 py-3 text-center text-zinc-600">8.3 — Ótimo</td>
                      <td className="px-4 py-3 text-center text-zinc-500">—</td>
                      <td className="bg-green-50/50 px-4 py-3 text-center text-zinc-500">
                        Novo no mercado
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-zinc-900">Cancelamento fácil?</td>
                      <td className="px-4 py-3 text-center text-red-500">
                        Difícil — 43% não voltariam
                      </td>
                      <td className="px-4 py-3 text-center text-green-600">Sim</td>
                      <td className="px-4 py-3 text-center text-zinc-500">
                        Resposta em até 17 dias
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-600">Sim</td>
                      <td className="bg-green-50/50 px-4 py-3 text-center font-bold text-green-700">
                        Pelo painel, sem burocracia
                      </td>
                    </tr>
                    <tr className="bg-zinc-50/50">
                      <td className="px-4 py-3 font-semibold text-zinc-900">
                        Catálogo pronto do nicho
                      </td>
                      <td className="px-4 py-3 text-center text-red-400">
                        <X className="mx-auto h-4 w-4" />
                      </td>
                      <td className="px-4 py-3 text-center text-red-400">
                        <X className="mx-auto h-4 w-4" />
                      </td>
                      <td className="px-4 py-3 text-center text-red-400">
                        <X className="mx-auto h-4 w-4" />
                      </td>
                      <td className="px-4 py-3 text-center text-red-400">
                        <X className="mx-auto h-4 w-4" />
                      </td>
                      <td className="bg-green-50/50 px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-green-700">
                          <CheckCircle className="h-4 w-4" /> {TOTAL_TEMPLATE_NICHES} nichos prontos
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-zinc-900">IA no cardápio</td>
                      <td className="px-4 py-3 text-center text-zinc-600">Bot WhatsApp</td>
                      <td className="px-4 py-3 text-center text-zinc-600">Chatbot ChatGPT</td>
                      <td className="px-4 py-3 text-center text-red-400">
                        <X className="mx-auto h-4 w-4" />
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-600">
                        IA &quot;Kai&quot; WhatsApp
                      </td>
                      <td className="bg-green-50/50 px-4 py-3 text-center font-bold text-green-700">
                        IA dentro do cardápio
                      </td>
                    </tr>
                    <tr className="bg-zinc-50/50">
                      <td className="px-4 py-3 font-semibold text-zinc-900">
                        Foco em food service
                      </td>
                      <td className="px-4 py-3 text-center text-green-600">Sim</td>
                      <td className="px-4 py-3 text-center text-green-600">Sim — 15+ anos</td>
                      <td className="px-4 py-3 text-center text-green-600">Sim</td>
                      <td className="px-4 py-3 text-center text-red-500">Não — generalista</td>
                      <td className="bg-green-50/50 px-4 py-3 text-center font-bold text-green-700">
                        Sim — 100% delivery
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-zinc-900">Canal 100% próprio</td>
                      <td className="px-4 py-3 text-center text-zinc-600">Parcial</td>
                      <td className="px-4 py-3 text-center text-zinc-600">Parcial</td>
                      <td className="px-4 py-3 text-center text-zinc-600">Parcial</td>
                      <td className="px-4 py-3 text-center text-green-600">Sim</td>
                      <td className="bg-green-50/50 px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-green-700">
                          <CheckCircle className="h-4 w-4" /> Sim — sua marca
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="mt-3 text-center text-xs text-zinc-400">
                *Preços estimados com base em reviews públicos (não publicam valores). Reputação:
                Reclame Aqui (consultado Abr/2026). Consumer e Kyte: pricing público em sites
                oficiais.
              </p>

              {/* ── ESTRATÉGIA HÍBRIDA — Bloco educativo ─────────────────── */}
              <div className="mt-14 rounded-3xl border-2 border-orange-200 bg-orange-50 p-6 md:p-10">
                <p className="text-sm font-bold tracking-[0.18em] text-orange-700 uppercase">
                  A estratégia inteligente
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
                  Use o iFood para captar. Use a Zairyx para lucrar.
                </h3>
                <p className="mt-3 text-base leading-relaxed text-zinc-700">
                  Marketplaces são ótimos para aquisição: seu delivery aparece para milhares de
                  pessoas. Mas quando o cliente já conhece você, cada pedido intermediado é margem
                  perdida. A estratégia inteligente é usar os dois — e ir migrando o cliente
                  recorrente para o seu canal próprio.
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-3xl">🎣</p>
                    <p className="mt-2 text-sm font-bold text-zinc-800">1. Capte no marketplace</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">
                      iFood, apps regionais e redes sociais ajudam a ser encontrado por novos
                      clientes. Use para gerar demanda.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-3xl">🔗</p>
                    <p className="mt-2 text-sm font-bold text-zinc-800">
                      2. Direcione para o seu canal
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">
                      QR Code na embalagem, link no Instagram, mensagem pós-venda. Traga o cliente
                      para pedir direto no seu cardápio Zairyx.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-3xl">💰</p>
                    <p className="mt-2 text-sm font-bold text-zinc-800">3. Lucre sem comissão</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">
                      A partir da segunda compra, o pedido vem pelo seu canal próprio. Sem taxa por
                      pedido, sem concorrentes na tela, sem intermediário.
                    </p>
                  </div>
                </div>
              </div>

              {/* Value highlights */}
              <div className="mt-10 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-6 text-center">
                  <p className="text-sm font-bold text-green-800">Catálogo pronto</p>
                  <p className="mt-2 text-3xl font-bold text-green-700">
                    {TOTAL_TEMPLATE_NICHES} nichos
                  </p>
                  <p className="mt-1 text-sm text-green-600">com produtos reais — só editar</p>
                </div>
                <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-6 text-center">
                  <p className="text-sm font-bold text-green-800">Economia potencial</p>
                  <p className="mt-2 text-3xl font-bold text-green-700">até R$ 3.000</p>
                  <p className="mt-1 text-sm text-green-600">
                    p/ mês · simulação com R$ 20k em vendas
                  </p>
                </div>
                <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-6 text-center">
                  <p className="text-sm font-bold text-green-800">Cancelamento</p>
                  <p className="mt-2 text-3xl font-bold text-green-700">Sem fidelidade</p>
                  <p className="mt-1 text-sm text-green-600">cancele pelo painel quando quiser</p>
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-zinc-200 bg-zinc-50 p-6 md:p-8">
                <p className="text-sm font-bold tracking-[0.18em] text-zinc-600 uppercase">
                  Por que donos de delivery escolhem a Zairyx
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                  Produto pronto + editor intuitivo + WhatsApp = vendas desde o primeiro dia.
                </h3>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-zinc-800">
                      1. Sem trabalho de cadastro
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      Outros sistemas pedem que você cadastre cada produto do zero. Aqui, o catálogo
                      do seu nicho já vem pronto — com nomes, descrições e categorias. Você só
                      ajusta o que quiser.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-zinc-800">
                      2. Sem custo de programador
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      O editor visual funciona no celular. Troque preço, foto e descrição com poucos
                      cliques. Se precisar de ajuda, nossa equipe implanta pra você.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-zinc-800">
                      3. Pedido claro para fechar mais
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      O cliente navega com clareza, escolhe item, ajusta observação e envia tudo
                      organizado. Menos atrito para pedir, menos retrabalho para atender.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-10 text-center">
                <TrackedLink
                  href="/templates"
                  trackCta="comparison_cta"
                  trackPage="landing"
                  data-testid="comparison-cta"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-xl"
                >
                  <Flame className="h-5 w-5 transition-transform group-hover:scale-110" />
                  Começar com meu modelo
                </TrackedLink>
              </div>

              {/* CTA-isca → página de comparativo */}
              <div className="mt-6 text-center">
                <Link
                  href="/comparativo"
                  className="group inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-orange-600"
                >
                  Ainda em dúvida? Compare todos os sistemas com dados reais
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ═══════════════════════════════════════════════════════════════
            PRICING STRIP — Preço + comparação rápida
        ═══════════════════════════════════════════════════════════════ */}
        <ScrollReveal>
          <section
            data-testid="pricing-section"
            className="border-t border-zinc-100 bg-zinc-50 py-16"
          >
            <div className="container-premium">
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-sm font-bold tracking-[0.2em] text-orange-600 uppercase">
                  Preço justo, sem surpresas
                </p>
                <div className="mt-6 flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-zinc-900 md:text-6xl">R$ 147</span>
                  <span className="text-lg font-medium text-zinc-500">/mês</span>
                </div>
                <p className="mt-3 text-lg font-semibold text-zinc-700">
                  Catálogo pronto + editor visual + IA assistente + pedidos por WhatsApp.
                </p>
                <p className="mt-2 text-base font-semibold text-orange-600">
                  ✦ Mensalidade fixa. {COMMERCIAL_COPY.noPlatformCommission}. Sem surpresas no
                  plano.
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  Tudo incluído: {TOTAL_TEMPLATE_NICHES} modelos de nicho, editor mobile, QR Code e
                  suporte.
                </p>
                <div className="mx-auto mt-6 flex max-w-md flex-wrap justify-center gap-3 text-sm text-zinc-600">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-green-500" /> {TOTAL_TEMPLATE_NICHES}{' '}
                    modelos profissionais
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-green-500" /> Editor visual completo
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-green-500" /> Pedido direto no WhatsApp
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-green-500" /> Pedidos por WhatsApp
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-green-500" /> Suporte humanizado
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                    {COMMERCIAL_COPY.withdrawalShort}
                  </span>
                </div>
                <div className="mt-8 rounded-xl bg-green-50 p-4">
                  <p className="text-sm font-bold text-green-700">
                    {COMMERCIAL_COPY.noPlatformCommission}. Vendeu R$ 1.000 ou R$ 100.000 no mês?{' '}
                    <span className="text-green-800">
                      A mensalidade do plano nao muda; gateway e entrega seguem à parte.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ═══════════════════════════════════════════════════════════════
            CTA FINAL — Urgência máxima + garantia irrecusável
        ═══════════════════════════════════════════════════════════════ */}
        <section data-testid="final-cta-section" className="px-4 pb-20 md:pb-28">
          <div className="container-premium">
            <div className="overflow-hidden rounded-4xl bg-zinc-950 p-8 md:p-14">
              <div className="relative">
                <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-orange-500/15 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-red-500/10 blur-3xl" />
                <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-300">
                      <Zap className="h-4 w-4" />
                      Pronto para começar — é só escolher seu modelo
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                      Seu delivery pronto em minutos.{' '}
                      <span className="text-orange-400">Você só edita e começa a vender.</span>
                    </h2>
                    <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-200">
                      Catálogo completo, editor visual, pedidos pelo WhatsApp e{' '}
                      {TOTAL_TEMPLATE_NICHES} modelos de nicho. Tudo pronto.{' '}
                      <strong className="text-white">{COMMERCIAL_COPY.withdrawalExplainer}</strong>
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-zinc-300">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        {COMMERCIAL_COPY.noPlatformCommission}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        Atendimento inicial por IA
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:min-w-72">
                    <TrackedLink
                      href="/templates"
                      trackCta="final_primary"
                      trackPage="landing"
                      data-testid="final-cta-primary"
                      className="group inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-xl"
                    >
                      <Flame className="h-5 w-5 transition-transform group-hover:scale-110" />
                      Começar agora
                    </TrackedLink>
                    <TrackedLink
                      href="/templates"
                      trackCta="final_assistant"
                      trackPage="landing"
                      data-testid="final-cta-whatsapp"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/5"
                    >
                      <Eye className="h-5 w-5 text-zinc-300" />
                      Ver modelos prontos
                    </TrackedLink>
                    <GuaranteeBadge variant="dark" className="mt-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

/* ─── Sub-components ─────────────────────────────────────────────── */

function ProofStat({
  value,
  label,
  highlight,
}: {
  value: string
  label: string
  highlight?: boolean
}) {
  return (
    <div className="text-center" data-testid={`proof-stat-${value}`}>
      <div
        className={`text-2xl font-bold md:text-3xl ${highlight ? 'text-orange-600' : 'text-zinc-900'}`}
      >
        {value}
      </div>
      <div className="mt-1 text-sm text-zinc-700">{label}</div>
    </div>
  )
}

function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div
      className="relative rounded-2xl border border-zinc-200 bg-white p-7 transition-shadow hover:shadow-lg"
      data-testid={`step-card-${step}`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
          {icon}
        </div>
        <span className="text-3xl font-bold text-zinc-300">{step}</span>
      </div>
      <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
      <p className="mt-2 text-base leading-relaxed text-zinc-700">{description}</p>
    </div>
  )
}

function BenefitCard({
  icon,
  title,
  text,
  accent,
}: {
  icon: React.ReactNode
  title: string
  text: string
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-6 transition-shadow hover:shadow-lg ${
        accent ? 'border-orange-200 bg-orange-50/70' : 'border-zinc-200 bg-white'
      }`}
    >
      <div
        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
          accent ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-700'
        }`}
      >
        {icon}
      </div>
      <h3 className="text-base font-bold text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-700">{text}</p>
    </div>
  )
}
