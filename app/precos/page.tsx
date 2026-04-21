import Link from 'next/link'
import { ArrowRight, Check, Shield, Store, Zap } from 'lucide-react'
import { PUBLIC_SUBSCRIPTION_PRICES, PLAN_LIMITS } from '@/lib/domains/marketing/pricing'
import { getPublicPlanDisplay } from '@/lib/domains/marketing/plan-display'

const PLANS = [
  {
    slug: 'semente' as const,
    highlight: false,
  },
  {
    slug: 'basico' as const,
    highlight: true,
  },
  {
    slug: 'pro' as const,
    highlight: false,
  },
  {
    slug: 'premium' as const,
    highlight: false,
  },
]

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

export default function PrecosPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Store className="h-6 w-6 text-orange-600" />
            <span className="text-xl font-bold text-zinc-950">Zairyx</span>
          </Link>
          <Link
            href="/templates"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950"
          >
            Ver templates
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16">
        {/* Hero */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-950 md:text-5xl">
            Planos simples, sem taxa por pedido
          </h1>
          <p className="mx-auto max-w-xl text-lg text-zinc-600">
            Você paga pela capacidade do seu catálogo e escolhe o template ideal para a sua fase de
            crescimento.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
            <Check className="h-4 w-4" />
            0% de comissão por pedido*** — venda direto no seu canal
          </div>
        </div>

        {/* Banner Bônus Exclusivo */}
        <div className="mb-10 rounded-2xl border border-orange-300 bg-orange-50 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold tracking-[0.15em] text-orange-600 uppercase">
                Bônus Exclusivo Incluído
              </p>
              <h2 className="mt-2 text-xl font-bold text-zinc-950">
                E-book: Google Meu Negócio
              </h2>
              <p className="mt-1 text-sm text-zinc-600">92 páginas de conteúdo prático</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-700">
                <span>Economize R$ 350-800</span>
                <span>·</span>
                <span>Aumento médio de 46%, 76%, 28% em visibilidade</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-green-700">
                100% GRÁTIS para quem adquirir qualquer plano
              </p>
            </div>
            <div className="flex-shrink-0 rounded-xl border border-orange-200 bg-white px-6 py-4 text-center">
              <p className="text-xs text-zinc-500 line-through">De:</p>
              <p className={`text-2xl font-bold text-orange-600`}>VALOR: R$ 197</p>
              <p className="text-sm font-bold text-green-600">Incluso no plano</p>
            </div>
          </div>
        </div>

        {/* Tabela comparativa de planos */}
        <div className="mb-10 overflow-x-auto">
          <table className="w-full border-collapse text-sm text-zinc-700">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="py-3 pr-4 text-left font-semibold text-zinc-950">Plano</th>
                <th className="px-4 py-3 text-center font-semibold text-zinc-950">Produtos</th>
                <th className="px-4 py-3 text-center font-semibold text-zinc-950">Mensalidade</th>
                <th className="px-4 py-3 text-center font-semibold text-zinc-950">Bônus</th>
              </tr>
            </thead>
            <tbody>
              {PLANS.map((plan) => {
                const display = getPublicPlanDisplay(plan.slug)
                const prices = PUBLIC_SUBSCRIPTION_PRICES[plan.slug]
                const limits = PLAN_LIMITS[plan.slug]
                return (
                  <tr key={plan.slug} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="py-3 pr-4 font-medium text-zinc-950">{display.name}</td>
                    <td className="px-4 py-3 text-center">{limits.maxProducts}</td>
                    <td className="px-4 py-3 text-center">R$ {formatBRL(prices.monthly)}/mês</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-green-700">
                        <Check className="h-3.5 w-3.5" />
                        E-book incluso
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Cards */}
        <div className="mb-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const display = getPublicPlanDisplay(plan.slug)
            const prices = PUBLIC_SUBSCRIPTION_PRICES[plan.slug]
            const limits = PLAN_LIMITS[plan.slug]

            return (
              <div
                key={plan.slug}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  plan.highlight
                    ? 'border-orange-300 bg-orange-50 shadow-md'
                    : 'border-zinc-200 bg-white'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white uppercase">
                    {display.badge}
                  </span>
                )}

                <h3 className="text-lg font-bold text-zinc-950">{display.name}</h3>
                <p className="mt-1 text-sm font-medium text-zinc-600">{display.phase}</p>
                <p className="mt-3 min-h-12 text-sm text-zinc-500">{display.microcopy}</p>

                <div className="mt-6">
                  <span className="text-3xl font-bold text-zinc-950">
                    R$ {formatBRL(prices.monthly)}**
                  </span>
                  <span className="text-sm text-zinc-500">/mês</span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">ou R$ {formatBRL(prices.annual)}**/ano</p>
                <p className="mt-2 text-xs text-zinc-500">Implantação inicial à parte*</p>

                <div className="mt-6 flex-1">
                  <div className="rounded-xl bg-zinc-100 p-3 text-center">
                    <p className="text-2xl font-bold text-zinc-950">{limits.maxProducts}</p>
                    <p className="text-xs text-zinc-600">produtos no catálogo</p>
                  </div>
                </div>

                <Link
                  href="/templates"
                  className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    plan.highlight
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-zinc-950 text-white hover:bg-zinc-800'
                  }`}
                >
                  {display.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )
          })}
        </div>

        <section className="mb-16 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-600">
          <div className="space-y-3">
            <p>
              * A implantação inicial é contratada no checkout e varia conforme o template e a
              modalidade escolhida.
            </p>
            <p>
              ** A mensalidade mantém o canal digital ativo, hospedado e editável. Cancele quando
              quiser, sem multa.
            </p>
            <p>
              *** Taxas de gateway e meios de pagamento podem ser cobradas pelo provedor escolhido,
              não pela Zairyx.
            </p>
          </div>
        </section>

        {/* Como funciona */}
        <section className="mb-16 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 md:p-8">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-zinc-950">
            <Zap className="h-5 w-5 text-orange-600" />
            Como funciona
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-orange-600">1</p>
              <h3 className="mt-1 font-semibold text-zinc-950">Escolha o template</h3>
              <p className="mt-1 text-sm text-zinc-600">
                O template define o visual e o nicho do seu cardápio (pizzaria, açaí, sushi, etc.).
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-orange-600">2</p>
              <h3 className="mt-1 font-semibold text-zinc-950">O plano define a capacidade</h3>
              <p className="mt-1 text-sm text-zinc-600">
                Quantos produtos você pode cadastrar no catálogo e qual estrutura faz mais sentido
                para a fase atual do seu delivery.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-orange-600">3</p>
              <h3 className="mt-1 font-semibold text-zinc-950">Implantação no checkout</h3>
              <p className="mt-1 text-sm text-zinc-600">
                Configure sozinho ou peça para a equipe montar tudo. Você decide na hora da compra.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2 text-zinc-600">
            <Shield className="h-5 w-5 text-green-500" />
            Sem surpresa no checkout. Mensalidade clara, implantação separada e canal próprio.
          </div>
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-8 py-4 font-semibold text-white transition-colors hover:bg-orange-700"
          >
            Ver templates disponíveis
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </main>
    </div>
  )
}
