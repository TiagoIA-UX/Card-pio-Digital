import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  Eye,
  MessageCircle,
  Pencil,
  Rocket,
  Send,
  Shield,
  Smartphone,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import { HomeHeader } from '@/components/home-header'
import { Footer } from '@/components/footer'
import { RESTAURANT_TEMPLATES } from '@/lib/templates-config'
import FaqSection from '@/components/sections/FaqSection'

const WHATSAPP_NUMBER = '5512996887993'
const WHATSAPP_MESSAGE = encodeURIComponent(
  'Olá! Quero saber mais sobre o cardápio digital.'
)
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`

const TOP_TEMPLATES = RESTAURANT_TEMPLATES.slice(0, 6)

export default function Home() {
  return (
    <>
      <main className="bg-white text-zinc-900 min-h-screen">
        <Suspense fallback={null}>
          <HomeHeader />
        </Suspense>

        {/* ═══════════════════════════════════════════════════════════════
            HERO — Promessa direta em 5 segundos
        ═══════════════════════════════════════════════════════════════ */}
        <section
          data-testid="hero-section"
          className="relative overflow-hidden bg-zinc-950 px-4 pt-8 pb-16 md:pt-12 md:pb-24"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(249,115,22,0.15),transparent)]" />

          <div className="container-premium relative">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              {/* Left — Copy */}
              <div className="max-w-xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-orange-300 backdrop-blur-sm">
                  <Zap className="h-4 w-4" />
                  0% de comissão por pedido
                </div>

                <h1 className="text-4xl leading-[1.08] font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                  Receba mais pedidos
                  <span className="block text-orange-400">direto no WhatsApp.</span>
                </h1>

                <p className="mt-5 max-w-lg text-lg leading-relaxed text-zinc-300">
                  Monte seu cardápio digital em minutos.
                  Seus clientes escolhem, pedem e você recebe{' '}
                  <strong className="text-white">tudo organizado no WhatsApp</strong>.
                  Sem app, sem taxa por pedido.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/templates"
                    data-testid="hero-cta-primary"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-7 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 hover:-translate-y-0.5"
                  >
                    <Eye className="h-5 w-5" />
                    Ver modelos prontos
                  </Link>
                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="hero-cta-whatsapp"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-4 text-base font-semibold text-white transition-all hover:bg-white/5"
                  >
                    <MessageCircle className="h-5 w-5 text-green-400" />
                    Falar com especialista
                  </a>
                </div>

                {/* Micro proof */}
                <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-green-400" />
                    Pronto em 30 min
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-green-400" />
                    15 modelos por nicho
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-green-400" />
                    Garantia 30 dias
                  </span>
                </div>
              </div>

              {/* Right — Visual */}
              <div className="relative flex justify-center lg:justify-end">
                <div className="relative w-full max-w-md">
                  {/* Phone mockup frame */}
                  <div className="rounded-[2.5rem] border-2 border-white/10 bg-zinc-900 p-3 shadow-2xl shadow-black/40">
                    <div className="overflow-hidden rounded-[2rem] bg-white">
                      <Image
                        src="/screenshots/painel-editor.png"
                        alt="Editor visual do cardápio digital Zairyx"
                        width={400}
                        height={600}
                        className="h-auto w-full object-cover"
                        priority
                      />
                    </div>
                  </div>
                  {/* Floating badge */}
                  <div className="absolute -right-2 bottom-16 rounded-2xl border border-white/10 bg-zinc-800/90 px-4 py-3 shadow-xl backdrop-blur-md md:-right-8">
                    <p className="text-xs font-medium text-zinc-400">Pedido recebido</p>
                    <p className="mt-0.5 text-lg font-bold text-green-400">+R$ 89,90</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SOCIAL PROOF — Métricas de confiança
        ═══════════════════════════════════════════════════════════════ */}
        <section
          data-testid="proof-section"
          className="border-b border-zinc-100 bg-zinc-50 py-8"
        >
          <div className="container-premium">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              <ProofStat value="0%" label="de comissão por pedido" />
              <ProofStat value="15" label="modelos por segmento" />
              <ProofStat value="30 min" label="pra colocar no ar" />
              <ProofStat value="30 dias" label="garantia de reembolso" />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            DOR → SOLUÇÃO — O problema que resolve
        ═══════════════════════════════════════════════════════════════ */}
        <section
          data-testid="pain-solution-section"
          className="py-20 md:py-28"
        >
          <div className="container-premium">
            <div className="mb-14 max-w-2xl">
              <p className="text-sm font-bold tracking-[0.2em] uppercase text-orange-600">
                Por que mudar agora
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                Cada pedido no app está custando
                <span className="text-orange-500"> até 27% do seu faturamento.</span>
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-zinc-600">
                Com seu próprio cardápio digital, o valor integral vai pro seu caixa.
                Assinatura fixa, sem surpresas.
              </p>
            </div>

            {/* Comparison Cards */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* OLD WAY */}
              <div className="rounded-3xl border border-red-200 bg-red-50/50 p-8">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
                  <X className="h-4 w-4" />
                  Apps de delivery tradicionais
                </div>
                <ul className="space-y-4">
                  {[
                    'Cobram de 12% a 27% por pedido',
                    'Você depende da plataforma',
                    'Sem controle sobre a apresentação',
                    'Precisa de desenvolvedor pra mudar preço',
                    'Custos que crescem com cada venda',
                    'Seus clientes veem concorrentes ao lado',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm text-red-800/80 line-through decoration-red-300"
                    >
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* NEW WAY */}
              <div className="rounded-3xl border-2 border-orange-200 bg-orange-50/50 p-8 shadow-lg shadow-orange-100/50">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-700">
                  <CheckCircle className="h-4 w-4" />
                  Cardápio Digital Zairyx
                </div>
                <ul className="space-y-4">
                  {[
                    '0% de comissão — o lucro é todo seu',
                    'Canal próprio com a cara do seu negócio',
                    'Editor visual simples (tipo WhatsApp)',
                    'Você muda preço e foto na hora',
                    'Assinatura fixa e previsível',
                    'Seus clientes só veem VOCÊ',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm font-medium text-zinc-800"
                    >
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            COMO FUNCIONA — 3 passos
        ═══════════════════════════════════════════════════════════════ */}
        <section
          data-testid="how-it-works-section"
          className="border-t border-zinc-100 bg-zinc-50 py-20 md:py-28"
        >
          <div className="container-premium">
            <div className="mb-14 text-center">
              <p className="text-sm font-bold tracking-[0.2em] uppercase text-orange-600">
                Simples assim
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                3 passos pra começar a vender
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <StepCard
                step="01"
                icon={<Sparkles className="h-6 w-6" />}
                title="Escolha seu modelo"
                description="15 templates prontos por segmento: pizzaria, hamburgueria, sushi, bar, cafeteria e mais. Já vem com produtos de exemplo."
              />
              <StepCard
                step="02"
                icon={<Pencil className="h-6 w-6" />}
                title="Personalize no painel"
                description="Troque fotos, preços, categorias e cores pelo celular ou computador. Se você usa WhatsApp, consegue usar o painel."
              />
              <StepCard
                step="03"
                icon={<Send className="h-6 w-6" />}
                title="Publique e venda"
                description="Compartilhe o link no WhatsApp, Instagram e QR Code. Pedidos chegam organizados no seu canal. Sem intermediário."
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BENEFÍCIOS — Bento Grid
        ═══════════════════════════════════════════════════════════════ */}
        <section
          data-testid="benefits-section"
          className="py-20 md:py-28"
        >
          <div className="container-premium">
            <div className="mb-14 max-w-2xl">
              <p className="text-sm font-bold tracking-[0.2em] uppercase text-orange-600">
                Feito pra quem vende comida
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                O que muda na prática
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <BenefitCard
                icon={<Shield className="h-5 w-5" />}
                title="Zero comissão"
                text="Assinatura fixa. O valor de cada pedido vai 100% pro seu caixa. Venda 10 ou 1000 — o custo é o mesmo."
                accent
              />
              <BenefitCard
                icon={<Smartphone className="h-5 w-5" />}
                title="Edita pelo celular"
                text="Troque preços, fotos e categorias de qualquer lugar. É intuitivo — sua equipe aprende em minutos."
              />
              <BenefitCard
                icon={<MessageCircle className="h-5 w-5" />}
                title="Pedidos no WhatsApp"
                text="O cliente monta o pedido no cardápio e envia direto no seu WhatsApp. Organizado com itens e quantidades."
              />
              <BenefitCard
                icon={<Rocket className="h-5 w-5" />}
                title="Pronto em 30 minutos"
                text="Escolha o modelo, personalize e publique. Se preferir, nossa equipe faz a configuração inicial."
              />
              <BenefitCard
                icon={<Clock className="h-5 w-5" />}
                title="Alta temporada sem caos"
                text="Quando o volume de pedidos explode, o cardápio organiza o fluxo pra sua equipe atender com agilidade."
              />
              <BenefitCard
                icon={<Zap className="h-5 w-5" />}
                title="QR Code + Link direto"
                text="Compartilhe no Instagram, WhatsApp ou imprima o QR Code. Seus clientes acessam direto no celular."
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            PRODUTO — Screenshots reais
        ═══════════════════════════════════════════════════════════════ */}
        <section
          data-testid="product-section"
          className="border-t border-zinc-100 bg-zinc-50 py-20 md:py-28"
        >
          <div className="container-premium">
            <div className="mb-14 text-center">
              <p className="text-sm font-bold tracking-[0.2em] uppercase text-orange-600">
                Veja o painel
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                Se você usa WhatsApp, consegue usar.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-zinc-600">
                Painel visual para gerenciar produtos, preços e categorias.
                Funciona no celular e no computador.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
                <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-3">
                  <span className="text-sm font-semibold text-zinc-700">Dashboard</span>
                </div>
                <div className="relative aspect-[16/10]">
                  <Image
                    src="/screenshots/painel-dashboard.png"
                    alt="Dashboard do painel Zairyx"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
                <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-3">
                  <span className="text-sm font-semibold text-zinc-700">Editor de Produtos</span>
                </div>
                <div className="relative aspect-[16/10]">
                  <Image
                    src="/screenshots/painel-editor.png"
                    alt="Editor visual do cardápio Zairyx"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            TEMPLATES — Top 6 nichos
        ═══════════════════════════════════════════════════════════════ */}
        <section
          data-testid="templates-section"
          className="py-20 md:py-28"
        >
          <div className="container-premium">
            <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-bold tracking-[0.2em] uppercase text-orange-600">
                  15 nichos prontos
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                  Tem modelo pro seu tipo de negócio.
                </h2>
              </div>
              <Link
                href="/templates"
                data-testid="templates-view-all"
                className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
              >
                Ver todos os 15 modelos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {TOP_TEMPLATES.map((template) => (
                <article
                  key={template.slug}
                  className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-lg hover:border-orange-200"
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={template.imageUrl}
                      alt={template.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-lg font-bold text-white">{template.name}</h3>
                      <p className="mt-0.5 text-sm text-white/80">{template.eyebrow}</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-zinc-600 leading-relaxed">{template.description}</p>
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
                        href={`/comprar/${template.slug}`}
                        data-testid={`template-buy-${template.slug}`}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
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
              {RESTAURANT_TEMPLATES.map((t) => (
                <Link
                  key={t.slug}
                  href={`/templates/${t.slug}`}
                  className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-orange-300 hover:text-orange-600"
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            FAQ — Redução de objeção
        ═══════════════════════════════════════════════════════════════ */}
        <FaqSection />

        {/* ═══════════════════════════════════════════════════════════════
            CTA FINAL — Urgência + Garantia
        ═══════════════════════════════════════════════════════════════ */}
        <section
          data-testid="final-cta-section"
          className="px-4 pb-20 md:pb-28"
        >
          <div className="container-premium">
            <div className="overflow-hidden rounded-[2rem] bg-zinc-950 p-8 md:p-14">
              <div className="relative">
                <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-orange-500/10 blur-3xl" />
                <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                      Pronto pra vender mais{' '}
                      <span className="text-orange-400">sem pagar comissão?</span>
                    </h2>
                    <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-300">
                      Escolha o modelo do seu segmento, personalize pelo painel e comece
                      a receber pedidos hoje. Se não gostar em 30 dias, devolvemos 100%.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Shield className="h-4 w-4 text-green-400" />
                        Garantia 30 dias
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-green-400" />
                        Sem taxa por pedido
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-green-400" />
                        Suporte por WhatsApp
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:min-w-64">
                    <Link
                      href="/templates"
                      data-testid="final-cta-primary"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 hover:-translate-y-0.5"
                    >
                      <Eye className="h-5 w-5" />
                      Ver modelos prontos
                    </Link>
                    <a
                      href={WHATSAPP_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="final-cta-whatsapp"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/5"
                    >
                      <MessageCircle className="h-5 w-5 text-green-400" />
                      Falar no WhatsApp
                    </a>
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

function ProofStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center" data-testid={`proof-stat-${value}`}>
      <div className="text-2xl font-bold text-zinc-900 md:text-3xl">{value}</div>
      <div className="mt-1 text-sm text-zinc-500">{label}</div>
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
        <span className="text-3xl font-bold text-zinc-200">{step}</span>
      </div>
      <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{description}</p>
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
        accent
          ? 'border-orange-200 bg-orange-50/70'
          : 'border-zinc-200 bg-white'
      }`}
    >
      <div
        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
          accent
            ? 'bg-orange-500 text-white'
            : 'bg-zinc-100 text-zinc-700'
        }`}
      >
        {icon}
      </div>
      <h3 className="text-base font-bold text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{text}</p>
    </div>
  )
}
