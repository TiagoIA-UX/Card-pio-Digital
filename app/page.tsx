import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgePercent,
  CheckCircle,
  ChevronRight,
  Eye,
  Flame,
  MessageCircle,
  Pencil,
  Send,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import { HomeHeader } from '@/components/home-header'
import { RESTAURANT_TEMPLATES } from '@/lib/domains/marketing/templates-config'
import { ScrollReveal } from '@/components/scroll-reveal'
import { TrackedLink } from '@/components/tracked-link'
import { HeroBadge, HeroHeading } from '@/components/hero-ab'

const Footer = dynamic(() => import('@/components/footer').then((m) => ({ default: m.Footer })))
const FaqSection = dynamic(() => import('@/components/sections/FaqSection'))
const SavingsCalculator = dynamic(() => import('@/components/sections/SavingsCalculator'))
const TestimonialsSection = dynamic(() => import('@/components/sections/TestimonialsSection'))

const TOP_TEMPLATES = RESTAURANT_TEMPLATES.slice(0, 6)

export default function Home() {
  return (
    <>
      <main className="min-h-screen bg-white text-zinc-900">
        <Suspense fallback={null}>
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
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              {/* Left — Copy */}
              <div className="max-w-xl">
                {/* Educational badge */}
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-300 backdrop-blur-sm">
                  <Sparkles className="h-4 w-4" />
                  <HeroBadge />
                </div>

                <h1 className="text-4xl leading-[1.08] font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                  <HeroHeading />
                </h1>

                <p className="mt-5 max-w-lg text-lg leading-relaxed text-zinc-200">
                  Já vem com produtos, categorias e tudo configurado.{' '}
                  <strong className="text-white">
                    Edite nome, preço e fotos com poucos cliques — sem precisar de programador.
                  </strong>{' '}
                  Pedidos direto no WhatsApp. Comece a vender hoje.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <TrackedLink
                    href="/templates"
                    trackCta="hero_primary"
                    trackPage="landing"
                    data-testid="hero-cta-primary"
                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-7 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-500/40"
                  >
                    <Flame className="h-5 w-5 transition-transform group-hover:scale-110" />
                    Começar agora
                  </TrackedLink>
                  <TrackedLink
                    href="/templates"
                    trackCta="hero_assistant"
                    trackPage="landing"
                    data-testid="hero-cta-whatsapp"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-4 text-base font-semibold text-white transition-all hover:bg-white/5"
                  >
                    <Eye className="h-5 w-5 text-zinc-300" />
                    Ver modelos prontos
                  </TrackedLink>
                </div>

                {/* Micro proof — trust builders */}
                <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-orange-400" />
                    Pronto para vender em minutos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Pencil className="h-4 w-4 text-green-400" />
                    Edite sem programador
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-green-400" />
                    Garantia 30 dias
                  </span>
                </div>
              </div>

              {/* Right — Visual */}
              <div className="relative flex justify-center lg:justify-end">
                <div className="relative w-full max-w-md">
                  {/* Phone mockup frame */}
                  <div className="rounded-[2.5rem] border-2 border-white/10 bg-zinc-900 p-3 shadow-2xl shadow-black/40">
                    <div className="overflow-hidden rounded-4xl bg-white">
                      <Image
                        src="/screenshots/painel-editor.png"
                        alt="Editor visual do cardápio digital Zairyx — monte em minutos"
                        width={400}
                        height={600}
                        className="h-auto w-full object-cover"
                        priority
                      />
                    </div>
                  </div>
                  {/* Floating badge — pedido */}
                  <div className="absolute -right-2 bottom-20 rounded-2xl border border-green-500/30 bg-zinc-800/90 px-4 py-3 shadow-xl backdrop-blur-md md:-right-8">
                    <p className="text-xs font-medium text-zinc-300">Novo pedido agora</p>
                    <p className="mt-0.5 text-lg font-bold text-green-400">+R$ 127,90</p>
                    <p className="text-[10px] text-green-400/70">100% pro seu caixa</p>
                  </div>
                  {/* Floating badge — economia */}
                  <div className="absolute top-16 -left-2 rounded-2xl border border-orange-500/30 bg-zinc-800/90 px-4 py-3 shadow-xl backdrop-blur-md md:-left-8">
                    <p className="text-xs font-medium text-zinc-300">Economia mensal</p>
                    <p className="mt-0.5 text-lg font-bold text-orange-400">R$ 3.000+</p>
                    <p className="text-[10px] text-orange-400/70">vs. apps tradicionais</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SOCIAL PROOF — Números de impacto + urgência
        ═══════════════════════════════════════════════════════════════ */}
        <section data-testid="proof-section" className="border-b border-zinc-100 bg-zinc-50 py-8">
          <div className="container-premium">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              <ProofStat value="0%" label="de taxa por pedido" highlight />
              <ProofStat value="16" label="nichos com modelo pronto" />
              <ProofStat value="30 min" label="e seu cardápio está no ar" />
              <ProofStat value="100%" label="do dinheiro vai pro seu caixa" highlight />
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
                  Categorias pensadas, sugestões inteligentes e uma IA que ajuda a vender mais.
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Google Meu Negócio — teaser compacto */}
        <ScrollReveal>
          <section
            data-testid="google-business-section"
            className="border-t border-zinc-100 bg-blue-50 py-10"
          >
            <div className="container-premium">
              <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">
                      Já está no <span className="text-blue-600">Google Meu Negócio</span>?
                    </p>
                    <p className="text-sm text-zinc-600">
                      Apareça nas buscas locais gratuitamente e direcione clientes direto ao seu
                      cardápio.
                    </p>
                  </div>
                </div>
                <TrackedLink
                  href="/google-meu-negocio"
                  trackCta="google_business_teaser"
                  trackPage="landing"
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border-2 border-blue-600 px-5 py-2.5 text-sm font-bold text-blue-600 transition-all hover:bg-blue-600 hover:text-white"
                >
                  Saiba mais
                  <ChevronRight className="h-4 w-4" />
                </TrackedLink>
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
                  Enquanto você lê isso, concorrentes seus já estão faturando sem comissão.
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-3">
                <StepCard
                  step="01"
                  icon={<Sparkles className="h-6 w-6" />}
                  title="Escolha o modelo do seu nicho"
                  description="15 templates profissionais: Pizzaria, Hamburgueria, Bar, Cafeteria, Açaíteria e mais. Já vêm com produtos reais de exemplo — só trocar."
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
                  description="Envie seu link por WhatsApp, Instagram e QR Code. Pedidos chegam organizados. 100% do valor entra no SEU caixa."
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
                  <span className="text-orange-500">tirar o trabalho do cliente</span>
                </h2>
                <p className="mt-4 text-base text-zinc-600">
                  Produto pronto, editor simples e pedidos organizados. Você foca no que importa:
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
                  title="Editor simples como WhatsApp"
                  text="Mude preço, foto e categoria em poucos cliques pelo celular. Se você manda áudio no WhatsApp, você usa nosso painel."
                  accent
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
                  title="IA que atende 24h"
                  text="Assistente inteligente direto no cardápio. Responde dúvidas, sugere combos e fecha pedidos — inclusive de madrugada. Vai de brinde."
                />
                <BenefitCard
                  icon={<CheckCircle className="h-5 w-5" />}
                  title="Pagamento online integrado"
                  text="Seu cliente paga com cartão, PIX ou parcelado direto no pedido. Confirmação automática — sem conferir manualmente."
                />
                <BenefitCard
                  icon={<Shield className="h-5 w-5" />}
                  title="Mensalidade fixa, sem taxa por pedido"
                  text="Vendeu R$ 1.000 ou R$ 100.000? Paga o mesmo. Cada centavo de lucro fica no seu bolso."
                />
                <BenefitCard
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="30 dias de garantia total"
                  text="Teste por 30 dias completos. Se não funcionar para o seu negócio, devolvemos tudo — sem perguntas e sem burocracia."
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
              Simples, direto e pronto para usar
            </p>
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              R$ 147/mês fixo.{' '}
              <span className="text-orange-200">Catálogo pronto. Sem taxa por pedido.</span>
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
            <p className="text-xs text-orange-200">
              <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
              Garantia de 30 dias ou dinheiro de volta. Sem contrato.
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            DEPOIMENTOS — Prova social real
        ═══════════════════════════════════════════════════════════════ */}
        <TestimonialsSection />

        {/* ═══════════════════════════════════════════════════════════════
            PRODUTO — Screenshots reais + IA destaque
        ═══════════════════════════════════════════════════════════════ */}
        <ScrollReveal>
          <section
            data-testid="product-section"
            className="border-t border-zinc-100 bg-zinc-50 py-20 md:py-28"
          >
            <div className="container-premium">
              <div className="mb-14 text-center">
                <p className="text-sm font-bold tracking-[0.2em] text-orange-600 uppercase">
                  Tecnologia que vende por você
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                  Painel profissional.{' '}
                  <span className="text-orange-500">Simplicidade de WhatsApp.</span>
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base text-zinc-700">
                  Dashboard completo + editor visual + IA integrada. Tudo no mesmo lugar. Funciona
                  no celular e computador.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
                  <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-3">
                    <span className="text-sm font-semibold text-zinc-700">
                      Dashboard — Controle total
                    </span>
                  </div>
                  <div className="relative aspect-16/10">
                    <Image
                      src="/screenshots/painel-dashboard.png"
                      alt="Dashboard completo do painel Zairyx com métricas de vendas"
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
                  <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-3">
                    <span className="text-sm font-semibold text-zinc-700">
                      Editor Visual — Fácil como WhatsApp
                    </span>
                  </div>
                  <div className="relative aspect-16/10">
                    <Image
                      src="/screenshots/painel-editor.png"
                      alt="Editor visual intuitivo do cardápio digital Zairyx"
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>

              {/* Feature highlights strip */}
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-zinc-200 bg-white p-5 text-center">
                  <Sparkles className="mx-auto mb-2 h-6 w-6 text-orange-500" />
                  <p className="text-sm font-bold text-zinc-900">IA Assistente 24h</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Responde e vende mesmo quando você dorme
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
                    16 nichos prontos — escolha o seu
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
                  Ver todos os 16 modelos
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
                          href={`/comprar/${template.slug}`}
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
                {RESTAURANT_TEMPLATES.map((t) => (
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
                      Catálogo pronto, editor simples, tudo pelo celular
                    </p>
                  </div>
                  <div className="rounded-xl border border-green-200 bg-white p-5">
                    <p className="text-2xl font-bold text-green-600">✓</p>
                    <p className="mt-2 text-sm font-bold text-zinc-900">Quer sua própria marca</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Cardápio com sua identidade, IA assistente e QR Code
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
            COMPARAÇÃO CONCORRENTES — Tabela de verdade
        ═══════════════════════════════════════════════════════════════ */}
        <ScrollReveal>
          <section
            data-testid="competitor-comparison-section"
            className="border-t border-zinc-100 bg-white py-20 md:py-28"
          >
            <div className="container-premium">
              <div className="mb-14 max-w-2xl">
                <p className="text-sm font-bold tracking-[0.2em] text-orange-600 uppercase">
                  Compare e escolha com clareza
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                  O que está incluso <span className="text-orange-500">no seu canal próprio</span>
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-zinc-700">
                  Veja o que você ganha com a Zairyx comparado a outras opções do mercado.
                  Transparência total — sem letras miúdas.
                </p>
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                <table className="comparison-table w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50">
                      <th className="px-6 py-4 text-left font-bold text-zinc-700">Critério</th>
                      <th className="px-6 py-4 text-center font-bold text-red-600">iFood</th>
                      <th className="px-6 py-4 text-center font-bold text-red-600">Rappi</th>
                      <th className="px-6 py-4 text-center font-bold text-zinc-500">
                        WhatsApp informal
                      </th>
                      <th className="bg-green-50 px-6 py-4 text-center font-bold text-green-700">
                        Zairyx
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    <tr>
                      <td className="px-6 py-4 font-semibold text-zinc-900">Comissão por pedido</td>
                      <td className="px-6 py-4 text-center font-bold text-red-600">
                        ~15% (Básico)*
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-red-600">~25-30%</td>
                      <td className="px-6 py-4 text-center text-zinc-500">0%</td>
                      <td className="bg-green-50/50 px-6 py-4 text-center font-bold text-green-700">
                        0%
                      </td>
                    </tr>
                    <tr className="bg-zinc-50/50">
                      <td className="px-6 py-4 font-semibold text-zinc-900">Mensalidade</td>
                      <td className="px-6 py-4 text-center text-zinc-700">R$ 110-150</td>
                      <td className="px-6 py-4 text-center text-zinc-700">Variável</td>
                      <td className="px-6 py-4 text-center text-zinc-500">R$ 0</td>
                      <td className="bg-green-50/50 px-6 py-4 text-center font-bold text-green-700">
                        R$ 147
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-semibold text-zinc-900">
                        Custo real (R$ 20k/mês)
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-red-600">~R$ 3.150*</td>
                      <td className="px-6 py-4 text-center font-bold text-red-600">~R$ 5.000+</td>
                      <td className="px-6 py-4 text-center text-zinc-500">R$ 0</td>
                      <td className="bg-green-50/50 px-6 py-4 text-center font-bold text-green-700">
                        R$ 147
                      </td>
                    </tr>
                    <tr className="bg-zinc-50/50">
                      <td className="px-6 py-4 font-semibold text-zinc-900">
                        Clientes veem concorrentes?
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-red-600">
                          <X className="h-4 w-4" />
                          Sim
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-red-600">
                          <X className="h-4 w-4" />
                          Sim
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-zinc-500">Não</td>
                      <td className="bg-green-50/50 px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          Não
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-semibold text-zinc-900">IA assistente 24h</td>
                      <td className="px-6 py-4 text-center text-red-400">
                        <X className="mx-auto h-4 w-4" />
                      </td>
                      <td className="px-6 py-4 text-center text-red-400">
                        <X className="mx-auto h-4 w-4" />
                      </td>
                      <td className="px-6 py-4 text-center text-red-400">
                        <X className="mx-auto h-4 w-4" />
                      </td>
                      <td className="bg-green-50/50 px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          Inclusa no plano
                        </span>
                      </td>
                    </tr>
                    <tr className="bg-zinc-50/50">
                      <td className="px-6 py-4 font-semibold text-zinc-900">
                        Sua marca em destaque
                      </td>
                      <td className="px-6 py-4 text-center text-zinc-500">
                        Diluída no marketplace
                      </td>
                      <td className="px-6 py-4 text-center text-zinc-500">
                        Diluída no marketplace
                      </td>
                      <td className="px-6 py-4 text-center text-zinc-500">Sem presença digital</td>
                      <td className="bg-green-50/50 px-6 py-4 text-center font-bold text-green-700">
                        100% sua marca
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-semibold text-zinc-900">
                        Cardápio profissional
                      </td>
                      <td className="px-6 py-4 text-center text-zinc-500">Template genérico</td>
                      <td className="px-6 py-4 text-center text-zinc-500">Template genérico</td>
                      <td className="px-6 py-4 text-center text-red-400">
                        <X className="mx-auto h-4 w-4" />
                      </td>
                      <td className="bg-green-50/50 px-6 py-4 text-center font-bold text-green-700">
                        16 modelos de nicho
                      </td>
                    </tr>
                    <tr className="bg-zinc-50/50">
                      <td className="px-6 py-4 font-semibold text-zinc-900">Garantia</td>
                      <td className="px-6 py-4 text-center text-red-400">
                        <X className="mx-auto h-4 w-4" />
                      </td>
                      <td className="px-6 py-4 text-center text-red-400">
                        <X className="mx-auto h-4 w-4" />
                      </td>
                      <td className="px-6 py-4 text-center text-zinc-500">N/A</td>
                      <td className="bg-green-50/50 px-6 py-4 text-center font-bold text-green-700">
                        30 dias ou dinheiro de volta
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-semibold text-zinc-900">Precisa de motoboy?</td>
                      <td className="px-6 py-4 text-center text-zinc-500">
                        Opcional (27% no Plano Entrega)
                      </td>
                      <td className="px-6 py-4 text-center text-zinc-500">Incluso na taxa</td>
                      <td className="px-6 py-4 text-center text-zinc-500">Você fornece</td>
                      <td className="bg-green-50/50 px-6 py-4 text-center text-zinc-700">
                        Você já tem — economize
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mobile note — hidden columns */}
              <p className="mt-2 text-center text-[11px] text-zinc-400 md:hidden">
                Comparação resumida. Gire o celular para ver Rappi e WhatsApp.
              </p>

              {/* Source disclaimer */}
              <p className="mt-4 text-center text-xs text-zinc-400">
                *Plano Básico iFood (entrega própria): 12% + 3,2% online + R$110/mês. O Plano
                Entrega (motoboy do iFood) cobra até 27%, mas inclui logística que a Zairyx não
                oferece. Rappi: estimativas de mercado. Fonte: blog-parceiros.ifood.com.br
                (consultado Mar/2026).
              </p>

              {/* Value highlights */}
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-6 text-center">
                  <p className="text-sm font-bold text-green-800">Catálogo pronto</p>
                  <p className="mt-2 text-3xl font-bold text-green-700">16 nichos</p>
                  <p className="mt-1 text-sm text-green-600">com produtos reais — só editar</p>
                </div>
                <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-6 text-center">
                  <p className="text-sm font-bold text-green-800">Tempo de ativação</p>
                  <p className="mt-2 text-3xl font-bold text-green-700">30 min</p>
                  <p className="mt-1 text-sm text-green-600">e seu delivery está no ar</p>
                </div>
                <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-6 text-center">
                  <p className="text-sm font-bold text-green-800">IA assistente</p>
                  <p className="mt-2 text-3xl font-bold text-green-700">24h</p>
                  <p className="mt-1 text-sm text-green-600">
                    atendendo no seu cardápio — de brinde
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-orange-200 bg-orange-50 p-6 md:p-8">
                <p className="text-sm font-bold tracking-[0.18em] text-orange-700 uppercase">
                  Por que donos de delivery escolhem a Zairyx
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                  Produto pronto + editor simples + WhatsApp = vendas desde o primeiro dia.
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
                    <p className="text-sm font-semibold text-zinc-800">3. IA que vende por você</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      A Zai é uma IA que fica no seu cardápio digital. Ela responde dúvidas, sugere
                      combos e ajuda o cliente a fechar o pedido — 24 horas por dia, sem custo
                      extra.
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
                  ✦ Mensalidade fixa. Sem taxa por pedido. Sem surpresas.
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  Tudo incluído: 16 modelos de nicho, IA 24h, editor mobile, QR Code e suporte.
                </p>
                <div className="mx-auto mt-6 flex max-w-md flex-wrap justify-center gap-3 text-sm text-zinc-600">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-green-500" /> 16 modelos profissionais
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-green-500" /> Editor visual completo
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-green-500" /> IA assistente 24h
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-green-500" /> Pedidos por WhatsApp
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-green-500" /> Suporte humanizado
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-green-500" /> Garantia 30 dias
                  </span>
                </div>
                <div className="mt-8 rounded-xl bg-green-50 p-4">
                  <p className="text-sm font-bold text-green-700">
                    Sem taxa por pedido. Vendeu R$ 1.000 ou R$ 100.000 no mês?{' '}
                    <span className="text-green-800">Paga o mesmo. O lucro é todo seu.</span>
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
                      Catálogo completo, editor visual, IA assistente 24h, pedidos pelo WhatsApp e
                      16 modelos de nicho. Tudo pronto.{' '}
                      <strong className="text-white">
                        Se não gostar em 30 dias, devolvemos cada centavo.
                      </strong>
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-zinc-300">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-green-400" />
                        Garantia 30 dias ou dinheiro de volta
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        Sem taxa por pedido
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
                    <p className="mt-1 text-center text-xs text-zinc-400">
                      Risco zero. Garantia total de 30 dias.
                    </p>
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
