import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Download, ExternalLink, Gift, Star } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Bônus Exclusivos | Zairyx',
  description: 'Acesse seu e-book gratuito de Google Meu Negócio e outros materiais exclusivos',
}

export default function BonusPublicPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
          <Link
            href="/"
            className="text-foreground/80 hover:text-foreground flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Início
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Gift className="text-primary h-5 w-5" />
            <span className="text-foreground font-semibold">Seus Materiais Exclusivos</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        {/* Hero */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700 dark:bg-purple-900 dark:text-purple-100">
            <Star className="h-4 w-4" />
            Assinante Premium
          </div>
          <h1 className="text-foreground mb-3 text-3xl font-bold md:text-4xl">
            Seus Materiais Exclusivos
          </h1>
          <p className="text-foreground/80 mx-auto max-w-2xl">
            Como assinante Zairyx, você tem acesso a conteúdos premium que valem mais de{' '}
            <strong className="text-foreground">R$ 547</strong> — 100% grátis.
          </p>
        </div>

        {/* E-book Card */}
        <div className="mb-6 overflow-hidden rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 shadow-xl dark:border-purple-800 dark:from-purple-950/50 dark:via-blue-950/50 dark:to-indigo-950/50">
          <div className="p-8">
            {/* Header do Card */}
            <div className="mb-6 flex items-start gap-6">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-4xl shadow-lg">
                📍
              </div>
              <div className="flex-1">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-green-300 bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:border-green-700 dark:bg-green-900 dark:text-green-100">
                  <Gift className="h-3 w-3" />
                  DISPONÍVEL AGORA
                </div>
                <h2 className="mb-2 text-2xl font-bold text-purple-900 dark:text-purple-100">
                  Google Meu Negócio
                </h2>
                <p className="text-purple-800 dark:text-purple-200">
                  Guia Completo de Configuração Profissional
                </p>
              </div>
              <div className="hidden shrink-0 rounded-xl border border-purple-300 bg-white px-4 py-2 text-center dark:border-purple-700 dark:bg-purple-900 md:block">
                <div className="text-foreground/60 text-xs">Valor</div>
                <div className="text-primary text-2xl font-bold">R$ 197</div>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="mb-6 space-y-3 rounded-xl border border-purple-200 bg-white/60 p-5 dark:border-purple-800 dark:bg-purple-950/30">
              <h3 className="flex items-center gap-2 font-semibold text-purple-900 dark:text-purple-100">
                <BookOpen className="h-5 w-5" />
                O que você vai aprender:
              </h3>
              <ul className="space-y-2 text-sm text-purple-900/90 dark:text-purple-100/90">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-green-600 dark:text-green-400">✓</span>
                  <span>
                    <strong>92 páginas</strong> de passo a passo completo — do cadastro à otimização
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-green-600 dark:text-green-400">✓</span>
                  <span>
                    Dados oficiais do Google: <strong>46%, 76%, 28%</strong> de conversão local
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-green-600 dark:text-green-400">✓</span>
                  <span>
                    Como economizar <strong>R$ 350-800</strong> fazendo setup você mesmo
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-green-600 dark:text-green-400">✓</span>
                  <span>
                    <strong>20 melhores práticas</strong> de otimização + 8 erros fatais a evitar
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-green-600 dark:text-green-400">✓</span>
                  <span>
                    Modelos prontos de respostas a avaliações (5 cenários com exemplos)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-green-600 dark:text-green-400">✓</span>
                  <span>
                    Integração com seu cardápio digital Zairyx + checklist de 40+ itens
                  </span>
                </li>
              </ul>
            </div>

            {/* Botão de Download */}
            <a
              href="/Ebook-GMB-Profissional-v2.md"
              download="Google-Meu-Negocio-Guia-Completo-Zairyx.md"
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              <Download className="h-5 w-5 transition-transform group-hover:translate-y-0.5" />
              <span>Baixar E-book Agora (92 páginas)</span>
            </a>

            <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-center text-xs font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-100">
              📄 Formato: Markdown (.md) — Abra em qualquer editor de texto ou VS Code
            </div>
          </div>
        </div>

        {/* Setup Assistido */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-md">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-2xl dark:bg-blue-900">
                🛠️
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-bold text-foreground">
                  Setup Assistido (Bônus Extra)
                </h3>
                <p className="text-foreground/80 mb-4 text-sm">
                  Prefere que nossa equipe configure seu Google Meu Negócio para você?{' '}
                  <strong className="text-foreground">
                    Economize R$ 350 fazendo agendamento direto.
                  </strong>
                </p>
                <Link
                  href="https://wa.me/5512988331095?text=Olá!%20Sou%20assinante%20Zairyx%20e%20gostaria%20de%20agendar%20o%20setup%20assistido%20do%20Google%20Meu%20Negócio%20(bônus%20gratuito)."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-primary text-primary hover:bg-primary/5 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Agendar pelo WhatsApp
                </Link>
              </div>
              <div className="hidden shrink-0 rounded-lg border border-green-300 bg-green-100 px-3 py-1.5 text-center dark:border-green-700 dark:bg-green-900 md:block">
                <div className="text-xs text-green-700 dark:text-green-300">Valor</div>
                <div className="text-lg font-bold text-green-700 dark:text-green-300">R$ 350</div>
              </div>
            </div>
          </div>
        </div>

        {/* Economia Total */}
        <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 text-center shadow-md dark:border-green-800 dark:from-green-950/30 dark:to-emerald-950/30">
          <div className="mb-3 text-4xl">💰</div>
          <h3 className="mb-2 text-xl font-bold text-green-900 dark:text-green-100">
            Economia Total com Bônus
          </h3>
          <div className="mb-4 flex items-center justify-center gap-3">
            <div>
              <div className="text-foreground/60 text-xs">E-book</div>
              <div className="text-foreground text-lg font-semibold">R$ 197</div>
            </div>
            <div className="text-2xl">+</div>
            <div>
              <div className="text-foreground/60 text-xs">Setup</div>
              <div className="text-foreground text-lg font-semibold">R$ 350</div>
            </div>
            <div className="text-2xl">=</div>
            <div>
              <div className="text-green-700 dark:text-green-300 text-xs font-bold">TOTAL</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">R$ 547</div>
            </div>
          </div>
          <p className="text-foreground/80 text-sm">
            Tudo isso <strong className="text-foreground">100% GRÁTIS</strong> como agradecimento por
            ser assinante Zairyx 🎉
          </p>
        </div>

        {/* CTA para adquirir plano */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-foreground/80 mb-4 text-sm">
            Ainda não é assinante? Adquira qualquer plano e ganhe este bônus:
          </p>
          <Link
            href="/precos"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-colors"
          >
            Ver Planos e Preços
          </Link>
        </div>
      </main>
    </div>
  )
}
