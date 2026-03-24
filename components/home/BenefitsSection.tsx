import { HIGHLIGHT_BENEFITS } from '@/components/home/home-data'

export function BenefitsSection() {
  return (
    <section id="beneficios" className="container-premium py-12 md:py-16">
      <div className="mb-8 max-w-2xl">
        <p className="text-sm font-semibold tracking-[0.18em] text-orange-600 uppercase">
          Por Que Mudar para o Seu Próprio Canal
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          Mais Vendas, Menos Taxas, Controle Total.
        </h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {HIGHLIGHT_BENEFITS.map((benefit) => (
          <article
            key={benefit.title}
            className="border-border bg-card rounded-[1.75rem] border p-6 shadow-sm"
          >
            <h3 className="text-xl font-semibold">{benefit.title}</h3>
            <p className="text-foreground/80 mt-3 text-base leading-7">{benefit.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
