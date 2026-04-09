'use client'

import { useSyncExternalStore } from 'react'
import { getOrAssignABVariant, type ABVariant } from '@/lib/domains/marketing/ab-variant'

let cachedVariant: ABVariant | null = null

function subscribe(cb: () => void) {
  // variant is assigned once and never changes during session
  if (!cachedVariant) cachedVariant = getOrAssignABVariant()
  // no external events to listen to — variant is stable
  return () => {}
}

function getSnapshot(): ABVariant | null {
  if (!cachedVariant) cachedVariant = getOrAssignABVariant()
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
