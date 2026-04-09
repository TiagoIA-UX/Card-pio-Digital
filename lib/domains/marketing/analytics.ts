import { track } from '@vercel/analytics'
import { getVisitorId } from '@/lib/domains/marketing/visitor-id'
import type { ABVariant } from '@/lib/domains/marketing/ab-variant'

/**
 * Conversion funnel events.
 *
 * Funnel:  landing_view → cta_click → signup → delivery_created → order_placed
 */

type FunnelEvent =
  | { name: 'landing_view'; props: { page: string; variant: ABVariant } }
  | { name: 'cta_click'; props: { cta: string; page: string; variant?: ABVariant } }
  | { name: 'next_step'; props: { step: string; page: string; variant?: ABVariant } }
  | {
      name: 'signup_start'
      props: { method: 'google' | 'otp' | 'unknown'; context: string; variant?: ABVariant }
    }
  | { name: 'signup_complete'; props: { method: 'google' | 'magic_link' | 'unknown' } }
  | { name: 'delivery_created'; props: { template?: string; slug: string } }
  | { name: 'order_placed'; props: { restaurant_id: string; total: number; items_count: number } }
  | { name: 'checkout_started'; props: { restaurant_id: string; items_count: number } }

export function trackEvent<E extends FunnelEvent>(event: E['name'], props: E['props']) {
  try {
    const visitorId = getVisitorId()
    track(event, {
      ...props,
      ...(visitorId ? { visitor_id: visitorId } : {}),
    } as Record<string, string | number | boolean>)
  } catch {
    // silently fail — analytics should never break the app
  }
}
