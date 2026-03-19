'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ScrollText, Search, Loader2, Filter, ChevronDown } from 'lucide-react'

interface LogEntry {
  id: string
  entity: string
  entity_id: string | null
  action: string
  actor_id: string | null
  actor_type: string
  metadata: Record<string, unknown> | null
  created_at: string
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  escalate: 'bg-orange-100 text-orange-700',
  strike: 'bg-red-100 text-red-700',
  revert: 'bg-purple-100 text-purple-700',
  resolve: 'bg-teal-100 text-teal-700',
}

export default function AdminLogsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [entity, setEntity] = useState('')
  const [action, setAction] = useState('')
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState(0)

  const loadLogs = useCallback(async () => {
    setLoading(true)

    // Verificar admin
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    const { data: adminCheck } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle()
    if (!adminCheck) {
      router.push('/painel')
      return
    }

    // Buscar logs via API
    const params = new URLSearchParams()
    if (entity) params.set('entity', entity)
    if (action) params.set('action', action)

    const res = await fetch(`/api/admin/logs?${params.toString()}`)
    const json = await res.json()
    setLogs(json.data ?? [])
    setTotal(json.data?.length ?? 0)
    setLoading(false)
  }, [supabase, router, entity, action])

  useEffect(() => {
    queueMicrotask(loadLogs)
  }, [loadLogs])

  const filteredLogs = search
    ? logs.filter(
        (l) =>
          l.entity.includes(search.toLowerCase()) ||
          l.action.includes(search.toLowerCase()) ||
          l.entity_id?.includes(search) ||
          JSON.stringify(l.metadata ?? {})
            .toLowerCase()
            .includes(search.toLowerCase())
      )
    : logs

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">
          <ScrollText className="mr-2 inline h-6 w-6" />
          Logs & Auditoria
        </h1>

        {/* Filtros */}
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Todas Entidades</option>
            <option value="support_ticket">Tickets</option>
            <option value="affiliate">Afiliados</option>
            <option value="freelancer">Freelancers</option>
            <option value="freelancer_job">Jobs</option>
            <option value="penalty">Penalidades</option>
            <option value="restaurant">Restaurantes</option>
          </select>

          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Todas Ações</option>
            <option value="create">Criação</option>
            <option value="update">Atualização</option>
            <option value="delete">Exclusão</option>
            <option value="escalate">Escalação</option>
            <option value="strike">Strike</option>
            <option value="revert">Reversão</option>
            <option value="resolve">Resolução</option>
          </select>

          <div className="relative flex-1">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar nos logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border py-2 pr-3 pl-9 text-sm"
            />
          </div>

          <button
            onClick={loadLogs}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            <Filter className="mr-1 inline h-4 w-4" /> Filtrar
          </button>
        </div>

        <p className="mb-3 text-sm text-gray-500">
          {filteredLogs.length} de {total} registros
        </p>

        {/* Tabela */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Data/Hora</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Entidade</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Ação</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Actor</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-gray-500">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
                        {log.entity}
                      </span>
                      {log.entity_id && (
                        <span className="ml-1 text-xs text-gray-400" title={log.entity_id}>
                          {log.entity_id.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{log.actor_type}</span>
                      {log.actor_id && (
                        <span className="ml-1 font-mono text-xs text-gray-400" title={log.actor_id}>
                          {log.actor_id.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-xs text-gray-500">
                      {log.metadata ? JSON.stringify(log.metadata).slice(0, 100) : '—'}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      Nenhum log encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
