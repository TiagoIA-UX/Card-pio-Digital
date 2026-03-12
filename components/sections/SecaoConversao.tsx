'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Check,
  CheckCircle,
  Clock,
  MessageCircle,
  Shield,
  Smartphone,
  Sparkles,
  Wrench,
  X,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── CONFIGURAÇÃO ─────────────────────────────────────────────────────────────
// Atualize conforme demanda real de suporte

// ─── Bloco 2 — Tabela comparativa ─────────────────────────────────────────────
const COMPARISON_ROWS = [
  {
    outros: 'Você monta tudo do zero',
    nos: 'Template pronto do seu tipo de negócio',
  },
  {
    outros: 'Suporte por ticket — espera dias',
    nos: 'Suporte humano via WhatsApp',
  },
  {
    outros: 'Mensalidade eterna, sem saída',
    nos: 'Pagamento único. Sem mensalidade recorrente',
  },
  {
    outros: 'Interface de técnico',
    nos: 'Edita igual a um contato no celular',
  },
  {
    outros: 'Plataformas de delivery cobram comissão',
    nos: 'Sem comissão. Seu cardápio, suas regras',
  },
  {
    outros: 'Precisa chamar alguém pra mudar preço',
    nos: 'Você muda em 30 segundos, do celular',
  },
] as const

// ─── Bloco 3 — Cards de benefício ─────────────────────────────────────────────
const BENEFIT_CARDS = [
  {
    icon: Clock,
    title: 'Muda um preço em 30 segundos',
    text: 'Acabou o frango? Desativa em 2 cliques. Promoção no fim de semana? Cria um destaque sem precisar de ninguém.',
    footer: '⏱️ Tempo médio de edição: 30 segundos',
  },
  {
    icon: Smartphone,
    title: 'Se você usa WhatsApp, você edita',
    text: 'O painel foi feito para dono de delivery e negócio alimentício, não para programador. Clica, digita, salva. Só isso.',
    footer: '📱 Funciona pelo celular, sem instalar nada',
  },
  {
    icon: MessageCircle,
    title: 'O pedido chega pronto no seu WhatsApp',
    text: 'O cliente escolhe no cardápio, clica em pedir, e você recebe tudo organizado. Sem app. Sem maquineta. Sem comissão.',
    footer: '💸 Sem comissão sobre pedidos no seu cardápio digital',
  },
] as const

// ─── Bloco 4 — Planos (preços variam por template — ver /precos) ───────────────
const PLANS = [
  {
    id: 'self-service',
    destaque: false,
    icon: Wrench,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-500/10',
    badge: null,
    titulo: 'Faça Você Mesmo',
    subtitulo: 'Você configura no painel, no seu ritmo',
    precoPix: 197,
    precoCartao: 237,
    parcelas: 3,
    parcelaValor: 79,
    precoLabel: 'a partir de',
    href: '/templates',
    hrefPrecos: '/precos',
    ariaLabel: 'Escolher plano Faça Você Mesmo a partir de 197 reais no PIX',
    ctaTexto: 'Quero fazer eu mesmo',
    itens: [
      'Template completo pronto para usar',
      'Painel simples — edita pelo celular',
      'Você adiciona seus produtos e fotos',
      'Suporte via WhatsApp',
      'Hospedagem inclusa',
    ],
  },
  {
    id: 'feito-pra-voce',
    destaque: true,
    icon: Sparkles,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    badge: '⭐ MAIS POPULAR',
    titulo: 'Feito Pra Você',
    subtitulo: 'A equipe monta tudo. Você só aprova.',
    precoPix: 497,
    precoCartao: 597,
    parcelas: 3,
    parcelaValor: 199,
    precoLabel: 'a partir de',
    href: '/templates',
    hrefPrecos: '/precos',
    ariaLabel: 'Escolher plano Feito Pra Você a partir de 497 reais no PIX',
    ctaTexto: 'Quero que montem pra mim',
    itens: [
      'Tudo do plano Faça Você Mesmo',
      'Cardápio montado pela equipe em até 48h úteis após envio das informações',
      'Seus produtos com fotos e preços',
      'Configuração completa do WhatsApp',
      'Suporte prioritário',
    ],
  },
] as const

