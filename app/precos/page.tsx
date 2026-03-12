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
]

export default function PrecosPage() {
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
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
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
            Tabela de preços transparente
          </div>
          <h1 className="text-foreground mb-4 text-4xl font-bold md:text-5xl">
            Preços por template e plano
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Escolha o template do seu negócio e veja o valor exato. Faça Você Mesmo é mais barato
            porque você configura. Feito Pra Você inclui mão de obra para montar tudo por você.
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
                    Faça Você Mesmo
                  </th>
                  <th className="text-foreground px-4 py-4 text-center text-sm font-semibold">
                    Feito Pra Você
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
                        <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">
                          {complexidadeLabel}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-sm">
                          <span className="text-foreground font-semibold">
                            R$ {p.selfService.pix}
                          </span>
                          <span className="text-muted-foreground"> PIX</span>
                        </div>
                        <div className="text-muted-foreground text-xs">
                          ou 3x R$ {Math.round(p.selfService.card / 3)} no cartão
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-sm">
                          <span className="text-primary font-semibold">
                            R$ {p.feitoPraVoce.pix}
                          </span>
                          <span className="text-muted-foreground"> PIX</span>
                        </div>
                        <div className="text-muted-foreground text-xs">
                          ou 3x R$ {Math.round(p.feitoPraVoce.card / 3)} no cartão
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
              <h3 className="text-foreground mb-2 font-semibold">Faça Você Mesmo</h3>
              <p className="text-muted-foreground text-sm">
                Você recebe o template pronto e configura tudo no painel. Sem custo de mão de obra.
                O valor varia conforme a complexidade do template (simples, médio ou complexo).
              </p>
              <ul className="text-muted-foreground mt-3 space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                  Simples: R$ 197 (lanchonete, açaí)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                  Médio: R$ 247 (restaurante, cafeteria, bar)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                  Complexo: R$ 297 (pizzaria, sushi)
                </li>
              </ul>
            </div>
            <div className="border-border bg-primary/5 rounded-xl border p-4">
              <h3 className="text-foreground mb-2 font-semibold">Feito Pra Você</h3>
              <p className="text-muted-foreground text-sm">
                Inclui o custo de um freelancer para montar tudo por você (categorias, produtos,
                fotos). O valor é ~135–152% a mais do DIY para cobrir mão de obra e margem.
              </p>
              <ul className="text-muted-foreground mt-3 space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4 shrink-0" />
                  Simples: R$ 497
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4 shrink-0" />
                  Médio: R$ 597
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4 shrink-0" />
                  Complexo: R$ 697
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-muted-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Pagamento único por template no fluxo público atual.
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
