'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BadgePercent,
  Building2,
  Calculator,
  CheckCircle,
  ChevronRight,
  DollarSign,
  Flame,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react'

// ── Constantes ────────────────────────────────────────────────────────────────
const IFOOD_COMMISSION = 0.15        // 15% plano básico
const IFOOD_MONTHLY_FEE = 110        // R$ 110/mês entrega própria
const ZAIRYX_PRICE = 147             // R$/mês
const IFOOD_PAYMENT_FEE = 0.032      // 3.2% pgto online

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

// ── Planos SaaS (para o empreendedor olhando o negócio da Zairyx) ─────────────
const SAAS_SCENARIOS = [
  { clients: 10,  mrr: 10 * ZAIRYX_PRICE,  label: 'Início'    },
  { clients: 25,  mrr: 25 * ZAIRYX_PRICE,  label: 'Crescendo' },
  { clients: 50,  mrr: 50 * ZAIRYX_PRICE,  label: 'Tração'    },
  { clients: 100, mrr: 100 * ZAIRYX_PRICE, label: 'Escala'    },
  { clients: 250, mrr: 250 * ZAIRYX_PRICE, label: 'Regional'  },
  { clients: 500, mrr: 500 * ZAIRYX_PRICE, label: 'Nacional'  },
]

// ── Componente principal ──────────────────────────────────────────────────────
export default function QuantoPossoLucrarPage() {
  // Calculadora do dono de delivery
  const [monthlyRevenue, setMonthlyRevenue] = useState(8000)
  const [ifoodShare, setIfoodShare] = useState(60)    // % do faturamento que vem do iFood

  const calc = useMemo(() => {
    const ifoodRevenue   = monthlyRevenue * (ifoodShare / 100)
    const ownRevenue     = monthlyRevenue - ifoodRevenue

    // Custo atual do iFood
    const commissionLoss = ifoodRevenue * IFOOD_COMMISSION
    const paymentLoss    = ifoodRevenue * IFOOD_PAYMENT_FEE
    const monthlyFee     = IFOOD_MONTHLY_FEE
    const totalIfoodCost = commissionLoss + paymentLoss + monthlyFee

    // Com Zairyx: migrar 30% dos fiéis para canal próprio (conservador)
    const migratableRevenue = ifoodRevenue * 0.30
    const savedOnMigrated   = migratableRevenue * (IFOOD_COMMISSION + IFOOD_PAYMENT_FEE)
    const netSaving         = savedOnMigrated - ZAIRYX_PRICE

    // ROI em meses
    const roiMonths = ZAIRYX_PRICE / (savedOnMigrated > 0 ? savedOnMigrated : 1)

    // Anual
    const annualSaving = netSaving * 12

    return {
      totalIfoodCost,
      commissionLoss,
      paymentLoss,
      monthlyFee,
      savedOnMigrated,
      netSaving,
      roiMonths,
      annualSaving,
      migratableRevenue,
    }
  }, [monthlyRevenue, ifoodShare])

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pb-16 pt-20 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(249,115,22,0.2),transparent)]" />
        <div className="container-premium relative text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-300">
            <Calculator className="h-4 w-4" />
            Calculadora de Lucro Real
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
            Quanto você está{' '}
            <span className="text-red-400">perdendo</span>{' '}
            no iFood agora?
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-300">
            Coloque seu faturamento e veja em tempo real o dinheiro que fica no iFood — e quanto
            você recupera com a Zairyx em 30 dias.
          </p>
        </div>
      </section>

      {/* ── Calculadora delivery ── */}
      <section className="px-4 pb-20">
        <div className="container-premium">
          <div className="grid gap-8 lg:grid-cols-2">

            {/* Inputs */}
            <div className="rounded-3xl border border-zinc-700/50 bg-zinc-900 p-8 space-y-8">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <DollarSign className="h-5 w-5 text-orange-400" />
                  Seu delivery hoje
                </h2>
                <p className="mt-1 text-sm text-zinc-400">Ajuste os valores do seu negócio</p>
              </div>

              {/* Faturamento mensal */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-zinc-300">
                  Faturamento mensal total
                  <span className="ml-2 text-xl font-bold text-white">{fmt(monthlyRevenue)}</span>
                </label>
                <input
                  type="range"
                  min={1000}
                  max={100000}
                  step={500}
                  value={monthlyRevenue}
                  onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>R$ 1.000</span>
                  <span>R$ 100.000</span>
                </div>
              </div>

              {/* % iFood */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-zinc-300">
                  % do faturamento que vem pelo iFood
                  <span className="ml-2 text-xl font-bold text-white">{ifoodShare}%</span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={ifoodShare}
                  onChange={(e) => setIfoodShare(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>10% (complementar)</span>
                  <span>100% (só iFood)</span>
                </div>
              </div>

              {/* Explicação */}
              <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  <strong className="text-zinc-300">Cálculo conservador:</strong> estimamos que
                  apenas 30% dos clientes iFood (os fiéis) migram para o seu canal próprio. O resto
                  continua pelo iFood. A economia já paga a Zairyx várias vezes.
                </p>
              </div>
            </div>

            {/* Resultados */}
            <div className="space-y-4">
              {/* Custo atual iFood */}
              <div className="rounded-3xl border border-red-500/30 bg-red-500/5 p-6">
                <p className="text-sm font-bold uppercase tracking-wide text-red-400">
                  O que você paga ao iFood hoje
                </p>
                <p className="mt-3 text-4xl font-bold text-red-400">{fmt(calc.totalIfoodCost)}<span className="text-xl">/mês</span></p>
                <div className="mt-4 space-y-2 text-sm text-zinc-400">
                  <div className="flex justify-between">
                    <span>Comissão (15%)</span>
                    <span className="text-red-400 font-semibold">{fmt(calc.commissionLoss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa pagamento online (3,2%)</span>
                    <span className="text-red-400 font-semibold">{fmt(calc.paymentLoss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mensalidade iFood (entrega própria)</span>
                    <span className="text-red-400 font-semibold">{fmt(calc.monthlyFee)}</span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-zinc-500">
                  *Plano Básico iFood · fonte: blog-parceiros.ifood.com.br (Mar/2026)
                </p>
              </div>

              {/* Com Zairyx */}
              <div className="rounded-3xl border border-green-500/30 bg-green-500/5 p-6">
                <p className="text-sm font-bold uppercase tracking-wide text-green-400">
                  Com a Zairyx (migração de 30% dos fiéis)
                </p>
                <p className="mt-3 text-4xl font-bold text-green-400">{fmt(Math.max(calc.netSaving, 0))}<span className="text-xl">/mês economizado</span></p>
                <div className="mt-4 space-y-2 text-sm text-zinc-400">
                  <div className="flex justify-between">
                    <span>Receita migrada para canal próprio</span>
                    <span className="text-green-400 font-semibold">{fmt(calc.migratableRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Economia em comissões (canal próprio)</span>
                    <span className="text-green-400 font-semibold">{fmt(calc.savedOnMigrated)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zairyx mensalidade</span>
                    <span className="text-zinc-400 font-semibold">- {fmt(ZAIRYX_PRICE)}</span>
                  </div>
                </div>
              </div>

              {/* ROI */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5 text-center">
                  <p className="text-3xl font-bold text-orange-400">{fmt(calc.annualSaving)}</p>
                  <p className="mt-1 text-xs text-zinc-400">economia em 12 meses</p>
                </div>
                <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5 text-center">
                  <p className="text-3xl font-bold text-purple-400">
                    {calc.roiMonths < 1 ? '&lt;1' : Math.ceil(calc.roiMonths)} dias
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">para recuperar o investimento</p>
                </div>
              </div>

              {/* CTA */}
              <Link
                href="/templates"
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-orange-500 px-8 py-5 text-lg font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:bg-orange-600"
              >
                <Flame className="h-5 w-5" />
                Quero recuperar esse dinheiro agora
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Seção: Expansão de rede ── */}
      <section className="border-t border-zinc-800 bg-zinc-900 py-20 px-4">
        <div className="container-premium">
          <div className="text-center mb-14">
            <p className="text-sm font-bold tracking-[0.2em] text-orange-500 uppercase">
              A máquina de expansão
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Canal próprio hoje → caixa para filial amanhã
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              Cada centavo que você para de dar ao iFood vira capital de giro. Com R$3.000+ por mês
              de volta no caixa, a expansão para a segunda unidade acontece muito antes.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: BadgePercent,
                title: '0% de comissão para sempre',
                text: 'Venda R$10.000 ou R$500.000 por mês. A mensalidade é sempre R$147. O resto é seu.',
                color: 'text-green-400',
                bg: 'bg-green-500/10',
                border: 'border-green-600/30',
              },
              {
                icon: Building2,
                title: 'Cardápio para cada filial',
                text: 'Cada unidade tem seu próprio painel, cardápio e link. Gerencie tudo de um lugar ou dê autonomia para o gerente local.',
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
                border: 'border-blue-600/30',
              },
              {
                icon: TrendingUp,
                title: 'Escale sem aumentar custo',
                text: 'Abriu a 3ª unidade? O custo do cardápio digital é apenas mais R$147/mês. Estrutura escalável desde a primeira unidade.',
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
                border: 'border-purple-600/30',
              },
            ].map(({ icon: Icon, title, text, color, bg, border }) => (
              <div key={title} className={`rounded-2xl border ${border} ${bg} p-6`}>
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <h3 className="text-base font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{text}</p>
              </div>
            ))}
          </div>

          {/* Simulação de expansão */}
          <div className="mt-12 rounded-3xl border border-zinc-700 bg-zinc-800/50 p-8">
            <h3 className="mb-6 text-center text-xl font-bold text-white">
              Simulação de expansão — 1ª para 5ª unidade
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-400 text-left">
                    <th className="pb-4 pr-6">Unidades</th>
                    <th className="pb-4 pr-6">Fat. mensal total</th>
                    <th className="pb-4 pr-6">Custo c/ iFood*</th>
                    <th className="pb-4 pr-6">Custo Zairyx</th>
                    <th className="pb-4">Diferença / mês</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {[1, 2, 3, 5].map((units) => {
                    const rev = units * 20000
                    const ifoodCost = rev * 0.6 * (IFOOD_COMMISSION + IFOOD_PAYMENT_FEE) + (units * IFOOD_MONTHLY_FEE)
                    const zairyxCost = units * ZAIRYX_PRICE
                    const diff = ifoodCost - zairyxCost
                    return (
                      <tr key={units} className="border-t border-zinc-700">
                        <td className="py-3 pr-6 font-semibold text-white">{units} unidade{units > 1 ? 's' : ''}</td>
                        <td className="py-3 pr-6 text-zinc-300">{fmt(rev)}</td>
                        <td className="py-3 pr-6 text-red-400">{fmt(ifoodCost)}</td>
                        <td className="py-3 pr-6 text-green-400">{fmt(zairyxCost)}</td>
                        <td className="py-3 font-bold text-emerald-400">+{fmt(diff)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              *Simulado: 60% do faturamento via iFood, plano entrega própria (15% + 3,2% + R$110/unidade/mês).
              Valores reais variam. Faturamento estimado: R$20.000/unidade/mês.
            </p>
          </div>
        </div>
      </section>

      {/* ── Seção SaaS MRR (para Tiago ver o negócio dele) ── */}
      <section className="border-t border-zinc-800 py-20 px-4">
        <div className="container-premium">
          <div className="text-center mb-14">
            <p className="text-sm font-bold tracking-[0.2em] text-purple-400 uppercase">
              O negócio por trás da plataforma
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl text-white">
              Cada novo delivery = receita recorrente mensal
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              MRR simples e previsível. Sem custos variáveis por volume de pedidos dos clientes.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SAAS_SCENARIOS.map(({ clients, mrr, label }) => (
              <div
                key={clients}
                className={`rounded-2xl border p-6 ${
                  clients === 100
                    ? 'border-orange-500/50 bg-orange-500/10 ring-1 ring-orange-500/30'
                    : 'border-zinc-700/50 bg-zinc-900'
                }`}
              >
                {clients === 100 && (
                  <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-bold text-orange-300">
                    <Sparkles className="h-3 w-3" /> Meta 12 meses
                  </div>
                )}
                <p className="text-sm font-semibold text-zinc-400">{label}</p>
                <p className="mt-1 text-3xl font-bold text-white">
                  {clients} <span className="text-base text-zinc-500">deliverys</span>
                </p>
                <p className="mt-3 text-2xl font-bold text-green-400">{fmt(mrr)}<span className="text-sm text-zinc-400">/mês MRR</span></p>
                <p className="mt-1 text-sm text-zinc-500">{fmt(mrr * 12)}/ano</p>
                {clients >= 100 && (
                  <div className="mt-3 pt-3 border-t border-zinc-700">
                    <p className="text-xs text-zinc-400">
                      + afiliados + filiais + resellers = receita adicional
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Plus afiliados */}
          <div className="mt-10 rounded-3xl border border-purple-600/30 bg-purple-500/5 p-8">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <h3 className="text-xl font-bold text-white">
                  <Zap className="mr-2 inline h-5 w-5 text-purple-400" />
                  Multiplique com afiliados + revendedores
                </h3>
                <p className="mt-3 text-zinc-400">
                  Cada afiliado traz 5–20 novos deliverys por mês. Com 10 afiliados ativos, o MRR
                  cresce sem você fazer nada. Revendedores locais conhecem cada praça e fecham deals
                  que você nunca alcançaria sozinho.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-2xl font-bold text-purple-400">10</p>
                    <p className="text-xs text-zinc-500">afiliados ativos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-400">×5</p>
                    <p className="text-xs text-zinc-500">deliverys/afiliado</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">{fmt(50 * ZAIRYX_PRICE)}</p>
                    <p className="text-xs text-zinc-500">MRR extra/mês</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-3">
                <Link
                  href="/afiliados"
                  className="flex items-center justify-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 px-5 py-3 text-sm font-bold text-purple-300 hover:bg-purple-500/20"
                >
                  Programa de afiliados
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/revendedores"
                  className="flex items-center justify-center gap-2 rounded-xl border border-zinc-600 bg-zinc-800 px-5 py-3 text-sm font-bold text-zinc-300 hover:bg-zinc-700"
                >
                  Seja um revendedor
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="border-t border-zinc-800 bg-zinc-900 py-16 px-4 text-center">
        <div className="container-premium max-w-2xl">
          <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-green-400" />
          <h2 className="text-3xl font-bold text-white">
            Pare de calcular. Comece a lucrar.
          </h2>
          <p className="mt-4 text-zinc-400">
            R$147/mês. Cardápio no ar em 30 minutos. 30 dias com garantia completa.
            Nenhum risco.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600"
            >
              <Flame className="h-5 w-5" />
              Escolher meu template agora
            </Link>
            <Link
              href="/precos"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-600 px-8 py-4 text-base font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white"
            >
              Ver planos e preços
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-400" /> Garantia 30 dias</span>
            <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-400" /> Sem comissão por pedido</span>
            <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-400" /> Suporte real</span>
          </div>
        </div>
      </section>
    </main>
  )
}
