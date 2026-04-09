'use client'

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

export function readABVariant(): ABVariant | null {
  const existing = getCookie(COOKIE_NAME)
  return existing === 'A' || existing === 'B' ? existing : null
}

export function getOrAssignABVariant(): ABVariant {
  const existing = readABVariant()
  if (existing) return existing

  const assigned: ABVariant = Math.random() < 0.5 ? 'A' : 'B'
  setCookie(COOKIE_NAME, assigned, COOKIE_DAYS)
  return assigned
}
