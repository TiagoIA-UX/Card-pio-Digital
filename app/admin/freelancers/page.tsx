'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Loader2,
  Plus,
  Eye,
} from 'lucide-react'

interface Freelancer {
  id: string
  nome: string
  email: string
  especialidades: string[]
  status: string
  rating_avg: number
  jobs_completed: number
  cidade: string | null
  estado: string | null
  created_at: string
}

interface Job {
  id: string
  titulo: string
  tipo: string
  status: string
  valor: number | null
  prazo: string
  freelancer_id: string | null
  revisoes_usadas: number
  max_revisoes: number
  created_at: string
  freelancers?: { nome: string }
  restaurants?: { nome: string }
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-red-100 text-red-800',
  blocked: 'bg-gray-100 text-gray-800',
  open: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  review: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
}

export default function AdminFreelancersPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'freelancers' | 'jobs'>('freelancers')
  const [loading, setLoading] = useState(true)
  const [freelancers, setFreelancers] = useState<Freelancer[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/freelancers?tab=${tab}`)
    if (res.status === 401) {
      router.push('/login')
      return
    }
    const json = await res.json()
    if (tab === 'freelancers') setFreelancers(json.data ?? [])
    else setJobs(json.data ?? [])
    setTotal(json.total ?? 0)
    setLoading(false)
  }, [tab, router])

  useEffect(() => {
    queueMicrotask(load)
  }, [load])

  const doAction = async (action: string, data: Record<string, unknown>) => {
    const key = `${action}-${JSON.stringify(data)}`
    setActionLoading(key)
    await fetch('/api/admin/freelancers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...data }),
    })
    await load()
    setActionLoading(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">
          <Briefcase className="mr-2 inline h-6 w-6" />
          Freelancers ({total})
        </h1>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-gray-200 p-1">
          {(['freelancers', 'jobs'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                tab === t ? 'bg-white shadow' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t === 'freelancers' ? (
                <>
                  <Users className="mr-1 inline h-4 w-4" /> Freelancers
                </>
              ) : (
                <>
                  <Briefcase className="mr-1 inline h-4 w-4" /> Jobs
                </>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : tab === 'freelancers' ? (
          /* Freelancers Table */
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Especialidades</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Rating</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Jobs</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Local</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {freelancers.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{f.nome}</p>
                      <p className="text-xs text-gray-500">{f.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {f.especialidades.map((e) => (
                          <span key={e} className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                            {e}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[f.status]}`}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Star className="mr-1 inline h-3.5 w-3.5 text-yellow-500" />
                      {f.rating_avg.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-center">{f.jobs_completed}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {[f.cidade, f.estado].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {f.status === 'pending' && (
                          <button
                            onClick={() => doAction('approve', { freelancer_id: f.id })}
                            disabled={!!actionLoading}
                            className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            <CheckCircle className="mr-0.5 inline h-3 w-3" /> Aprovar
                          </button>
                        )}
                        {['approved', 'active'].includes(f.status) && (
                          <button
                            onClick={() => doAction('suspend', { freelancer_id: f.id })}
                            disabled={!!actionLoading}
                            className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            <XCircle className="mr-0.5 inline h-3 w-3" /> Suspender
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {freelancers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Nenhum freelancer cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Jobs Table */
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Título</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Freelancer</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Restaurante</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Revisões</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Prazo</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {jobs.map((j) => {
                  const overdue =
                    new Date(j.prazo) < new Date() && !['completed', 'cancelled'].includes(j.status)
                  return (
                    <tr key={j.id} className={`hover:bg-gray-50 ${overdue ? 'bg-red-50' : ''}`}>
                      <td className="px-4 py-3 font-medium">{j.titulo}</td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{j.tipo}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[j.status]}`}
                        >
                          {j.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {(j.freelancers as { nome: string } | undefined)?.nome ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {(j.restaurants as { nome: string } | undefined)?.nome ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-xs">
                        {j.revisoes_usadas}/{j.max_revisoes}
                      </td>
                      <td
                        className={`px-4 py-3 text-xs ${overdue ? 'font-bold text-red-600' : 'text-gray-500'}`}
                      >
                        {new Date(j.prazo).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {j.status === 'review' && (
                            <button
                              onClick={() => doAction('complete_job', { job_id: j.id, rating: 5 })}
                              disabled={!!actionLoading}
                              className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              Aprovar
                            </button>
                          )}
                          {!['completed', 'cancelled'].includes(j.status) && (
                            <button
                              onClick={() => doAction('cancel_job', { job_id: j.id })}
                              disabled={!!actionLoading}
                              className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      Nenhum job encontrado.
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
