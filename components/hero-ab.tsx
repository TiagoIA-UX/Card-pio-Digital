'use client'

import { useABVariant } from '@/hooks/use-ab-variant'
import { trackEvent } from '@/lib/domains/marketing/analytics'
import { useEffect } from 'react'

const VARIANTS = {
  A: {
    badge: 'Seu cliente ja te conhece — por que pagar 15% ao iFood?',
    heading: (
      <>
        <span className="text-orange-400">Cliente fiel pedindo pelo iFood?</span>{' '}
        <span className="text-white">Ele pode pedir direto de voce.</span>
        <span className="mt-3 block text-2xl font-semibold text-green-400 md:text-3xl lg:text-4xl">
          Seu cardapio. Sua marca. 100% do lucro.
        </span>
      </>
    ),
  },
  B: {
    badge: 'iFood traz pedido. Canal proprio traz margem, recompra e relacionamento',
    heading: (
      <>
        Continue vendendo no
        <span className="mx-2 inline-flex rounded-full bg-orange-500 px-3 py-1 align-middle text-[0.72em] font-extrabold tracking-[0.08em] text-white uppercase">
          iFood
        </span>
        <span className="text-orange-400"> sem deixar toda a margem por la.</span>
        <span className="mt-2 block text-green-400">
          WhatsApp, site proprio e IA para recuperar relacionamento e lucro.
        </span>
      </>
    ),
  },
  C: {
    badge: 'Seu cliente ja te conhece — por que pagar 15% ao iFood?',
    heading: (
      <>
        <span className="text-orange-400">Cliente fiel pedindo pelo iFood?</span>{' '}
        <span className="text-white">Ele pode pedir direto de voce.</span>
        <span className="mt-3 block text-2xl font-semibold text-green-400 md:text-3xl lg:text-4xl">
          Seu cardapio. Sua marca. 100% do lucro.
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
