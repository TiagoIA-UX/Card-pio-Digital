'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Store,
  Package,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  QrCode,
  X,
  Loader2,
  FlaskConical,
} from 'lucide-react'
import type { Restaurant } from '@/lib/supabase/client'
import { getPaymentModeBadgeLabel, isPublicSandboxMode } from '@/lib/payment-mode'

// ========================================
// ARQUITETURA LIMPA:
// - Middleware: Verifica autenticação (ÚNICO ponto)
// - Layout: Verifica apenas se tem restaurante
// ========================================

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const supabase = useMemo(() => createClient(), [])
  const isSandboxMode = isPublicSandboxMode()
  const paymentBadge = getPaymentModeBadgeLabel()

  // Página de criar restaurante não precisa verificar restaurante
  const isCreatePage = pathname === '/painel/criar-restaurante'

  useEffect(() => {
    const checkRestaurant = async () => {
      // NÃO verificar sessão aqui - middleware já fez isso
      // Se chegou aqui, usuário está autenticado

      if (isCreatePage) {
        setLoading(false)
        return
      }

      // Obter sessão apenas para pegar user_id (não para validar auth)
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        // Se não tem sessão aqui, algo errado aconteceu
        // Mas não redirecionar - deixar middleware lidar
        setLoading(false)
        return
      }

      // Verificar se tem restaurante
      const { data: rest } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (!rest) {
        router.replace('/painel/criar-restaurante')
        return
      }

      setRestaurant(rest)
      setLoading(false)
    }

    checkRestaurant()
  }, [isCreatePage, pathname, router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

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

  const menuItems = [
    { href: '/painel', icon: Store, label: 'Dashboard' },
    { href: '/painel/produtos', icon: Package, label: 'Produtos' },
    { href: '/painel/pedidos', icon: ClipboardList, label: 'Pedidos' },
    { href: '/painel/qrcode', icon: QrCode, label: 'QR Code' },
    { href: '/painel/configuracoes', icon: Settings, label: 'Configurações' },
  ]

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
        <h1 className="text-foreground font-bold">{restaurant?.nome}</h1>
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
            <nav className="flex-1 space-y-2 p-4">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="hover:bg-secondary text-foreground flex items-center gap-3 rounded-lg px-4 py-3 transition-colors"
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
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
        <aside className="bg-card border-border fixed top-0 bottom-0 left-0 hidden w-64 flex-col border-r lg:flex">
          <div className="border-border border-b p-4">
            <div className="flex items-center gap-3">
              {restaurant?.logo_url ? (
                <Image
                  src={restaurant.logo_url}
                  alt={restaurant.nome}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-full">
                  <Store className="h-5 w-5 text-white" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-foreground truncate font-bold">{restaurant?.nome}</h2>
                <Link
                  href={`/r/${restaurant?.slug}`}
                  target="_blank"
                  className="text-primary text-xs hover:underline"
                >
                  Ver cardápio
                </Link>
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-2 p-4">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:bg-secondary text-foreground flex items-center gap-3 rounded-lg px-4 py-3 transition-colors"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
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

        {/* Main Content */}
        <main className="min-h-screen flex-1 lg:ml-64">{children}</main>
      </div>
    </div>
  )
}
