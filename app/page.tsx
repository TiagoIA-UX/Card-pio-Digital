import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Beer,
  CheckCircle,
  ChevronRight,
  Coffee,
  Eye,
  Fish,
  IceCream,
  LayoutTemplate,
  MessageCircle,
  MousePointerClick,
  Palette,
  Pizza,
  Rocket,
  Shield,
  ShoppingBag,
  Sparkles,
  Store,
  TabletSmartphone,
  UtensilsCrossed,
  WandSparkles,
} from 'lucide-react'
import { RESTAURANT_TEMPLATES } from '@/lib/templates-config'
import SecaoConversao from '@/components/sections/SecaoConversao'

const ICONS = {
  store: Store,
  pizza: Pizza,
  burger: ShoppingBag,
  beer: Beer,
  coffee: Coffee,
  'ice-cream': IceCream,
  fish: Fish,
}

const WHATSAPP_NUMBER = '5512996887993'
const WHATSAPP_MESSAGE = encodeURIComponent(
  'Olá! Quero conhecer os modelos prontos de cardápio digital para os 7 tipos de negócio.'
)
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`

const NICHE_TEMPLATES = RESTAURANT_TEMPLATES.map((template) => ({
  slug: template.slug,
  name: template.name,
  eyebrow: template.eyebrow,
  description: template.description,
  image: template.imageUrl,
  icon: ICONS[template.iconKey],
  accent: template.accent,
  chip: template.chip,
  highlights: template.highlights,
}))

const PLATFORM_FEATURES = [
  {
    icon: LayoutTemplate,
    title: 'Templates profissionais para cada tipo de operação',
    description:
      'Escolha entre 7 modelos criados para diferentes segmentos de alimentação, com organização visual pensada para facilitar a escolha do cliente e aumentar a conversão.',
  },
  {
    icon: Palette,
    title: 'Painel de edição visual',
    description:
      'Altere preços, fotos, categorias, produtos e destaques diretamente no painel, sem precisar contratar desenvolvedor para fazer mudanças simples no dia a dia.',
  },
  {
    icon: TabletSmartphone,
    title: 'Operação simples no celular',
    description:
      'O painel foi desenhado para funcionar bem no celular, facilitando a gestão mesmo durante a rotina corrida do restaurante.',
  },
  {
    icon: MousePointerClick,
    title: 'Mais agilidade para manter o cardápio sempre correto',
    description:
      'Mudou preço, acabou um item ou entrou uma promoção? Você atualiza em poucos passos e mantém o atendimento alinhado com a operação real.',
  },
  {
    icon: WandSparkles,
    title: 'Mais economia com desenvolvimento',
    description:
      'O restaurante ganha autonomia para operar o próprio cardápio e evita gastos recorrentes com ajustes que normalmente dependeriam de programador.',
  },
  {
    icon: Shield,
    title: 'Pedidos organizados no seu próprio canal',
    description:
      'O cliente escolhe, envia o pedido e sua equipe recebe tudo com mais clareza no WhatsApp, sem intermediação desnecessária e sem comissão sobre os pedidos.',
  },
] as const

const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Escolha o template ideal para o seu negócio',
    description:
      'Selecione o modelo que melhor combina com a sua operação e comece com uma base profissional pronta para uso.',
  },
  {
    step: '02',
    title: 'Edite o cardápio pelo painel visual',
    description:
      'Personalize produtos, preços, fotos, categorias, banners e textos sem depender de desenvolvedor.',
  },
  {
    step: '03',
    title: 'Publique e receba pedidos',
    description:
      'Coloque seu cardápio no ar, compartilhe o link no WhatsApp, Instagram e QR Code, e concentre os pedidos no seu próprio canal de atendimento.',
  },
] as const

export default function Home() {
  const heroTemplate =
    NICHE_TEMPLATES.find((template) => template.slug === 'pizzaria') || NICHE_TEMPLATES[0]
  const featuredTemplates = NICHE_TEMPLATES.slice(0, 3)

  return (
    <main className="bg-background text-foreground min-h-screen">
      <header className="border-border/80 bg-background/85 sticky top-0 z-50 border-b backdrop-blur-xl">
        <div className="container-premium flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <span className="text-foreground/75 block text-sm font-semibold tracking-[0.18em] uppercase">
                Cardápio Digital
              </span>
              <span className="block text-base font-semibold">Plataforma para operações de alimentação</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/login"
              className="text-foreground text-sm font-semibold transition-colors hover:text-orange-600"
            >
              Login
            </Link>
            <a
              href="#nichos"
              className="text-foreground/75 hover:text-foreground text-sm font-medium transition-colors"
            >
              Nichos
            </a>
            <a
              href="#estrutura"
              className="text-foreground/75 hover:text-foreground text-sm font-medium transition-colors"
            >
              Estrutura
            </a>
            <a
              href="#como-funciona"
              className="text-foreground/75 hover:text-foreground text-sm font-medium transition-colors"
            >
              Como funciona
            </a>
            <a
              href="#conversao"
              className="text-foreground/75 hover:text-foreground text-sm font-medium transition-colors"
            >
              Planos
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="border-border bg-card hover:bg-secondary inline-flex rounded-full border px-4 py-2 text-sm font-medium transition-colors md:hidden"
            >
              Login
            </Link>
            <Link
              href="/templates"
              className="border-border bg-card hover:bg-secondary hidden rounded-full border px-4 py-2 text-sm font-medium transition-colors sm:inline-flex"
            >
              Ver todos
            </Link>
            <Link
              href="/ofertas"
              className="bg-foreground text-background inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02]"
            >
              Ver preços e planos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

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
              <div className="animate-enter-fast mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-md">
                <Sparkles className="h-4 w-4 text-orange-300" />7 templates para negócios de
                alimentação
              </div>

              <h1 className="animate-enter animation-delay-100 max-w-3xl text-4xl leading-[0.95] font-semibold tracking-tight text-balance text-white md:text-6xl lg:text-7xl">
                Cardápio digital profissional para vender direto.
                <span className="mt-3 block text-orange-300">
                  Edite no painel, receba no seu canal e não pague comissão por pedido.
                </span>
              </h1>

              <p className="animate-enter animation-delay-200 mt-6 max-w-2xl text-lg leading-8 text-white/90 md:text-xl">
                Para restaurantes, pizzarias, hamburguerias, quiosques, cafeterias, açaíterias e
                operações de alimentação que querem vender online com mais autonomia.
              </p>

              <div className="animate-enter animation-delay-300 mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/templates"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-orange-600"
                >
                  <Eye className="h-5 w-5" />
                  Ver os 7 templates
                </Link>
                <Link
                  href="/ofertas"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/15"
                >
                  <Store className="h-5 w-5" />
                  Quero vender no meu canal
                </Link>
              </div>

              <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                <div className="animate-enter animation-delay-300">
                  <DarkMetricCard value="7" label="templates profissionais" />
                </div>
                <div className="animate-enter animation-delay-400">
                  <DarkMetricCard value="painel" label="visual de edição" />
                </div>
                <div className="animate-enter animation-delay-500">
                  <DarkMetricCard value="0%" label="de comissão sobre pedidos" />
                </div>
              </div>
            </div>

            <div className="flex items-end justify-end">
              <div className="animate-enter animation-delay-200 animate-float-gentle w-full max-w-xl rounded-4xl border border-white/12 bg-black/20 p-4 shadow-2xl shadow-black/30 backdrop-blur-md md:p-5">
                <div className="overflow-hidden rounded-[1.6rem] border border-white/12 bg-white/95 shadow-xl">
                  <Image
                    src={heroTemplate.image}
                    alt={`Preview ${heroTemplate.name}`}
                    width={960}
                    height={576}
                    className="h-64 w-full object-cover md:h-72"
                  />
                  <div className="animate-glow-drift p-6">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-foreground/70 text-xs font-semibold tracking-[0.18em] uppercase">
                          Painel de edição em destaque
                        </p>
                        <h2 className="text-foreground mt-1 text-2xl font-semibold">
                          Edite seu cardápio no painel
                        </h2>
                      </div>
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                        Editor visual
                      </span>
                    </div>

                    <p className="text-foreground/80 text-sm leading-6">
                      Atualize preços, fotos, categorias e destaques em um painel simples, sem
                      depender de desenvolvedor para manter o cardápio em dia.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                        Atualização rápida
                      </span>
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                        Edição pelo celular
                      </span>
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                        Sem desenvolvedor
                      </span>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <Link
                        href="/ofertas"
                        className="bg-foreground text-background inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
                      >
                        Ver planos
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        href="/templates"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-900"
                      >
                        Ver templates
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
                  className="animate-enter-fast inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/15"
                >
                  <Icon className="h-4 w-4" />
                  {template.name}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section id="nichos" className="container-premium py-20 md:py-24">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-orange-600 uppercase">
              Modelos por tipo de negócio
            </p>
            <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              Um template certo para cada operação.
            </h2>
          </div>
          <p className="text-foreground/80 max-w-xl text-base leading-7">
            Cada modelo foi criado para respeitar o perfil da operação, organizar melhor a
            apresentação dos produtos e facilitar a decisão de compra do cliente.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {NICHE_TEMPLATES.map((template) => {
            const Icon = template.icon

            return (
              <article
                key={template.slug}
                className="group animate-enter border-border bg-card hover:shadow-premium overflow-hidden rounded-[1.75rem] border shadow-sm transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={template.image}
                    alt={template.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/10 to-transparent" />
                  <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between gap-3">
                    <div>
                      <div
                        className={`mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur ${template.chip}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {template.eyebrow}
                      </div>
                      <h3 className="text-xl font-semibold text-white">{template.name}</h3>
                    </div>
                    <div className="rounded-full bg-white/15 p-2 text-white backdrop-blur">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-foreground/80 text-sm leading-6">{template.description}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {template.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="border-border bg-secondary text-foreground/80 rounded-full border px-3 py-1 text-xs font-medium"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <Link
                      href={`/templates/${template.slug}`}
                      className="bg-foreground text-background hover:bg-foreground/90 inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      Ver modelo
                    </Link>
                    <Link
                      href={`/comprar/${template.slug}`}
                      className="border-border text-foreground hover:bg-secondary inline-flex flex-1 items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition-colors"
                    >
                      Comprar
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section id="estrutura" className="bg-zinc-950 px-4 py-20 text-zinc-50 md:py-24">
        <div className="container-premium">
          <div className="mb-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-orange-300 uppercase">
                Proposta de valor
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                Venda online com painel de edição e mais controle.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-zinc-200">
              O Cardápio Digital foi desenvolvido para negócios reais de alimentação que precisam
              vender online com clareza, confiança e agilidade no dia a dia.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {PLATFORM_FEATURES.map((feature) => {
              const Icon = feature.icon

              return (
                <div
                  key={feature.title}
                  className="animate-enter rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-200">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="container-premium py-20 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-orange-600 uppercase">
              Como funciona
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              Escolha, edite e publique.
            </h2>
            <p className="text-foreground/80 mt-4 max-w-lg text-base leading-7">
              Você escolhe um template profissional, edita tudo pelo painel visual e publica seu
              canal próprio para receber pedidos sem depender de desenvolvedor.
            </p>

            <div className="border-border mt-8 rounded-[1.75rem] border bg-linear-to-br from-orange-50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                  <Rocket className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-semibold">
                    Venda com mais autonomia
                  </p>
                  <p className="text-foreground/80 text-sm">
                    Atualize preços, fotos, categorias e promoções com rapidez, reduza dependência
                    de aplicativos e mantenha mais controle sobre a operação.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/ofertas"
                  className="bg-foreground text-background inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  Ver ofertas
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-border text-foreground inline-flex items-center gap-2 rounded-full border bg-white px-5 py-3 text-sm font-semibold"
                >
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  Falar com um especialista
                </a>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {PROCESS_STEPS.map((step) => (
              <div
                key={step.step}
                className="animate-enter border-border bg-card rounded-[1.75rem] border p-6 shadow-sm"
              >
                <div className="flex items-start gap-5">
                  <div className="bg-secondary text-foreground flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="text-foreground text-xl font-semibold">{step.title}</h3>
                    <p className="text-foreground/80 mt-2 max-w-xl text-sm leading-7">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SecaoConversao />

      <section className="px-4 pb-20 md:pb-24">
        <div className="container-premium shadow-premium-lg rounded-4xl bg-linear-to-br from-orange-500 via-red-500 to-amber-500 p-8 text-white md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
                <BadgeCheck className="h-4 w-4" />
                Templates individuais, pacotes e implantação assistida
              </div>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                Venda online com mais controle.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/95">
                Escolha seu template, publique seu canal e atualize o cardápio sem depender de
                desenvolvedor.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:min-w-72">
              <Link
                href="/templates"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-50"
              >
                <Eye className="h-4 w-4" />
                Ver os 7 templates
              </Link>
              <Link
                href="/ofertas"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <ShoppingBag className="h-4 w-4" />
                Quero vender no meu canal
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-border rounded-[1.25rem] border bg-white/90 p-4 shadow-sm backdrop-blur-sm">
      <div className="text-foreground text-2xl font-semibold">{value}</div>
      <div className="text-muted-foreground mt-1 text-sm">{label}</div>
    </div>
  )
}

function DarkMetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/12 bg-white/10 p-4 shadow-sm backdrop-blur-md">
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm text-white/70">{label}</div>
    </div>
  )
}

function ForWhoCard({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="border-border bg-card flex flex-col items-center gap-3 rounded-lg border p-5 text-center transition-shadow hover:shadow-md">
      <div className="text-primary">{icon}</div>
      <p className="text-foreground font-semibold">{title}</p>
    </div>
  )
}

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 p-3">
      <CheckCircle className="text-primary h-5 w-5 shrink-0" />
      <p className="text-foreground">{text}</p>
    </div>
  )
}

function ManagementCard({
  icon,
  title,
  description,
  color,
  bgColor,
}: {
  icon: React.ReactNode
  title: string
  description: string
  color: string
  bgColor: string
}) {
  return (
    <div className="border-border bg-card hover:border-primary/50 rounded-xl border p-5 transition-all hover:shadow-md">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${bgColor} ${color} mb-4`}
      >
        {icon}
      </div>
      <h3 className="text-foreground mb-1 font-bold">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  color,
  bgColor,
}: {
  icon: React.ReactNode
  title: string
  description: string
  color: string
  bgColor: string
}) {
  return (
    <div className="border-border bg-card hover:border-primary/50 rounded-2xl border-2 p-6 text-center transition-all hover:shadow-lg">
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${bgColor} ${color} mb-4`}
      >
        {icon}
      </div>
      <h3 className="text-foreground mb-2 text-lg font-bold">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-border bg-card rounded-xl border p-5">
      <h4 className="text-foreground mb-2 font-bold">{question}</h4>
      <p className="text-muted-foreground text-sm">{answer}</p>
    </div>
  )
}
