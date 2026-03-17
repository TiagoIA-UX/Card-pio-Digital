'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Shield, Sparkles, Store, Zap } from 'lucide-react'
import { COMPANY_NAME, PAYMENT_DESCRIPTOR_NOTE, PRODUCT_ENDORSEMENT } from '@/lib/brand'
import { getTemplateCatalog } from '@/lib/templates-config'
import { getTemplatePricing } from '@/lib/pricing'

export default function OfertasPage() {
  const [ciclo, setCiclo] = useState<'mensal' | 'anual'>('mensal')
  const plans = useMemo(() => {
    const templates = getTemplateCatalog()
    const selfServiceMonthly = templates.map((template) => template.priceMonthly ?? template.price)
    const selfServiceAnnual = templates.map((template) => template.priceAnnual ?? (template.priceMonthly ?? template.price) * 10)
    const fpvcMonthly = templates.map((template) => getTemplatePricing(template.slug as Parameters<typeof getTemplatePricing>[0]).feitoPraVoce.monthly)
    const fpvcAnnual = templates.map((template) => getTemplatePricing(template.slug as Parameters<typeof getTemplatePricing>[0]).feitoPraVoce.annual)

    return [
      {
        id: 'self-service',
        nome: 'Faça Você Mesmo',
        descricao: 'Para editar o cardápio sozinho, com autonomia total no painel.',
        icon: Zap,
        mensalMin: Math.min(...selfServiceMonthly),
        mensalMax: Math.max(...selfServiceMonthly),
        anualMin: Math.min(...selfServiceAnnual),
        anualMax: Math.max(...selfServiceAnnual),
        destaque: false,
        cta: 'Ver templates e escolher',
        href: '/templates',
        beneficios: [
          '1 restaurante ativo',
          'Editor visual do cardápio',
          'QR Code e link público',
          'Pedidos via WhatsApp',
          'Hospedagem incluída',
          'Atualização sem desenvolvedor',
        ],
      },
      {
        id: 'feito-pra-voce',
        nome: 'Feito Pra Você',
        descricao: 'Para quem quer entrar no ar mais rápido com implantação feita pela nossa equipe.',
        icon: Sparkles,
        mensalMin: Math.min(...fpvcMonthly),
        mensalMax: Math.max(...fpvcMonthly),
        anualMin: Math.min(...fpvcAnnual),
        anualMax: Math.max(...fpvcAnnual),
        destaque: true,
        cta: 'Escolher template com implantação',
        href: '/templates',
        beneficios: [
          'Tudo do Faça Você Mesmo',
          'Montagem pela nossa equipe',
          'Configuração com suas fotos e preços',
          'Acompanhamento na ativação',
          'Suporte prioritário',
          'Entrada no ar mais rápida',
        ],
      },
    ]
  }, [])

  return (
    <div className="from-background to-secondary/20 min-h-screen bg-linear-to-b">
      {/* Header */}
      <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Store className="text-primary h-6 w-6" />
            <span className="text-foreground text-xl font-bold">Cardápio Digital</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/templates"
              className="text-foreground/80 hover:text-foreground text-sm font-medium transition-colors"
            >
              Ver templates
            </Link>
            <Link
              href="/login"
              className="text-foreground/80 hover:text-foreground text-sm font-medium transition-colors"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="bg-primary/10 text-primary mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Planos recorrentes · 0% de comissão por pedido
          </div>
          <h1 className="text-foreground mb-4 text-4xl font-bold md:text-5xl">Escolha seu plano</h1>
          <p className="text-foreground/80 mx-auto max-w-2xl text-lg">
            Os valores variam conforme o template escolhido. Primeiro você escolhe o modelo, depois define se quer fazer sozinho ou receber a implantação pronta.
          </p>
          <div className="border-border bg-card/80 mx-auto mt-6 max-w-3xl rounded-2xl border px-5 py-4 text-left shadow-sm">
            <p className="text-foreground text-sm font-semibold">Transparência na cobrança</p>
            <p className="text-foreground/75 mt-1 text-sm leading-6">
              {PRODUCT_ENDORSEMENT} {PAYMENT_DESCRIPTOR_NOTE}
            </p>
            <p className="text-foreground/65 mt-2 text-xs leading-5">
              Empresa responsável pela operação comercial: {COMPANY_NAME}.
            </p>
          </div>
        </div>

        {/* Toggle mensal / anual */}
        <div className="mb-10 flex items-center justify-center gap-3">
          <button
            onClick={() => setCiclo('mensal')}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
              ciclo === 'mensal'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setCiclo('anual')}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all ${
              ciclo === 'anual'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            Anual
            <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-600">
              2 meses grátis
            </span>
          </button>
        </div>

        {/* Cards de Planos */}
        <div className="grid gap-6 md:grid-cols-2 lg:mx-auto lg:max-w-4xl">
          {plans.map((plan) => {
            const Icon = plan.icon
            const precoMin = ciclo === 'anual' ? plan.anualMin : plan.mensalMin
            const precoMax = ciclo === 'anual' ? plan.anualMax : plan.mensalMax
            return (
              <div
                id={plan.id}
                key={plan.id}
                className={`relative rounded-2xl border-2 p-6 transition-all ${
                  plan.destaque
                    ? 'border-primary bg-primary/5 shadow-xl'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                {plan.destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap">
                      ⭐ Mais escolhido
                    </span>
                  </div>
                )}

                <div
                  className={`mb-4 inline-flex rounded-xl p-3 ${
                    plan.destaque ? 'bg-primary/10' : 'bg-secondary'
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 ${plan.destaque ? 'text-primary' : 'text-foreground/70'}`}
                  />
                </div>

                <h3 className="text-foreground mb-1 text-xl font-bold">{plan.nome}</h3>
                <p className="text-foreground/65 mb-4 text-sm">{plan.descricao}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-bold ${plan.destaque ? 'text-primary' : 'text-foreground'}`}
                    >
                      R$ {precoMin}
                    </span>
                    <span className="text-foreground/50 text-sm">{ciclo === 'anual' ? '/ano' : '/mês'}</span>
                  </div>
                  {precoMin !== precoMax && (
                    <p className="text-foreground/60 mt-1 text-xs">
                      Faixa por template: até R$ {precoMax}{ciclo === 'anual' ? '/ano' : '/mês'}
                    </p>
                  )}
                  {ciclo === 'anual' && (
                    <p className="text-foreground/50 mt-0.5 text-xs">
                      Economia equivalente a 2 meses em relação ao mensal.
                    </p>
                  )}
                  {ciclo === 'mensal' && (
                    <p className="mt-0.5 text-xs font-medium text-green-600">
                      Ou a partir de R$ {plan.anualMin}/ano no plano anual
                    </p>
                  )}
                </div>

                <ul className="mb-6 space-y-2.5">
                  {plan.beneficios.map((beneficio) => (
                    <li key={beneficio} className="flex items-start gap-2 text-sm">
                      <Check
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          plan.destaque ? 'text-primary' : 'text-green-500'
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
                      : 'border-border bg-background text-foreground hover:bg-secondary border'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )
          })}
        </div>

        {/* Diferencial: sem comissão */}
        <div className="border-border bg-card mx-auto mt-12 max-w-3xl rounded-2xl border p-6 text-center">
          <p className="text-foreground text-base font-semibold">🚫 Sem comissão por pedido</p>
          <p className="text-foreground/65 mt-1 text-sm">
            Plataformas como o iFood cobram entre 12% e 27% por pedido. Aqui o cliente paga direto
            para você, sem desconto por transação na operação do cardápio.
          </p>
        </div>

        {/* Garantia */}
        <div className="mt-8 text-center">
          <div className="border-border bg-card inline-flex flex-wrap items-center justify-center gap-3 rounded-full border px-6 py-3">
            <Shield className="h-5 w-5 shrink-0 text-green-500" />
            <span className="text-foreground/80 text-sm">
              <strong className="text-foreground">Garantia de 30 dias</strong> — cancele nos
              primeiros 30 dias e devolvemos o valor integral, sem burocracia.
            </span>
          </div>
        </div>

        {/* FAQ */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-foreground mb-8 text-center text-2xl font-bold">
            Perguntas frequentes
          </h2>

          <div className="space-y-4">
            <div className="border-border bg-card rounded-xl border p-5">
              <h3 className="text-foreground mb-2 font-semibold">Como funciona a cobrança?</h3>
              <p className="text-foreground/75 text-sm">
                O valor final depende do template e do plano escolhidos. Na compra você vê o
                investimento inicial de implantação e a assinatura recorrente correspondente, sem
                comissão por pedido.
              </p>
            </div>

            <div className="border-border bg-card rounded-xl border p-5">
              <h3 className="text-foreground mb-2 font-semibold">
                Posso cancelar a qualquer momento?
              </h3>
              <p className="text-foreground/75 text-sm">
                Sim. Você cancela pelo painel quando quiser, sem multa. O acesso continua ativo até
                o fim do período já pago. Nos primeiros 30 dias, o reembolso integral é garantido.
              </p>
            </div>

            <div className="border-border bg-card rounded-xl border p-5">
              <h3 className="text-foreground mb-2 font-semibold">
                Onde meu cardápio fica hospedado?
              </h3>
              <p className="text-foreground/75 text-sm">
                Na nossa infraestrutura. Você recebe um link personalizado (ex:{' '}
                <code className="bg-muted rounded px-1 text-xs">
                  cardapiodigital.app/r/seu-negocio
                </code>
                ) para compartilhar via QR Code ou WhatsApp. Sem servidor próprio, sem custo de
                hospedagem separado.
              </p>
            </div>

            <div className="border-border bg-card rounded-xl border p-5">
              <h3 className="text-foreground mb-2 font-semibold">
                Como acesso o painel para editar o cardápio?
              </h3>
              <p className="text-foreground/75 text-sm">
                Após criar sua conta, acesse com Google ou e-mail. Pelo painel você edita produtos,
                preços, fotos e promoções sem precisar de desenvolvedor.
              </p>
            </div>

            <div className="border-border bg-card rounded-xl border p-5">
              <h3 className="text-foreground mb-2 font-semibold">
                Tem template para o meu tipo de negócio?
              </h3>
              <p className="text-foreground/75 text-sm">
                Sim. Há templates para restaurante, pizzaria, hamburgueria, lanchonete, bar,
                cafeteria, açaíteria e sushi. Escolha o template na tela de templates e assine o
                plano que faz sentido para você.
              </p>
            </div>

            <div className="border-border bg-card rounded-xl border p-5">
              <h3 className="text-foreground mb-2 font-semibold">Posso mudar de plano depois?</h3>
              <p className="text-foreground/75 text-sm">
                Se quiser mudar de plano ou migrar para implantação feita pela nossa equipe, fale com
                o suporte para avaliarmos a melhor transição para o seu cardápio.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
