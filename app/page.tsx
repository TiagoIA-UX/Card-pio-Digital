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
})) as const

const PLATFORM_FEATURES = [
  {
    icon: LayoutTemplate,
    title: '7 modelos feitos para negócios diferentes',
    description:
      'Cada modelo foi pensado para um tipo de negócio, sem usar a mesma cara para todo mundo.',
  },
  {
    icon: Palette,
    title: 'Troca fácil de cor, foto e textos',
    description: 'Dá para mudar cor, foto, banner e textos sem desmontar o que já está pronto.',
  },
  {
    icon: TabletSmartphone,
    title: 'Mobile-first de verdade',
    description:
      'A experiência prioriza o dedo, o tempo de decisão e o fluxo real do cliente no celular.',
  },
  {
    icon: MousePointerClick,
    title: 'Feito para gerar mais pedidos',
    description:
      'Botões claros, destaque para combos, preços fáceis de ler e caminho simples para o cliente pedir.',
  },
  {
    icon: WandSparkles,
    title: 'Pronto para colocar no ar rápido',
    description:
      'Você começa com um cardápio com cara de negócio de verdade, não com uma base crua para montar do zero.',
  },
  {
    icon: Shield,
    title: 'Bom para crescer depois',
    description:
      'Você pode começar com um modelo só ou trabalhar mais de um tipo de negócio sem bagunçar a identidade visual.',
  },
] as const

