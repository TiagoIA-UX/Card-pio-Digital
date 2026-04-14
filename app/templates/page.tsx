'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Eye, Sparkles, FlaskConical } from 'lucide-react'
import { TemplateCard } from '@/components/templates/template-card'
import { getTemplateCatalog } from '@/lib/domains/marketing/templates-config'
import {
  decorateTemplateCatalog,
  TEMPLATE_FAMILIES,
  TEMPLATE_FAMILY_ORDER,
} from '@/lib/domains/marketing/template-public-meta'
import { createClient } from '@/lib/shared/supabase/client'

const templates = decorateTemplateCatalog(getTemplateCatalog())
const groupedTemplates = TEMPLATE_FAMILY_ORDER.map((familyId) => ({
  ...TEMPLATE_FAMILIES[familyId],
  items: templates.filter(
    (template): template is typeof template & { publicFamily: typeof familyId } =>
      'publicFamily' in template && template.publicFamily === familyId
  ),
})).filter((group) => group.items.length > 0)
const showDevUnlock =
  process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ALLOW_DEV_UNLOCK === 'true'

export default function TemplatesPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth
      .getSession()
      .then(
        ({
          data: { session },
        }: {
          data: { session: import('@supabase/supabase-js').Session | null }
        }) => {
          setIsLoggedIn(!!session)
        }
      )
  }, [])

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
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/painel" className="text-foreground text-sm font-medium hover:underline">
                Ir para o painel
              </Link>
            ) : (
              <Link href="/login" className="text-foreground text-sm font-medium hover:underline">
                Entrar
              </Link>
            )}
            <Link href="/precos" className="text-primary text-sm font-medium hover:underline">
              Ver preços
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="from-primary/5 to-background bg-linear-to-b px-4 py-12 md:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="bg-primary/10 text-primary mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            16 nichos prontos para ativar
          </div>
          <h1 className="text-foreground mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            Escolha o nicho certo para o seu delivery
          </h1>
          <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
            Escolha pelo tipo de operação e siga para o checkout. Os nomes públicos estão mais
            claros e o template interno continua o mesmo na ativação.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/precos"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors"
            >
              <Eye className="h-4 w-4" />
              Ver preços
            </Link>
            {showDevUnlock && (
              <Link
                href="/dev/unlock"
                className="border-primary/30 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition-colors"
              >
                <FlaskConical className="h-4 w-4" />
                Testar todos no editor
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          {/* Stats */}
          <div className="mb-8 flex flex-wrap justify-center gap-8 text-center">
            <div>
              <div className="text-foreground text-2xl font-bold">16</div>
              <div className="text-muted-foreground text-sm">Nichos</div>
            </div>
            <div>
              <div className="text-foreground text-2xl font-bold">0%</div>
              <div className="text-muted-foreground text-sm">Taxa por pedido</div>
            </div>
            <div>
              <div className="text-foreground text-2xl font-bold">48h</div>
              <div className="text-muted-foreground text-sm">Ativação com suporte</div>
            </div>
          </div>

          <div className="space-y-10">
            {groupedTemplates.map((group) => (
              <div key={group.id}>
                <div className="mb-5">
                  <div>
                    <h2 className="text-foreground text-2xl font-bold">{group.label}</h2>
                    <p className="text-muted-foreground max-w-2xl text-sm">{group.description}</p>
                  </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.items.map((template) => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-foreground mb-4 text-2xl font-bold">
            Implantação inicial com nome claro e plano mensal correspondente
          </h2>
          <p className="text-muted-foreground mb-6">
            Você escolhe o nicho e segue para o checkout. No próximo passo, decide se quer
            configurar sozinho ou mandar o material para a equipe.
          </p>
          <Link
            href="/precos"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-8 py-3 font-semibold transition-colors"
          >
            Ver preços por template
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
