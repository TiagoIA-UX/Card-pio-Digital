import Link from 'next/link'
import { ArrowRight, MessageCircle, Rocket } from 'lucide-react'
import { PROCESS_STEPS, WHATSAPP_LINK } from '@/components/home/home-data'

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="container-premium py-20 md:py-24">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-orange-600 uppercase">
            Como Funciona
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            Escolha, Edite e Publique.
          </h2>
          <p className="text-foreground/80 mt-4 max-w-lg text-base leading-7">
            Escolha o modelo do seu segmento, personalize produtos, preços e fotos no painel e
            publique seu cardápio — sem comissão e sem depender de programador.
          </p>

          <div className="border-border mt-8 rounded-[1.75rem] border bg-linear-to-br from-orange-50 to-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <p className="text-foreground text-sm font-semibold">Venda com Mais Autonomia</p>
                <p className="text-foreground/80 text-sm">
                  Atualize preços, fotos, categorias e promoções com rapidez, reduza dependência de
                  aplicativos e mantenha mais controle sobre a operação.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/templates"
                className="bg-foreground text-background inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                Ver Modelos
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border text-foreground inline-flex items-center gap-2 rounded-full border bg-white px-5 py-3 text-sm font-semibold"
              >
                <MessageCircle className="h-4 w-4 text-green-600" />
                Falar com um Especialista
              </a>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {PROCESS_STEPS.map((step) => (
            <div
              key={step.step}
              className="border-border bg-card rounded-[1.75rem] border p-6 shadow-sm"
            >
              <div className="flex items-start gap-5">
                <div className="bg-secondary text-foreground flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold">
                  {step.step}
                </div>
                <div>
                  <h3 className="text-foreground text-xl font-semibold">{step.title}</h3>
                  <p className="text-foreground/80 mt-2 max-w-xl text-sm leading-7">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
