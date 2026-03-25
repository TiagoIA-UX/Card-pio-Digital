import { track } from '@vercel/analytics'

/**
 * Conversion funnel events.
 *
 * Funnel:  landing_view → cta_click → signup → delivery_created → order_placed
 */

type FunnelEvent =
  | { name: 'cta_click'; props: { cta: string; page: string } }
  | { name: 'signup_complete'; props: { method: 'google' | 'magic_link' | 'unknown' } }
  | { name: 'delivery_created'; props: { template?: string; slug: string } }
  | { name: 'order_placed'; props: { restaurant_id: string; total: number; items_count: number } }
  | { name: 'checkout_started'; props: { restaurant_id: string; items_count: number } }

export function trackEvent<E extends FunnelEvent>(event: E['name'], props: E['props']) {
  try {
    track(event, props as Record<string, string | number | boolean>)
  } catch {
    // silently fail — analytics should never break the app
  }
}
