'use client'

import { useABVariant } from '@/hooks/use-ab-variant'
import { trackEvent } from '@/lib/domains/marketing/analytics'
import { useEffect } from 'react'

const VARIANTS = {
  A: {
    badge: 'Ja vende no iFood? Descubra quanto da sua margem ainda fica fora do seu caixa',
    heading: (
      <>
        Se hoje voce vende no
        <span className="mx-2 inline-flex rounded-full bg-orange-500 px-3 py-1 text-[0.72em] font-extrabold tracking-[0.08em] text-white align-middle uppercase">
          iFood
        </span>
        <span className="text-orange-400"> parte do seu lucro pode estar ficando la.</span>
        <span className="mt-2 block text-green-400">
          Crie seu canal proprio e recupere margem sem parar de vender onde ja vende.
        </span>
      </>
    ),
  },
  B: {
    badge: 'iFood traz pedido. Canal proprio traz margem, recompra e relacionamento',
    heading: (
      <>
        Continue vendendo no
        <span className="mx-2 inline-flex rounded-full bg-orange-500 px-3 py-1 text-[0.72em] font-extrabold tracking-[0.08em] text-white align-middle uppercase">
          iFood
        </span>
        <span className="text-orange-400"> sem deixar toda a margem por la.</span>
        <span className="mt-2 block text-green-400">
          WhatsApp, site proprio e IA para recuperar relacionamento e lucro.
        </span>
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
      trackEvent('landing_view', { page: 'landing', variant })
    }
  }, [variant])

  if (!variant) {
    return <span className="invisible">{VARIANTS.A.heading}</span>
  }
  return <>{VARIANTS[variant].heading}</>
}
