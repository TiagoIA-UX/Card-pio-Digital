import Link from 'next/link'
import { ArrowRight, Calculator, Check, Shield, Store, TrendingUp } from 'lucide-react'
import { TEMPLATE_PRESETS, type RestaurantTemplateSlug } from '@/lib/restaurant-customization'
import { TEMPLATE_PRICING } from '@/lib/pricing'

const TEMPLATE_ORDER: RestaurantTemplateSlug[] = [
  'lanchonete',
  'acai',
  'restaurante',
  'cafeteria',
  'bar',
  'pizzaria',
  'sushi',
  'adega',
  'mercadinho',
  'padaria',
  'sorveteria',
  'acougue',
  'hortifruti',
  'petshop',
  'doceria',
]

function getValuesByComplexity(tipo: 'selfService' | 'feitoPraVoce') {
  const pricing = Object.values(TEMPLATE_PRICING)

  const getValueForComplexity = (complexidade: 1 | 2 | 3) => {
    const match = pricing.find((item) => item.complexidade === complexidade)
    return match?.[tipo].pix ?? 0
  }

  return {
    simples: getValueForComplexity(1),
    medio: getValueForComplexity(2),
    complexo: getValueForComplexity(3),
  }
}

export default function PrecosPage() {
  const selfServiceValues = getValuesByComplexity('selfService')
  const feitoPraVoceValues = getValuesByComplexity('feitoPraVoce')

  return (
    <div className="from-background to-secondary/20 min-h-screen bg-linear-to-b">
      {/* Header */}
      <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Store className="text-primary h-6 w-6" />
            <span className="text-foreground text-xl font-bold">Cardápio Digital</span>
          </Link>
          <Link
            href="/templates"
            className="text-foreground/80 hover:text-foreground text-sm font-medium transition-colors"
          >
            Ver templates
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="bg-primary/10 text-primary mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
            <Calculator className="h-4 w-4" />
            Preços claros e diretos
          </div>
          <h1 className="text-foreground mb-4 text-4xl font-bold md:text-5xl">
            Preços por template
          </h1>
          <p className="text-foreground/80 mx-auto max-w-2xl text-lg">
            Veja quanto paga hoje e quanto mantém por mês em cada formato.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
            <Check className="h-4 w-4" />
            0% de comissão por pedido — o lucro é todo seu
          </div>
          <p className="text-foreground/60 mt-3 text-sm">
            A partir de <strong className="text-foreground">menos de R$&nbsp;2 por dia</strong> para
            manter seu delivery no ar — sem comissão sobre vendas.
          </p>
          <p className="text-foreground/50 mt-1 text-xs">
            Marketplaces cobram de 12% a 27% por pedido. Aqui você paga mensalidade fixa e
            fica com 100% do faturamento.
          </p>
        </div>

        {/* Tabela de preços */}
        <div className="border-border bg-card mb-16 overflow-hidden rounded-2xl border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-160">
              <thead>
                <tr className="border-border bg-muted/30 border-b">
                  <th className="text-foreground px-4 py-4 text-left text-sm font-semibold">
                    Template
                  </th>
                  <th className="text-foreground px-4 py-4 text-center text-sm font-semibold">
                    Complexidade
                  </th>
                  <th className="text-foreground px-4 py-4 text-center text-sm font-semibold">
                    Você configura
                  </th>
                  <th className="text-foreground px-4 py-4 text-center text-sm font-semibold">
                    Equipe configura
                  </th>
                  <th className="px-4 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {TEMPLATE_ORDER.map((slug) => {
                  const p = TEMPLATE_PRICING[slug]
                  const preset = TEMPLATE_PRESETS[slug]
                  const complexidadeLabel =
                    p.complexidade === 1 ? 'Simples' : p.complexidade === 2 ? 'Médio' : 'Complexo'
                  return (
                    <tr
                      key={slug}
                      className="border-border hover:bg-muted/20 border-b transition-colors last:border-0"
                    >
                      <td className="px-4 py-4">
                        <span className="text-foreground font-medium">{preset.label}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="bg-muted text-foreground/75 rounded-full px-2.5 py-0.5 text-xs font-medium">
                          {complexidadeLabel}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-sm">
                          <span className="text-foreground font-semibold">
                            R$ {p.selfService.pix}
                          </span>
                          <span className="text-foreground/70"> hoje</span>
                        </div>
                        <div className="text-foreground/70 text-xs">
                          depois R$ {p.selfService.monthly}/mês
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-sm">
                          <span className="text-primary font-semibold">
                            R$ {p.feitoPraVoce.pix}
                          </span>
                          <span className="text-foreground/70"> hoje</span>
                        </div>
                        <div className="text-foreground/70 text-xs">
                          depois R$ {p.feitoPraVoce.monthly}/mês
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/comprar/${slug}`}
                          className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
                        >
                          Comprar
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Análise */}
        <section className="border-border bg-card mb-16 rounded-2xl border p-6 md:p-8">
          <h2 className="text-foreground mb-4 flex items-center gap-2 text-xl font-bold">
            <TrendingUp className="text-primary h-5 w-5" />
            Por que os preços são diferentes?
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="border-border bg-muted/20 rounded-xl border p-4">
              <h3 className="text-foreground mb-2 font-semibold">Você configura</h3>
              <p className="text-foreground/80 text-sm">
                Implantação feita pelo cliente, com controle direto no painel.
              </p>
              <ul className="text-foreground/80 mt-3 space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                  Simples: R$ {selfServiceValues.simples} (lanchonete, açaí)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                  Médio: R$ {selfServiceValues.medio} (restaurante, cafeteria, bar)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                  Complexo: R$ {selfServiceValues.complexo} (pizzaria, sushi)
                </li>
              </ul>
            </div>
            <div className="border-border bg-primary/5 rounded-xl border p-4">
              <h3 className="text-foreground mb-2 font-semibold">Equipe configura</h3>
              <p className="text-foreground/80 text-sm">
                Implantação feita pela equipe da Zairyx para acelerar a entrada no ar.
              </p>
              <ul className="text-foreground/80 mt-3 space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4 shrink-0" />
                  Simples: R$ {feitoPraVoceValues.simples} (lanchonete, açaí)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4 shrink-0" />
                  Médio: R$ {feitoPraVoceValues.medio} (restaurante, cafeteria, bar)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4 shrink-0" />
                  Complexo: R$ {feitoPraVoceValues.complexo} (pizzaria, sushi)
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-foreground/80 flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Pagamento claro por template e contratação sem comissão sobre pedidos.
          </div>
          <Link
            href="/templates"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-6 py-4 font-semibold transition-colors"
          >
            Escolher template
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </main>
    </div>
  )
}
