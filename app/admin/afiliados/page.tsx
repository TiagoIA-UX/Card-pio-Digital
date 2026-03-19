'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Shield,
  Loader2,
  ChevronDown,
  Star,
  MapPin,
  Minus,
  Plus,
  Undo2,
} from 'lucide-react'

interface Affiliate {
  id: string
  nome: string
  code: string
  status: string
  tier: string
  commission_rate: number
  strikes: number
  last_response_at: string | null
  cidade: string | null
  estado: string | null
  chave_pix: string | null
  created_at: string
  referral_count?: number
}

interface Penalty {
  id: string
  affiliate_id: string
  tipo: string
  strike_number: number
  descricao: string
  reverted_at: string | null
  created_at: string
}

const TIER_COLOR: Record<string, string> = {
  trainee: 'bg-gray-100 text-gray-700',
  analista: 'bg-blue-100 text-blue-700',
  coordenador: 'bg-purple-100 text-purple-700',
  gerente: 'bg-indigo-100 text-indigo-700',
  diretor: 'bg-orange-100 text-orange-700',
  socio: 'bg-yellow-100 text-yellow-800',
}

const STATUS_BADGE: Record<string, string> = {
  ativo: 'bg-green-100 text-green-800',
  inativo: 'bg-gray-100 text-gray-600',
  suspenso: 'bg-red-100 text-red-800',
}

