import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle,
  CreditCard,
  QrCode,
  ShieldCheck,
  Smartphone,
  Store,
  TrendingDown,
  Zap,
} from 'lucide-react'

export const metadata = {
  title: 'Funcionalidades | Zairyx — Pagamento Digital para Delivery',
  description:
    'Veja como o Zairyx oferece checkout online via Mercado Pago, QR Code Pix e confirmação automática de pedidos. Zero comissão por pedido. Controle total para o operador.',
}

export default function FuncionalidadesPage() {
  return (
    <div className="from-background to-secondary/20 min-h-screen bg-linear-to-b">
      {/* Header */}
      <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Store className="text-primary h-6 w-6" />
            <span className="text-foreground text-xl font-bold">Zairyx</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/precos"
              className="text-foreground/70 hover:text-foreground text-sm font-medium transition-colors"
            >
              Preços
            </Link>
            <Link
              href="/templates"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
            >
              Ver modelos
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        {/* Hero */}
        <div className="mb-16 text-center">
          <div className="bg-primary/10 text-primary mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
            <CreditCard className="h-4 w-4" />
            Pagamento digital nativo
          </div>
          <h1 className="text-foreground mb-4 text-4xl font-bold md:text-5xl">
            Seu cliente paga{' '}
            <span className="text-primary">direto no cardápio</span>
          </h1>
          <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
            O Zairyx já tem integração nativa com Mercado Pago. Seu cliente finaliza o pedido e
            paga com cartão, PIX ou parcelado — tudo sem sair do cardápio. Nenhuma comissão por
            pedido. Confirmação automática.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/templates"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors"
            >
              Começar agora
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/precos"
              className="border-border text-foreground hover:bg-secondary inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition-colors"
            >
              Ver planos
            </Link>
          </div>
        </div>

        {/* Destaque: Zero Comissão */}
        <div className="mb-16 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: TrendingDown,
              title: 'Zero comissão por pedido',
              desc: 'iFood cobra entre 12% e 30%. Aqui você paga mensalidade fixa e fica com 100% de cada venda.',
            },
            {
              icon: Zap,
              title: 'Confirmação automática',
              desc: 'Quando o pagamento é aprovado, o pedido já entra como "pago" no seu painel. Sem precisar verificar manualmente.',
            },
            {
              icon: ShieldCheck,
              title: 'Controle total',
              desc: 'Você ativa ou desativa o pagamento online a qualquer momento pelo painel. Sua operação, suas regras.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="border-border bg-card rounded-2xl border p-6">
              <div className="bg-primary/10 mb-3 inline-flex rounded-xl p-3">
                <Icon className="text-primary h-5 w-5" />
              </div>
              <h3 className="text-foreground mb-2 font-semibold">{title}</h3>
              <p className="text-muted-foreground text-sm">{desc}</p>
            </div>
          ))}
        </div>

        {/* Fluxo do pagamento */}
        <section className="mb-16">
          <div className="mb-8 text-center">
            <h2 className="text-foreground mb-2 text-2xl font-bold md:text-3xl">
              Como funciona o pagamento
            </h2>
            <p className="text-muted-foreground">
              Do pedido à confirmação, tudo acontece de forma automática.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              {
                step: '1',
                title: 'Cliente faz o pedido',
                desc: 'Escolhe os produtos no cardápio digital e clica em "Finalizar pedido".',
              },
              {
                step: '2',
                title: 'Escolhe a forma de pagamento',
                desc: 'Cartão de crédito, débito, PIX ou parcelado — tudo via Mercado Pago.',
              },
              {
                step: '3',
                title: 'Pagamento processado',
                desc: 'O Mercado Pago processa o pagamento de forma segura. Sem redirecionamentos estranhos.',
              },
              {
                step: '4',
                title: 'Confirmação automática',
                desc: 'Webhook notifica o sistema e o pedido é marcado como "pago" instantaneamente.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="border-border bg-card relative rounded-2xl border p-6">
                <div className="bg-primary text-primary-foreground mb-4 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold">
                  {step}
                </div>
                <h3 className="text-foreground mb-2 font-semibold">{title}</h3>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Mercado Pago */}
        <section className="border-border bg-card mb-16 rounded-2xl border p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <CreditCard className="h-4 w-4" />
                Checkout Mercado Pago
              </div>
              <h2 className="text-foreground mb-4 text-2xl font-bold">
                Integração completa com Mercado Pago
              </h2>
              <p className="text-muted-foreground mb-6">
                Quando o operador ativa o pagamento online, o cardápio exibe o botão de pagamento
                no checkout. O cliente é redirecionado para o ambiente seguro do Mercado Pago e
                pode pagar com:
              </p>
              <ul className="space-y-2">
                {[
                  'Cartão de crédito (Visa, Mastercard, Elo e outros)',
                  'Cartão de débito',
                  'PIX instantâneo',
                  'Parcelamento em até 12x',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="text-primary h-4 w-4 shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <div className="border-border rounded-xl border p-4">
                <h4 className="text-foreground mb-1 font-semibold">Webhook automático</h4>
                <p className="text-muted-foreground text-sm">
                  Após a aprovação, o Mercado Pago envia uma notificação para o Zairyx. O pedido é
                  atualizado automaticamente, sem nenhuma ação manual sua.
                </p>
              </div>
              <div className="border-border rounded-xl border p-4">
                <h4 className="text-foreground mb-1 font-semibold">Rastreamento de status</h4>
                <p className="text-muted-foreground text-sm">
                  Cada pedido tem seu status de pagamento visível no painel:{' '}
                  <span className="font-medium">pendente</span>,{' '}
                  <span className="font-medium">aprovado</span>,{' '}
                  <span className="font-medium">recusado</span> ou{' '}
                  <span className="font-medium">expirado</span>.
                </p>
              </div>
              <div className="border-border rounded-xl border p-4">
                <h4 className="text-foreground mb-1 font-semibold">Segurança Mercado Pago</h4>
                <p className="text-muted-foreground text-sm">
                  Os dados do cartão nunca passam pelo servidor do Zairyx. Toda a criptografia e
                  conformidade PCI é responsabilidade do Mercado Pago.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* QR Code Pix */}
        <section className="mb-16">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="border-border bg-card rounded-2xl border p-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                <QrCode className="h-4 w-4" />
                QR Code PIX
              </div>
              <h3 className="text-foreground mb-3 text-xl font-bold">QR Code PIX por mesa</h3>
              <p className="text-muted-foreground mb-4">
                O Zairyx gera QR Codes únicos por mesa para uso em restaurantes com atendimento
                presencial. O cliente escaneia, acessa o cardápio e faz o pedido pelo próprio
                celular.
              </p>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  ℹ️ Status atual: geração de QR Code disponível para entrada no estabelecimento.
                  Integração com confirmação automática de PIX via BACEN em desenvolvimento para
                  versões futuras.
                </p>
              </div>
            </div>
            <div className="border-border bg-card rounded-2xl border p-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                <Smartphone className="h-4 w-4" />
                Sem app, sem download
              </div>
              <h3 className="text-foreground mb-3 text-xl font-bold">
                Funciona direto no navegador
              </h3>
              <p className="text-muted-foreground mb-4">
                Seu cliente não precisa baixar nada. O cardápio digital é um site responsivo que
                abre em qualquer celular. O QR Code da mesa leva direto para o cardápio — sem
                cadastro, sem fricção.
              </p>
              <ul className="space-y-2">
                {[
                  'iOS e Android',
                  'Chrome, Safari, Firefox',
                  'Funciona no Wi-Fi do estabelecimento',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="text-primary h-4 w-4 shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Como ativar — micro-tutorial */}
        <section className="mb-16">
          <div className="mb-8 text-center">
            <h2 className="text-foreground mb-2 text-2xl font-bold md:text-3xl">
              Como ativar o pagamento online
            </h2>
            <p className="text-muted-foreground">
              Para clientes que já têm a plataforma. Leva menos de 5 minutos.
            </p>
          </div>

          <div className="border-border bg-card rounded-2xl border p-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                {[
                  {
                    step: '1',
                    title: 'Acesse seu painel',
                    desc: 'Entre em zairyx.app/painel com seu login e senha.',
                  },
                  {
                    step: '2',
                    title: 'Vá em Configurações de Pagamento',
                    desc: 'No menu lateral, clique em "Configurações" → "Pagamento e Checkout".',
                  },
                  {
                    step: '3',
                    title: 'Conecte sua conta Mercado Pago',
                    desc: 'Clique em "Ativar pagamento online" e siga o processo de autorização OAuth do Mercado Pago.',
                  },
                  {
                    step: '4',
                    title: 'Pronto — pagamentos ativos',
                    desc: 'O botão de pagamento aparece automaticamente no seu cardápio. Pedidos pagos online chegam marcados como "pago".',
                  },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex items-start gap-4">
                    <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                      {step}
                    </div>
                    <div>
                      <h4 className="text-foreground mb-1 font-semibold">{title}</h4>
                      <p className="text-muted-foreground text-sm">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-border rounded-xl border p-6">
                <h4 className="text-foreground mb-4 font-semibold">Perguntas frequentes</h4>
                <div className="space-y-4">
                  {[
                    {
                      q: 'Preciso ter CNPJ para usar o Mercado Pago?',
                      a: 'Não. Pessoas físicas (CPF) também podem receber pagamentos pelo Mercado Pago, com os mesmos recursos.',
                    },
                    {
                      q: 'Quando o dinheiro cai na minha conta?',
                      a: 'PIX: em até 30 minutos. Cartão de crédito: conforme o plano do seu Mercado Pago (padrão: D+14 ou D+30 para contas básicas, D+2 para contas Point).',
                    },
                    {
                      q: 'O Zairyx cobra taxa por pedido pago?',
                      a: 'Não. O Zairyx cobra apenas a mensalidade do plano. A taxa de processamento é do Mercado Pago (em geral 0,99% para PIX e ~3,99% para cartão, dependendo do seu plano MP).',
                    },
                    {
                      q: 'Posso desativar o pagamento online quando quiser?',
                      a: 'Sim. Basta desligar a opção no painel. O cardápio volta a funcionar no modo de pedido por WhatsApp, sem impacto no resto da operação.',
                    },
                  ].map(({ q, a }) => (
                    <div key={q}>
                      <p className="text-foreground mb-1 text-sm font-medium">{q}</p>
                      <p className="text-muted-foreground text-sm">{a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparativo com concorrentes */}
        <section className="mb-16">
          <div className="mb-8 text-center">
            <h2 className="text-foreground mb-2 text-2xl font-bold md:text-3xl">
              Zairyx vs. marketplaces
            </h2>
            <p className="text-muted-foreground">
              Por que pagar comissão se você pode ter seu próprio canal?
            </p>
          </div>

          <div className="border-border bg-card overflow-hidden rounded-2xl border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-border border-b">
                    <th className="text-foreground px-6 py-4 text-left font-semibold">Recurso</th>
                    <th className="bg-primary/5 text-primary px-6 py-4 text-center font-bold">
                      Zairyx
                    </th>
                    <th className="text-muted-foreground px-6 py-4 text-center font-medium">
                      iFood
                    </th>
                    <th className="text-muted-foreground px-6 py-4 text-center font-medium">
                      Delivery Direto
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {[
                    {
                      feature: 'Comissão por pedido',
                      zairyx: '0%',
                      ifood: '12% – 30%',
                      dd: '0% (mensalidade fixa)',
                      zairyxGood: true,
                    },
                    {
                      feature: 'Checkout online integrado',
                      zairyx: '✓ Mercado Pago nativo',
                      ifood: '✓ (interno)',
                      dd: '✓',
                      zairyxGood: true,
                    },
                    {
                      feature: 'Confirmação automática de pagamento',
                      zairyx: '✓ via webhook',
                      ifood: '✓',
                      dd: '✓',
                      zairyxGood: true,
                    },
                    {
                      feature: 'QR Code por mesa',
                      zairyx: '✓ incluso',
                      ifood: '✗',
                      dd: '✓ (planos avançados)',
                      zairyxGood: true,
                    },
                    {
                      feature: 'IA de atendimento 24h',
                      zairyx: '✓ incluso em todos os planos',
                      ifood: '✗',
                      dd: '✗',
                      zairyxGood: true,
                    },
                    {
                      feature: 'Marca própria (seu domínio)',
                      zairyx: '✓',
                      ifood: '✗ (marca iFood)',
                      dd: '✓',
                      zairyxGood: true,
                    },
                    {
                      feature: 'Garantia de devolução',
                      zairyx: '30 dias',
                      ifood: '—',
                      dd: '—',
                      zairyxGood: true,
                    },
                  ].map(({ feature, zairyx, ifood, dd, zairyxGood }) => (
                    <tr key={feature} className="hover:bg-secondary/30 transition-colors">
                      <td className="text-foreground px-6 py-3 font-medium">{feature}</td>
                      <td
                        className={`px-6 py-3 text-center ${zairyxGood ? 'text-primary font-semibold' : 'text-foreground'}`}
                      >
                        {zairyx}
                      </td>
                      <td className="text-muted-foreground px-6 py-3 text-center">{ifood}</td>
                      <td className="text-muted-foreground px-6 py-3 text-center">{dd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Garantia */}
        <section className="mb-16">
          <div className="from-primary/10 to-primary/5 border-primary/20 rounded-2xl border bg-linear-to-br p-8 text-center md:p-12">
            <BadgeCheck className="text-primary mx-auto mb-4 h-12 w-12" />
            <h2 className="text-foreground mb-3 text-2xl font-bold md:text-3xl">
              Teste por 30 dias. Risco zero.
            </h2>
            <p className="text-muted-foreground mx-auto mb-2 max-w-xl text-lg">
              Se não funcionar para o seu negócio, devolvemos cada centavo — sem perguntas.
            </p>
            <p className="text-muted-foreground mb-8 text-sm">
              A maioria dos concorrentes dá 7 dias. A gente dá 30 porque confia no produto.
            </p>
            <Link
              href="/templates"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold transition-colors"
            >
              Começar agora — grátis por 30 dias
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer simples */}
      <footer className="border-border border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center md:flex-row md:justify-between">
          <Link href="/" className="text-foreground font-semibold">
            Zairyx
          </Link>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/precos"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Preços
            </Link>
            <Link
              href="/templates"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Templates
            </Link>
            <Link
              href="/demo"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Demo
            </Link>
            <Link
              href="/termos"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Termos
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
