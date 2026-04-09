'use client'

import Link from 'next/link'
import { trackEvent } from '@/lib/domains/marketing/analytics'
import { readABVariant } from '@/lib/domains/marketing/ab-variant'
import type { ComponentProps, ReactNode } from 'react'

type TrackedLinkProps = ComponentProps<typeof Link> & {
  trackCta: string
  trackPage: string
}

export function TrackedLink({ trackCta, trackPage, onClick, ...props }: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        trackEvent('cta_click', {
          cta: trackCta,
          page: trackPage,
          variant: readABVariant() ?? undefined,
        })
        onClick?.(e)
      }}
    />
  )
}

type TrackedAnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  trackCta: string
  trackPage: string
  children: ReactNode
}

export function TrackedAnchor({ trackCta, trackPage, onClick, ...props }: TrackedAnchorProps) {
  return (
    <a
      {...props}
      onClick={(e) => {
        trackEvent('cta_click', {
          cta: trackCta,
          page: trackPage,
          variant: readABVariant() ?? undefined,
        })
        onClick?.(e)
      }}
    />
  )
}