export default function AdminAfiliadosPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null)
  const [penalties, setPenalties] = useState<Penalty[]>([])
  const [penaltiesLoading, setPenaltiesLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('')

  const loadAffiliates = useCallback(async () => {
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

    // Buscar afiliados
    let query = supabase.from('affiliates').select('*').order('created_at', { ascending: false })

    if (filterStatus) query = query.eq('status', filterStatus)

    const { data } = await query
    if (data) {
      // Enriquecer com contagem de referrals
      const enriched = await Promise.all(
        data.map(async (a: Affiliate) => {
          const { count } = await supabase
            .from('affiliate_referrals')
            .select('*', { count: 'exact', head: true })
            .eq('affiliate_id', a.id)
          return { ...a, referral_count: count ?? 0 }
        })
      )
      setAffiliates(enriched)
    }
    setLoading(false)
  }, [supabase, router, filterStatus])

  useEffect(() => {
    queueMicrotask(loadAffiliates)
  }, [loadAffiliates])

  const selectAffiliate = async (aff: Affiliate) => {
    setSelectedAffiliate(aff)
    setPenaltiesLoading(true)
    const res = await fetch(`/api/admin/penalidades?affiliate_id=${aff.id}`)
    const json = await res.json()
    setPenalties(json.data ?? [])
    setPenaltiesLoading(false)
  }

  const applyStrike = async () => {
    if (!selectedAffiliate) return
    setActionLoading(true)
    await fetch('/api/admin/penalidades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'apply',
        affiliate_id: selectedAffiliate.id,
        descricao: 'Penalidade manual aplicada pelo admin.',
      }),
    })
    await loadAffiliates()
    // Reload selected
    const updated = affiliates.find((a) => a.id === selectedAffiliate.id)
    if (updated) await selectAffiliate({ ...updated, strikes: updated.strikes + 1 })
    setActionLoading(false)
  }

  const revertPenalty = async (penaltyId: string) => {
    setActionLoading(true)
    await fetch('/api/admin/penalidades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'revert', penalty_id: penaltyId }),
    })
    if (selectedAffiliate) await selectAffiliate(selectedAffiliate)
    await loadAffiliates()
    setActionLoading(false)
  }

  // Stats
  const stats = {
    total: affiliates.length,
    ativos: affiliates.filter((a) => a.status === 'ativo').length,
    comStrikes: affiliates.filter((a) => a.strikes > 0).length,
    suspensos: affiliates.filter((a) => a.status === 'suspenso').length,
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">
          <Users className="mr-2 inline h-6 w-6" />
          Gestão de Afiliados
        </h1>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Total', value: stats.total, icon: Users, color: 'blue' },
            { label: 'Ativos', value: stats.ativos, icon: TrendingUp, color: 'green' },
            { label: 'Com Strikes', value: stats.comStrikes, icon: AlertTriangle, color: 'orange' },
            { label: 'Suspensos', value: stats.suspensos, icon: Shield, color: 'red' },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border bg-white p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <s.icon className="h-4 w-4" />
                {s.label}
              </div>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filtro */}
        <div className="mb-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="ativo">Ativos</option>
            <option value="suspenso">Suspensos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Lista */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Afiliado</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Tier</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">Comissão</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">Referrals</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">Strikes</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {affiliates.map((a) => (
                      <tr
                        key={a.id}
                        onClick={() => selectAffiliate(a)}
                        className={`cursor-pointer hover:bg-gray-50 ${
                          selectedAffiliate?.id === a.id ? 'bg-blue-50' : ''
                        } ${a.strikes >= 3 ? 'bg-red-50' : a.strikes > 0 ? 'bg-yellow-50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium">{a.nome}</p>
                          <p className="text-xs text-gray-500">
                            {a.code}
                            {a.cidade && (
                              <span className="ml-1">
                                <MapPin className="mr-0.5 inline h-3 w-3" />
                                {a.cidade}/{a.estado}
                              </span>
                            )}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${TIER_COLOR[a.tier]}`}
                          >
                            {a.tier}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono">{a.commission_rate}%</td>
                        <td className="px-4 py-3 text-center">{a.referral_count ?? 0}</td>
                        <td className="px-4 py-3 text-center">
                          {a.strikes > 0 ? (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                              <AlertTriangle className="h-3 w-3" /> {a.strikes}
                            </span>
                          ) : (
                            <span className="text-gray-300">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[a.status]}`}
                          >
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {affiliates.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          Nenhum afiliado encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Painel lateral */}
          <div className="lg:col-span-1">
            {selectedAffiliate ? (
              <div className="rounded-lg border bg-white p-5">
                <h3 className="text-lg font-semibold">{selectedAffiliate.nome}</h3>
                <p className="text-sm text-gray-500">Código: {selectedAffiliate.code}</p>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tier</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${TIER_COLOR[selectedAffiliate.tier]}`}
                    >
                      {selectedAffiliate.tier}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Comissão</span>
                    <span className="font-mono">{selectedAffiliate.commission_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Strikes</span>
                    <span
                      className={`font-bold ${selectedAffiliate.strikes >= 3 ? 'text-red-600' : selectedAffiliate.strikes > 0 ? 'text-orange-600' : 'text-green-600'}`}
                    >
                      {selectedAffiliate.strikes}/3
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Referrals</span>
                    <span>{selectedAffiliate.referral_count ?? 0}</span>
                  </div>
                  {selectedAffiliate.last_response_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Última resposta</span>
                      <span className="text-xs">
                        {new Date(selectedAffiliate.last_response_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}
                  {selectedAffiliate.chave_pix && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">PIX</span>
                      <span className="max-w-32 truncate text-xs">
                        {selectedAffiliate.chave_pix}
                      </span>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={applyStrike}
                    disabled={actionLoading}
                    className="flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <Plus className="h-3 w-3" /> Strike
                  </button>
                </div>

                {/* Penalidades */}
                <div className="mt-4 border-t pt-4">
                  <h4 className="mb-2 text-sm font-medium text-gray-700">
                    Histórico de Penalidades
                  </h4>
                  {penaltiesLoading ? (
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-400" />
                  ) : penalties.length === 0 ? (
                    <p className="text-xs text-gray-400">Nenhuma penalidade.</p>
                  ) : (
                    <div className="max-h-64 space-y-2 overflow-y-auto">
                      {penalties.map((p) => (
                        <div
                          key={p.id}
                          className={`rounded border p-2 text-xs ${p.reverted_at ? 'border-dashed bg-gray-50' : 'bg-red-50'}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              Strike #{p.strike_number} — {p.tipo}
                            </span>
                            {!p.reverted_at && (
                              <button
                                onClick={() => revertPenalty(p.id)}
                                disabled={actionLoading}
                                className="flex items-center gap-0.5 rounded bg-gray-200 px-1.5 py-0.5 text-gray-600 hover:bg-gray-300 disabled:opacity-50"
                              >
                                <Undo2 className="h-3 w-3" /> Reverter
                              </button>
                            )}
                          </div>
                          <p className="mt-0.5 text-gray-600">{p.descricao}</p>
                          <p className="mt-0.5 text-gray-400">
                            {new Date(p.created_at).toLocaleString('pt-BR')}
                            {p.reverted_at && (
                              <span className="ml-1 text-green-600">(revertida)</span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-lg border bg-white text-sm text-gray-400">
                Selecione um afiliado
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
