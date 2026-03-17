'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Shield, Sparkles, Store, Zap } from 'lucide-react'
import { COMPANY_NAME, PAYMENT_DESCRIPTOR_NOTE, PRODUCT_ENDORSEMENT } from '@/lib/brand'
import { getTemplateCatalog } from '@/lib/templates-config'
import { getTemplatePricing } from '@/lib/pricing'

export default function OfertasPage() {
  const plans = useMemo(() => {
    const templates = getTemplateCatalog()
    const selfServicePix = templates.map(
      (template) =>
        getTemplatePricing(template.slug as Parameters<typeof getTemplatePricing>[0]).selfService
          .pix
    )
    const selfServiceCard = templates.map(
      (template) =>
        getTemplatePricing(template.slug as Parameters<typeof getTemplatePricing>[0]).selfService
          .card
    )
    const selfServiceMonthly = templates.map(
      (template) =>
        getTemplatePricing(template.slug as Parameters<typeof getTemplatePricing>[0]).selfService
          .monthly
    )
    const fpvcPix = templates.map(
      (template) =>
        getTemplatePricing(template.slug as Parameters<typeof getTemplatePricing>[0]).feitoPraVoce
          .pix
    )
    const fpvcCard = templates.map(
      (template) =>
        getTemplatePricing(template.slug as Parameters<typeof getTemplatePricing>[0]).feitoPraVoce
          .card
    )
    const fpvcMonthly = templates.map(
      (template) =>
        getTemplatePricing(template.slug as Parameters<typeof getTemplatePricing>[0]).feitoPraVoce
          .monthly
    )

    return [
      {
        id: 'self-service',
        nome: 'Faça Você Mesmo',
        descricao: 'Para operar com autonomia, atualizar rápido e manter o canal sob seu controle.',
        icon: Zap,
        pixMin: Math.min(...selfServicePix),
        pixMax: Math.max(...selfServicePix),
        cardMin: Math.min(...selfServiceCard),
        cardMax: Math.max(...selfServiceCard),
        monthlyMin: Math.min(...selfServiceMonthly),
        monthlyMax: Math.max(...selfServiceMonthly),
        destaque: false,
        cta: 'Quero começar com menor custo',
        href: '/templates',
        beneficios: [
          '1 delivery ativo',
          'Editor visual com atualização rápida',
          'Link público e QR Code prontos para divulgar',
          'Pedidos direto no WhatsApp do negócio',
          'Infraestrutura incluída no plano ativo',
          'Gestão sem depender de desenvolvedor',
        ],
      },
      {
        id: 'feito-pra-voce',
        nome: 'Feito Pra Você',
        descricao: 'Para quem quer lançamento mais assistido, com nossa equipe conduzindo a implantação.',
        icon: Sparkles,
        pixMin: Math.min(...fpvcPix),
        pixMax: Math.max(...fpvcPix),
        cardMin: Math.min(...fpvcCard),
        cardMax: Math.max(...fpvcCard),
        monthlyMin: Math.min(...fpvcMonthly),
        monthlyMax: Math.max(...fpvcMonthly),
        destaque: true,
        cta: 'Quero entrar no ar mais rápido',
        href: '/templates',
        beneficios: [
          'Tudo do Faça Você Mesmo',
          'Montagem conduzida pela nossa equipe',
          'Você pode enviar fotos e preços depois da compra',
          'Acompanhamento próximo na ativação',
          'Suporte prioritário',
          'Publicação em até 48 h úteis após onboarding completo',
        ],
      },
    ]
  }, [])

  return (
    <div className="from-background to-secondary/20 min-h-screen bg-linear-to-b">
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
        <div className="mb-10 text-center">
          <div className="bg-primary/10 text-primary mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Modelo comercial claro, operação própria e 0% de comissão por pedido
          </div>
          <h1 className="text-foreground mb-4 text-4xl font-bold md:text-5xl">Escolha seu plano</h1>
          <p className="text-foreground/80 mx-auto max-w-2xl text-lg">
            Escolha entre operar com autonomia desde o primeiro dia ou acelerar a entrada no ar com
            implantação assistida. A proposta mostra com clareza o valor de entrada e o valor
            mensal que sustenta a operação.
          </p>
          <div className="border-border bg-card/80 mx-auto mt-6 max-w-3xl rounded-2xl border px-5 py-4 text-left shadow-sm">
            <p className="text-foreground text-sm font-semibold">Transparência na cobrança</p>
            <p className="text-foreground/75 mt-1 text-sm leading-6">
              {PRODUCT_ENDORSEMENT} {PAYMENT_DESCRIPTOR_NOTE}
            </p>
            <p className="text-foreground/65 mt-2 text-xs leading-5">
              A entrada inicial ativa a implantação. O plano mensal mantém hospedagem, painel,
              link público e suporte da plataforma, sem promessa artificial de acesso vitalício.
            </p>
            <p className="text-foreground/65 mt-2 text-xs leading-5">
              Empresa responsável pela operação comercial: {COMPANY_NAME}.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:mx-auto lg:max-w-4xl">
          {plans.map((plan) => {
            const Icon = plan.icon
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
                      R$ {plan.pixMin}
                    </span>
                    <span className="text-foreground/50 text-sm">de implantação no PIX</span>
                  </div>
                  <p className="text-foreground/65 mt-1 text-xs font-medium">Entrada de implantação para colocar o projeto no ar</p>
                  {plan.pixMin !== plan.pixMax && (
                    <p className="text-foreground/60 mt-1 text-xs">
                      Faixa de implantação no PIX por template: até R$ {plan.pixMax}
                    </p>
                  )}
                  <p className="text-foreground/50 mt-0.5 text-xs">
                    No cartão: de R$ {plan.cardMin} até R$ {plan.cardMax}, com parcelamento em até
                    3x.
                  </p>
                  <div className="border-border/60 bg-background/70 mt-4 rounded-xl border p-3 text-left">
                    <p className="text-foreground text-xs font-semibold">Plano mensal da plataforma</p>
                    <p className="text-foreground mt-1 text-lg font-bold">R$ {plan.monthlyMin}/mês</p>
                    <p className="text-foreground/60 mt-1 text-xs">
                      {plan.monthlyMin === plan.monthlyMax
                        ? 'Valor recorrente deste modelo em todos os templates.'
                        : `Conforme o template escolhido, o valor recorrente pode chegar a R$ ${plan.monthlyMax}/mês.`}
                    </p>
                  </div>
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

        <div className="border-border bg-card mx-auto mt-12 max-w-3xl rounded-2xl border p-6 text-center">
          <p className="text-foreground text-base font-semibold">🚫 Sem comissão por pedido</p>
          <p className="text-foreground/65 mt-1 text-sm">
            Em muitos marketplaces existe comissão por pedido. Aqui o cliente paga direto para você,
            sem desconto por transação na operação do cardápio.
          </p>
        </div>

        <div className="mt-8 text-center">
          <div className="border-border bg-card inline-flex flex-wrap items-center justify-center gap-3 rounded-full border px-6 py-3">
            <Shield className="h-5 w-5 shrink-0 text-green-500" />
            <span className="text-foreground/80 text-sm">
              <strong className="text-foreground">Garantia de 30 dias</strong> — cancele nos
              primeiros 30 dias e devolvemos o valor integral, sem burocracia.
            </span>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-foreground mb-8 text-center text-2xl font-bold">
            Perguntas frequentes
          </h2>

          <div className="space-y-4">
            <div className="border-border bg-card rounded-xl border p-5">
              <h3 className="text-foreground mb-2 font-semibold">Como funciona a cobrança?</h3>
              <p className="text-foreground/75 text-sm">
                Você aprova a implantação no checkout e mantém o cardápio no plano mensal do modelo
                escolhido. As duas etapas ficam explícitas antes da compra para dar previsibilidade
                comercial.
              </p>
            </div>

            <div className="border-border bg-card rounded-xl border p-5">
              <h3 className="text-foreground mb-2 font-semibold">
                E se eu não tiver disponibilidade para configurar?
              </h3>
              <p className="text-foreground/75 text-sm">
                Escolha o Feito Pra Você. Você compra agora e pode enviar fotos, preços, logo e
                informações depois. O prazo de até 48 h úteis começa quando recebemos o onboarding
                completo.
              </p>
            </div>

            <div className="border-border bg-card rounded-xl border p-5">
              <h3 className="text-foreground mb-2 font-semibold">
                Depois eu preciso pagar assinatura obrigatória?
              </h3>
              <p className="text-foreground/75 text-sm">
                Sim. O Cardápio Digital é um SaaS: a implantação coloca o projeto no ar e o plano
                mensal sustenta infraestrutura, painel, link público, suporte e a continuidade da
                operação.
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
                <code className="bg-muted rounded px-1 text-xs">zairyx.com/r/seu-negocio</code>)
                para compartilhar via QR Code ou WhatsApp. Sem servidor próprio, sem custo de
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
                Sim. Há templates para Deliverys, pizzaria, hamburgueria, lanchonete, bar,
                cafeteria, açaíteria e sushi. Escolha o template na tela de templates e escolha o
                modelo que faz mais sentido para você.
              </p>
            </div>

            <div className="border-border bg-card rounded-xl border p-5">
              <h3 className="text-foreground mb-2 font-semibold">Posso mudar de plano depois?</h3>
              <p className="text-foreground/75 text-sm">
                Se quiser migrar para implantação feita pela nossa equipe ou contratar serviços
                adicionais, fale com o suporte para desenharmos a transição mais adequada para o
                seu momento.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
