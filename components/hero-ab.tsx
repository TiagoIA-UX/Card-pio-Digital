'use client'

import { useABVariant } from '@/hooks/use-ab-variant'
import { trackEvent } from '@/lib/analytics'
import { useEffect } from 'react'

const VARIANTS = {
  A: {
    badge: 'Já tem motoboy? Você perde até R$ 3.000/mês em comissões',
    heading: (
      <>
        Pare de dar <span className="text-red-400">15% do seu faturamento</span> pra plataforma.
        <span className="mt-2 block text-orange-400">Venda direto. Lucre 100%.</span>
      </>
    ),
  },
  B: {
    badge: 'Deliverys com motoboy próprio já economizam R$ 3.000+/mês',
    heading: (
      <>
        Recupere até <span className="text-green-400">R$ 3.000 por mês</span> que o iFood cobra.
        <span className="mt-2 block text-orange-400">Seu cardápio. Seu lucro. Sem comissão.</span>
      </>
    ),
  },
} as const

export function HeroBadge() {
  const variant = useABVariant()
  if (!variant) {
    return <span className="invisible">{VARIANTS.A.badge}</span>
  }
  return <>{VARIANTS[variant].badge}</>
}

export function HeroHeading() {
  const variant = useABVariant()

  useEffect(() => {
    if (variant) {
      trackEvent('cta_click', { cta: `hero_view_${variant}`, page: 'landing' })
    }
  }, [variant])

  if (!variant) {
    return <span className="invisible">{VARIANTS.A.heading}</span>
  }
  return <>{VARIANTS[variant].heading}</>
}
