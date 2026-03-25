'use client'

import Link from 'next/link'
import {
  CheckCircle,
  Clock,
  MessageCircle,
  PiggyBank,
  Shield,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react'

// ─── CONFIGURAÇÃO ─────────────────────────────────────────────────────────────
// Atualize conforme demanda real de suporte

// ─── Bloco 2 — Tabela comparativa ─────────────────────────────────────────────
const COMPARISON_ROWS = [
  {
    outros: 'Cobram percentual sobre cada pedido',
    nos: 'Zero taxa por pedido no seu canal digital',
  },
  {
    outros: 'Mantêm o delivery dependente de plataformas terceiras',
    nos: 'Canal próprio para vender com mais independência',
  },
  {
    outros: 'Dificultam o controle do canal de venda',
    nos: 'Controle direto do atendimento e da operação',
  },
  {
    outros: 'Nem sempre permitem editar o catálogo com liberdade',
    nos: 'Editor visual para atualizar o catálogo com autonomia',
  },
  {
    outros: 'Misturam taxas por pedido com cobranças pouco previsíveis',
    nos: 'Implantação inicial e plano mensal correspondente, sem taxa por pedido',
  },
  {
    outros: 'Exigem desenvolvedor para ajustes simples',
    nos: 'O dono adiciona produtos, edita preços e troca fotos no painel',
  },
] as const

// ─── Bloco 3 — Cards de benefício ─────────────────────────────────────────────
const BENEFIT_CARDS = [
  {
    icon: PiggyBank,
    title: 'Zero Taxa por Pedido — o Lucro É Todo Seu',
    text: 'Plataformas de delivery cobram percentual sobre cada pedido. Aqui você contrata a implantação inicial e mantém o plano mensal correspondente, sem repassar taxa por venda.',
    footer: 'Implantação inicial + plano mensal, sem taxa por pedido',
  },
  {
    icon: Clock,
    title: 'Preparado para Alta Temporada e Picos de Demanda',
    text: 'Férias, feriados, verão no litoral — quando o volume de pedidos dispara, o canal digital organiza o fluxo para sua equipe atender com agilidade.',
    footer: 'Mais Pedidos sem Perder Organização',
  },
  {
    icon: Smartphone,
    title: 'WhatsApp Organizado Mesmo nos Dias de Pico',
    text: 'Os pedidos chegam estruturados com itens, quantidade e observações. Sua equipe processa tudo rápido, mesmo quando o WhatsApp não para de apitar.',
    footer: 'Atendimento Ágil Quando Mais Importa',
  },
  {
    icon: MessageCircle,
    title: 'Aumente o Volume de Vendas por Mês',
    text: 'Catálogo fácil de navegar, fotos atrativas e pedido direto no WhatsApp. O cliente decide rápido e você converte mais — sem depender de plataforma terceira.',
    footer: 'Mais Conversão com Canal Próprio',
  },
] as const

const DIFFERENTIALS = [
  'Atendimento de IA dentro do próprio cardápio digital',
  'Scripts por tipo de delivery: restaurante, pizzaria, bar, cafeteria, adega e mais',
  'Sem depender do WhatsApp do comerciante para atender o cliente',
  'Fluxo simples para vender sem complicar a operação',
  'Painel visual para editar tudo pelo celular',
  'Canal próprio com zero comissão por pedido',
] as const

// ─────────────────────────────────────────────────────────────────────────────
export default function SecaoConversao() {
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
            Canal Próprio · Zero Taxa por Pedido · Alta Temporada sem Caos
          </span>
          <h2
            id="conversao-heading"
            className="text-foreground mx-auto mt-4 max-w-3xl text-3xl leading-tight font-bold tracking-tight md:text-4xl lg:text-5xl"
          >
            Venda Mais, Zero Taxa por Pedido.
            <br />
            <span className="text-primary">Seu Canal Digital Zairyx com Controle Total.</span>
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg md:text-xl">
            Tenha seu próprio canal de vendas, com zero taxa por pedido e com painel visual que
            qualquer pessoa da equipe consegue usar.{' '}
            <span className="text-foreground font-semibold">
              Preparado para alta temporada, feriados e picos de demanda.
            </span>{' '}
            <span className="text-foreground font-medium">
              Se preferir, nossa equipe também pode conduzir a implantação inicial para você.
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
                ❌ Aplicativos e Soluções Genéricas
              </p>
              <ul className="space-y-3">
                {COMPARISON_ROWS.map((row, i) => (
                  <li
                    key={row.outros}
                    className="text-muted-foreground flex items-start gap-2 text-sm line-through"
                  >
                    <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    {row.outros}
                  </li>
                ))}
              </ul>
            </div>

            {/* Coluna direita — Canal Digital */}
            <div className="border-primary/30 bg-primary/5 p-5">
              <p className="text-primary mb-4 text-center text-sm font-bold tracking-wider uppercase">
                ✅ Canal Digital Zairyx
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

        {/* ═══════════════════════════════════════════════════════════════════
            DIFERENCIAIS — IA e operação sem WhatsApp do comerciante
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-12 rounded-2xl border border-zinc-200 bg-white p-6 md:mb-16 md:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-11 w-11 items-center justify-center rounded-xl">
              <Sparkles className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-primary text-sm font-semibold tracking-wider uppercase">
                Diferenciais da IA
              </p>
              <h3 className="text-foreground text-xl font-bold md:text-2xl">
                Atendimento inteligente dentro do cardápio digital
              </h3>
            </div>
          </div>

          <p className="text-muted-foreground mb-5 text-sm leading-6 md:text-base">
            O atendimento fica no próprio cardápio digital, sem depender do WhatsApp do comerciante
            para resolver dúvidas simples. Isso reduz ruído, evita exposição do número e deixa a
            operação mais organizada.
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            {DIFFERENTIALS.map((item) => (
              <div key={item} className="border-border bg-muted/30 rounded-xl border px-4 py-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                  <span className="text-foreground text-sm leading-6">{item}</span>
                </div>
              </div>
            ))}
          </div>
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
                Garantia de 30 Dias com Processo Simples
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
