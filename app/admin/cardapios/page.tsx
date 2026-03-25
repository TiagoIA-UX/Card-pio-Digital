'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Search,
  Eye,
  ExternalLink,
  Store,
  Ban,
  CheckCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react'

interface Restaurant {
  id: string
  nome: string
  slug: string
  telefone: string
  ativo: boolean
  suspended: boolean
  plan_slug: string
  created_at: string
  user_id: string
  last_active_at: string | null
}

export default function AdminCardapiosPage() {
  const supabase = createClient()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('restaurants')
      .select(
        'id, nome, slug, telefone, ativo, suspended, plan_slug, created_at, user_id, last_active_at'
      )
      .order('created_at', { ascending: false })
    if (data) setRestaurants(data as Restaurant[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    load()
  }, [load])

  const handleImpersonate = async (userId: string) => {
    setActionLoading(userId)
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'impersonate', user_id: userId }),
      })
      const data = await res.json()
      if (data.magic_link) window.open(data.magic_link, '_blank')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSuspend = async (id: string) => {
    setActionLoading(id)
    await supabase.rpc('suspend_restaurant_for_nonpayment', { p_restaurant_id: id })
    await load()
    setActionLoading(null)
  }

  const handleReactivate = async (id: string) => {
    setActionLoading(id)
    await supabase.rpc('reactivate_restaurant', { p_restaurant_id: id })
    await load()
    setActionLoading(null)
  }

  const filtered = restaurants.filter((r) => {
    const s = search.toLowerCase()
    const matchSearch =
      !search || r.nome.toLowerCase().includes(s) || r.slug.toLowerCase().includes(s)
    const matchFilter =
      filter === 'all' ||
      (filter === 'active' && r.ativo && !r.suspended) ||
      (filter === 'suspended' && r.suspended)
    return matchSearch && matchFilter
  })

  const total = restaurants.length
  const active = restaurants.filter((r) => r.ativo && !r.suspended).length
  const suspended = restaurants.filter((r) => r.suspended).length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <Store className="h-4 w-4" />
            <span className="text-xs">Total</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-zinc-100">{total}</p>
        </div>
        <div className="rounded-xl border border-green-600/30 bg-green-500/5 p-4">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs">Ativos</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-green-400">{active}</p>
        </div>
        <div className="rounded-xl border border-red-600/30 bg-red-500/5 p-4">
          <div className="flex items-center gap-2 text-red-400">
            <Ban className="h-4 w-4" />
            <span className="text-xs">Suspensos</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-red-400">{suspended}</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pr-4 pl-10 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'active', 'suspended'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${filter === f ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
            >
              {f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : 'Suspensos'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-400">Restaurante</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Plano</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Status</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Criado</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-900/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-200">{r.nome}</p>
                    <p className="text-xs text-zinc-500">/{r.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.plan_slug === 'premium'
                          ? 'bg-purple-500/20 text-purple-400'
                          : r.plan_slug === 'pro'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {r.plan_slug?.toUpperCase() || 'BÁSICO'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.suspended ? (
                      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                        Suspenso
                      </span>
                    ) : r.ativo ? (
                      <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
                        Ativo
                      </span>
                    ) : (
                      <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-400">
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {new Date(r.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/r/${r.slug}`}
                        target="_blank"
                        className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                        title="Ver canal"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleImpersonate(r.user_id)}
                        disabled={actionLoading === r.user_id}
                        className="rounded p-1.5 text-blue-400 hover:bg-blue-600/20"
                        title="Acessar painel do cliente"
                      >
                        {actionLoading === r.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
                      </button>
                      <Link
                        href={`/admin/clientes/${r.id}`}
                        className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                        title="Detalhes"
                      >
                        <Store className="h-4 w-4" />
                      </Link>
                      {r.suspended ? (
                        <button
                          onClick={() => handleReactivate(r.id)}
                          disabled={actionLoading === r.id}
                          className="rounded p-1.5 text-green-400 hover:bg-green-600/20"
                          title="Reativar"
                        >
                          {actionLoading === r.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSuspend(r.id)}
                          disabled={actionLoading === r.id}
                          className="rounded p-1.5 text-red-400 hover:bg-red-600/20"
                          title="Suspender"
                        >
                          {actionLoading === r.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Ban className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-zinc-500">Nenhum canal encontrado</div>
          )}
        </div>
      )}
    </div>
  )
}
