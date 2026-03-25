'use client'

import { useEffect, useState } from 'react'

export type ABVariant = 'A' | 'B'

const COOKIE_NAME = 'ab_hero'
const COOKIE_DAYS = 30

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

/**
 * Returns a stable A/B variant for the hero section.
 * Assigns randomly on first visit and persists via cookie.
 */
export function useABVariant(): ABVariant | null {
  const [variant, setVariant] = useState<ABVariant | null>(null)

  useEffect(() => {
    const existing = getCookie(COOKIE_NAME)
    if (existing === 'A' || existing === 'B') {
      setVariant(existing)
      return
    }
    const assigned: ABVariant = Math.random() < 0.5 ? 'A' : 'B'
    setCookie(COOKIE_NAME, assigned, COOKIE_DAYS)
    setVariant(assigned)
  }, [])

  return variant
}
