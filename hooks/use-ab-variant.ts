'use client'

import { useSyncExternalStore } from 'react'

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

function getOrAssignVariant(): ABVariant {
  const existing = getCookie(COOKIE_NAME)
  if (existing === 'A' || existing === 'B') return existing
  const assigned: ABVariant = Math.random() < 0.5 ? 'A' : 'B'
  setCookie(COOKIE_NAME, assigned, COOKIE_DAYS)
  return assigned
}

let cachedVariant: ABVariant | null = null

function subscribe(cb: () => void) {
  // variant is assigned once and never changes during session
  if (!cachedVariant) cachedVariant = getOrAssignVariant()
  // no external events to listen to — variant is stable
  return () => {}
}

function getSnapshot(): ABVariant | null {
  if (!cachedVariant) cachedVariant = getOrAssignVariant()
  return cachedVariant
}

function getServerSnapshot(): ABVariant | null {
  return null
}

/**
 * Returns a stable A/B variant for the hero section.
 * Assigns randomly on first visit and persists via cookie.
 */
export function useABVariant(): ABVariant | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
