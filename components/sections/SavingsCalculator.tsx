'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Calculator, TrendingDown, TrendingUp, Eye, MessageCircle } from 'lucide-react'

const WHATSAPP_NUMBER = '5512996887993'
const WHATSAPP_MSG = encodeURIComponent(
  'Olá! Vi o calculador de economia e quero saber mais sobre o canal digital.'
)
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`

const ZAIRYX_MONTHLY = 59
const PRESETS = [5000, 10000, 15000, 20000, 30000, 50000]

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export default function SavingsCalculator() {
  const [revenue, setRevenue] = useState(15000)
  const [commissionPct, setCommissionPct] = useState(15)

  const calc = useMemo(() => {
    const monthlyLoss = (revenue * commissionPct) / 100
    const annualLoss = monthlyLoss * 12
    const annualZairyx = ZAIRYX_MONTHLY * 12
    const annualSavings = annualLoss - annualZairyx
    return { monthlyLoss, annualLoss, annualZairyx, annualSavings }
  }, [revenue, commissionPct])

  return (
    <section
      data-testid="savings-calculator-section"
      className="relative overflow-hidden bg-zinc-950 py-20 md:py-28"
    >
      {/* Glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(249,115,22,0.08),transparent)]" />

      <div className="container-premium relative">
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-400">
            <Calculator className="h-4 w-4" />
            Calculadora de Economia
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            Quanto você está <span className="text-red-400">perdendo</span> por mês?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-300">
            Informe seu faturamento mensal e veja o impacto real das comissões no seu bolso.
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            {/* ── Inputs ── */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm md:p-8">
              {/* Revenue */}
              <div className="mb-8">
                <label className="mb-3 block text-sm font-medium text-zinc-300">
                  Faturamento mensal
                </label>
                <div className="mb-4 text-3xl font-bold text-white">{formatBRL(revenue)}</div>
                <input
                  type="range"
                  min={2000}
                  max={80000}
                  step={1000}
                  value={revenue}
                  onChange={(e) => setRevenue(Number(e.target.value))}
                  data-testid="revenue-slider"
                  className="calc-slider mb-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-700"
                />
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setRevenue(v)}
                      data-testid={`preset-${v}`}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        revenue === v
                          ? 'bg-orange-500 text-white'
                          : 'bg-white/10 text-zinc-400 hover:bg-white/15'
                      }`}
                    >
                      {formatBRL(v)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Commission % */}
              <div>
                <label className="mb-3 block text-sm font-medium text-zinc-300">
                  Comissão do app atual
                </label>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-red-400">{commissionPct}%</span>
                  <span className="text-sm text-zinc-400">por pedido</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={30}
                  step={1}
                  value={commissionPct}
                  onChange={(e) => setCommissionPct(Number(e.target.value))}
                  data-testid="commission-slider"
                  className="calc-slider-red mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-700"
                />
                <div className="mt-2 flex justify-between text-xs text-zinc-400">
                  <span>8%</span>
                  <span>30%</span>
                </div>
              </div>
            </div>

            {/* ── Results ── */}
            <div className="flex flex-col gap-4">
              {/* Loss card */}
              <div className="rounded-2xl border border-red-500/20 bg-red-950/30 p-6">
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-red-400">
                  <TrendingDown className="h-4 w-4" />
                  Você perde com o app de delivery
                </div>
                <div className="flex items-baseline gap-3">
                  <span
                    data-testid="monthly-loss"
                    className="text-3xl font-bold text-red-400 md:text-4xl"
                  >
                    {formatBRL(calc.monthlyLoss)}
                  </span>
                  <span className="text-sm text-zinc-400">/mês</span>
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                  Em 12 meses:{' '}
                  <span className="font-semibold text-red-400/80">
                    {formatBRL(calc.annualLoss)}
                  </span>
                </p>
              </div>

              {/* Savings card */}
              <div className="rounded-2xl border-2 border-green-500/30 bg-green-950/20 p-6">
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-green-400">
                  <TrendingUp className="h-4 w-4" />
                  Com Zairyx você economiza
                </div>
                <div className="flex items-baseline gap-3">
                  <span
                    data-testid="annual-savings"
                    className="text-3xl font-bold text-green-400 md:text-4xl"
                  >
                    {formatBRL(calc.annualSavings > 0 ? calc.annualSavings : 0)}
                  </span>
                  <span className="text-sm text-zinc-400">/ano</span>
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                  Assinatura fixa:{' '}
                  <span className="font-semibold text-zinc-300">
                    {formatBRL(ZAIRYX_MONTHLY)}/mês
                  </span>{' '}
                  ({formatBRL(calc.annualZairyx)}/ano)
                </p>
              </div>

              {/* Impact highlight */}
              {calc.annualSavings > 0 && (
                <div className="rounded-2xl border border-orange-500/20 bg-orange-950/20 p-5 text-center">
                  <p className="text-sm text-zinc-300">
                    Isso equivale a{' '}
                    <span className="font-bold text-orange-400">
                      {Math.round(calc.annualSavings / revenue)}{' '}
                      {Math.round(calc.annualSavings / revenue) === 1 ? 'mês' : 'meses'}
                    </span>{' '}
                    de faturamento inteiro que volta pro seu bolso.
                  </p>
                </div>
              )}

              {/* CTAs */}
              <div className="mt-auto flex flex-col gap-3 pt-2">
                <Link
                  href="/templates"
                  data-testid="calc-cta-primary"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-7 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-0.5 hover:bg-orange-600"
                >
                  <Eye className="h-5 w-5" />
                  Parar de perder dinheiro
                </Link>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="calc-cta-whatsapp"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-4 text-base font-semibold text-white transition-all hover:bg-white/5"
                >
                  <MessageCircle className="h-5 w-5 text-green-400" />
                  Quero uma demonstração
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
