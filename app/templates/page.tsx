'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Eye, Sparkles } from 'lucide-react'
import { TemplateCard } from '@/components/templates/template-card'
import { getTemplateCatalog } from '@/lib/templates-config'

const templates = getTemplateCatalog()

export default function TemplatesPage() {
  return (
    <main className="bg-background min-h-screen">
      {/* Header */}
      <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="text-foreground hover:text-primary text-lg font-bold transition-colors"
          >
            ← Voltar
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/ofertas" className="text-primary text-sm font-medium hover:underline">
              Ver Planos
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="from-primary/5 to-background bg-gradient-to-b px-4 py-12 md:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="bg-primary/10 text-primary mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" />7 Templates Profissionais
          </div>
          <h1 className="text-foreground mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            Escolha o Template Perfeito
          </h1>
          <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
            Cada demo abaixo reutiliza o mesmo template que o restaurante recebe no onboarding pago.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/ofertas"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors"
            >
              <Eye className="h-4 w-4" />
              Comparar planos SaaS
            </Link>
          </div>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          {/* Stats */}
          <div className="mb-8 flex flex-wrap justify-center gap-8 text-center">
            <div>
              <div className="text-foreground text-2xl font-bold">7</div>
              <div className="text-muted-foreground text-sm">Templates</div>
            </div>
            <div>
              <div className="text-foreground text-2xl font-bold">500+</div>
              <div className="text-muted-foreground text-sm">Clientes</div>
            </div>
            <div>
              <div className="text-foreground text-2xl font-bold">4.8</div>
              <div className="text-muted-foreground text-sm">Avaliação média</div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-foreground mb-4 text-2xl font-bold">
            Assinatura SaaS com template instalado automaticamente
          </h2>
          <p className="text-muted-foreground mb-6">
            Escolha o nicho, defina o plano e o sistema provisiona restaurante, vitrine inicial e
            painel sem fluxo legado de pacote.
          </p>
          <Link
            href="/ofertas"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-8 py-3 font-semibold transition-colors"
          >
            Ver planos recorrentes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Demo Info */}
      <section className="border-border border-t px-4 py-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-muted-foreground mb-2 inline-flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4" />
            Demonstração disponível
          </div>
          <p className="text-muted-foreground text-sm">
            Clique em &quot;Ver Demo&quot; para testar cada template antes de comprar.
          </p>
        </div>
      </section>
    </main>
  )
}
