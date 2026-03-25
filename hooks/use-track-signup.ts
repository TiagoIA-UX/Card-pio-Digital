'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { trackEvent } from '@/lib/analytics'

/**
 * Captures `?event=signup&method=google|magic_link` from URL,
 * fires the analytics event, and cleans up the URL.
 */
export function useTrackSignup() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const event = searchParams.get('event')
    const method = searchParams.get('method')

    if (event === 'signup') {
      trackEvent('signup_complete', {
        method: (method as 'google' | 'magic_link') || 'unknown',
      })

      // Clean up URL params
      const params = new URLSearchParams(searchParams.toString())
      params.delete('event')
      params.delete('method')
      const clean = params.toString()
      router.replace(clean ? `${pathname}?${clean}` : pathname, { scroll: false })
    }
  }, [searchParams, router, pathname])
}
