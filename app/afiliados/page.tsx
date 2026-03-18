'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle,
  ChevronDown,
  Crown,
  Globe,
  Link2,
  MessageCircle,
  Network,
  Palette,
  ShieldCheck,
  Smartphone,
  Star,
  Store,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'

// ── Constantes ─────────────────────────────────────────────────────────────────
const PLANO_PRO = 129
const PCT_VENDEDOR = 0.3
const PCT_LIDER = 0.1
const GANHO_POR_CLIENTE = Math.round(PLANO_PRO * PCT_VENDEDOR) // R$39
const REDE_BONUS_EX = Math.round(5 * 10 * PLANO_PRO * PCT_LIDER) // 5 vendedores × 10 rest × 10% = R$645

// ── Dados ──────────────────────────────────────────────────────────────────────
const EXEMPLOS = [
  { nome: 'João M.', cidade: 'São Paulo · SP', restaurantes: 83 },
  { nome: 'Mariana C.', cidade: 'Rio de Janeiro · RJ', restaurantes: 37 },
  { nome: 'Carlos A.', cidade: 'Curitiba · PR', restaurantes: 12 },
]

const PERSONAS = [
  { icon: Globe, label: 'Agências de marketing' },
  { icon: Palette, label: 'Designers e criativos' },
  { icon: Smartphone, label: 'Criadores de site' },
  { icon: Users, label: 'Freelancers' },
  { icon: TrendingUp, label: 'Vendedores' },
  { icon: MessageCircle, label: 'Influenciadores locais' },
  { icon: Store, label: 'Quem conhece restaurantes' },
  { icon: Network, label: 'Empreendedores locais' },
]

const FERRAMENTAS = [
  {
    icon: Link2,
    title: 'Link exclusivo',
    desc: 'Seu link de indicação personalizado, pronto para compartilhar em qualquer canal.',
  },
  {
    icon: BarChart3,
    title: 'Painel de estatísticas',
    desc: 'Indicações, comissões e status de cada restaurante em tempo real.',
  },
  {
    icon: TrendingUp,
    title: 'MRR da sua carteira',
    desc: 'Veja exatamente quanto sua carteira gera todo mês.',
  },
  {
    icon: Network,
    title: 'Gestão de rede',
    desc: 'Veja os vendedores recrutados e a produção de cada um (Líderes).',
  },
  {
    icon: Star,
    title: 'Ranking público',
    desc: 'Apareça no ranking e comprove sua performance para o mercado.',
  },
  {
    icon: BadgeCheck,
    title: 'Bônus por meta',
    desc: 'R$200 em 10 clientes · R$500 em 30 · R$1.000 em 50 restaurantes.',
  },
]

const FAQ = [
  {
    q: 'Quanto recebo por cada restaurante indicado?',
    a: `30% do valor da assinatura — todo mês. No plano Pro (R$${PLANO_PRO}/mês, o mais escolhido), isso é R$${GANHO_POR_CLIENTE} por restaurante ativo.`,
  },
  {
    q: 'Quando é feito o pagamento?',
    a: 'Comissões são liberadas após 30 dias da assinatura (período de garantia do cliente). O pagamento é mensal via PIX na chave que você cadastrar.',
  },
  {
    q: 'Preciso pagar algo para ser afiliado?',
    a: 'Não. O programa é 100% gratuito. Você se cadastra, recebe o link e começa a indicar no mesmo dia.',
  },
  {
    q: 'O que é o título Líder Zairyx?',
    a: 'Quando você recrutar 5 ou mais vendedores ativos para a sua rede, você vira Líder Zairyx e passa a ganhar +10% sobre todas as comissões geradas pela sua rede — além dos seus 30% diretos.',
  },
  {
    q: 'Por quanto tempo recebo a comissão?',
    a: 'Enquanto o restaurante mantiver a assinatura ativa. A comissão é recorrente — todo mês, todo ano, sem prazo de validade.',
  },
  {
    q: 'E se o restaurante cancelar?',
    a: 'A comissão para quando a assinatura é cancelada. Por isso o sistema é sustentável: você tem incentivo para indicar bons clientes que ficam ativos por muito tempo.',
  },
]

