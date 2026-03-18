'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Shield, Sparkles, Store, Zap } from 'lucide-react'
import { COMPANY_NAME, PAYMENT_DESCRIPTOR_NOTE, PRODUCT_ENDORSEMENT } from '@/lib/brand'
import { getTemplateCatalog } from '@/lib/templates-config'
import { getTemplatePricing, PUBLIC_SUBSCRIPTION_PRICES } from '@/lib/pricing'

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
    return [
      {
        id: 'self-service',
        nome: 'Você configura',
        descricao: 'Você configura, publica e ajusta pelo painel.',
        icon: Zap,
        pixMin: Math.min(...selfServicePix),
        pixMax: Math.max(...selfServicePix),
        cardMin: Math.min(...selfServiceCard),
        cardMax: Math.max(...selfServiceCard),
        monthly: PUBLIC_SUBSCRIPTION_PRICES.basico.monthly,
        recurringLabel: 'Mensalidade da plataforma',
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
        nome: 'Equipe configura',
        descricao: 'A equipe da Zairyx monta a operação inicial para você.',
        icon: Sparkles,
        pixMin: Math.min(...fpvcPix),
        pixMax: Math.max(...fpvcPix),
        cardMin: Math.min(...fpvcCard),
        cardMax: Math.max(...fpvcCard),
        monthly: PUBLIC_SUBSCRIPTION_PRICES.pro.monthly,
        recurringLabel: 'Mensalidade da plataforma',
        destaque: true,
        cta: 'Quero entrar no ar mais rápido',
        href: '/templates',
        beneficios: [
          'Tudo da opção Você configura',
          'Montagem conduzida pela nossa equipe',
          'Você pode enviar fotos e preços depois da compra',
          'Acompanhamento próximo na ativação',
          'Suporte prioritário',
          'Publicação em até 2 dias úteis após envio completo do onboarding',
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
            0% de comissão · operação própria
          </div>
          <h1 className="text-foreground mb-4 text-4xl font-bold md:text-5xl">
            Escolha como quer começar
          </h1>
          <p className="text-foreground/80 mx-auto max-w-2xl text-lg">
            Escolha entre fazer a configuração por conta própria ou deixar a equipe da Zairyx
            conduzir tudo. Você vê o valor da implantação hoje e o valor mensal após a ativação.
          </p>
          <p className="text-foreground/60 mt-3 text-sm">
            Mensalidade a partir de <strong className="text-foreground">menos de R$&nbsp;2 por dia</strong>{' '}
            — sem comissão sobre vendas. Marketplaces cobram de 12% a 27% por pedido.
          </p>
          <div className="border-border bg-card/80 mx-auto mt-6 max-w-3xl rounded-2xl border px-5 py-4 text-left shadow-sm">
            <p className="text-foreground text-sm font-semibold">Transparência na cobrança</p>
            <p className="text-foreground/75 mt-1 text-sm leading-6">
              {PRODUCT_ENDORSEMENT} {PAYMENT_DESCRIPTOR_NOTE}
            </p>
            <p className="text-foreground/65 mt-2 text-xs leading-5">
              A implantação coloca o cardápio no ar. A mensalidade mantém hospedagem, painel, link
              público e suporte.
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
                      ⭐ Recomendado
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
                  <p className="text-foreground/55 text-xs font-semibold tracking-wide uppercase">
                    Hoje
                  </p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-bold ${plan.destaque ? 'text-primary' : 'text-foreground'}`}
                    >
                      R$ {plan.pixMin}
                    </span>
                    <span className="text-foreground/50 text-sm">no PIX</span>
                  </div>
                  <p className="text-foreground/65 mt-1 text-xs font-medium">
                    Entrada inicial para publicar o delivery
                  </p>
                  {plan.pixMin !== plan.pixMax && (
                    <p className="text-foreground/60 mt-1 text-xs">
                      Hoje pode chegar a R$ {plan.pixMax} no PIX, conforme o template.
                    </p>
                  )}
                  <p className="text-foreground/50 mt-0.5 text-xs">
                    PIX no menor valor. Nos demais meios, o Mercado Pago usa o valor do checkout e
                    permite crédito em até 12x.
                  </p>
                  <div className="border-border/60 bg-background/70 mt-4 rounded-xl border p-3 text-left">
                    <p className="text-foreground text-xs font-semibold">Por mês</p>
                    <p className="text-foreground mt-1 text-lg font-bold">R$ {plan.monthly}/mês</p>
                    <p className="text-foreground/60 mt-1 text-xs">
                      {plan.recurringLabel} após a ativação.
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
                Você vê o valor de hoje no checkout e depois mantém o cardápio no valor mensal.
              </p>
            </div>

            <div className="border-border bg-card rounded-xl border p-5">
              <h3 className="text-foreground mb-2 font-semibold">
                E se eu não tiver disponibilidade para configurar?
              </h3>
              <p className="text-foreground/75 text-sm">
                Escolha a opção Equipe configura. Você compra agora e envia o material depois.
              </p>
            </div>

            <div className="border-border bg-card rounded-xl border p-5">
              <h3 className="text-foreground mb-2 font-semibold">
                Depois eu preciso pagar assinatura obrigatória?
              </h3>
              <p className="text-foreground/75 text-sm">
                Sim. A implantação ativa o projeto e a mensalidade mantém a operação ativa.
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
                Sim. Se quiser migrar para a opção Equipe configura, fale com o suporte.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