/** Hook: dispara animação quando elemento entra na viewport */
function useInView(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setIsInView(true)
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isInView }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SecaoConversao() {
  const { ref: sectionRef, isInView } = useInView(0.08)

  return (
    <section
      ref={sectionRef}
      id="conversao"
      role="region"
      aria-labelledby="conversao-heading"
      className={cn(
        'border-border bg-muted/30 border-t px-4 py-12 transition-all duration-700 md:py-16',
        isInView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      )}
    >
      <div className="mx-auto max-w-4xl">
        {/* ═══════════════════════════════════════════════════════════════════
            BLOCO 1 — Headline: mata o medo de tecnologia nos primeiros 3s
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-12 text-center md:mb-16">
          <span className="border-primary/20 bg-primary/10 text-primary mb-4 inline-flex rounded-full border px-4 py-1.5 text-sm font-medium">
            Sem técnico. Sem curso. Sem complicação.
          </span>
          <h2
            id="conversao-heading"
            className="text-foreground mx-auto mt-4 max-w-3xl text-3xl leading-tight font-bold tracking-tight md:text-4xl lg:text-5xl"
          >
            Você faz a comida.
            <br />
            <span className="text-primary">A gente cuida do cardápio.</span>
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg md:text-xl">
            Se você sabe mandar mensagem no WhatsApp, você já sabe editar seu cardápio.{' '}
            <span className="text-foreground font-medium">
              E se preferir, a gente monta tudo por você.
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
                ❌ Os outros
              </p>
              <ul className="space-y-3">
                {COMPARISON_ROWS.map((row, i) => (
                  <li
                    key={row.outros}
                    className={cn(
                      'text-muted-foreground flex items-start gap-2 text-sm line-through transition-all duration-500',
                      isInView ? 'opacity-50' : 'opacity-0'
                    )}
                    style={{ transitionDelay: `${i * 100}ms` }}
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
                    className={cn(
                      'text-foreground flex items-start gap-2 text-sm font-medium transition-all duration-500',
                      isInView ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
                    )}
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    <CheckCircle className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                    <span>
                      {row.nos.includes('30 segundos') ? (
                        <>
                          Você muda em <strong>30 segundos</strong>, do celular
                        </>
                      ) : row.nos.includes('Cada real') ? (
                        <>
                          Zero comissão. <strong>Cada real</strong> vai pra você
                        </>
                      ) : (
                        row.nos
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            BLOCO 3 — Cards de benefício com prova real
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-12 grid gap-6 md:mb-16 md:grid-cols-3">
          {BENEFIT_CARDS.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.title}
                className="border-border bg-card hover:border-primary/40 rounded-xl border p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
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

        {/* ═══════════════════════════════════════════════════════════════════
            BLOCO 4 — Planos
            Psicologia: quem tem medo de tecnologia → "Feito Pra Você"
                        quem quer economizar → "Faça Você Mesmo"
                        Os dois convertem. Ninguém sai sem escolher.
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-12 md:mb-16">
          <h3 className="text-foreground mb-2 text-center text-2xl font-bold">
            Escolha como quer começar
          </h3>
          <p className="text-muted-foreground mb-8 text-center text-sm">
            Você edita quando quiser — ou a gente monta tudo por você em até 48 horas úteis.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {PLANS.map((plan) => {
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
                  {/* Badge "Mais Popular" */}
                  {plan.badge && (
                    <span className="bg-primary text-primary-foreground absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold">
                      {plan.badge}
                    </span>
                  )}

                  {/* Cabeçalho */}
                  <div className="mb-5 flex items-start gap-4">
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                        plan.iconBg
                      )}
                    >
                      <Icon className={cn('h-6 w-6', plan.iconColor)} aria-hidden />
                    </div>
                    <div>
                      <h4 className="text-foreground text-lg font-bold">{plan.titulo}</h4>
                      <p className="text-muted-foreground text-sm">{plan.subtitulo}</p>
                    </div>
                  </div>

                  {/* Preço */}
                  <div className="mb-5">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          'text-4xl font-black',
                          plan.destaque ? 'text-primary' : 'text-foreground'
                        )}
                      >
                        {plan.precoLabel ? `${plan.precoLabel} R$ ` : 'R$ '}
                        {plan.precoPix}
                      </span>
                      <span className="text-muted-foreground text-sm">à vista no PIX</span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      ou {plan.parcelas}x de R$ {plan.parcelaValor} no cartão
                    </p>
                    {plan.hrefPrecos && (
                      <Link
                        href={plan.hrefPrecos}
                        className="text-primary mt-1 inline-block text-xs font-medium hover:underline"
                      >
                        Ver tabela completa de preços →
                      </Link>
                    )}
                    {/* Destaque exclusivo do plano Feito Pra Você */}
                    {plan.destaque && (
                      <div className="bg-primary/10 border-primary/20 mt-3 rounded-lg border p-2.5">
                        <p className="text-primary text-sm font-semibold">
                          🕐 Cardápio pronto em até 48 horas úteis
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          Você foca no negócio. A equipe resolve o cardápio.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Lista de itens */}
                  <ul className="mb-6 flex-1 space-y-2">
                    {plan.itens.map((item) => (
                      <li key={item} className="text-foreground flex items-start gap-2 text-sm">
                        <Check
                          className={cn(
                            'mt-0.5 h-4 w-4 shrink-0',
                            plan.destaque ? 'text-primary' : 'text-blue-500'
                          )}
                          aria-hidden
                        />
                        {item}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href={plan.href}
                    aria-label={plan.ariaLabel}
                    className={cn(
                      'flex w-full items-center justify-center gap-2 rounded-lg px-6 py-4 font-semibold shadow transition-all',
                      plan.destaque
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 text-base hover:scale-[1.02]'
                        : 'border-border text-foreground bg-background hover:bg-secondary border text-sm'
                    )}
                  >
                    {plan.destaque && <Zap className="h-4 w-4" aria-hidden />}
                    {plan.ctaTexto}
                  </Link>
                </div>
              )
            })}
          </div>

          {/* Urgência com variável dinâmica */}
          <p className="text-muted-foreground mt-6 text-center text-sm">
            Suporte humano disponível para todos os clientes. Tire suas dúvidas pelo WhatsApp antes
            de comprar.
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
                Garantia de 30 dias sem burocracia
              </h3>
              <p className="text-muted-foreground mt-2 leading-6">
                Pague hoje. Use por 30 dias completos. Se você achar que não valeu — por qualquer
                motivo — a gente devolve tudo. Sem formulário, sem pergunta, sem stress. O risco é
                nosso, não seu.
              </p>
              <p className="text-muted-foreground mt-4 text-sm">
                🔒 Garantia real. Se não gostar, basta avisar no WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
