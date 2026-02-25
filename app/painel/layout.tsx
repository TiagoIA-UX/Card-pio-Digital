"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Store, Package, ClipboardList, Settings, LogOut, Menu, X, Loader2 } from "lucide-react"
import type { Restaurant } from "@/lib/supabase/client"

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const supabase = createClient()

  // Permitir acesso à página de criar restaurante sem verificações
  const isCreatePage = pathname === '/painel/criar-restaurante'

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      // Na página de criar, deixar a própria página decidir o que fazer
      if (isCreatePage) {
        setLoading(false)
        return
      }

      // Buscar restaurante do usuário
      const { data: rest } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (!rest) {
        // Se não tem restaurante, redirecionar para criar
        router.push('/painel/criar-restaurante')
        return
      }

      // Verificar status de pagamento
      if (rest.status_pagamento !== 'ativo') {
        router.push('/checkout')
        return
      }

      setRestaurant(rest)
      setLoading(false)
    }

    checkAuth()
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Na página de criar restaurante, mostrar apenas o conteúdo sem sidebar
  if (isCreatePage) {
    return <>{children}</>
  }

  const menuItems = [
    { href: '/painel', icon: Store, label: 'Dashboard' },
    { href: '/painel/produtos', icon: Package, label: 'Produtos' },
    { href: '/painel/pedidos', icon: ClipboardList, label: 'Pedidos' },
    { href: '/painel/configuracoes', icon: Settings, label: 'Configurações' },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-secondary rounded-lg">
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="font-bold text-foreground">{restaurant?.nome}</h1>
        <button onClick={handleLogout} className="p-2 hover:bg-secondary rounded-lg text-destructive">
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <span className="font-bold text-foreground">{restaurant?.nome}</span>
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-secondary rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              {menuItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors text-foreground"
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-border">
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 text-destructive w-full">
                <LogOut className="h-5 w-5" />
                Sair
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              {restaurant?.logo_url ? (
                <img src={restaurant.logo_url} alt={restaurant.nome} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Store className="h-5 w-5 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-foreground truncate">{restaurant?.nome}</h2>
                <Link href={`/r/${restaurant?.slug}`} target="_blank" className="text-xs text-primary hover:underline">
                  Ver cardápio
                </Link>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors text-foreground"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-border">
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 text-destructive w-full">
              <LogOut className="h-5 w-5" />
              Sair
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