const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Escolha o tipo certo do seu negócio',
    description: 'Comece por um modelo que já combina com o seu negócio e evite retrabalho.',
  },
  {
    step: '02',
    title: 'Ajuste marca e cardápio',
    description:
      'Troque fotos, textos, categorias e a ordem da vitrine sem perder a estrutura bonita e organizada.',
  },
  {
    step: '03',
    title: 'Publique e compartilhe',
    description:
      'Publique seu cardápio em uma URL própria, compartilhe no WhatsApp e Instagram e use QR Code nas mesas para abrir o menu presencial sem depender de outro número.',
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
              <span className="text-muted-foreground block text-sm font-semibold tracking-[0.18em] uppercase">
                Cardápio Digital
              </span>
              <span className="block text-base font-semibold">Modelos prontos para delivery</span>
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
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Nichos
            </a>
            <a
              href="#estrutura"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Estrutura
            </a>
            <a
              href="#como-funciona"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Como funciona
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
              Ver planos SaaS
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden px-4 pt-6 pb-20 md:pt-8 md:pb-24">
        <div className="absolute inset-0">
          <img
            src={heroTemplate.image}
            alt={heroTemplate.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(15,23,42,0.92)_0%,rgba(15,23,42,0.78)_42%,rgba(15,23,42,0.3)_72%,rgba(15,23,42,0.45)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.32),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.22),transparent_24%)]" />
        </div>

        <div className="container-premium relative">
          <div className="grid min-h-170 gap-12 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:py-16">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-md">
                <Sparkles className="h-4 w-4 text-orange-300" />7 modelos criados para operações
                reais de delivery
              </div>

              <h1 className="max-w-3xl text-4xl leading-[0.95] font-semibold tracking-tight text-balance text-white md:text-6xl lg:text-7xl">
                Um cardápio digital com cara de marca séria.
                <span className="mt-3 block text-orange-300">
                  Escolha um modelo pronto, edite e publique mais rápido.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80 md:text-xl">
                Restaurante, pizzaria, hamburgueria, bar, cafeteria, açaíteria e sushi. Cada modelo
                foi pensado para apresentar melhor o cardápio e facilitar o pedido no celular.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/templates"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-orange-600"
                >
                  <Eye className="h-5 w-5" />
                  Ver os 7 modelos
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/15"
                >
                  <Store className="h-5 w-5" />
                  Entrar no painel
                </Link>
              </div>

              <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                <DarkMetricCard value="7" label="modelos prontos" />
                <DarkMetricCard value="500+" label="clientes atendidos" />
                <DarkMetricCard value="4.8/5" label="avaliação média" />
              </div>
            </div>

            <div className="flex items-end justify-end">
              <div className="w-full max-w-xl rounded-4xl border border-white/12 bg-black/20 p-4 shadow-2xl shadow-black/30 backdrop-blur-md md:p-5">
                <div className="overflow-hidden rounded-[1.6rem] border border-white/12 bg-white/95 shadow-xl">
                  <img
                    src={heroTemplate.image}
                    alt={`Preview ${heroTemplate.name}`}
                    className="h-64 w-full object-cover md:h-72"
                  />
                  <div className="p-6">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                          Modelo em destaque
                        </p>
                        <h2 className="text-foreground mt-1 text-2xl font-semibold">
                          {heroTemplate.name}
                        </h2>
                      </div>
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                        {heroTemplate.eyebrow}
                      </span>
                    </div>

                    <p className="text-muted-foreground text-sm leading-6">
                      {heroTemplate.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {heroTemplate.highlights.map((highlight) => (
                        <span
                          key={highlight}
                          className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 flex gap-3">
                      <Link
                        href={`/templates/${heroTemplate.slug}`}
                        className="bg-foreground text-background inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
                      >
                        Ver modelo
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        href="/ofertas"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-900"
                      >
                        Ver planos
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
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/15"
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
              Cada modelo foi pensado para o jeito que o seu cliente compra.
            </h2>
          </div>
          <p className="text-muted-foreground max-w-xl text-base leading-7">
            O cardápio de uma pizzaria não vende do mesmo jeito que o de um bar ou de uma cafeteria.
            Aqui cada modelo acompanha o ritmo do negócio e o tipo de produto.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {NICHE_TEMPLATES.map((template) => {
            const Icon = template.icon

            return (
              <article
                key={template.slug}
                className="group border-border bg-card hover:shadow-premium overflow-hidden rounded-[1.75rem] border shadow-sm transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={template.image}
                    alt={template.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                  <p className="text-muted-foreground text-sm leading-6">{template.description}</p>

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
                Feito para vender melhor
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                Não é só bonito. Ajuda o cliente a escolher mais rápido.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-zinc-300">
              O cardápio foi organizado para destacar os itens principais, facilitar a leitura no
              celular e passar mais confiança logo no primeiro acesso.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {PLATFORM_FEATURES.map((feature) => {
              const Icon = feature.icon

              return (
                <div
                  key={feature.title}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{feature.description}</p>
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
              Saia do zero e coloque seu cardápio no ar em poucos passos.
            </h2>
            <p className="text-muted-foreground mt-4 max-w-lg text-base leading-7">
              A ideia é simples: pegar um modelo pronto, colocar suas informações, ajustar as fotos
              e publicar rápido, sem precisar montar tudo do zero.
            </p>

            <div className="border-border mt-8 rounded-[1.75rem] border bg-linear-to-br from-orange-50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                  <Rocket className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-semibold">
                    Ideal para quem quer crescer rápido
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Bom para quem trabalha com mais de uma marca ou quer testar outro tipo de
                    negócio.
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
                  Tirar dúvidas
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
                    <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-7">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 md:pb-24">
        <div className="container-premium shadow-premium-lg rounded-4xl bg-linear-to-br from-orange-500 via-red-500 to-amber-500 p-8 text-white md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
                <BadgeCheck className="h-4 w-4" />
                Modelos individuais, pacotes e acesso completo
              </div>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                Se você vende em mais de um estilo de negócio, sua vitrine também precisa mostrar
                isso.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/85">
                Aqui você pode escolher um modelo pronto, adaptar ao seu negócio e colocar no ar
                mais rápido. A proposta fica mais clara para quem quer vender por delivery, retirada
                ou atendimento no local.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:min-w-72">
              <Link
                href="/templates"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-50"
              >
                <Eye className="h-4 w-4" />
                Abrir catálogo de modelos
              </Link>
              <Link
                href="/ofertas"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <ShoppingBag className="h-4 w-4" />
                Comparar pacotes
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
