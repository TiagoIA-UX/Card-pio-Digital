'use client'

import { useEffect, useState, useCallback } from 'react'
import { Clock, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

interface Trial {
  subscription_id: string
  restaurant_id: string
  restaurant_nome: string
  user_id: string
  trial_ends_at: string
  days_left: number
  status: 'active' | 'critical' | 'expired'
}

export default function AdminTrialsPage() {
  const [trials, setTrials] = useState<Trial[]>([])
  const [eventsSent, setEventsSent] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchTrials = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/trials')
    if (res.ok) {
      const data = await res.json()
      setTrials(data.trials)
      setEventsSent(data.events_sent)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      void fetchTrials()
    }, 0)
    return () => clearTimeout(timeout)
  }, [fetchTrials])

  const handleExtend = async (userId: string) => {
    await fetch('/api/admin/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'extend_trial', user_id: userId, days: 7 }),
    })
    fetchTrials()
  }

  const handleRevoke = async (userId: string) => {
    await fetch('/api/admin/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'revoke_trial', user_id: userId }),
    })
    fetchTrials()
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })

  const expired = trials.filter((t) => t.status === 'expired')
  const critical = trials.filter((t) => t.status === 'critical')
  const active = trials.filter((t) => t.status === 'active')

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <Clock className="h-4 w-4" />
            <span className="text-xs">Trials ativos</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-zinc-100">{active.length}</p>
        </div>
        <div className="rounded-xl border border-yellow-600/30 bg-yellow-500/5 p-4">
          <div className="flex items-center gap-2 text-yellow-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs">Críticos (≤2d)</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-yellow-400">{critical.length}</p>
        </div>
        <div className="rounded-xl border border-red-600/30 bg-red-500/5 p-4">
          <div className="flex items-center gap-2 text-red-400">
            <XCircle className="h-4 w-4" />
            <span className="text-xs">Expirados</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-red-400">{expired.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <RefreshCw className="h-4 w-4" />
            <span className="text-xs">Eventos enviados</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-blue-400">{eventsSent}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        </div>
      ) : trials.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
          <CheckCircle className="mx-auto mb-3 h-8 w-8 text-green-500" />
          <p className="text-zinc-400">Nenhum trial ativo no momento</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-400">Restaurante</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Status</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Dias restantes</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Expira em</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {trials.map((t) => (
                <tr
                  key={t.subscription_id}
                  className={`${t.status === 'expired' ? 'bg-red-500/5' : t.status === 'critical' ? 'bg-yellow-500/5' : ''} hover:bg-zinc-900/50`}
                >
                  <td className="px-4 py-3 font-medium text-zinc-200">{t.restaurant_nome}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        t.status === 'expired'
                          ? 'bg-red-500/20 text-red-400'
                          : t.status === 'critical'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {t.status === 'expired'
                        ? 'Expirado'
                        : t.status === 'critical'
                          ? 'Crítico'
                          : 'Ativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-bold ${
                          t.days_left <= 0
                            ? 'text-red-400'
                            : t.days_left <= 2
                              ? 'text-yellow-400'
                              : 'text-green-400'
                        }`}
                      >
                        {t.days_left <= 0 ? '0' : t.days_left}d
                      </span>
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-800">
                        <svg
                          className="h-full w-full"
                          preserveAspectRatio="none"
                          viewBox="0 0 100 100"
                        >
                          <rect
                            x="0"
                            y="0"
                            width={Math.min(100, Math.max(0, (t.days_left / 7) * 100))}
                            height="100"
                            rx="8"
                            fill={
                              t.days_left <= 0
                                ? '#ef4444'
                                : t.days_left <= 2
                                  ? '#eab308'
                                  : '#22c55e'
                            }
                          />
                        </svg>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{fmtDate(t.trial_ends_at)}</td>
                  <td className="flex gap-2 px-4 py-3">
                    <button
                      onClick={() => handleExtend(t.user_id)}
                      className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      +7 dias
                    </button>
                    {t.status !== 'expired' && (
                      <button
                        onClick={() => handleRevoke(t.user_id)}
                        className="rounded bg-red-600/20 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-600/40"
                      >
                        Revogar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