// ── Componentes internos ───────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-border/40 border-b last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-start justify-between gap-4 px-0 py-4 text-left"
      >
        <span className="text-foreground font-medium">{q}</span>
        <ChevronDown
          className={`text-foreground/40 mt-0.5 h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <p className="text-foreground/65 pb-4 text-sm leading-6">{a}</p>}
    </div>
  )
}

// ── Página ─────────────────────────────────────────────────────────────────────
export default function Afiliados() {
  const [clientes, setClientes] = useState(20)
  const ganhoMes = clientes * GANHO_POR_CLIENTE
  const ganhoAno = ganhoMes * 12

  return (
    <div className="from-background to-secondary/20 min-h-screen bg-linear-to-b">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <span className="text-primary-foreground text-sm font-bold">CD</span>
            </div>
            <span className="text-foreground text-xl font-bold">Cardápio Digital</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/afiliados/ranking"
              className="text-foreground/60 hover:text-foreground hidden text-sm transition-colors sm:block"
            >
              Ver ranking
            </Link>
            <Link
              href="/painel/afiliados"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Acessar painel
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ══════════════════════════════════════════════════════════ HERO */}
        <section className="px-4 pt-16 pb-20 text-center md:pt-24 md:pb-28">
          <div className="mx-auto max-w-4xl">
            <div className="bg-primary/10 text-primary mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              30% Todo Mês · Sem limite de ganhos
            </div>

            <h1 className="text-foreground mb-6 text-4xl leading-tight font-bold tracking-tight md:text-6xl">
              Ganhe dinheiro <span className="text-primary">todo mês</span> indicando restaurantes
            </h1>

            <p className="text-foreground/70 mx-auto mb-10 max-w-2xl text-xl leading-relaxed">
              Compartilhe seu link exclusivo. O restaurante assina o Cardápio Digital. Você recebe{' '}
              <strong className="text-foreground">30% de comissão recorrente</strong> enquanto ele
              for cliente — sem limite de ganhos.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/painel/afiliados"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-7 py-4 text-base font-semibold shadow-lg transition-colors"
              >
                Quero ser afiliado
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#calculadora"
                className="border-border text-foreground hover:bg-secondary inline-flex items-center gap-2 rounded-xl border px-7 py-4 text-base font-medium transition-colors"
              >
                Ver quanto posso ganhar
                <BarChart3 className="h-4 w-4" />
              </a>
            </div>

            {/* Stats */}
            <div className="mt-14 flex flex-wrap justify-center gap-10">
              {[
                { value: '0%', label: 'Para entrar' },
                { value: '30%', label: 'Comissão direta' },
                { value: '+10%', label: 'Bônus de rede' },
                { value: '30d', label: 'Garantia pagamento' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-primary text-3xl font-black">{s.value}</div>
                  <div className="text-foreground/50 mt-0.5 text-xs">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════ COMO FUNCIONA */}
        <section className="border-border bg-secondary/40 border-y px-4 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-foreground mb-2 text-center text-3xl font-bold">Como funciona</h2>
            <p className="text-foreground/55 mb-14 text-center text-sm">
              Três passos. Simples assim.
            </p>
            <div className="grid gap-10 md:grid-cols-3">
              {[
                {
                  n: '1',
                  icon: Link2,
                  title: 'Você indica',
                  desc: 'Cadastre-se gratuitamente, receba seu link exclusivo e compartilhe com donos de restaurante.',
                },
                {
                  n: '2',
                  icon: Store,
                  title: 'O restaurante assina',
                  desc: 'Ele cria o cardápio digital no Cardápio Digital Seven e escolhe um plano (Start R$79 · Pro R$129 · Elite R$199).',
                },
                {
                  n: '3',
                  icon: TrendingUp,
                  title: 'Você recebe todo mês',
                  desc: 'Enquanto a assinatura estiver ativa, 30% do valor cai na sua conta mensalmente — sem prazo de validade.',
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.n} className="text-center">
                    <div className="bg-primary mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl shadow-md">
                      <Icon className="text-primary-foreground h-7 w-7" />
                    </div>
                    <div className="text-primary/60 mb-1 text-xs font-semibold tracking-widest uppercase">
                      Passo {item.n}
                    </div>
                    <h3 className="text-foreground mb-2 text-lg font-bold">{item.title}</h3>
                    <p className="text-foreground/60 text-sm leading-6">{item.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════ CALCULADORA */}
        <section id="calculadora" className="px-4 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-foreground mb-2 text-center text-3xl font-bold">
              Calcule seus ganhos
            </h2>
            <p className="text-foreground/55 mb-10 text-center text-sm">
              Baseado no plano Pro (R${PLANO_PRO}/mês · mais escolhido) com comissão de 30% = R$
              {GANHO_POR_CLIENTE} por restaurante/mês.
            </p>

            <div className="border-border bg-card rounded-2xl border p-8 shadow-sm">
              <label htmlFor="slider-clientes" className="text-foreground mb-1 block font-semibold">
                Quantos restaurantes você pretende indicar?
              </label>
              <p className="text-foreground/45 mb-5 text-xs">
                Arraste o slider ou selecione uma quantidade
              </p>

              <input
                id="slider-clientes"
                type="range"
                min={1}
                max={200}
                value={clientes}
                onChange={(e) => setClientes(Number(e.target.value))}
                className="accent-primary h-2 w-full cursor-pointer"
                aria-label="Número de restaurantes indicados"
              />

              <div className="mt-7 grid gap-4 md:grid-cols-3">
                <div className="bg-primary rounded-xl p-5 text-center">
                  <div className="text-primary-foreground text-3xl font-black">
                    R${ganhoMes.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-primary-foreground/70 mt-1 text-xs">
                    {clientes} restaurante{clientes !== 1 ? 's' : ''} · por mês
                  </div>
                </div>
                <div className="bg-secondary rounded-xl p-5 text-center">
                  <div className="text-foreground text-3xl font-black">
                    R${ganhoAno.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-foreground/50 mt-1 text-xs">Ganho anual estimado</div>
                </div>
                <div className="border-border rounded-xl border p-5 text-center">
                  <div className="text-foreground text-3xl font-black">R${GANHO_POR_CLIENTE}</div>
                  <div className="text-foreground/50 mt-1 text-xs">Por restaurante/mês</div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {[5, 10, 25, 50, 100, 200].map((n) => (
                  <button
                    key={n}
                    onClick={() => setClientes(n)}
                    className={`rounded-full px-4 py-1.5 text-sm transition-all ${
                      clientes === n
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'border-border text-foreground/55 hover:text-foreground border'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════ EXEMPLOS */}
        <section className="border-border bg-secondary/40 border-y px-4 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-foreground mb-2 text-center text-3xl font-bold">
              Exemplos de ganhos reais
            </h2>
            <p className="text-foreground/55 mb-12 text-center text-sm">
              Plano Pro (R${PLANO_PRO}) × 30% = R${GANHO_POR_CLIENTE}/restaurante/mês
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {EXEMPLOS.map((ex) => {
                const ganhoEx = ex.restaurantes * GANHO_POR_CLIENTE
                return (
                  <div key={ex.nome} className="border-border bg-card rounded-2xl border p-6">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                        <span className="text-primary text-sm font-bold">{ex.nome[0]}</span>
                      </div>
                      <div>
                        <div className="text-foreground font-semibold">{ex.nome}</div>
                        <div className="text-foreground/45 text-xs">{ex.cidade}</div>
                      </div>
                    </div>
                    <div className="text-primary text-3xl font-black">
                      R${ganhoEx.toLocaleString('pt-BR')}
                      <span className="text-foreground/35 text-sm font-normal">/mês</span>
                    </div>
                    <div className="text-foreground/55 mt-1 text-sm">
                      {ex.restaurantes} restaurantes ativos
                    </div>
                    <div className="border-border mt-4 flex items-center gap-1.5 border-t pt-3 text-xs text-green-600">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Comissão recorrente · todo mês
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════ PROGRAMA LÍDERES */}
        <section className="px-4 py-20">
          <div className="mx-auto max-w-4xl">
            <div className="mb-3 flex justify-center">
              <span className="rounded-full bg-amber-100 px-4 py-1.5 text-sm font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                👑 Nível avançado — exclusivo
              </span>
            </div>
            <h2 className="text-foreground mb-2 text-center text-3xl font-bold">
              Torne-se Líder Zairyx
            </h2>
            <p className="text-foreground/55 mb-12 text-center text-sm">
              Recrute 5 vendedores e ganhe 10% de tudo que sua rede produzir — além dos seus 30%
              diretos.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Vendedor */}
              <div className="border-border bg-card rounded-2xl border p-6">
                <div className="bg-secondary mb-4 inline-flex rounded-xl p-3">
                  <Zap className="text-foreground/60 h-5 w-5" />
                </div>
                <h3 className="text-foreground mb-1 text-lg font-bold">Vendedor</h3>
                <p className="text-foreground/55 mb-5 text-sm leading-6">
                  Indique restaurantes diretamente. 30% de cada assinatura ativa cai na sua conta
                  todo mês.
                </p>
                <div className="bg-secondary rounded-xl py-4 text-center">
                  <div className="text-foreground text-3xl font-black">30%</div>
                  <div className="text-foreground/50 mt-0.5 text-xs">comissão direta todo mês</div>
                </div>
              </div>

              {/* Líder */}
              <div className="rounded-2xl border-2 border-amber-300/40 bg-amber-50/60 p-6 dark:bg-amber-950/10">
                <div className="mb-4 inline-flex rounded-xl bg-amber-100 p-3 dark:bg-amber-900/20">
                  <Crown className="h-5 w-5 text-amber-600" />
                </div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="text-foreground text-lg font-bold">Líder Zairyx</h3>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    5+ vendedores na rede
                  </span>
                </div>
                <p className="text-foreground/55 mb-5 text-sm leading-6">
                  Recrute outros vendedores. Ganhe 10% de tudo que a rede indicar — além dos seus
                  30% diretos.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary rounded-xl py-4 text-center">
                    <div className="text-foreground text-2xl font-black">30%</div>
                    <div className="text-foreground/50 mt-0.5 text-xs">direto</div>
                  </div>
                  <div className="rounded-xl bg-amber-100/80 py-4 text-center dark:bg-amber-900/30">
                    <div className="text-2xl font-black text-amber-700 dark:text-amber-400">
                      +10%
                    </div>
                    <div className="mt-0.5 text-xs text-amber-600 dark:text-amber-500">rede</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Math example */}
            <div className="border-border bg-secondary/50 mt-6 rounded-2xl border p-5 text-center">
              <p className="text-foreground/55 text-sm">
                Exemplo: 5 vendedores na sua rede, cada um com 10 restaurantes no plano Pro
              </p>
              <p className="text-foreground mt-2 text-xl font-bold">
                5 × 10 × R${PLANO_PRO} × 10% ={' '}
                <span className="text-primary">
                  R${REDE_BONUS_EX.toLocaleString('pt-BR')}/mês extra
                </span>
              </p>
              <p className="text-foreground/40 mt-1 text-xs">
                Além da sua comissão direta de 30% sobre os seus próprios clientes
              </p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════ QUEM PODE */}
        <section className="border-border bg-secondary/40 border-y px-4 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-foreground mb-2 text-center text-3xl font-bold">
              Quem pode ser afiliado?
            </h2>
            <p className="text-foreground/55 mb-10 text-center text-sm">
              Qualquer pessoa. Se você conhece donos de restaurantes, você já tem o que precisa.
            </p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {PERSONAS.map((p) => {
                const Icon = p.icon
                return (
                  <div
                    key={p.label}
                    className="border-border bg-card rounded-xl border p-4 text-center"
                  >
                    <div className="bg-primary/10 mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl">
                      <Icon className="text-primary h-5 w-5" />
                    </div>
                    <p className="text-foreground text-xs leading-5 font-medium">{p.label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════ FERRAMENTAS */}
        <section className="px-4 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-foreground mb-2 text-center text-3xl font-bold">
              Tudo que você precisa para vender
            </h2>
            <p className="text-foreground/55 mb-12 text-center text-sm">
              Painel profissional incluso no programa. Gratuito.
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {FERRAMENTAS.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="border-border bg-card rounded-xl border p-5">
                    <div className="bg-primary/10 mb-3 inline-flex rounded-xl p-2.5">
                      <Icon className="text-primary h-5 w-5" />
                    </div>
                    <h3 className="text-foreground mb-1 font-semibold">{item.title}</h3>
                    <p className="text-foreground/60 text-sm leading-5">{item.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════ SEGURANÇA */}
        <section className="border-border bg-secondary/40 border-y px-4 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
              <ShieldCheck className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-foreground mb-2 text-3xl font-bold">
              Pagamento seguro e transparente
            </h2>
            <p className="text-foreground/55 mb-8 text-sm">
              Sem surpresas. Você sabe exatamente o que vai receber e quando.
            </p>
            <div className="border-border bg-card rounded-2xl border p-6 text-left">
              <ul className="space-y-4">
                {[
                  'Comissões liberadas após 30 dias da assinatura — protege você de cancelamentos imediatos.',
                  'Status visível no painel em tempo real: Pendente → Aprovado → Pago.',
                  'Pagamento mensal via PIX na chave que você cadastrar no painel.',
                  'Cookie de rastreamento ativo por 30 dias — você é creditado mesmo se o restaurante demorar para assinar.',
                  'Bônus de metas pagos separadamente ao atingir 10, 30 ou 50 restaurantes ativos.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span className="text-foreground/70">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════ FAQ */}
        <section className="px-4 py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-foreground mb-10 text-center text-3xl font-bold">
              Dúvidas frequentes
            </h2>
            <div className="border-border bg-card rounded-2xl border px-6">
              {FAQ.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════ CTA FINAL */}
        <section className="px-4 pb-24">
          <div className="mx-auto max-w-3xl">
            <div className="bg-primary rounded-3xl p-10 text-center text-white shadow-2xl">
              <Crown className="mx-auto mb-4 h-10 w-10 text-white/70" />
              <h2 className="mb-3 text-3xl font-bold">Comece a ganhar hoje</h2>
              <p className="mb-8 text-lg text-white/80">
                Gratuito para entrar. Sem contrato. Seu link fica pronto em minutos.
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/painel/afiliados"
                  className="text-primary inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 text-base font-semibold shadow transition-colors hover:bg-white/90"
                >
                  Quero ser afiliado
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/afiliados/ranking"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-7 py-4 text-base font-medium text-white transition-colors hover:bg-white/10"
                >
                  Ver ranking de afiliados
                </Link>
              </div>
              <p className="mt-6 text-sm text-white/50">
                Já é afiliado?{' '}
                <Link href="/painel/afiliados" className="underline hover:text-white/80">
                  Acessar meu painel →
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
