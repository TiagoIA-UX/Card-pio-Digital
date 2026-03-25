import { createClient, type Restaurant } from '@/lib/supabase/client'

const ACTIVE_RESTAURANT_STORAGE_KEY = 'active_restaurant_id'

type RestaurantLike = {
  id: string
  nome?: string | null
  created_at?: string
  organization_id?: string | null
  unit_type?: 'headquarters' | 'branch' | null
  unit_label?: string | null
}

export interface ActiveRestaurantContext<T extends RestaurantLike = Restaurant> {
  activeRestaurant: T | null
  restaurants: T[]
  organizationRestaurants: T[]
  organizationId: string | null
  headquartersRestaurant: T | null
  isNetwork: boolean
}

function resolveRestaurantOrganizationId<T extends RestaurantLike>(restaurant: T) {
  return restaurant.organization_id || restaurant.id
}

function sortRestaurantsByRecency<T extends RestaurantLike>(restaurants: T[]) {
  return [...restaurants].sort((left, right) => {
    const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0
    const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0
    return rightTime - leftTime
  })
}

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

export function getRestaurantDisplayName<T extends RestaurantLike>(
  restaurant: T | null | undefined
) {
  if (!restaurant) return 'Unidade'
  return restaurant.unit_label || restaurant.nome || 'Unidade'
}

export function getRestaurantUnitBadgeLabel<T extends RestaurantLike>(
  restaurant: T | null | undefined
) {
  return restaurant?.unit_type === 'headquarters' ? 'Matriz' : 'Filial'
}

export async function getActiveRestaurantContextForUser<T extends RestaurantLike = Restaurant>(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  select = '*'
): Promise<ActiveRestaurantContext<T>> {
  const requestedId = getRequestedRestaurantId()
  const savedId = requestedId || getStoredActiveRestaurantId()

  const { data } = await supabase
    .from('restaurants')
    .select(select)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const restaurants = sortRestaurantsByRecency((data || []) as T[])

  if (restaurants.length === 0) {
    clearStoredActiveRestaurantId()
    return {
      activeRestaurant: null,
      restaurants: [],
      organizationRestaurants: [],
      organizationId: null,
      headquartersRestaurant: null,
      isNetwork: false,
    }
  }

  let activeRestaurant =
    (savedId ? restaurants.find((restaurant) => restaurant.id === savedId) : null) ||
    restaurants[0] ||
    null

  if (!activeRestaurant) {
    clearStoredActiveRestaurantId()
    return {
      activeRestaurant: null,
      restaurants,
      organizationRestaurants: [],
      organizationId: null,
      headquartersRestaurant: null,
      isNetwork: false,
    }
  }

  if (!savedId || savedId !== activeRestaurant.id || requestedId) {
    setStoredActiveRestaurantId(activeRestaurant.id)
  }

  const organizationId = resolveRestaurantOrganizationId(activeRestaurant)
  const organizationRestaurants = restaurants.filter(
    (restaurant) => resolveRestaurantOrganizationId(restaurant) === organizationId
  )

  const headquartersRestaurant =
    organizationRestaurants.find((restaurant) => restaurant.unit_type === 'headquarters') ||
    organizationRestaurants.find((restaurant) => restaurant.id === organizationId) ||
    activeRestaurant

  return {
    activeRestaurant,
    restaurants,
    organizationRestaurants,
    organizationId,
    headquartersRestaurant,
    isNetwork: organizationRestaurants.length > 1,
  }
}

export async function getActiveRestaurantForUser<T extends { id: string } = Restaurant>(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  select = '*'
) {
  const context = await getActiveRestaurantContextForUser<T & RestaurantLike>(
    supabase,
    userId,
    select
  )
  return (context.activeRestaurant as T | null) ?? null
}
