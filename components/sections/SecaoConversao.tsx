'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Check,
  CheckCircle,
  Clock,
  MessageCircle,
  PiggyBank,
  Shield,
  Smartphone,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import { getTemplateCatalog } from '@/lib/templates-config'
import { getTemplatePricing, PUBLIC_SUBSCRIPTION_PRICES } from '@/lib/pricing'
import { cn } from '@/lib/utils'

// ─── CONFIGURAÇÃO ─────────────────────────────────────────────────────────────
// Atualize conforme demanda real de suporte

// ─── Bloco 2 — Tabela comparativa ─────────────────────────────────────────────
const COMPARISON_ROWS = [
  {
    outros: 'Cobram comissão sobre pedidos',
    nos: '0% de comissão sobre os pedidos do seu cardápio',
  },
  {
    outros: 'Mantêm o restaurante dependente de plataformas terceiras',
    nos: 'Canal próprio para vender com mais independência',
  },
  {
    outros: 'Dificultam o controle do canal de venda',
    nos: 'Controle direto do atendimento e da operação',
  },
  {
    outros: 'Nem sempre permitem editar o cardápio com liberdade',
    nos: 'Editor visual para atualizar o cardápio com autonomia',
  },
  {
    outros: 'Escondem setup, mensalidade ou regra de cancelamento',
    nos: 'Implantação e plano mensal exibidos com clareza antes da compra',
  },
  {
    outros: 'Exigem desenvolvedor para ajustes simples',
    nos: 'O dono adiciona produtos, edita preços e troca fotos no painel',
  },
] as const

// ─── Bloco 3 — Cards de benefício ─────────────────────────────────────────────
const BENEFIT_CARDS = [
  {
    icon: Clock,
    title: 'Atualizações rápidas, sem travar a operação',
    text: 'Mudou preço, acabou um item ou entrou uma promoção? Você ajusta o cardápio em poucos passos e mantém atendimento e operação falando a mesma língua.',
    footer: 'Ritmo de atualização compatível com a rotina real',
  },
  {
    icon: PiggyBank,
    title: 'Estrutura profissional, sem dependência técnica',
    text: 'O restaurante ganha autonomia para operar o próprio canal e reduz a necessidade de pedir ajustes simples para terceiros.',
    footer: 'Mais controle sobre a operação digital',
  },
  {
    icon: Smartphone,
    title: 'Painel pensado para o ritmo do restaurante',
    text: 'Produtos, preços, fotos e categorias ficam na sua mão, pelo celular ou computador, com uma edição visual fácil de manter.',
    footer: 'Operação simples para quem precisa agilidade',
  },
  {
    icon: MessageCircle,
    title: 'Canal próprio, atendimento direto',
    text: 'Seu cliente escolhe com clareza e o pedido chega no WhatsApp do negócio, sem comissão por pedido e sem intermediação desnecessária.',
    footer: 'Mais margem e relação direta com o cliente',
  },
] as const

