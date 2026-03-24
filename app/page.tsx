import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Apple,
  ArrowRight,
  BadgeCheck,
  Beer,
  Cake,
  ChevronRight,
  Coffee,
  Croissant,
  Eye,
  Fish,
  Flame,
  IceCream,
  LayoutTemplate,
  MessageCircle,
  PawPrint,
  Pizza,
  Rocket,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  TabletSmartphone,
  Wine,
} from 'lucide-react'
import { HomeHeader } from '@/components/home-header'
import { Footer } from '@/components/footer'
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
  wine: Wine,
  cart: ShoppingCart,
  croissant: Croissant,
  flame: Flame,
  apple: Apple,
  paw: PawPrint,
  cake: Cake,
}

const WHATSAPP_NUMBER = '5512996887993'

/** Imagens do produto na landing (prints reais do painel e editor) */
const SCREENSHOT_EDITOR = '/screenshots/painel-editor.png'
const SCREENSHOT_DASHBOARD = '/screenshots/painel-dashboard.png'
const WHATSAPP_MESSAGE = encodeURIComponent(
  'Olá! Quero conhecer os modelos prontos de cardápio digital para os 15 tipos de negócio.'
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
    title: '15 Modelos Prontos para Cada Tipo de Operação',
    description:
      'Pizzaria, hamburgueria, açaí, sushi, bar, doceria — cada template foi desenhado para o perfil do negócio, com visual que facilita a escolha do cliente e aumenta a conversão.',
  },
  {
    icon: Shield,
    title: 'Zero Taxa por Pedido — o Lucro É Todo Seu',
    description:
      'Diferente de plataformas que cobram de 12% a 27% por pedido, aqui você contrata a implantação inicial e mantém o plano mensal correspondente. O valor de cada pedido continua 100% com você.',
  },
  {
    icon: TabletSmartphone,
    title: 'Painel Simples no Celular e no Computador',
    description:
      'Se você sabe usar WhatsApp, consegue usar o painel. Atualize preços, fotos e promoções de qualquer lugar, sem depender de ninguém.',
  },
  {
    icon: Rocket,
    title: 'Preparado para Alta Temporada e Picos de Demanda',
    description:
      'No litoral e em datas sazonais o volume de pedidos dispara. Com o cardápio digital organizado, sua equipe atende mais rápido e sem perder pedido.',
  },
] as const

const HIGHLIGHT_BENEFITS = [
  {
    title: 'Venda Mais com Zero Taxa por Pedido',
    description:
      'Em plataformas tradicionais, cada pedido custa entre 12% e 27% em taxas. Aqui o modelo é implantação inicial com plano mensal correspondente, e o valor integral de cada pedido vai direto para o seu caixa.',
  },
  {
    title: 'Preparado para Períodos de Alta Demanda',
    description:
      'Feriados, férias escolares, temporada de verão — quando o volume de pedidos explode, o cardápio digital organiza o fluxo para sua equipe atender com agilidade e sem perder vendas.',
  },
] as const

const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Escolha o Modelo do Seu Segmento',
    description:
      'Selecione entre 15 templates profissionais — pizzaria, hamburgueria, sushi, bar, cafeteria e mais. Cada modelo já vem com a estrutura ideal para o seu tipo de operação.',
  },
  {
    step: '02',
    title: 'Personalize pelo Painel — Sem Programador',
    description:
      'Cadastre seus produtos, defina preços, adicione fotos e organize as categorias. O painel é visual e funciona no celular. Se você usa WhatsApp, consegue usar.',
  },
  {
    step: '03',
    title: 'Publique e Venda Direto pelo Seu Canal',
    description:
      'Compartilhe o link no WhatsApp, Instagram e QR Code. Os pedidos chegam organizados no seu canal, sem intermediário e com zero taxa por pedido.',
  },
] as const

