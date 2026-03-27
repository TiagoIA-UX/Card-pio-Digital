'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient, resetBrowserClient } from '@/lib/supabase/client'
import {
  Store,
  LogOut,
  Menu,
  X,
  Loader2,
  FlaskConical,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import type { Restaurant } from '@/lib/supabase/client'
import { getPaymentModeBadgeLabel, isPublicSandboxMode } from '@/lib/payment-mode'
import {
  getActiveRestaurantContextForUser,
  getRestaurantDisplayName,
  getRestaurantUnitBadgeLabel,
  setStoredActiveRestaurantId,
} from '@/lib/active-restaurant'
import { resolvePanelCapabilities, type PanelCapabilities } from '@/lib/panel/capabilities'
import { getGroupedNavigationItems, isNavigationItemActive } from '@/lib/panel/navigation'
import { PanelAccessProvider } from '@/lib/panel/panel-context'

// ========================================
// ARQUITETURA LIMPA:
// - Middleware: Verifica autenticação (ÚNICO ponto)
// - Layout: Verifica apenas se tem restaurante
// ========================================

function PainelLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([])
  const [organizationRestaurants, setOrganizationRestaurants] = useState<Restaurant[]>([])
  const searchParams = useSearchParams()
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [capabilities, setCapabilities] = useState<PanelCapabilities>(() =>
    resolvePanelCapabilities({
      activePurchasesCount: 0,
      approvedOrdersCount: 0,
      restaurantsCount: 0,
    })
  )
  const supabase = useMemo(() => createClient(), [])
  const isSandboxMode = isPublicSandboxMode()
  const paymentBadge = getPaymentModeBadgeLabel()

  const isCreatePage = pathname === '/painel/criar-restaurante'
  useEffect(() => {
    const checkRestaurant = async () => {
      // SEGURANÇA: getUser() valida o JWT com o servidor Supabase.
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        // Sem usuário válido — deixar middleware lidar
        setLoading(false)
        return
      }

      const [{ count: activePurchases }, { count: approvedOrders }] = await Promise.all([
        supabase
          .from('user_purchases')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'active'),
        supabase
          .from('template_orders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('payment_status', 'approved'),
      ])

      const hasActiveAccess = (activePurchases || 0) > 0 || (approvedOrders || 0) > 0

      if (isCreatePage && !hasActiveAccess) {
        router.replace('/templates')
        return
      }

      const restaurantContext = await getActiveRestaurantContextForUser<Restaurant>(
        supabase,
        user.id
      )

      const nextCapabilities = resolvePanelCapabilities({
        activePurchasesCount: activePurchases || 0,
        approvedOrdersCount: approvedOrders || 0,
        restaurantsCount: restaurantContext.restaurants.length,
      })

      if (restaurantContext.restaurants.length === 0) {
        setCapabilities(nextCapabilities)
        if (!hasActiveAccess) {
          router.replace('/templates')
          return
        }

        router.replace('/painel/criar-restaurante')
        return
      }

      setAllRestaurants(restaurantContext.restaurants)
      setOrganizationRestaurants(restaurantContext.organizationRestaurants)
      setCapabilities(nextCapabilities)

      if (restaurantContext.activeRestaurant?.id) {
        setStoredActiveRestaurantId(restaurantContext.activeRestaurant.id)
      }

      setRestaurant(restaurantContext.activeRestaurant)
      setLoading(false)
    }

    checkRestaurant()
  }, [isCreatePage, pathname, router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'global' })
    resetBrowserClient()
    window.location.href = '/login'
  }

  const panelAccessValue = useMemo(
    () => ({ capabilities, restaurantId: restaurant?.id ?? null }),
    [capabilities, restaurant?.id]
  )

  if (loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Na página de criar restaurante, mostrar apenas o conteúdo sem sidebar
  if (isCreatePage) {
    return <>{children}</>
  }

  const groupedItems = getGroupedNavigationItems(capabilities, restaurant?.id)

  const switchRestaurant = (rest: Restaurant) => {
    setRestaurant(rest)
    setShowSwitcher(false)
    setStoredActiveRestaurantId(rest.id)
    const params = new URLSearchParams(searchParams.toString())
    params.set('restaurant', rest.id)
    router.push(`${pathname}?${params.toString()}`)
    router.refresh()
  }

  const activeRestaurantDisplayName = getRestaurantDisplayName(restaurant)
  const activeRestaurantBadge = getRestaurantUnitBadgeLabel(restaurant)
  const isNetworkContext = organizationRestaurants.length > 1

  return (
    <div className="bg-background min-h-screen">
      {isSandboxMode && (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
          <div className="mx-auto flex max-w-6xl items-center gap-3 text-sm font-medium">
            <FlaskConical className="h-4 w-4" />
            <span>{paymentBadge}</span>
            <span className="text-amber-700">
              Use este ambiente para validar checkout e webhook sem cobrar clientes reais.
            </span>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <header className="border-border bg-card/95 sticky top-0 z-50 flex items-center justify-between border-b px-4 py-3 backdrop-blur lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="hover:bg-secondary rounded-lg p-2"
          title="Abrir menu"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 px-2 text-center">
          <h1 className="text-foreground truncate font-bold">{activeRestaurantDisplayName}</h1>
          <p className="text-muted-foreground truncate text-[11px]">
            {isNetworkContext ? activeRestaurantBadge : restaurant?.nome}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="hover:bg-secondary text-destructive rounded-lg p-2"
          title="Sair"
          aria-label="Sair"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="bg-card border-border absolute top-0 bottom-0 left-0 flex w-64 flex-col border-r">
            <div className="border-border flex items-center justify-between border-b p-4">
              <span className="text-foreground font-bold">{restaurant?.nome}</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="hover:bg-secondary rounded-lg p-2"
                title="Fechar menu"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-4 overflow-y-auto p-4">
              {groupedItems.map((group) => (
                <div key={group.id}>
                  <p className="text-muted-foreground mb-1 px-4 text-[11px] font-semibold tracking-wider uppercase">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = isNavigationItemActive(item, pathname)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                            active
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-foreground hover:bg-secondary'
                          }`}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
            <div className="border-border border-t p-4">
              <button
                onClick={handleLogout}
                className="hover:bg-destructive/10 text-destructive flex w-full items-center gap-3 rounded-lg px-4 py-3"
              >
                <LogOut className="h-5 w-5" />
                Sair
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside
          className={`bg-card border-border fixed top-0 bottom-0 left-0 hidden flex-col border-r transition-all duration-200 lg:flex ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          <div className="border-border flex items-center justify-between border-b p-4">
            {!sidebarCollapsed && (
              <div className="relative min-w-0 flex-1">
                <button
                  onClick={() => allRestaurants.length > 1 && setShowSwitcher(!showSwitcher)}
                  className={`flex w-full items-center gap-3 ${allRestaurants.length > 1 ? 'hover:bg-secondary cursor-pointer rounded-lg p-1 transition-colors' : ''}`}
                >
                  {restaurant?.logo_url ? (
                    <Image
                      src={restaurant.logo_url}
                      alt={restaurant.nome}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="bg-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                      <Store className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="text-foreground truncate font-bold">
                      {activeRestaurantDisplayName}
                    </h2>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">{activeRestaurantBadge}</span>
                      <Link
                        href={`/r/${restaurant?.slug}`}
                        target="_blank"
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver canal
                      </Link>
                    </div>
                  </div>
                  {allRestaurants.length > 1 && (
                    <ChevronDown
                      className={`text-muted-foreground h-4 w-4 shrink-0 transition-transform ${showSwitcher ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>

                {/* Restaurant Switcher Dropdown */}
                {showSwitcher && allRestaurants.length > 1 && (
                  <div className="bg-card border-border absolute top-full right-0 left-0 z-50 mt-2 rounded-lg border shadow-lg">
                    {allRestaurants.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => switchRestaurant(r)}
                        className={`hover:bg-secondary flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${r.id === restaurant?.id ? 'bg-primary/5 font-semibold' : ''}`}
                      >
                        {r.logo_url ? (
                          <Image
                            src={r.logo_url}
                            alt={r.nome}
                            width={28}
                            height={28}
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="bg-muted flex h-7 w-7 items-center justify-center rounded-full">
                            <Store className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate">{getRestaurantDisplayName(r)}</p>
                          <p className="text-muted-foreground truncate text-xs font-normal">
                            {getRestaurantUnitBadgeLabel(r)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {sidebarCollapsed && restaurant?.logo_url ? (
              <Image
                src={restaurant.logo_url}
                alt={restaurant.nome}
                width={32}
                height={32}
                className="mx-auto h-8 w-8 rounded-full object-cover"
              />
            ) : sidebarCollapsed ? (
              <div className="bg-primary mx-auto flex h-8 w-8 items-center justify-center rounded-full">
                <Store className="h-4 w-4 text-white" />
              </div>
            ) : null}
          </div>
          <nav className={`flex-1 space-y-5 overflow-y-auto ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            {groupedItems.map((group) => (
              <div key={group.id}>
                {!sidebarCollapsed && (
                  <p className="text-muted-foreground mb-1 px-4 text-[11px] font-semibold tracking-wider uppercase">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isNavigationItemActive(item, pathname)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={`flex items-center gap-3 rounded-lg text-sm transition-colors ${
                          sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-4 py-2.5'
                        } ${
                          active
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-foreground hover:bg-secondary'
                        }`}
                      >
                        <item.icon className="h-4.5 w-4.5 shrink-0" />
                        {!sidebarCollapsed && (
                          <>
                            <span className="flex-1">{item.label}</span>
                            {item.badge && (
                              <span
                                className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold ${
                                  item.badge === 'new'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {item.badge === 'new' ? 'Novo' : 'Beta'}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="border-border space-y-2 border-t p-3">
            <button
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="hover:bg-secondary text-muted-foreground flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
              title={sidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4" />
                  <span>Recolher</span>
                </>
              )}
            </button>
            <button
              onClick={handleLogout}
              className={`hover:bg-destructive/10 text-destructive flex w-full items-center gap-3 rounded-lg px-4 py-3 ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <LogOut className="h-5 w-5" />
              {!sidebarCollapsed && 'Sair'}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`min-h-screen flex-1 transition-all duration-200 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}
        >
          <PanelAccessProvider value={panelAccessValue}>{children}</PanelAccessProvider>
        </main>
      </div>
    </div>
  )
}

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      }
    >
      <PainelLayoutContent>{children}</PainelLayoutContent>
    </Suspense>
  )
}
