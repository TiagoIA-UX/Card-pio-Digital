import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronRight, Eye } from 'lucide-react'
import { NICHE_TEMPLATES } from '@/components/home/home-data'

export function NichesSection() {
  return (
    <section id="nichos" className="container-premium py-20 md:py-24">
      <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-orange-600 uppercase">
            Modelos por Tipo de Negócio
          </p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            Um Template Certo para Cada Operação.
          </h2>
        </div>
        <p className="text-foreground/80 max-w-xl text-base leading-7">
          Cada modelo foi criado para respeitar o perfil da operação, organizar melhor a
          apresentação dos produtos e facilitar a decisão de compra do cliente.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {NICHE_TEMPLATES.map((template) => {
          const Icon = template.icon

          return (
            <article
              key={template.slug}
              className="border-border bg-card hover:shadow-premium overflow-hidden rounded-[1.75rem] border shadow-sm transition-shadow"
            >
              <div className="relative h-56 overflow-hidden">
                <Image src={template.image} alt={template.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between gap-3">
                  <div>
                    <div
                      className={`mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur ${template.chip}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {template.eyebrow}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{template.name}</h3>
                  </div>
                  <div className="rounded-full bg-white/15 p-2 text-white backdrop-blur">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-foreground/80 text-sm leading-6">{template.description}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {template.highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="border-border bg-secondary text-foreground/80 rounded-full border px-3 py-1 text-xs font-medium"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <Link
                    href={`/templates/${template.slug}`}
                    className="bg-foreground text-background hover:bg-foreground/90 inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Ver Modelo
                  </Link>
                  <Link
                    href={`/comprar/${template.slug}`}
                    className="border-border text-foreground hover:bg-secondary inline-flex flex-1 items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition-colors"
                  >
                    Comprar
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
