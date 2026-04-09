'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import {
  Users,
  Search,
  Filter,
  ChevronDown,
  ExternalLink,
  Clock,
  UserPlus,
  XCircle,
  Shield,
  MoreVertical,
} from 'lucide-react'

interface UserItem {
  id: string
  email: string
  nome: string | null
  avatar_url: string | null
  created_at: string
  last_sign_in_at: string | null
  last_seen_at: string | null
  referred_by: string | null
  restaurant: {
    id: string
    nome: string
    slug: string
    plan_slug: string
    ativo: boolean
    suspended: boolean
  } | null
  subscription: {
    status: string
    trial_ends_at: string | null
    current_period_end: string | null
  } | null
  trial_days_left: number | null
  trial_days: number
  status: string
}

interface Stats {
  total: number
  with_restaurant: number
  trial: number
  active: number
  suspended: number
  canceled: number
  no_restaurant: number
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  trial: { label: 'Trial', cls: 'bg-blue-500/20 text-blue-400' },
  active: { label: 'Ativo', cls: 'bg-green-500/20 text-green-400' },
  suspended: { label: 'Suspenso', cls: 'bg-red-500/20 text-red-400' },
  canceled: { label: 'Cancelado', cls: 'bg-zinc-500/20 text-zinc-400' },
  inactive: { label: 'Inativo', cls: 'bg-yellow-500/20 text-yellow-400' },
  no_restaurant: { label: 'Sem restaurante', cls: 'bg-zinc-700/50 text-zinc-500' },
}

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRenderAt, setLastRenderAt] = useState(() => Date.now())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/usuarios')
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users)
      setStats(data.stats)
      setLastRenderAt(Date.now())
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      void fetchUsers()
    }, 0)
    return () => clearTimeout(timeout)
  }, [fetchUsers])

  const handleAction = async (action: string, userId: string, days?: number) => {
    setActionLoading(userId)
    setOpenMenu(null)
    const res = await fetch('/api/admin/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, user_id: userId, days }),
    })
    if (res.ok) {
      const data = await res.json()
      if (action === 'impersonate' && data.impersonate_url) {
        window.open(data.impersonate_url, '_blank')
      }
      await fetchUsers()
    }
    setActionLoading(null)
  }

  const filtered = users.filter((u) => {
    if (statusFilter && u.status !== statusFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return (
        u.email?.toLowerCase().includes(s) ||
        u.nome?.toLowerCase().includes(s) ||
        u.restaurant?.nome?.toLowerCase().includes(s) ||
        u.restaurant?.slug?.toLowerCase().includes(s) ||
        u.referred_by?.toLowerCase().includes(s)
      )
    }
    return true
  })

  const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—')
  const fmtAgo = (d: string | null) => {
    if (!d) return 'Nunca'
    const diff = lastRenderAt - new Date(d).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}min atrás`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h atrás`
    return `${Math.floor(hrs / 24)}d atrás`
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {[
            { label: 'Total', value: stats.total, color: 'text-zinc-100' },
            { label: 'Com restaurante', value: stats.with_restaurant, color: 'text-blue-400' },
            { label: 'Trial', value: stats.trial, color: 'text-sky-400' },
            { label: 'Ativos', value: stats.active, color: 'text-green-400' },
            { label: 'Suspensos', value: stats.suspended, color: 'text-red-400' },
            { label: 'Cancelados', value: stats.canceled, color: 'text-zinc-400' },
            { label: 'Sem rest.', value: stats.no_restaurant, color: 'text-zinc-500' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              <p className="text-xs text-zinc-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nome, email, restaurante, afiliado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pr-4 pl-10 text-sm text-zinc-100 placeholder-zinc-600 focus:border-orange-500 focus:outline-none"
          />
        </div>
        <select
          title="Filtro de status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300"
        >
          <option value="">Todos os status</option>
          <option value="trial">Trial</option>
          <option value="active">Ativo</option>
          <option value="suspended">Suspenso</option>
          <option value="canceled">Cancelado</option>
          <option value="inactive">Inativo</option>
          <option value="no_restaurant">Sem restaurante</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-400">Usuário</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Restaurante</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Plano</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Status</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Trial</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Afiliado</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Cadastro</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Último acesso</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.map((u) => {
                const badge = STATUS_BADGE[u.status] || STATUS_BADGE.inactive
                return (
                  <tr key={u.id} className="hover:bg-zinc-900/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.avatar_url ? (
                          <Image
                            src={u.avatar_url}
                            alt={u.nome ? `Avatar de ${u.nome}` : 'Avatar do usuário'}
                            width={28}
                            height={28}
                            unoptimized
                            className="h-7 w-7 rounded-full"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-xs text-zinc-400">
                            {(u.nome || u.email)?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          {u.nome && <p className="font-medium text-zinc-200">{u.nome}</p>}
                          <p className="text-xs text-zinc-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.restaurant ? (
                        <a
                          href={`/r/${u.restaurant.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-orange-400 hover:underline"
                        >
                          {u.restaurant.nome}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
                        {u.restaurant?.plan_slug || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.trial_days_left !== null && u.trial_days_left >= 0 ? (
                        <div className="w-20">
                          <div className="mb-0.5 text-xs text-zinc-400">
                            {u.trial_days_left}d restantes
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                            <svg
                              className="h-full w-full"
                              preserveAspectRatio="none"
                              viewBox="0 0 100 100"
                            >
                              <rect
                                x="0"
                                y="0"
                                width={Math.min(100, (u.trial_days_left / u.trial_days) * 100)}
                                height="100"
                                rx="8"
                                fill={
                                  u.trial_days_left <= 1
                                    ? '#ef4444'
                                    : u.trial_days_left <= 3
                                      ? '#eab308'
                                      : '#22c55e'
                                }
                              />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.referred_by ? (
                        <span className="rounded bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">
                          {u.referred_by}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{fmtDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{fmtAgo(u.last_sign_in_at)}</td>
                    <td className="relative px-4 py-3">
                      <button
                        onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                        disabled={actionLoading === u.id}
                        className="rounded p-1 hover:bg-zinc-800"
                      >
                        {actionLoading === u.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                        ) : (
                          <MoreVertical className="h-4 w-4 text-zinc-400" />
                        )}
                      </button>
                      {openMenu === u.id && (
                        <div className="absolute top-full right-4 z-20 w-48 rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-xl">
                          {u.restaurant && (
                            <button
                              onClick={() => handleAction('impersonate', u.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700"
                            >
                              <Shield className="h-3.5 w-3.5" /> Acessar como usuário
                            </button>
                          )}
                          {(u.status === 'trial' || u.status === 'inactive') && (
                            <button
                              onClick={() => handleAction('extend_trial', u.id, 7)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700"
                            >
                              <Clock className="h-3.5 w-3.5" /> Estender trial +7d
                            </button>
                          )}
                          {u.status === 'trial' && (
                            <button
                              onClick={() => handleAction('revoke_trial', u.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-700"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Revogar trial
                            </button>
                          )}
                          {u.restaurant && (
                            <a
                              href={`/admin/clientes/${u.restaurant.id}`}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700"
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> Detalhe do restaurante
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-zinc-500">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-zinc-600">
        {filtered.length} de {users.length} usuários
      </p>
    </div>
  )
}