// ─────────────────────────────────────────────────────────────────────────────
export default function SecaoConversao() {
  const templates = getTemplateCatalog()
  const selfServicePix = templates.map(
    (template) => getTemplatePricing(template.slug).selfService.pix
  )
  const selfServiceCard = templates.map(
    (template) => getTemplatePricing(template.slug).selfService.card
  )
  const fpvcPix = templates.map((template) => getTemplatePricing(template.slug).feitoPraVoce.pix)
  const fpvcCard = templates.map((template) => getTemplatePricing(template.slug).feitoPraVoce.card)

  const plans = [
    {
      id: 'self-service',
      destaque: false,
      icon: Zap,
      iconColor: 'text-foreground/70',
      iconBg: 'bg-secondary',
      badge: null,
      titulo: 'Você configura',
      subtitulo: 'Para quem quer lançar rápido e ajustar tudo pelo painel.',
      preco: Math.min(...selfServicePix),
      faixa: `Depois R$ ${PUBLIC_SUBSCRIPTION_PRICES.basico.monthly}/mês`,
      href: '/templates',
      ariaLabel: 'Escolher template na opção Você configura',
      ctaTexto: 'Escolher template',
      itens: [
        '1 restaurante ativo',
        'Editor visual do cardápio',
        'QR Code e link público',
        'Pedidos via WhatsApp',
        'Hospedagem incluída',
      ],
    },
    {
      id: 'feito-pra-voce',
      destaque: true,
      icon: Sparkles,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
      badge: '⭐ Mais escolhido',
      titulo: 'Equipe configura',
      subtitulo: 'Para quem quer comprar agora e deixar a configuração com a equipe.',
      preco: Math.min(...fpvcPix),
      faixa: `Depois R$ ${PUBLIC_SUBSCRIPTION_PRICES.pro.monthly}/mês`,
      href: '/templates',
      ariaLabel: 'Escolher template na opção Equipe configura',
      ctaTexto: 'Ver opções de compra',
      itens: [
        'Tudo da opção Você configura',
        'Montagem pela nossa equipe',
        'Envio de fotos e preços depois da compra',
        'Acompanhamento na ativação',
        'Suporte prioritário',
      ],
    },
  ] as const

  return (
    <section
      id="conversao"
      role="region"
      aria-labelledby="conversao-heading"
      className="border-border bg-muted/30 border-t px-4 py-12 md:py-16"
    >
      <div className="mx-auto max-w-4xl">
        {/* ═══════════════════════════════════════════════════════════════════
            BLOCO 1 — Headline: mata o medo de tecnologia nos primeiros 3s
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-12 text-center md:mb-16">
          <span className="border-primary/20 bg-primary/10 text-primary mb-4 inline-flex rounded-full border px-4 py-1.5 text-sm font-medium">
            Operação própria, visual profissional e 0% de comissão por pedido.
          </span>
          <h2
            id="conversao-heading"
            className="text-foreground mx-auto mt-4 max-w-3xl text-3xl leading-tight font-bold tracking-tight md:text-4xl lg:text-5xl"
          >
            Estrutura profissional para vender com clareza.
            <br />
            <span className="text-primary">
              Sua equipe mantém tudo no painel, sem dependência técnica.
            </span>
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg md:text-xl">
            Seu cardápio evolui com a rotina do negócio: produtos, preços, imagens e categorias
            podem ser ajustados sem fricção, sempre no seu próprio canal.{' '}
            <span className="text-foreground font-semibold">
              A experiência foi pensada para quem precisa resolver rápido, não para quem quer
              aprender software complexo.
            </span>{' '}
            <span className="text-foreground font-medium">
              E se preferir, nossa equipe conduz a configuração inicial por você.
            </span>
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            BLOCO 2 — Comparativo: Nós vs Outros
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-12 overflow-hidden rounded-xl border md:mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Coluna esquerda — Os outros */}
            <div className="border-border bg-destructive/5 border-b p-5 md:border-r md:border-b-0">
              <p className="text-muted-foreground mb-4 text-center text-sm font-semibold tracking-wider uppercase">
                ❌ Aplicativos e soluções genéricas
              </p>
              <ul className="space-y-3">
                {COMPARISON_ROWS.map((row, i) => (
                  <li
                    key={row.outros}
                    className="text-muted-foreground flex items-start gap-2 text-sm line-through opacity-50"
                  >
                    <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    {row.outros}
                  </li>
                ))}
              </ul>
            </div>

            {/* Coluna direita — Cardápio Digital */}
            <div className="border-primary/30 bg-primary/5 p-5">
              <p className="text-primary mb-4 text-center text-sm font-bold tracking-wider uppercase">
                ✅ Cardápio Digital
              </p>
              <ul className="space-y-3">
                {COMPARISON_ROWS.map((row, i) => (
                  <li
                    key={row.nos}
                    className="text-foreground flex items-start gap-2 text-sm font-medium"
                  >
                    <CheckCircle className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                    <span>{row.nos}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            BLOCO 3 — Cards de benefício com prova real
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-12 grid gap-6 md:mb-16 md:grid-cols-2">
          {BENEFIT_CARDS.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.title}
                className="border-border bg-card rounded-xl border p-6 transition-shadow duration-200 hover:shadow-lg"
              >
                <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="text-foreground text-lg font-semibold">{card.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">{card.text}</p>
                <div className="border-border/50 mt-4 border-t pt-4">
                  <p className="text-primary text-sm font-medium">{card.footer}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mb-12 md:mb-16">
          <h3 className="text-foreground mb-2 text-center text-2xl font-bold">
            Escolha como quer entrar no ar
          </h3>
          <p className="text-muted-foreground mb-2 text-center text-sm">
            A proposta comercial é objetiva: um valor para começar e um valor mensal para manter a
            operação com previsibilidade.
          </p>
          <p className="text-muted-foreground mb-8 text-center text-xs">
            Primeiro você escolhe o template. Depois decide se quer configurar sozinho ou deixar a
            equipe fazer isso por você.
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            {plans.map((plan) => {
              const Icon = plan.icon
              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative flex flex-col rounded-xl border-2 p-6 transition-all duration-200',
                    plan.destaque
                      ? 'secao-conversao-glow border-primary bg-primary/5 shadow-xl'
                      : 'border-border bg-card hover:shadow-md'
                  )}
                >
                  {plan.badge && (
                    <span className="bg-primary text-primary-foreground absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap">
                      {plan.badge}
                    </span>
                  )}

                  <div className={cn('mb-3 inline-flex rounded-xl p-2.5', plan.iconBg)}>
                    <Icon className={cn('h-5 w-5', plan.iconColor)} aria-hidden />
                  </div>

                  <h4 className="text-foreground text-lg font-bold">{plan.titulo}</h4>
                  <p className="text-muted-foreground mb-4 text-xs leading-5">{plan.subtitulo}</p>

                  <div className="mb-5">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      Hoje
                    </p>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span
                        className={cn(
                          'text-3xl font-black',
                          plan.destaque ? 'text-primary' : 'text-foreground'
                        )}
                      >
                        R$ {plan.preco}
                      </span>
                      <span className="text-muted-foreground text-sm">no PIX</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs">{plan.faixa}</p>
                  </div>

                  <ul className="mb-6 flex-1 space-y-2">
                    {plan.itens.map((item) => (
                      <li key={item} className="text-foreground flex items-start gap-2 text-sm">
                        <Check
                          className={cn(
                            'mt-0.5 h-4 w-4 shrink-0',
                            plan.destaque ? 'text-primary' : 'text-green-500'
                          )}
                          aria-hidden
                        />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.href}
                    aria-label={plan.ariaLabel}
                    className={cn(
                      'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors',
                      plan.destaque
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'border-border text-foreground bg-background hover:bg-secondary border'
                    )}
                  >
                    {plan.ctaTexto}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              )
            })}
          </div>

          <p className="text-muted-foreground mt-6 text-center text-sm">
            Os dois modelos incluem suporte humano e uma jornada comercial sem cobrança escondida.
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            BLOCO 5 — Garantia: remove o último medo antes do clique
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="border-primary/20 bg-primary/5 mx-auto max-w-2xl rounded-2xl border p-8">
          <div className="flex flex-col items-center text-center md:flex-row md:items-start md:text-left">
            <div className="bg-primary/10 mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl md:mr-6 md:mb-0">
              <Shield className="text-primary h-8 w-8" aria-hidden />
            </div>
            <div>
              <h3 className="text-foreground text-xl font-bold">
                Garantia de 30 dias com processo simples
              </h3>
              <p className="text-muted-foreground mt-2 leading-6">
                Você pode contratar, usar a plataforma na rotina do seu negócio e validar se ela faz
                sentido para a sua operação. Se entender que não atende ao que precisa, o reembolso
                é integral e sem burocracia.
              </p>
              <p className="text-muted-foreground mt-4 text-sm">
                🔒 Mais segurança para decidir com confiança.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
