import { createClient, type Restaurant } from '@/lib/supabase/client'

const ACTIVE_RESTAURANT_STORAGE_KEY = 'active_restaurant_id'

export function getRequestedRestaurantId() {
  if (typeof window === 'undefined') return null

  const params = new URLSearchParams(window.location.search)
  return params.get('restaurant')
}

export function getRestaurantScopedHref(href: string, restaurantId?: string | null) {
  if (!href.startsWith('/painel')) return href

  const activeId = restaurantId || getRequestedRestaurantId() || getStoredActiveRestaurantId()
  if (!activeId) return href

  const url = new URL(href, 'http://localhost')
  url.searchParams.set('restaurant', activeId)
  return `${url.pathname}${url.search}${url.hash}`
}

export function getStoredActiveRestaurantId() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(ACTIVE_RESTAURANT_STORAGE_KEY)
}

export function setStoredActiveRestaurantId(restaurantId: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ACTIVE_RESTAURANT_STORAGE_KEY, restaurantId)
}

export function clearStoredActiveRestaurantId() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(ACTIVE_RESTAURANT_STORAGE_KEY)
}

export async function getActiveRestaurantForUser<T extends { id: string } = Restaurant>(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  select = '*'
) {
  const requestedId = getRequestedRestaurantId()
  const savedId = requestedId || getStoredActiveRestaurantId()

  if (savedId) {
    const { data } = await supabase
      .from('restaurants')
      .select(select)
      .eq('user_id', userId)
      .eq('id', savedId)
      .maybeSingle()

    if (data) {
      if (requestedId) {
        setStoredActiveRestaurantId(data.id)
      }
      return data as T
    }

    clearStoredActiveRestaurantId()
  }

  const { data } = await supabase
    .from('restaurants')
    .select(select)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (data?.id) {
    setStoredActiveRestaurantId(data.id)
  }

  return (data as T | null) ?? null
}
