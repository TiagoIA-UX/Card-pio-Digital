import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle,
  CreditCard,
  Gift,
  Megaphone,
  MessageCircle,
  PackageCheck,
  Printer,
  QrCode,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  TrendingDown,
  TrendingUp,
  Zap,
  X,
} from 'lucide-react'
import { COMPANY_CNPJ, COMPANY_NAME } from '@/lib/shared/brand'
import { COMMERCIAL_COPY } from '@/lib/domains/marketing/commercial-copy'

export const metadata = {
  title: 'Benefícios | Zairyx — Canal próprio com IA e pagamento online',
  description: `Pare de depender só dos marketplaces. Com a Zairyx você tem canal próprio, IA 24h, pagamento online via Mercado Pago e mensalidade fixa ${COMMERCIAL_COPY.noPlatformCommission.toLowerCase()}.`,
}

export default function BeneficiosPage() {
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
            <BadgeCheck className="h-4 w-4" />
            Seu delivery, suas regras
          </div>
          <h1 className="text-foreground mb-4 text-4xl font-bold md:text-5xl">
            Você está pagando <span className="text-primary">até 27% de comissão</span> por pedido.
            <br />
            Isso precisa parar.
          </h1>
          <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
            Dono de delivery que usa iFood, Rappi ou Uber Eats financia o app, não o próprio
            negócio. A Zairyx devolve o controle para você: canal próprio, IA 24h, pagamento online
            e mensalidade fixa {COMMERCIAL_COPY.noPlatformCommission.toLowerCase()}.
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

        {/* Comparação iFood vs Zairyx */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-2xl font-bold">
            O que muda quando você para de depender do iFood
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* iFood */}
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-red-700">
                <X className="h-5 w-5" />
                Marketplace (iFood, Rappi...)
              </h3>
              <ul className="space-y-3">
                {[
                  'Comissão de 12% a 30% por pedido — para sempre',
                  'Seu cliente é do app, não seu',
                  'Você some quando o app sai do ar',
                  'Promoções obrigatórias para aparecer',
                  'Suporte que demora dias para responder',
                  'Você compete com dezenas de concorrentes na mesma tela',
                  'Nunca sabe quem são seus clientes fiéis',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-red-800">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Zairyx */}
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-green-700">
                <CheckCircle className="h-5 w-5" />
                Zairyx — canal próprio
              </h3>
              <ul className="space-y-3">
                {[
                  'Mensalidade fixa — sem comissao da Zairyx sobre cada venda',
                  'Seu cliente, seus dados, seu relacionamento',
                  'Seu canal funciona 24h no dia, 7 dias na semana',
                  'Você controla os preços e promoções',
                  'IA responde clientes em segundos — mesmo de madrugada',
                  'Você é a única opção no seu próprio cardápio',
                  'Histórico completo de pedidos e preferências',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-green-800">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ─── Estratégia iFood → Zairyx ──────────────────────────────── */}
        <div className="mb-16">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">
              <Megaphone className="h-4 w-4" />
              Estratégia comprovada
            </div>
            <h2 className="mb-3 text-2xl font-bold md:text-3xl">
              Use o iFood como vitrine —{' '}
              <span className="text-orange-500">e converta esses clientes pro seu canal</span>
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-base">
              Você não precisa abandonar o iFood do dia para a noite. A estratégia inteligente é
              usá-lo para atrair novos clientes e, a cada entrega, convidá-los a pedir diretamente
              pelo seu canal — onde você não paga comissão e eles pagam menos.
            </p>
          </div>

          {/* 3 passos do funil */}
          <div className="mb-10 grid gap-6 md:grid-cols-3">
            {[
              {
                num: '01',
                icon: Store,
                color: 'bg-zinc-700',
                title: 'iFood como isca de aquisição',
                desc: 'Mantenha sua loja no iFood para alcançar clientes que ainda não conhecem sua marca. O primeiro pedido vem por lá — e você paga a comissão uma única vez para adquirir esse cliente.',
              },
              {
                num: '02',
                icon: PackageCheck,
                color: 'bg-orange-500',
                title: 'A conversão acontece na entrega',
                desc: 'Dentro da sacola vai um cartão de agradecimento com QR Code da Zairyx. Exemplo: "Gostou? Peça pelo nosso site na próxima e ganhe 15% de desconto — sem intermediário." O iFood permite marketing offline após a venda.',
                highlight: true,
              },
              {
                num: '03',
                icon: TrendingUp,
                color: 'bg-green-600',
                title: 'Fidelização no canal próprio',
                desc: 'Com a comissão economizada, você pode dar brinde (refrigerante, sobremesa, miminho), oferecer desconto — e ainda sobrar dinheiro no bolso. O cliente sente a diferença e fideliza. Você ganha mais por pedido, para sempre.',
              },
            ].map(({ num, icon: Icon, color, title, desc, highlight }) => (
              <div
                key={num}
                className={`relative rounded-2xl border p-6 ${highlight ? 'border-orange-300 bg-orange-50/80 shadow-lg shadow-orange-100' : 'border-zinc-200 bg-white'}`}
              >
                <span className="absolute top-4 right-4 text-3xl font-black text-zinc-100 select-none">
                  {num}
                </span>
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${color} text-white`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-base font-bold">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* ─── Brinde + sobra dinheiro ─────────────────────────────── */}
          <div className="mb-10 rounded-2xl border-2 border-green-300 bg-linear-to-br from-green-50 to-emerald-50 p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600 text-white">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-900">
                  Você pode dar brinde, dar desconto — e ainda sobrar dinheiro
                </h3>
                <p className="text-sm text-green-700">
                  A matemática que o iFood não quer que você faça
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Coluna iFood */}
              <div className="rounded-xl border border-red-200 bg-white/70 p-5">
                <p className="mb-3 text-sm font-bold text-red-700">❌ Pedido de R$ 50 no iFood</p>
                <ul className="space-y-1.5 text-sm text-zinc-600">
                  <li className="flex justify-between">
                    <span>Valor recebido</span>
                    <span className="font-medium">R$ 50,00</span>
                  </li>
                  <li className="flex justify-between text-red-600">
                    <span>Comissão 27%</span>
                    <span className="font-medium">− R$ 13,50</span>
                  </li>
                  <li className="flex justify-between border-t border-zinc-200 pt-1.5 font-bold">
                    <span>Você fica com</span>
                    <span className="text-red-600">R$ 36,50</span>
                  </li>
                </ul>
                <p className="mt-3 text-xs text-zinc-400">
                  Sem brinde. Sem desconto. Sem fidelização.
                </p>
              </div>

              {/* Coluna Zairyx */}
              <div className="rounded-xl border border-green-300 bg-white/70 p-5">
                <p className="mb-3 text-sm font-bold text-green-700">
                  ✅ Mesmo pedido de R$ 50 na Zairyx
                </p>
                <ul className="space-y-1.5 text-sm text-zinc-600">
                  <li className="flex justify-between">
                    <span>Valor recebido</span>
                    <span className="font-medium">R$ 50,00</span>
                  </li>
                  <li className="flex justify-between text-green-700">
                    <span>Comissão Zairyx</span>
                    <span className="font-medium">R$ 0,00</span>
                  </li>
                  <li className="flex justify-between text-orange-600">
                    <span>Brinde p/ cliente (ex: refri)</span>
                    <span className="font-medium">− R$ 3,00</span>
                  </li>
                  <li className="flex justify-between text-orange-600">
                    <span>Desconto de 5%</span>
                    <span className="font-medium">− R$ 2,50</span>
                  </li>
                  <li className="flex justify-between border-t border-zinc-200 pt-1.5 font-bold">
                    <span>Você fica com</span>
                    <span className="text-green-600">R$ 44,50</span>
                  </li>
                </ul>
                <p className="mt-3 text-xs font-medium text-green-600">
                  Cliente recebeu brinde + desconto e ainda ficou R$ 8 a mais no seu bolso.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-green-600 px-6 py-4 text-center text-white">
              <p className="text-base font-bold">
                🎁 Você mima o cliente, fideliza — e ainda ganha{' '}
                <span className="underline decoration-white/60 decoration-2">R$ 8 a mais</span> por
                pedido do que ganharia no iFood.
              </p>
              <p className="mt-1 text-sm text-green-100">
                Exemplo: com 100 pedidos/mês, isso pode representar R$ 800 extras — mesmo oferecendo
                brinde. O resultado varia conforme seu volume.
              </p>
            </div>
          </div>

          {/* Pode / Não pode */}
          <div className="mb-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-green-800">
                <CheckCircle className="h-5 w-5 text-green-600" />O que você pode fazer (permitido
                pelo iFood)
              </h3>
              <ul className="space-y-3">
                {[
                  'Colocar cartão de agradecimento com QR Code dentro da sacola',
                  'Adesivo de lacre de sacola com seu link da Zairyx',
                  'Oferecer desconto para o próximo pedido pelo canal próprio',
                  'Enviar brinde ou miminho com bilhete convidando para o site',
                  'Mensagem offline após a entrega (panfleto, cartão impresso)',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-green-800">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-red-800">
                <X className="h-5 w-5 text-red-600" />O que não fazer (viola as regras do iFood)
              </h3>
              <ul className="space-y-3">
                {[
                  'Pedir para o cliente cancelar o pedido no iFood e refazer fora',
                  'Colocar link da Zairyx no chat do iFood ou nas descrições de produtos',
                  'Escrever no cardápio do iFood que "é mais barato no site tal"',
                  'Promover o canal próprio dentro do ambiente do app do iFood',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-red-800">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-red-600">
                Seguindo essas regras, você converte clientes sem arriscar o banimento da sua loja.
              </p>
            </div>
          </div>

          {/* Passo a passo prático */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-8">
            <div className="mb-6 flex items-center gap-3">
              <Printer className="text-primary h-7 w-7" />
              <h3 className="text-xl font-bold">Como colocar isso em prática — 4 passos</h3>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: '1',
                  title: 'Monte seu cardápio na Zairyx',
                  desc: 'Configure os mesmos produtos com preço igual ou levemente mais barato — a economia da comissão torna isso possível sem perder margem.',
                },
                {
                  step: '2',
                  title: 'Gere seu QR Code',
                  desc: 'No painel da Zairyx, copie o link da sua loja. Use qualquer gerador gratuito para criar o QR Code em segundos.',
                },
                {
                  step: '3',
                  title: 'Imprima os materiais',
                  desc: 'Cartão de agradecimento A6 ou adesivo de lacre de sacola com o QR Code e uma chamada: "Peça aqui e ganhe X% de desconto na próxima!"',
                },
                {
                  step: '4',
                  title: 'Gerencie tudo pela Zairyx',
                  desc: 'Quando o cliente pedir pelo seu canal, o pedido chega organizado no WhatsApp ou no painel, sem comissao da Zairyx por pedido e com IA de atendimento 24h.',
                },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex flex-col gap-3">
                  <div className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold">
                    {step}
                  </div>
                  <h4 className="text-sm font-bold">{title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-orange-50 px-5 py-4">
              <p className="text-sm font-medium text-orange-800">
                💡 <strong>Dica de copy para o cartão:</strong> &quot;Obrigado pelo pedido! Da
                próxima vez, peça direto pelo nosso site e ganhe{' '}
                <span className="font-bold">15% de desconto</span> — sem taxa de entrega do app.
                Acesse o QR Code acima ou salve: [seu link da Zairyx]&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Benefícios detalhados */}
        <div className="mb-16">
          <h2 className="mb-2 text-center text-2xl font-bold">Tudo que você ganha com a Zairyx</h2>
          <p className="text-muted-foreground mb-8 text-center">
            Cada benefício foi construído para resolver um problema real de quem vive de delivery.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Benefício 1 */}
            <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-white">
                <TrendingDown className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-bold">{COMMERCIAL_COPY.noPlatformCommission}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Um restaurante que fatura R$ 20.000/mês no iFood paga até R$ 6.000 em comissão. Na
                Zairyx você paga mensalidade fixa a partir de R$ 147 e nao paga comissao da
                plataforma por pedido. As taxas de gateway e logística, quando existirem, seguem
                separadas. Isso preserva mais margem para brinde, desconto e recompra.
              </p>
            </div>

            {/* Benefício 2 */}
            <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-bold">IA que atende 24h — sem custo extra</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                O Cadu, nosso assistente de IA, está dentro do seu cardápio o tempo todo. Responde
                dúvidas sobre cardápio, horário, entrega e ingredientes. Ajuda o cliente a montar o
                pedido e só chama você no WhatsApp quando é realmente necessário. Tudo incluso no
                plano — sem cobrar por mensagem.
              </p>
            </div>

            {/* Benefício 3 */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-white">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-bold">Pagamento online direto no pedido</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Seu cliente pode pagar com{' '}
                <strong>cartão de crédito, débito, PIX ou parcelado</strong> direto no cardápio,
                antes de enviar o pedido. Quando a aprovação chega via webhook do gateway, o pedido
                entra como &quot;pago&quot; no painel sem conferência manual. Integração nativa com
                Mercado Pago.
              </p>
            </div>

            {/* Benefício 4 */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-white">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-bold">Pedidos organizados no WhatsApp</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                O cliente monta o pedido no cardápio e envia tudo organizado — itens, quantidade,
                endereço e observações — direto no seu WhatsApp. Chega como uma mensagem
                estruturada, sem confusão. Sem app de terceiro no meio e sem comissao da Zairyx por
                pedido.
              </p>
            </div>

            {/* Benefício 5 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-700 text-white">
                <Smartphone className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-bold">Painel simples — funciona no celular</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Mude preço, adicione produto ou tire foto em 5 segundos pelo celular. O painel foi
                feito para donos de negócio, não para programadores. Se você manda áudio no
                WhatsApp, você usa o painel — sem precisar de nenhum treinamento.
              </p>
            </div>

            {/* Benefício 6 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-700 text-white">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-bold">QR Code + Link + Instagram — tudo pronto</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Imprima o QR Code na mesa, cole no balcão, compartilhe no story, coloque na bio do
                Instagram. Seus clientes acessam o cardápio em 1 toque, sem baixar nenhum
                aplicativo. Funciona no celular de qualquer pessoa.
              </p>
            </div>

            {/* Benefício 7 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-700 text-white">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-bold">Alta temporada sem perder pedido</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                No verão ou feriado prolongado, o volume pode dobrar de um dia pro outro. O cardápio
                digital organiza tudo — sem perder pedido, sem confusão de anotação, sem cliente sem
                resposta. Quanto mais você vende, mais você lucra — sem pagar mais por isso.
              </p>
            </div>

            {/* Benefício 8 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-700 text-white">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-bold">Pronto em menos de 30 minutos</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Escolha o template do seu nicho (pizzaria, hamburgueria, açaíteria, mercadinho e
                mais 11 opções), troque os produtos e preços, publique o link. Tudo em menos de meia
                hora — sem precisar de programador, designer ou agência.
              </p>
            </div>
          </div>
        </div>

        {/* Garantia */}
        <div className="mb-16 rounded-2xl border-2 border-green-300 bg-green-50 p-8 text-center">
          <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-green-600" />
          <h2 className="mb-3 text-2xl font-bold text-green-800">
            {COMMERCIAL_COPY.withdrawalOnline}
          </h2>
          <p className="mx-auto mb-2 max-w-2xl text-base text-green-700">
            O contratante pode cancelar em até 7 dias corridos após a contratação online, sem custo,
            conforme o Art. 49 do Código de Defesa do Consumidor.
          </p>
          <p className="text-sm font-medium text-green-600">
            Fora desse prazo, valem as condições comerciais e de cancelamento descritas nos termos.
          </p>
        </div>

        {/* Pagamento digital — detalhamento técnico simplificado */}
        <div className="mb-16 rounded-2xl border border-zinc-200 bg-white p-8">
          <div className="mb-6 flex items-center gap-3">
            <CreditCard className="text-primary h-8 w-8" />
            <h2 className="text-2xl font-bold">Como funciona o pagamento online</h2>
          </div>
          <p className="text-muted-foreground mb-6 text-base">
            Não é complicado. É assim que funciona quando seu cliente paga pelo cardápio:
          </p>

          <div className="mb-8 grid gap-4 md:grid-cols-4">
            {[
              {
                step: '1',
                title: 'Cliente faz o pedido',
                desc: 'Escolhe os itens e vai para o checkout no cardápio',
              },
              {
                step: '2',
                title: 'Escolhe como pagar',
                desc: 'Cartão, PIX, débito ou parcelado — tudo disponível',
              },
              {
                step: '3',
                title: 'Pagamento processado',
                desc: 'Mercado Pago processa com segurança — você não precisa fazer nada',
              },
              {
                step: '4',
                title: 'Pedido confirmado',
                desc: 'Chega no painel como "pago" automaticamente',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="rounded-xl bg-zinc-50 p-4 text-center">
                <div className="bg-primary text-primary-foreground mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold">
                  {step}
                </div>
                <h4 className="mb-1 text-sm font-bold">{title}</h4>
                <p className="text-muted-foreground text-xs">{desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
            <h4 className="mb-3 font-semibold">Formas de pagamento aceitas</h4>
            <div className="grid gap-2 md:grid-cols-2">
              {[
                { label: 'Cartão de crédito', detail: 'Visa, Mastercard, Elo, Amex e outras' },
                { label: 'Cartão de débito', detail: 'Principais bandeiras aceitas' },
                { label: 'PIX', detail: 'Confirmação em segundos, disponível 24h' },
                { label: 'Parcelado', detail: 'Até 12x — seu cliente decide' },
              ].map(({ label, detail }) => (
                <div key={label} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                  <span className="text-sm">
                    <strong>{label}</strong> — {detail}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabela comparativa */}
        <div className="mb-16">
          <h2 className="mb-6 text-center text-2xl font-bold">Zairyx vs. concorrentes</h2>
          <div className="overflow-x-auto rounded-2xl border border-zinc-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 text-left">
                  <th className="p-4 font-semibold">Recurso</th>
                  <th className="p-4 text-center font-semibold text-orange-600">Zairyx</th>
                  <th className="p-4 text-center font-semibold text-zinc-500">iFood / Rappi</th>
                  <th className="p-4 text-center font-semibold text-zinc-500">Outros SaaS</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: 'Comissão por pedido',
                    zairyx: '0% da Zairyx',
                    ifood: '12–30%',
                    outros: '0% (mensalidade fixa)',
                    zairyxGood: true,
                  },
                  {
                    feature: 'IA de atendimento 24h',
                    zairyx: '✓ inclusa',
                    ifood: '✗',
                    outros: 'Raramente inclusa',
                    zairyxGood: true,
                  },
                  {
                    feature: 'Pagamento online no cardápio',
                    zairyx: '✓ Mercado Pago nativo',
                    ifood: '✓ (mas eles ficam com %))',
                    outros: 'Alguns têm',
                    zairyxGood: true,
                  },
                  {
                    feature: 'QR Code para mesa/balcão',
                    zairyx: '✓ incluso',
                    ifood: '✗',
                    outros: 'Alguns têm',
                    zairyxGood: true,
                  },
                  {
                    feature: 'Garantia de devolução',
                    zairyx: '7 dias (CDC)',
                    ifood: 'Sem garantia',
                    outros: '7 dias (maioria)',
                    zairyxGood: true,
                  },
                  {
                    feature: 'Marca própria do cliente',
                    zairyx: '✓ sua logo e cores',
                    ifood: '✗ marca do app',
                    outros: 'Varia',
                    zairyxGood: true,
                  },
                  {
                    feature: 'Templates por nicho',
                    zairyx: '15 templates prontos',
                    ifood: '✗',
                    outros: 'Raramente',
                    zairyxGood: true,
                  },
                ].map(({ feature, zairyx, ifood, outros, zairyxGood }) => (
                  <tr key={feature} className="border-t border-zinc-100">
                    <td className="p-4 font-medium">{feature}</td>
                    <td
                      className={`p-4 text-center font-semibold ${zairyxGood ? 'text-green-600' : 'text-zinc-700'}`}
                    >
                      {zairyx}
                    </td>
                    <td className="p-4 text-center text-zinc-500">{ifood}</td>
                    <td className="p-4 text-center text-zinc-500">{outros}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA final */}
        <div className="rounded-2xl bg-zinc-900 p-10 text-center text-white">
          <Shield className="mx-auto mb-4 h-12 w-12 text-orange-400" />
          <h2 className="mb-3 text-3xl font-bold">
            Pare de financiar o iFood. Comece a construir o seu.
          </h2>
          <p className="mx-auto mb-6 max-w-xl text-zinc-300">
            Menos de 30 minutos para ter seu delivery próprio no ar. Sem programador, sem agência,
            {COMMERCIAL_COPY.noPlatformCommission.toLowerCase()}. E com{' '}
            {COMMERCIAL_COPY.withdrawalOnline.toLowerCase()}
            online.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
            >
              Escolher meu template agora
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/precos"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Ver preços
            </Link>
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            Consulte os termos para cancelamento, reembolso e direito de arrependimento.
          </p>
        </div>
      </main>

      {/* Footer simples */}
      <footer className="border-border mt-12 border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm md:flex-row">
          <Link href="/" className="flex items-center gap-2">
            <Store className="text-primary h-5 w-5" />
            <span className="font-bold">Zairyx</span>
          </Link>
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} {COMPANY_NAME}. CNPJ {COMPANY_CNPJ}.
          </p>
          <div className="flex gap-4">
            <Link
              href="/termos"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Termos
            </Link>
            <Link
              href="/privacidade"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
