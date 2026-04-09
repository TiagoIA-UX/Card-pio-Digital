'use client'

import { useABVariant } from '@/hooks/use-ab-variant'
import { trackEvent } from '@/lib/domains/marketing/analytics'
import { useEffect } from 'react'

const VARIANTS = {
  A: {
    badge: 'Zero taxa por pedido — o lucro é todo seu',
    heading: (
      <>
        Colocamos dinheiro <span className="text-orange-400">na conta do seu delivery.</span>
        <span className="mt-2 block text-green-400">
          Sem taxa, sem comissão, sem intermediário.
        </span>
      </>
    ),
  },
  B: {
    badge: 'Pedidos automáticos — mais lucro, menos caos',
    heading: (
      <>
        Seu delivery faturando mais{' '}
        <span className="text-orange-400">com menos custo operacional.</span>
        <span className="mt-2 block text-green-400">
          IA atendendo, pedidos formatados, zero taxa.
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
