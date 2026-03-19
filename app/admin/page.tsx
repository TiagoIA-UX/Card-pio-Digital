'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
  RefreshCw,
  Users,
  Store,
  AlertTriangle,
  TrendingUp,
  Loader2,
} from 'lucide-react'

interface Restaurant {
  id: string
  nome: string
  slug: string
  telefone: string
  ativo: boolean
  suspended: boolean
  suspended_reason: string | null
  plan_slug: string
  created_at: string
  user_id: string
  user_email?: string
}

interface Stats {
  total: number
  active: number
  suspended: number
  byPlan: Record<string, number>
}

export default function AdminPage() {
  const supabase = createClient()
  const router = useRouter()

  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, suspended: 0, byPlan: {} })
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const checkAdminAndLoad = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    // Verificar se é admin
    const { data: adminCheck } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!adminCheck) {
      router.push('/painel')
      return
    }

    setIsAdmin(true)
    await loadRestaurants()
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  useEffect(() => {
    checkAdminAndLoad()
  }, [checkAdminAndLoad])

  const loadRestaurants = async () => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setRestaurants(data as Restaurant[])

      // Calcular estatísticas
      const active = data.filter((r: Restaurant) => r.ativo && !r.suspended).length
      const suspended = data.filter((r: Restaurant) => r.suspended).length
      const byPlan: Record<string, number> = {}
      data.forEach((r: Restaurant) => {
        const plan = r.plan_slug || 'basico'
        byPlan[plan] = (byPlan[plan] || 0) + 1
      })

      setStats({
        total: data.length,
        active,
        suspended,
        byPlan,
      })
    }
  }

  const handleSuspend = async (restaurantId: string) => {
    setActionLoading(restaurantId)
    try {
      const { error } = await supabase.rpc('suspend_restaurant_for_nonpayment', {
        p_restaurant_id: restaurantId,
      })

      if (!error) {
        await loadRestaurants()
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleReactivate = async (restaurantId: string) => {
    setActionLoading(restaurantId)
    try {
      const { error } = await supabase.rpc('reactivate_restaurant', {
        p_restaurant_id: restaurantId,
      })

      if (!error) {
        await loadRestaurants()
      }
    } finally {
      setActionLoading(null)
    }
  }

  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch =
      r.nome.toLowerCase().includes(search.toLowerCase()) ||
      r.slug.toLowerCase().includes(search.toLowerCase()) ||
      r.telefone.includes(search)

    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && r.ativo && !r.suspended) ||
      (filter === 'suspended' && r.suspended)

    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-foreground text-2xl font-bold">Painel Admin</h1>
            <p className="text-muted-foreground text-sm">Gerenciamento de clientes</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/dashboard"
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/comissoes"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Comissões
            </Link>
            <Link
              href="/admin/equipe"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Equipe
            </Link>
            <Link
              href="/admin/venda-direta"
              className="text-sm font-medium text-green-600 hover:text-green-500"
            >
              + Venda Direta
            </Link>
            <Link href="/painel" className="text-muted-foreground hover:text-foreground text-sm">
              Voltar ao Painel
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <Store className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-muted-foreground text-sm">Total de Clientes</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-muted-foreground text-sm">Ativos</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-500/10 p-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.suspended}</p>
                <p className="text-muted-foreground text-sm">Suspensos</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  R${' '}
                  {(
                    (stats.byPlan.basico || 0) * 49 +
                    (stats.byPlan.pro || 0) * 99 +
                    (stats.byPlan.premium || 0) * 199
                  ).toLocaleString()}
                </p>
                <p className="text-muted-foreground text-sm">MRR Estimado</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, slug ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-background w-full rounded-lg border py-2 pr-4 pl-10"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                filter === 'active'
                  ? 'bg-green-500 text-white'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              Ativos
            </button>
            <button
              onClick={() => setFilter('suspended')}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                filter === 'suspended'
                  ? 'bg-red-500 text-white'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              Suspensos
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-muted-foreground px-4 py-3 text-left text-sm font-medium">
                    Restaurante
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-left text-sm font-medium">
                    Plano
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-left text-sm font-medium">
                    Status
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-left text-sm font-medium">
                    Criado em
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-right text-sm font-medium">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRestaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="hover:bg-secondary/20">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-foreground font-medium">{restaurant.nome}</p>
                        <p className="text-muted-foreground text-sm">/{restaurant.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          restaurant.plan_slug === 'premium'
                            ? 'bg-purple-500/10 text-purple-500'
                            : restaurant.plan_slug === 'pro'
                              ? 'bg-blue-500/10 text-blue-500'
                              : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {restaurant.plan_slug?.toUpperCase() || 'BÁSICO'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {restaurant.suspended ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-xs font-medium text-red-500">
                          <Ban className="h-3 w-3" />
                          Suspenso
                        </span>
                      ) : restaurant.ativo ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
                          <CheckCircle className="h-3 w-3" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-500">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-sm">
                      {new Date(restaurant.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/r/${restaurant.slug}`}
                          target="_blank"
                          className="hover:bg-secondary rounded-lg p-2"
                          title="Ver cardápio"
                        >
                          <Eye className="text-muted-foreground h-4 w-4" />
                        </Link>

                        <Link
                          href={`/admin/clientes/${restaurant.id}`}
                          className="hover:bg-secondary rounded-lg p-2"
                          title="Editar"
                        >
                          <MoreVertical className="text-muted-foreground h-4 w-4" />
                        </Link>

                        {restaurant.suspended ? (
                          <button
                            onClick={() => handleReactivate(restaurant.id)}
                            disabled={actionLoading === restaurant.id}
                            className="rounded-lg p-2 hover:bg-green-500/10"
                            title="Reativar"
                          >
                            {actionLoading === restaurant.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                            ) : (
                              <RefreshCw className="h-4 w-4 text-green-500" />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspend(restaurant.id)}
                            disabled={actionLoading === restaurant.id}
                            className="rounded-lg p-2 hover:bg-red-500/10"
                            title="Suspender"
                          >
                            {actionLoading === restaurant.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                            ) : (
                              <Ban className="h-4 w-4 text-red-500" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRestaurants.length === 0 && (
            <div className="py-12 text-center">
              <Users className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground">Nenhum cliente encontrado</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
