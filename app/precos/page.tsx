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

function getSalesTerm(slug: RestaurantTemplateSlug) {
  return TEMPLATE_PRICING[slug].nomeCanal
}

function getValuesByProductTier(tipo: 'selfService' | 'feitoPraVoce') {
  const pricing = Object.values(TEMPLATE_PRICING)

  const getValueForComplexity = (complexidade: 1 | 2 | 3) => {
    const match = pricing.find((item) => item.complexidade === complexidade)
    return match?.[tipo].pix ?? 0
  }

  return {
    ate40: getValueForComplexity(1),
    ate80: getValueForComplexity(2),
    ate200: getValueForComplexity(3),
  }
}

export default function PrecosPage() {
  const selfServiceValues = getValuesByProductTier('selfService')
  const feitoPraVoceValues = getValuesByProductTier('feitoPraVoce')

  return (
    <div className="from-background to-secondary/20 min-h-screen bg-linear-to-b">
      {/* Header */}
      <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Store className="text-primary h-6 w-6" />
            <span className="text-foreground text-xl font-bold">Zairyx</span>
          </Link>
          <Link
            href="/templates"
            className="text-foreground hover:text-foreground text-sm font-medium transition-colors"
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
            Precos claros para cada segmento
          </div>
          <h1 className="text-foreground mb-4 text-4xl font-bold md:text-5xl">
            Precos por volume de produtos
          </h1>
          <p className="text-foreground/90 mx-auto max-w-2xl text-lg">
            O valor depende da quantidade de produtos que seu negocio costuma ter. Quanto mais itens
            no catalogo, maior o trabalho de implantacao.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
            <Check className="h-4 w-4" />
            Zero taxa por pedido ou venda direta no seu canal
          </div>
          <p className="text-foreground/80 mt-3 text-sm">
            A partir de <strong className="text-foreground">menos de R$&nbsp;2 por dia</strong> para
            manter seu canal digital no ar, com total controle da operacao.
          </p>
          <p className="text-foreground/75 mt-1 text-xs">
            Marketplaces e intermediarios comem margem em cada venda. Aqui o checkout mostra a
            implantacao inicial e a referencia do plano mensal correspondente, enquanto o cliente
            compra direto de voce.
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
                    Volume de produtos
                  </th>
                  <th className="text-foreground px-4 py-4 text-center text-sm font-semibold">
                    Voce configura
                  </th>
                  <th className="text-foreground px-4 py-4 text-center text-sm font-semibold">
                    Voce envia, a gente monta
                  </th>
                  <th className="px-4 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {TEMPLATE_ORDER.map((slug) => {
                  const p = TEMPLATE_PRICING[slug]
                  const preset = TEMPLATE_PRESETS[slug]
                  return (
                    <tr
                      key={slug}
                      className="border-border hover:bg-muted/20 border-b transition-colors last:border-0"
                    >
                      <td className="px-4 py-4">
                        <div>
                          <span className="text-foreground font-medium">{preset.label}</span>
                          <p className="text-foreground/80 mt-1 text-xs">
                            {p.nomeCanal} · {p.mediaProdutos} itens
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="bg-muted text-foreground/90 rounded-full px-2.5 py-0.5 text-xs font-medium">
                          {p.faixaLabel}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-sm">
                          <span className="text-foreground font-semibold">
                            R$ {p.selfService.pix}
                          </span>
                          <span className="text-foreground/85"> hoje</span>
                        </div>
                        <div className="text-foreground/85 text-xs">
                          depois R$ {p.selfService.monthly}/mês
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-sm">
                          <span className="text-primary font-semibold">
                            R$ {p.feitoPraVoce.pix}
                          </span>
                          <span className="text-foreground/85"> hoje</span>
                        </div>
                        <div className="text-foreground/85 text-xs">
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
            Por que os precos variam?
          </h2>
          <p className="text-foreground/90 mb-6 text-sm">
            O valor da implantacao depende da{' '}
            <strong>quantidade de produtos que voce vai listar no catalogo digital</strong> — e nao
            do estoque fisico da loja. No delivery, o dono seleciona os itens mais vendidos e com
            melhor margem. Mais itens no catalogo = mais trabalho para cadastrar, organizar e
            configurar.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="border-border bg-muted/20 rounded-xl border p-4">
              <h3 className="text-foreground mb-2 font-semibold">Voce configura</h3>
              <p className="text-foreground/90 text-sm">
                Voce mesmo cadastra os produtos no painel. Controle total desde o primeiro dia.
              </p>
              <ul className="text-foreground/90 mt-3 space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                  Ate 40 produtos: R$ {selfServiceValues.ate40} (ex: lanchonete, acaiteria, doceria)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                  Ate 80 produtos: R$ {selfServiceValues.ate80} (ex: restaurante, padaria, bar)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                  120+ produtos: a partir de R$ {selfServiceValues.ate200} (ex: pizzaria, sushi,
                  hortifruti, petshop)
                </li>
              </ul>
            </div>
            <div className="border-border bg-primary/5 rounded-xl border p-4">
              <h3 className="text-foreground mb-2 font-semibold">Voce envia, a gente monta</h3>
              <p className="text-foreground/90 text-sm">
                <strong>Voce envia as fotos e dados dos produtos por WhatsApp ou e-mail.</strong>{' '}
                Nossa equipe organiza tudo no seu canal e deixa pronto para publicar.
              </p>
              <ul className="text-foreground/90 mt-3 space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4 shrink-0" />
                  Ate 40 produtos: R$ {feitoPraVoceValues.ate40} (implantacao + organizacao)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4 shrink-0" />
                  Ate 80 produtos: R$ {feitoPraVoceValues.ate80} (mais categorias e variações)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4 shrink-0" />
                  120+ produtos: a partir de R$ {feitoPraVoceValues.ate200} (catalogos extensos)
                </li>
              </ul>
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                <strong>Como funciona:</strong> assim como o iFood, Rappi e todas as grandes
                plataformas, quem fornece as fotos dos produtos e voce, dono do estabelecimento.
                Voce envia pelo WhatsApp ou e-mail e nossa equipe cuida do resto.
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-foreground/90 flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Pagamento claro por template: implantacao inicial, plano mensal correspondente e canal
            proprio para vender direto.
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
