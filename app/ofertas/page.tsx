import Link from 'next/link'
import { ArrowRight, Check, Shield, Sparkles, Store } from 'lucide-react'

const plans = [
  {
    id: 'basico',
    nome: 'Plano Básico',
    descricao: 'Para lançar um cardápio profissional com operação enxuta.',
    preco: 'R$ 49/mês',
    destaque: false,
    beneficios: [
      '1 restaurante ativo',
      'Template pronto para nicho específico',
      'Link público e QR Code',
      'Editor do cardápio no painel',
      'Pedidos via WhatsApp',
    ],
  },
  {
    id: 'pro',
    nome: 'Plano Pro',
    descricao: 'Para quem quer instalação inicial mais forte e mais capacidade.',
    preco: 'R$ 99/mês',
    destaque: true,
    beneficios: [
      'Tudo do Básico',
      'Mais capacidade operacional',
      'Melhor suporte de ativação',
      'Estrutura pronta para vender mais rápido',
      'Melhor custo-benefício para lançamento',
    ],
  },
  {
    id: 'premium',
    nome: 'Plano Premium',
    descricao: 'Para operação madura, equipe e expansão.',
    preco: 'R$ 199/mês',
    destaque: false,
    beneficios: [
      'Tudo do Pro',
      'Recursos administrativos ampliados',
      'Acompanhamento prioritário',
      'Base mais robusta para crescimento',
      'Maior previsibilidade comercial',
    ],
  },
]

export default function OfertasPage() {
  return (
    <div className="from-background to-secondary/20 min-h-screen bg-linear-to-b">
      {/* Header */}
      <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Store className="text-primary h-6 w-6" />
            <span className="text-foreground text-xl font-bold">Cardápio Digital</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="bg-primary/10 text-primary mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Modelo comercial SaaS recorrente
          </div>
          <h1 className="text-foreground mb-4 text-4xl font-bold md:text-5xl">
            Escolha o plano e depois o template
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Pacotes vitalícios e checkout legado foram removidos. A aquisição agora segue apenas
            onboarding pago com assinatura SaaS recorrente.
          </p>
        </div>

        {/* Cards de Ofertas */}
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-6 transition-all ${
                  plan.destaque
                    ? 'border-primary bg-primary/5 scale-105 shadow-xl'
                    : 'border-border hover:border-primary/40 hover:bg-primary/5'
                }`}
              >
                {plan.destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold">
                      MAIS INDICADO
                    </span>
                  </div>
                )}

                <div className="bg-primary/10 mb-4 inline-flex rounded-xl p-3">
                  <Store className="text-primary h-6 w-6" />
                </div>

                <h3 className="text-foreground mb-1 text-xl font-bold">{plan.nome}</h3>
                <p className="text-muted-foreground mb-4 text-sm">{plan.descricao}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-foreground text-3xl font-bold">{plan.preco}</span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    cobrança recorrente, sem pacote vitalício
                  </p>
                </div>

                <ul className="mb-6 space-y-3">
                  {plan.beneficios.map((beneficio, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                      <span className="text-muted-foreground">{beneficio}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/templates"
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition-all ${
                    plan.destaque
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
                >
                  Escolher template
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )
          })}
        </div>

        {/* Garantia */}
        <div className="mt-12 text-center">
          <div className="bg-card border-border inline-flex items-center gap-3 rounded-full border px-6 py-3">
            <Shield className="h-5 w-5 text-green-500" />
            <span className="text-muted-foreground text-sm">
              <strong className="text-foreground">Garantia de 7 dias</strong> — Não gostou?
              Devolvemos seu dinheiro
            </span>
          </div>
        </div>

        {/* FAQ rápido */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-foreground mb-8 text-center text-2xl font-bold">
            Perguntas frequentes
          </h2>

          <div className="space-y-4">
            <div className="bg-card border-border rounded-xl border p-5">
              <h3 className="text-foreground mb-2 font-semibold">
                Onde meu cardápio fica hospedado?
              </h3>
              <p className="text-muted-foreground text-sm">
                Seu cardápio fica hospedado em nossa infraestrutura profissional. Você recebe um
                link personalizado (ex: cardapio.digital/seu-restaurante) para compartilhar com seus
                clientes. Sem necessidade de configurar servidores ou pagar hospedagem separada.
              </p>
            </div>

            <div className="bg-card border-border rounded-xl border p-5">
              <h3 className="text-foreground mb-2 font-semibold">
                Como acesso o painel para editar?
              </h3>
              <p className="text-muted-foreground text-sm">
                Após a compra, você acessa o painel com o mesmo login usado na compra (Google ou
                email). Lá você edita produtos, preços, fotos e configurações do seu cardápio.
              </p>
            </div>

            <div className="bg-card border-border rounded-xl border p-5">
              <h3 className="text-foreground mb-2 font-semibold">Ainda existem pacotes antigos?</h3>
              <p className="text-muted-foreground text-sm">
                Não. O produto agora opera com assinatura recorrente, onboarding pago e
                provisionamento automático por restaurante.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
