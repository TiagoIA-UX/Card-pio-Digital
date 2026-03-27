'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient, resetBrowserClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Users,
  Store,
  MessageSquare,
  Activity,
  ShieldCheck,
  Handshake,
  LogOut,
  Menu,
  X,
  Loader2,
  Clock,
  Wallet,
  Bell,
  Globe,
  BarChart3,
} from 'lucide-react'

interface AdminMenuGroup {
  label: string
  items: { href: string; icon: typeof LayoutDashboard; label: string }[]
}

const menuGroups: AdminMenuGroup[] = [
  {
    label: 'Principal',
    items: [
      { href: '/admin', icon: LayoutDashboard, label: 'Visão Geral' },
      { href: '/admin/alertas', icon: Bell, label: 'Alertas' },
      { href: '/admin/financeiro', icon: Wallet, label: 'Financeiro' },
      { href: '/admin/metrics', icon: BarChart3, label: 'Métricas' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { href: '/admin/usuarios', icon: Users, label: 'Usuários' },
      { href: '/admin/afiliados', icon: Handshake, label: 'Afiliados' },
      { href: '/admin/cardapios', icon: Store, label: 'Canais' },
      { href: '/admin/trials', icon: Clock, label: 'Trials' },
    ],
  },
  {
    label: 'Ferramentas',
    items: [
      { href: '/admin/feedbacks', icon: MessageSquare, label: 'Feedbacks IA' },
      { href: '/admin/suporte', icon: ShieldCheck, label: 'Suporte' },
      { href: '/admin/logs', icon: Activity, label: 'Logs' },
      { href: '/admin/seo', icon: Globe, label: 'SEO' },
      { href: '/admin/venda-direta', icon: Handshake, label: 'Venda Direta' },
    ],
  },
]

const allMenuItems = menuGroups.flatMap((g) => g.items)

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [adminEmail, setAdminEmail] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadAlerts, setUnreadAlerts] = useState(0)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      const { data: admin } = await supabase
        .from('admin_users')
        .select('role, email')
        .eq('user_id', user.id)
        .single()

      if (!admin) {
        router.replace('/painel')
        return
      }

      setAdminEmail(admin.email)
      setLoading(false)
    }
    checkAdmin()

    // Fetch unread alerts count
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/admin/alertas?unread=true&limit=1')
        if (res.ok) {
          const data = await res.json()
          setUnreadAlerts(data.summary?.unread_total ?? 0)
        }
      } catch {}
    }
    fetchAlerts()
    const alertInterval = setInterval(fetchAlerts, 60000) // atualiza a cada 1 min
    return () => clearInterval(alertInterval)
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'global' })
    resetBrowserClient()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-800 bg-zinc-900 transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-bold text-orange-500">Admin</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {menuGroups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                {group.label}
              </p>
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-orange-500/15 font-medium text-orange-400'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                    {item.href === '/admin/alertas' && unreadAlerts > 0 && (
                      <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                        {unreadAlerts > 99 ? '99+' : unreadAlerts}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-zinc-800 p-3">
          <p className="mb-2 truncate px-3 text-xs text-zinc-500">{adminEmail}</p>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center border-b border-zinc-800 px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="mr-4 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">
            {allMenuItems.find(
              (i) => pathname === i.href || (i.href !== '/admin' && pathname.startsWith(i.href))
            )?.label || 'Admin'}
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
