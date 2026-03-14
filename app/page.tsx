import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Beer,
  ChevronRight,
  Coffee,
  Eye,
  Fish,
  IceCream,
  LayoutTemplate,
  MessageCircle,
  Palette,
  Pizza,
  Rocket,
  Shield,
  ShoppingBag,
  Sparkles,
  Store,
  TabletSmartphone,
} from 'lucide-react'
import { HomeHeader } from '@/components/home-header'
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
    title: 'Adicione produtos, edite preços, troque fotos — no painel',
    description:
      'O dono adiciona itens, altera preços, cria categorias, ativa ou pausa produtos. Tudo em um painel visual simples, sem chamar desenvolvedor.',
  },
  {
    icon: TabletSmartphone,
    title: 'Painel no celular e no computador',
    description:
      'Atualize o cardápio, cadastre produtos e publique mudanças de qualquer lugar. Pensado para donos sem conhecimento técnico.',
  },
  {
    icon: Shield,
    title: 'Pedidos organizados no seu próprio canal',
    description:
      'O cliente escolhe, envia o pedido e sua equipe recebe tudo com mais clareza no WhatsApp, sem intermediação desnecessária e sem comissão sobre os pedidos.',
  },
] as const

const HIGHLIGHT_BENEFITS = [
  {
    title: 'Adicione produtos • Edite preços • Troque fotos • Ative ou pause itens',
    description:
      'Tudo direto no painel. O dono adiciona itens, altera preços, cria categorias e ativa ou pausa produtos. Atualização em tempo real. Sem desenvolvedor.',
  },
  {
    title: 'Mais economia e autonomia total',
    description:
      'O restaurante opera o próprio cardápio sozinho. Evita gastos recorrentes com ajustes que antes exigiriam programador. O dono resolve tudo pelo painel.',
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
    title: 'Adicione produtos • Edite preços • Troque fotos • Ative ou pause itens',
    description:
      'Tudo direto no painel. O dono adiciona itens, altera preços, cria categorias e publica mudanças. Se você sabe usar WhatsApp, consegue usar o painel.',
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

  return (
    <main className="bg-background text-foreground min-h-screen">
      <HomeHeader />

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
                <Sparkles className="h-4 w-4 text-orange-300" />7 templates para negócios de
                alimentação
              </div>

              <h1 className="max-w-3xl text-4xl leading-[0.95] font-semibold tracking-tight text-balance text-white md:text-6xl lg:text-7xl">
                Cardápio digital profissional para vender direto.
                <span className="mt-3 block text-orange-300">
                  Adicione produtos • Edite preços • Troque fotos • Ative ou pause itens
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90 md:text-xl">
                Tudo direto no painel. Sem desenvolvedor.{' '}
                <span className="font-semibold text-white">
                  Se você sabe usar WhatsApp, consegue usar o painel.
                </span>
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/templates"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-500/30 transition-colors hover:bg-orange-600"
                >
                  <Eye className="h-5 w-5" />
                  Ver os 7 templates
                </Link>
                <Link
                  href="/ofertas"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/15"
                >
                  <Store className="h-5 w-5" />
                  Ver planos
                </Link>
              </div>

              <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                <DarkMetricCard value="7" label="templates profissionais" />
                <DarkMetricCard value="PAINEL" label="simples de editar" />
                <DarkMetricCard value="0%" label="de comissão sobre pedidos" />
              </div>
            </div>

            <div className="flex items-end justify-end">
              <div className="w-full max-w-xl rounded-4xl border border-white/12 bg-black/20 p-4 shadow-2xl shadow-black/30 backdrop-blur-md md:p-5">
                <div className="overflow-hidden rounded-[1.6rem] border border-white/12 bg-white/95 shadow-xl">
                  <Image
                    src="/screenshots/painel-editor.png"
                    alt="Painel de edição visual do cardápio digital"
                    width={960}
                    height={576}
                    className="h-64 w-full object-cover object-top md:h-72"
                  />
                  <div className="p-6">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-foreground/70 text-xs font-semibold tracking-[0.18em] uppercase">
                          O que o dono faz no painel
                        </p>
                        <h2 className="text-foreground mt-1 text-2xl font-semibold">
                          No painel você consegue:
                        </h2>
                      </div>
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                        Editor visual
                      </span>
                    </div>

                    <ul className="text-foreground/80 space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✔</span> Adicionar produtos
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✔</span> Editar preços
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✔</span> Trocar fotos
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✔</span> Criar categorias
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✔</span> Ativar ou pausar itens
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✔</span> Atualizar o cardápio em tempo real
                      </li>
                    </ul>

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

      <section id="beneficios" className="container-premium py-12 md:py-16">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold tracking-[0.18em] text-orange-600 uppercase">
            Benefícios em destaque
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            Simples de editar e simples de manter.
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {HIGHLIGHT_BENEFITS.map((benefit) => (
            <article
              key={benefit.title}
              className="border-border bg-card rounded-[1.75rem] border p-6 shadow-sm"
            >
              <h3 className="text-xl font-semibold">{benefit.title}</h3>
              <p className="text-foreground/80 mt-3 text-base leading-7">{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="produto" className="border-border border-t bg-zinc-50 py-16 md:py-20 dark:bg-zinc-900/50">
        <div className="container-premium">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold tracking-[0.18em] text-orange-600 uppercase">
              Nosso produto
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              Dashboard e editor visual do seu cardápio.
            </h2>
            <p className="text-foreground/80 mx-auto mt-4 max-w-2xl text-base leading-7">
              Se você sabe usar WhatsApp, consegue usar o painel.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700">
              <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Dashboard
                </span>
              </div>
              <div className="relative aspect-[16/10]">
                <Image
                  src="/screenshots/painel-dashboard.png"
                  alt="Dashboard do painel com pedidos e estatísticas"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700">
              <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Editor visual
                </span>
              </div>
              <div className="relative aspect-[16/10]">
                <Image
                  src="/screenshots/painel-editor.png"
                  alt="Editor visual para editar o cardápio"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
          <div className="bg-card border-border mx-auto mt-10 max-w-2xl rounded-2xl border p-6 shadow-sm">
            <p className="text-foreground mb-4 text-center font-semibold">
              No painel você consegue:
            </p>
            <ul className="text-foreground/80 grid gap-2 sm:grid-cols-2 sm:gap-x-8">
              <li className="flex items-center gap-2">
                <span className="text-primary">✔</span> Adicionar produtos
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✔</span> Editar preços
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✔</span> Trocar fotos
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✔</span> Criar categorias
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✔</span> Ativar ou pausar itens
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✔</span> Atualizar o cardápio em tempo real
              </li>
            </ul>
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
                className="border-border bg-card hover:shadow-premium overflow-hidden rounded-[1.75rem] border shadow-sm transition-shadow"
              >
                <div className="relative h-56 overflow-hidden">
                  <Image src={template.image} alt={template.name} fill className="object-cover" />
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
                  className="rounded-3xl border border-white/10 bg-white/5 p-6"
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
              Você escolhe um template profissional, edita no painel e publica seu canal próprio
              para receber pedidos sem depender de desenvolvedor.
            </p>

            <div className="border-border mt-8 rounded-[1.75rem] border bg-linear-to-br from-orange-50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                  <Rocket className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-semibold">Venda com mais autonomia</p>
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
                  Ver planos
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
                className="border-border bg-card rounded-[1.75rem] border p-6 shadow-sm"
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
                Ver planos
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
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
