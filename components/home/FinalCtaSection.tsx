import Link from 'next/link'
import { BadgeCheck, Eye, MessageCircle } from 'lucide-react'
import { WHATSAPP_LINK } from '@/components/home/home-data'

export function FinalCtaSection() {
  return (
    <section className="px-4 pb-20 md:pb-24">
      <div className="container-premium shadow-premium-lg rounded-4xl bg-linear-to-br from-orange-500 via-red-500 to-amber-500 p-8 text-white md:p-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
              <BadgeCheck className="h-4 w-4" />
              Templates Individuais, Pacotes e Implantação Assistida
            </div>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              Pronto para Começar a Vender Online?
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/95">
              Escolha o modelo do seu segmento, personalize no painel e receba pedidos direto no
              WhatsApp — sem comissão e sem intermediário.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:min-w-72">
            <Link
              href="/templates"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-50"
            >
              <Eye className="h-4 w-4" />
              Ver os 15 Modelos
            </Link>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <MessageCircle className="h-4 w-4 text-green-400" />
              Falar com Especialista
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
