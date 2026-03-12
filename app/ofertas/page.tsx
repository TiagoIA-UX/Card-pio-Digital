import Link from 'next/link'
import { ArrowRight, Check, Shield, Sparkles, Store, Wrench } from 'lucide-react'

const plans = [
  {
    id: 'self-service',
    nome: 'Faça Você Mesmo',
    descricao: 'Comece rápido e edite tudo no painel.',
    destaque: false,
    icon: Wrench,
    precoPix: 197,
    precoCartao: 237,
    parcelas: 3,
    beneficios: [
      'Template profissional pronto para uso',
      'Editor visual simples',
      'Cadastro de produtos, fotos e categorias',
      'Atualização de preços e promoções sem desenvolvedor',
      'Pedidos enviados para WhatsApp',
      'Suporte via WhatsApp',
      'Hospedagem inclusa',
    ],
    href: '/comprar/restaurante?plano=self-service',
    ctaTexto: 'Quero começar com autonomia',
  },
  {
    id: 'feito-pra-voce',
    nome: 'Feito Pra Você',
    descricao: 'A equipe implanta para você entrar no ar mais rápido.',
    destaque: true,
    icon: Sparkles,
    precoPix: 497,
    precoCartao: 597,
    parcelas: 3,
    beneficios: [
      'Tudo do plano Faça Você Mesmo',
      'Implantação assistida',
      'Estruturação inicial do cardápio',
      'Organização de produtos, fotos e preços',
      'Configuração do canal de pedidos',
      'Suporte prioritário',
    ],
    href: '/comprar/restaurante?plano=feito-pra-voce',
    ctaTexto: 'Quero que a equipe implante',
  },
]

export default function OfertasPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">Cardápio Digital</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/precos"
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              Ver preços
            </Link>
            <Link
              href="/templates"
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              Ver templates
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Planos para vender com autonomia
          </div>
          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            Escolha como quer começar
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-foreground/80">
            Escolha o template do seu negócio e decida se quer editar tudo no painel ou contar com
            implantação assistida.
          </p>
        </div>

        {/* Cards de Ofertas */}
        <div className="grid gap-6 md:grid-cols-2 lg:max-w-4xl lg:mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-6 transition-all ${
                  plan.destaque
                    ? 'border-primary bg-primary/5 shadow-xl'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                {plan.destaque && (
                  <div className="absolute -top-3 left-4">
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                      ⭐ MAIS POPULAR
                    </span>
                  </div>
                )}

                <div
                  className={`mb-4 inline-flex rounded-xl p-3 ${
                    plan.destaque ? 'bg-primary/10' : 'bg-blue-500/10'
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 ${plan.destaque ? 'text-primary' : 'text-blue-500'}`}
                  />
                </div>

                <h3 className="mb-1 text-xl font-bold text-foreground">{plan.nome}</h3>
                <p className="mb-4 text-sm text-foreground/75">{plan.descricao}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-2xl font-bold ${plan.destaque ? 'text-primary' : 'text-foreground'}`}
                    >
                      a partir de R$ {plan.precoPix}
                    </span>
                    <span className="text-sm text-foreground/70">à vista no PIX</span>
                  </div>
                  <p className="mt-0.5 text-sm text-foreground/70">
                    ou {plan.parcelas}x de R$ {Math.round(plan.precoCartao / plan.parcelas)} no cartão
                  </p>
                  <Link
                    href="/precos"
                    className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
                  >
                    Ver tabela completa de preços →
                  </Link>
                </div>

                <ul className="mb-6 space-y-3">
                  {plan.beneficios.map((beneficio, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          plan.destaque ? 'text-primary' : 'text-blue-500'
                        }`}
                      />
                      <span className="text-foreground/80">{beneficio}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition-all ${
                    plan.destaque
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border border-border bg-background text-foreground hover:bg-secondary'
                  }`}
                >
                  {plan.ctaTexto}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )
          })}
        </div>

        {/* Garantia */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-6 py-3">
            <Shield className="h-5 w-5 text-green-500" />
            <span className="text-sm text-foreground/80">
              <strong className="text-foreground">Garantia de 30 dias</strong> — valide a
              plataforma na rotina do seu negócio. Se não fizer sentido para sua operação,
              realizamos o reembolso integral sem burocracia.
            </span>
          </div>
        </div>

        {/* FAQ rápido */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            Perguntas frequentes
          </h2>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-2 font-semibold text-foreground">
                Qual o prazo de entrega do plano Feito Pra Você?
              </h3>
              <p className="text-sm text-foreground/80">
                Após o envio completo das informações no formulário de onboarding, nossa equipe
                monta e publica seu cardápio digital em até 48 horas úteis (dias úteis, excluindo
                feriados).
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-2 font-semibold text-foreground">
                Onde meu cardápio fica hospedado?
              </h3>
              <p className="text-sm text-foreground/80">
                Seu cardápio fica hospedado em nossa infraestrutura. Você recebe um link
                personalizado (ex: seu-site.com/r/seu-negocio) para compartilhar com seus clientes.
                Sem necessidade de configurar servidores ou pagar hospedagem separada.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-2 font-semibold text-foreground">
                Como acesso o painel para editar?
              </h3>
              <p className="text-sm text-foreground/80">
                Após a compra, você acessa o painel com o mesmo login usado na compra (Google ou
                email). Lá você edita produtos, preços, fotos e configurações do seu cardápio.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-2 font-semibold text-foreground">
                Como funciona o preço?
              </h3>
              <p className="text-sm text-foreground/80">
                O valor varia conforme o template escolhido e o formato de contratação. Você pode
                operar com autonomia pelo painel ou contratar a implantação assistida da equipe.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-2 font-semibold text-foreground">
                Posso escolher o template do meu tipo de negócio?
              </h3>
              <p className="text-sm text-foreground/80">
                Sim. Temos templates para restaurante, pizzaria, hamburgueria, lanchonete, bar,
                cafeteria, açaíteria e sushi. Escolha o template e depois selecione o plano (Faça
                Você Mesmo ou Feito Pra Você) na compra.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
