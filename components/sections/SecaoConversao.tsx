'use client'

import Link from 'next/link'
import {
  CheckCircle,
  MessageCircle,
  PiggyBank,
  Shield,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react'
import { COMMERCIAL_COPY } from '@/lib/domains/marketing/commercial-copy'

// ─── CONFIGURAÇÃO ─────────────────────────────────────────────────────────────
// Atualize conforme demanda real de suporte

// ─── Bloco 2 — Tabela comparativa ─────────────────────────────────────────────
const COMPARISON_ROWS = [
  {
    antes: 'Cadastrar produtos um por um do zero',
    depois: 'Catálogo pronto do seu nicho — só editar',
  },
  {
    antes: 'Depender de programador para qualquer ajuste',
    depois: 'Editor visual que funciona no celular',
  },
  {
    antes: 'Pedidos desorganizados por mensagem',
    depois: 'Pedidos estruturados direto no WhatsApp',
  },
  {
    antes: 'Catálogo genérico sem identidade',
    depois: 'Sua marca, suas cores, seus preços',
  },
  {
    antes: 'Sem atendimento fora do horário comercial',
    depois: 'IA assistente 24h dentro do cardápio',
  },
  {
    antes: 'Semanas para colocar no ar',
    depois: 'Pronto para vender em minutos',
  },
] as const

// ─── Bloco 3 — Cards de benefício ─────────────────────────────────────────────
const BENEFIT_CARDS = [
  {
    icon: Sparkles,
    title: 'Catálogo Pronto do Seu Nicho',
    text: 'Nada de cadastrar produto por produto. Seu cardápio já vem com itens reais, descrições e categorias organizadas. Só trocar o que quiser e publicar.',
    footer: 'Saia vendendo desde o primeiro dia',
  },
  {
    icon: Smartphone,
    title: 'Editor Simples Como WhatsApp',
    text: 'Troque preço, foto e descrição pelo celular em poucos cliques. Se você manda áudio no WhatsApp, você usa o painel da Zairyx sem treinamento.',
    footer: 'Sem precisar de programador',
  },
  {
    icon: MessageCircle,
    title: 'Pedidos Organizados no WhatsApp',
    text: 'Os pedidos chegam estruturados com itens, quantidade e observações. Sua equipe processa tudo rápido, mesmo nos dias de pico.',
    footer: 'Atendimento ágil quando mais importa',
  },
  {
    icon: PiggyBank,
    title: `Mensalidade Fixa, ${COMMERCIAL_COPY.noPlatformCommission}`,
    text: 'Vendeu R$ 1.000 ou R$ 100.000 no mês? O valor do plano nao muda. Sem surpresa no fim do mês e sem percentual da Zairyx sobre cada venda.',
    footer: 'Mais previsibilidade de margem',
  },
] as const

const DIFFERENTIALS = [
  'IA assistente dentro do próprio cardápio digital — atende 24h',
  'Scripts personalizados por nicho: pizzaria, bar, cafeteria, mercado e mais',
  'Cliente resolve dúvidas sem precisar ligar ou mandar mensagem',
  'Fluxo simples: escolheu, montou, pediu — sem complicação',
  'Painel visual para editar tudo pelo celular, de qualquer lugar',
  'Catálogo estratégico com produtos organizados para vender mais',
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
            Produto Pronto · Editor Simples · Venda no Mesmo Dia
          </span>
          <h2
            id="conversao-heading"
            className="text-foreground mx-auto mt-4 max-w-3xl text-3xl leading-tight font-bold tracking-tight md:text-4xl lg:text-5xl"
          >
            Seu canal de vendas pronto.
            <br />
            <span className="text-primary">Você só edita e começa a vender.</span>
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg md:text-xl">
            Catálogo completo do seu nicho, editor visual pelo celular e pedidos organizados no
            WhatsApp.{' '}
            <span className="text-foreground font-semibold">
              Tudo pronto para funcionar desde o primeiro dia.
            </span>{' '}
            <span className="text-foreground font-medium">
              Se preferir, nossa equipe conduz a implantação inicial para você.
            </span>
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            BLOCO 2 — Comparativo: Nós vs Outros
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-12 overflow-hidden rounded-xl border md:mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Coluna esquerda — Os outros */}
            <div className="border-border bg-muted/30 border-b p-5 md:border-r md:border-b-0">
              <p className="text-muted-foreground mb-4 text-center text-sm font-semibold tracking-wider uppercase">
                ❌ Começar do zero
              </p>
              <ul className="space-y-3">
                {COMPARISON_ROWS.map((row, i) => (
                  <li
                    key={row.antes}
                    className="text-muted-foreground flex items-start gap-2 text-sm line-through"
                  >
                    <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    {row.antes}
                  </li>
                ))}
              </ul>
            </div>

            {/* Coluna direita — Canal Digital */}
            <div className="border-primary/30 bg-primary/5 p-5">
              <p className="text-primary mb-4 text-center text-sm font-bold tracking-wider uppercase">
                ✅ Com a Zairyx
              </p>
              <ul className="space-y-3">
                {COMPARISON_ROWS.map((row, i) => (
                  <li
                    key={row.depois}
                    className="text-foreground flex items-start gap-2 text-sm font-medium"
                  >
                    <CheckCircle className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                    <span>{row.depois}</span>
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
                {COMMERCIAL_COPY.withdrawalOnline}
              </h3>
              <p className="text-muted-foreground mt-2 leading-6">
                Você pode contratar e avaliar se a plataforma faz sentido para a sua operação. Na
                contratação online, o cancelamento em até 7 dias corridos segue o Art. 49 do CDC,
                conforme os termos vigentes.
              </p>
              <p className="text-muted-foreground mt-4 text-sm">
                🔒 Mais clareza comercial para decidir com confiança.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
