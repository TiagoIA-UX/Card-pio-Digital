import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  AlertTriangle,
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
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'
import { HomeHeader } from '@/components/home-header'
import { Footer } from '@/components/footer'
import { RESTAURANT_TEMPLATES } from '@/lib/templates-config'
import FaqSection from '@/components/sections/FaqSection'
import SavingsCalculator from '@/components/sections/SavingsCalculator'
import { ScrollReveal } from '@/components/scroll-reveal'
import { TrackedLink, TrackedAnchor } from '@/components/tracked-link'
import { HeroBadge, HeroHeading } from '@/components/hero-ab'

const WHATSAPP_NUMBER = '5512996887993'
const WHATSAPP_MESSAGE = encodeURIComponent(
  'Quero montar meu cardápio digital AGORA. Me ajuda a começar!'
)
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`

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
                {/* Urgency badge */}
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300 backdrop-blur-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <HeroBadge />
                </div>

                <h1 className="text-4xl leading-[1.08] font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                  <HeroHeading />
                </h1>

                <p className="mt-5 max-w-lg text-lg leading-relaxed text-zinc-200">
                  Seu cardápio digital pronto em 30 minutos.{' '}
                  <strong className="text-white">Zero comissão por pedido, pra sempre.</strong>{' '}
                  Pedidos direto no WhatsApp. IA que atende 24h. O iFood traz gente nova — o SEU
                  cardápio fideliza.
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
                    Quero parar de perder dinheiro
                  </TrackedLink>
                  <TrackedAnchor
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    trackCta="hero_whatsapp"
                    trackPage="landing"
                    data-testid="hero-cta-whatsapp"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-4 text-base font-semibold text-white transition-all hover:bg-white/5"
                  >
                    <MessageCircle className="h-5 w-5 text-green-400" />
                    Montar meu cardápio agora
                  </TrackedAnchor>
                </div>

                {/* Micro proof — trust builders */}
                <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-green-400" />
                    Garantia 30 dias ou dinheiro de volta
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-orange-400" />
                    No ar em 30 minutos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BadgePercent className="h-4 w-4 text-green-400" />
                    0% de comissão — sempre
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
              <ProofStat value="0%" label="de comissão — pra sempre" highlight />
              <ProofStat value="15" label="nichos com modelo pronto" />
              <ProofStat value="30 min" label="e seu cardápio está no ar" />
              <ProofStat value="100%" label="do dinheiro vai pro seu caixa" highlight />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            DOR → SOLUÇÃO — Comparação agressiva: antes x depois
        ═══════════════════════════════════════════════════════════════ */}
        <ScrollReveal>
          <section data-testid="pain-solution-section" className="py-20 md:py-28">
            <div className="container-premium">
              <div className="mb-14 max-w-2xl">
                <p className="text-sm font-bold tracking-[0.2em] text-red-600 uppercase">
                  A conta que ninguém faz pra você
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                  Seu cliente já te conhece.{' '}
                  <span className="text-red-500">O iFood cobra como se tivesse apresentado.</span>
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-zinc-700">
                  Daqueles 200 pedidos/mês, quantos são de{' '}
                  <strong>gente que já é seu cliente?</strong> Se for metade, você paga ~15% de
                  comissão em 100 pedidos que <em>viriam de qualquer jeito</em>. Com ticket médio de
                  R$ 50, são{' '}
                  <strong className="text-red-600">
                    R$ 750/mês que o iFood fatura nas suas costas.
                  </strong>{' '}
                  Mande esses clientes pro SEU cardápio e esse dinheiro fica no seu caixa.
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  *Plano Básico iFood: 12% comissão + 3,2% pgto online + R$110/mês (entrega
                  própria). O Plano Entrega (motoboy do iFood) cobra até 27%, mas inclui logística
                  que a Zairyx não oferece. Fonte: blog-parceiros.ifood.com.br
                </p>
              </div>

              {/* Comparison Cards */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* OLD WAY */}
                <div className="rounded-3xl border-2 border-red-200 bg-red-50/50 p-8">
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700">
                    <X className="h-4 w-4" />
                    Depender só do iFood — O ralo silencioso
                  </div>
                  <ul className="space-y-4">
                    {[
                      'Cobra ~15% até em cliente que já é SEU',
                      'Seu cliente fiel vê concorrentes ao lado do seu nome',
                      'Sem canal próprio = referto do iFood. Saiu, perdeu tudo',
                      'Cobram pra aparecer melhor na busca',
                      'Você não tem a lista de contatos dos seus clientes',
                      'Quanto mais vende, mais paga de comissão',
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-sm font-medium text-red-700 line-through decoration-red-300"
                      >
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 rounded-xl bg-red-100/80 p-4 text-center">
                    <p className="text-sm font-bold text-red-700">
                      100 pedidos de cliente fiel/mês × R$50 × 15% = R$ 750 perdidos
                    </p>
                    <p className="mt-1 text-xs text-red-600">
                      Só nos pedidos que viriam de qualquer jeito
                    </p>
                  </div>
                </div>

                {/* NEW WAY */}
                <div className="rounded-3xl border-2 border-green-300 bg-green-50/50 p-8 shadow-lg shadow-green-100/50">
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    Seu canal próprio Zairyx — Lucro 100% seu
                  </div>
                  <ul className="space-y-4">
                    {[
                      '0% de comissão — venda R$ 1.000 ou R$ 100.000',
                      'Sua marca, seus clientes, sua lista de contatos',
                      'IA assistente 24h — atende e vende até de madrugada',
                      'Editor visual — troque preço em 5 segundos pelo celular',
                      'Use junto com iFood: novo pelo app, fiel pelo SEU cardápio',
                      'Quanto mais migra pro canal próprio, mais LUCRA',
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-base font-semibold text-zinc-800"
                      >
                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 rounded-xl bg-green-100/80 p-4 text-center">
                    <p className="text-sm font-bold text-green-700">
                      Mesmo faturamento = R$ 97/mês fixo
                    </p>
                    <p className="mt-1 text-xs text-green-600">
                      Economia de R$ 36.636/ano direto no caixa
                    </p>
                  </div>
                </div>
              </div>

              {/* Urgency strip */}
              <div className="mt-10 rounded-2xl border border-orange-200 bg-orange-50 p-6 text-center">
                <p className="text-lg font-bold text-zinc-900">
                  <Flame className="mr-2 inline h-5 w-5 text-orange-500" />
                  iFood pra pescar gente nova. Seu cardápio pra fidelizar. Dinheiro no SEU bolso.
                </p>
                <p className="mt-2 text-sm text-zinc-600">
                  Comece em 30 minutos. IA que vende 24h + editor visual + 0% comissão. Garantia de
                  30 dias.
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
          <section data-testid="benefits-section" className="py-20 md:py-28">
            <div className="container-premium">
              <div className="mb-14 max-w-2xl">
                <p className="text-sm font-bold tracking-[0.2em] text-orange-600 uppercase">
                  Tudo que seu delivery precisa pra crescer
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                  Ferramentas que botam{' '}
                  <span className="text-orange-500">dinheiro no seu caixa</span>
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <BenefitCard
                  icon={<Shield className="h-5 w-5" />}
                  title="Zero comissão — PRA SEMPRE"
                  text="R$ 97/mês fixo. Vendeu R$ 1.000 ou R$ 100.000? Paga o mesmo. A diferença vai pro SEU bolso, não pro app."
                  accent
                />
                <BenefitCard
                  icon={<Sparkles className="h-5 w-5" />}
                  title="IA que atende seus clientes 24h"
                  text="Assistente inteligente dentro do cardápio. Responde dúvidas, sugere produtos e ajuda seu cliente a fechar o pedido — mesmo de madrugada."
                  accent
                />
                <BenefitCard
                  icon={<MessageCircle className="h-5 w-5" />}
                  title="Pedidos direto no WhatsApp"
                  text="Cliente monta o pedido no cardápio e envia organizado no seu WhatsApp. Sem precisar de app de terceiro roubando sua margem."
                />
                <BenefitCard
                  icon={<Smartphone className="h-5 w-5" />}
                  title="Painel que até seu avô usa"
                  text="Mude preço, foto e categoria em 5 segundos pelo celular. Se você manda áudio no WhatsApp, você usa nosso painel."
                />
                <BenefitCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  title="Alta temporada = lucro, não caos"
                  text="Volume dobrou? Seu terminal organiza tudo. Sem perder pedido, sem confusão. Quanto mais vende, mais lucra."
                />
                <BenefitCard
                  icon={<Zap className="h-5 w-5" />}
                  title="QR Code + Link + Instagram"
                  text="Imprima na mesa, compartilhe no status, coloque na bio. Seus clientes acessam em 1 toque — sem baixar nada."
                />
              </div>
            </div>
          </section>
        </ScrollReveal>

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
                    15 nichos prontos — escolha o seu
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
                  Ver todos os 15 modelos
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
                  Estratégia inteligente pra quem já tem entrega
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                  iFood pra pescar.{' '}
                  <span className="text-orange-500">Seu cardápio pra fidelizar.</span>
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-700">
                  Não precisa sair do iFood. Use ele como vitrine pra{' '}
                  <strong>atrair gente nova</strong>. Mas quando o cliente já te conhece, manda pro
                  seu cardápio digital. Assim você para de pagar 15% em quem{' '}
                  <strong>já ia pedir de qualquer jeito</strong>.
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-green-200 bg-white p-5">
                    <p className="text-2xl font-bold text-green-600">✓</p>
                    <p className="mt-2 text-sm font-bold text-zinc-900">Tem motoboy próprio</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Já faz entrega — não precisa pagar 15% por isso
                    </p>
                  </div>
                  <div className="rounded-xl border border-green-200 bg-white p-5">
                    <p className="text-2xl font-bold text-green-600">✓</p>
                    <p className="mt-2 text-sm font-bold text-zinc-900">Tem clientes fiéis</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Gente que já pede sempre — mande pro SEU canal
                    </p>
                  </div>
                  <div className="rounded-xl border border-green-200 bg-white p-5">
                    <p className="text-2xl font-bold text-green-600">✓</p>
                    <p className="mt-2 text-sm font-bold text-zinc-900">Quer canal próprio + IA</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Cardápio com sua marca, IA assistente, link e QR Code
                    </p>
                  </div>
                </div>
                <p className="mt-6 text-xs text-zinc-400">
                  Se você depende do motoboy do iFood para entregas, o Plano Entrega (27%) pode
                  fazer sentido — mas custa muito mais. A Zairyx é ideal pra quem já resolveu a
                  logística e quer parar de pagar comissão nos clientes que já são seus.
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
                <p className="text-sm font-bold tracking-[0.2em] text-red-600 uppercase">
                  Compare e decida com números reais
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                  iFood, Rappi ou <span className="text-orange-500">os dois + canal próprio?</span>
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-zinc-700">
                  Use o iFood como vitrine. Mas veja quanto do seu dinheiro fica lá — e quanto
                  voltaria pro seu bolso com canal próprio.
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
                        R$ 97
                      </td>
                    </tr>
                    <tr className="bg-zinc-50/50">
                      <td className="px-6 py-4 font-semibold text-zinc-900">Mensalidade</td>
                      <td className="px-6 py-4 text-center text-zinc-700">R$ 110-150</td>
                      <td className="px-6 py-4 text-center text-zinc-700">Variável</td>
                      <td className="px-6 py-4 text-center text-zinc-500">R$ 0</td>
                      <td className="bg-green-50/50 px-6 py-4 text-center font-bold text-green-700">
                        R$ 97
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
                        R$ 97
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
                        <CheckCircle className="mx-auto h-4 w-4 text-green-600" />
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
                        15 modelos de nicho
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
                oferece. Rappi: estimativas de mercado. Fonte: blog-parceiros.ifood.com.br —
                Jun/2025.
              </p>

              {/* Savings highlight */}
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-6 text-center">
                  <p className="text-sm font-bold text-green-800">Faturamento R$ 10k/mês</p>
                  <p className="mt-2 text-3xl font-bold text-green-700">R$ 1.533</p>
                  <p className="mt-1 text-sm text-green-600">de economia mensal vs. iFood Básico</p>
                </div>
                <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-6 text-center">
                  <p className="text-sm font-bold text-green-800">Faturamento R$ 20k/mês</p>
                  <p className="mt-2 text-3xl font-bold text-green-700">R$ 3.053</p>
                  <p className="mt-1 text-sm text-green-600">de economia mensal vs. iFood Básico</p>
                </div>
                <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-6 text-center">
                  <p className="text-sm font-bold text-green-800">Faturamento R$ 30k/mês</p>
                  <p className="mt-2 text-3xl font-bold text-green-700">R$ 4.573</p>
                  <p className="mt-1 text-sm text-green-600">de economia mensal vs. iFood Básico</p>
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
                  Quero meu cardápio por R$ 97/mês
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
                  <span className="text-5xl font-bold text-zinc-900 md:text-6xl">R$ 97</span>
                  <span className="text-lg font-medium text-zinc-500">/mês</span>
                </div>
                <p className="mt-3 text-lg font-semibold text-zinc-700">
                  0% de comissão. Pra sempre. Ponto final.
                </p>
                <div className="mx-auto mt-6 flex max-w-md flex-wrap justify-center gap-3 text-sm text-zinc-600">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-green-500" /> 15 modelos profissionais
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
                <div className="mt-8 rounded-xl bg-red-50 p-4">
                  <p className="text-sm font-bold text-red-700">
                    No iFood, cada cliente fiel que pede gera ~15% de comissão pra eles.{' '}
                    <span className="text-green-700">
                      Na Zairyx, esse pedido gera R$ 0 de comissão. Você paga só R$ 97/mês fixo.
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-red-400">
                    *12% comissão + 3,2% pgto online + R$110 mensalidade (entrega própria). Fonte:
                    blog-parceiros.ifood.com.br
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
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300">
                      <AlertTriangle className="h-4 w-4" />
                      Cada pedido de cliente fiel no iFood = comissão desnecessária
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                      iFood traz gente nova.{' '}
                      <span className="text-orange-400">Seu cardápio fideliza e lucra 100%.</span>
                    </h2>
                    <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-200">
                      Cardápio digital com IA assistente 24h, editor visual, 15 modelos de nicho,
                      pedidos pelo WhatsApp e zero comissão. Monte em 30 minutos.{' '}
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
                        Suporte por WhatsApp
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
                      Quero parar de perder dinheiro
                    </TrackedLink>
                    <TrackedAnchor
                      href={WHATSAPP_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      trackCta="final_whatsapp"
                      trackPage="landing"
                      data-testid="final-cta-whatsapp"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/5"
                    >
                      <MessageCircle className="h-5 w-5 text-green-400" />
                      Montar meu cardápio agora
                    </TrackedAnchor>
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