export default function Home() {
  const heroTemplate =
    NICHE_TEMPLATES.find((template) => template.slug === 'pizzaria') || NICHE_TEMPLATES[0]

  return (
    <>
      <main className="bg-background text-foreground min-h-screen">
        <Suspense fallback={null}>
          <HomeHeader />
        </Suspense>

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
                    Zero Taxa por Pedido. O Lucro É Todo Seu.
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
                  <DarkMetricCard value="0%" label="de taxa por pedido" />
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
                          Zero Taxa por Pedido
                        </span>
                      </div>

                      <ul className="text-foreground/80 space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="text-primary">✔</span> Zero taxa por pedido recebido
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
                          <span className="text-primary">✔</span> Pedidos organizados no seu
                          WhatsApp
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-primary">✔</span> Funciona no celular e no
                          computador
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

        <section id="beneficios" className="container-premium py-12 md:py-16">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.18em] text-orange-600 uppercase">
              Por Que Mudar para o Seu Próprio Canal
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              Mais Vendas, Zero Taxa por Pedido, Controle Total.
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

        <section
          id="produto"
          className="border-border border-t bg-zinc-50 py-16 md:py-20 dark:bg-zinc-900/50"
        >
          <div className="container-premium">
            <div className="mb-10 text-center">
              <p className="text-sm font-semibold tracking-[0.18em] text-orange-600 uppercase">
                Nosso Produto
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                Dashboard e Editor Visual do Seu Cardápio.
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
                <div className="relative aspect-16/10">
                  <Image
                    src={SCREENSHOT_DASHBOARD}
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
                    Editor Visual
                  </span>
                </div>
                <div className="relative aspect-16/10">
                  <Image
                    src={SCREENSHOT_EDITOR}
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
                Diferenciais do Seu Canal Próprio:
              </p>
              <ul className="text-foreground/80 grid gap-2 sm:grid-cols-2 sm:gap-x-8">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✔</span> Zero taxa por pedido
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✔</span> Painel visual fácil de usar
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✔</span> Funciona no celular e no PC
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✔</span> QR Code e link compartilhável
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✔</span> Pedidos organizados no WhatsApp
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✔</span> Pronto para picos de demanda sazonal
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="nichos" className="container-premium py-20 md:py-24">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-orange-600 uppercase">
                Modelos por Tipo de Negócio
              </p>
              <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                Um Template Certo para Cada Operação.
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
                        Ver Modelo
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
                  Proposta de Valor
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                  Venda Online com Painel de Edição e Mais Controle.
                </h2>
              </div>
              <p className="max-w-2xl text-base leading-7 text-zinc-200">
                O Cardápio Digital da Zairyx foi desenvolvido para negócios reais de alimentação que
                precisam vender online com clareza, confiança e agilidade no dia a dia.
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
                Como Funciona
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                Escolha, Edite e Publique.
              </h2>
              <p className="text-foreground/80 mt-4 max-w-lg text-base leading-7">
                Escolha o modelo do seu segmento, personalize produtos, preços e fotos no painel e
                publique seu cardápio com zero taxa por pedido e sem depender de programador.
              </p>

              <div className="border-border mt-8 rounded-[1.75rem] border bg-linear-to-br from-orange-50 to-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                    <Rocket className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-semibold">
                      Venda com Mais Autonomia
                    </p>
                    <p className="text-foreground/80 text-sm">
                      Atualize preços, fotos, categorias e promoções com rapidez, reduza dependência
                      de aplicativos e mantenha mais controle sobre a operação.
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/templates"
                    className="bg-foreground text-background inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                  >
                    Ver Modelos
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-border text-foreground inline-flex items-center gap-2 rounded-full border bg-white px-5 py-3 text-sm font-semibold"
                  >
                    <MessageCircle className="h-4 w-4 text-green-600" />
                    Falar com um Especialista
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
                  Templates Individuais, Pacotes e Implantação Assistida
                </div>
                <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                  Pronto para Começar a Vender Online?
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/95">
                  Escolha o modelo do seu segmento, personalize no painel e receba pedidos direto no
                  WhatsApp com zero taxa por pedido e sem intermediário.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:min-w-72">
                <Link
                  href="/templates"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-50"
                >
                  <Eye className="h-4 w-4" />
                  Ver os 15 Modelos
                </Link>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <MessageCircle className="h-4 w-4 text-green-400" />
                  Falar com Especialista
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
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
