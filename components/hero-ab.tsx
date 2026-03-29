'use client'

import { useABVariant } from '@/hooks/use-ab-variant'
import { trackEvent } from '@/lib/analytics'
import { useEffect } from 'react'

const VARIANTS = {
  A: {
    badge: 'Seu cliente já te conhece — por que pagar 15% ao iFood?',
    heading: (
      <>
        Cliente fiel pedindo pelo iFood?{' '}
        <span className="text-orange-400">Ele pode pedir direto de você.</span>
        <span className="mt-2 block text-green-400">Seu cardápio. Sua marca. 100% do lucro.</span>
      </>
    ),
  },
  B: {
    badge: 'Google Meu Negócio é gratuito — apareça para quem busca "perto de mim"',
    heading: (
      <>
        iFood para conquistar clientes novos.{' '}
        <span className="text-orange-400">Seu cardápio para fidelizar.</span>
        <span className="mt-2 block text-green-400">Estratégia inteligente. Lucro 100% seu.</span>
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
