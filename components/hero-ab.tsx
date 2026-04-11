'use client'

import { useABVariant } from '@/hooks/use-ab-variant'
import { trackEvent } from '@/lib/domains/marketing/analytics'
import { useEffect } from 'react'

const VARIANTS = {
  A: {
    badge: 'Catálogo completo — só editar e vender',
    heading: (
      <>
        Seu delivery pronto <span className="text-orange-400">para vender em minutos.</span>
        <span className="mt-2 block text-green-400">Já vem com produtos. Você só edita.</span>
      </>
    ),
  },
  B: {
    badge: 'Comece a vender hoje — sem cadastrar nada',
    heading: (
      <>
        Seu cardápio digital <span className="text-orange-400">já vem pronto.</span>
        <span className="mt-2 block text-green-400">Edite, publique e comece a lucrar.</span>
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
