'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/shared/supabase/client'
import {
  ClipboardList,
  Loader2,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

type OnboardingSubmission = {
  id: string
  order_id: string | null
  restaurant_id: string | null
  user_id: string
  status: 'pending' | 'in_production' | 'completed' | 'rejected'
  created_at: string
  updated_at: string
  data: {
    nome_negocio: string
    tipo_negocio?: string
    cidade?: string
    estado?: string
    whatsapp: string
    instagram?: string
    horario_funcionamento?: string
    taxa_entrega?: string
    area_entrega?: string
    tempo_preparo?: string
    categorias: Array<{
      nome: string
      produtos: Array<{
        nome: string
        descricao?: string
        preco: string
        adicionais?: string
      }>
    }>
  }
}

const STATUS_LABELS: Record<
  OnboardingSubmission['status'],
  { label: string; icon: React.ElementType; color: string }
> = {
  pending: { label: 'Aguardando', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
  in_production: { label: 'Em produção', icon: Loader2, color: 'text-blue-600 bg-blue-50' },
  completed: { label: 'Concluído', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  rejected: { label: 'Rejeitado', icon: XCircle, color: 'text-red-600 bg-red-50' },
}

export default function AdminBriefingsPage() {
  const supabase = createClient()
  const [submissions, setSubmissions] = useState<OnboardingSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('onboarding_submissions')
      .select('id, order_id, restaurant_id, user_id, status, created_at, updated_at, data')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setSubmissions(data as OnboardingSubmission[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    queueMicrotask(load)
  }, [load])

  const updateStatus = async (id: string, status: OnboardingSubmission['status']) => {
    setUpdating(id)
    await supabase
      .from('onboarding_submissions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    await load()
    setUpdating(null)
  }

  const totalProdutos = (sub: OnboardingSubmission) =>
    sub.data.categorias.reduce((acc, c) => acc + c.produtos.length, 0)

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-orange-500" />
          <h1 className="text-2xl font-bold">Briefings — Feito Pra Você</h1>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <ClipboardList className="mx-auto mb-3 h-12 w-12 opacity-40" />
          <p>Nenhum briefing recebido ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const st = STATUS_LABELS[sub.status] ?? STATUS_LABELS.pending
            const Icon = st.icon
            const isOpen = expanded === sub.id

            return (
              <div key={sub.id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
                {/* Header do card */}
                <div
                  className="flex cursor-pointer items-center justify-between px-5 py-4 hover:bg-gray-50"
                  onClick={() => setExpanded(isOpen ? null : sub.id)}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${st.color}`}
                    >
                      <Icon className="h-3 w-3" />
                      {st.label}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{sub.data.nome_negocio}</p>
                      <p className="text-xs text-gray-400">
                        {sub.data.tipo_negocio || 'Delivery'} · {sub.data.cidade}/{sub.data.estado}{' '}
                        · {new Date(sub.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden text-xs text-gray-400 sm:inline">
                      {sub.data.categorias.length} cat. · {totalProdutos(sub)} produtos
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Conteúdo expandido */}
                {isOpen && (
                  <div className="space-y-4 border-t bg-gray-50 px-5 py-4">
                    {/* Dados gerais */}
                    <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                      <div>
                        <p className="text-xs tracking-wide text-gray-400 uppercase">WhatsApp</p>
                        <p className="font-medium">{sub.data.whatsapp}</p>
                      </div>
                      {sub.data.instagram && (
                        <div>
                          <p className="text-xs tracking-wide text-gray-400 uppercase">Instagram</p>
                          <p className="font-medium">{sub.data.instagram}</p>
                        </div>
                      )}
                      {sub.data.horario_funcionamento && (
                        <div>
                          <p className="text-xs tracking-wide text-gray-400 uppercase">Horário</p>
                          <p className="font-medium">{sub.data.horario_funcionamento}</p>
                        </div>
                      )}
                      {sub.data.taxa_entrega && (
                        <div>
                          <p className="text-xs tracking-wide text-gray-400 uppercase">
                            Taxa entrega
                          </p>
                          <p className="font-medium">{sub.data.taxa_entrega}</p>
                        </div>
                      )}
                      {sub.data.area_entrega && (
                        <div>
                          <p className="text-xs tracking-wide text-gray-400 uppercase">
                            Área de entrega
                          </p>
                          <p className="font-medium">{sub.data.area_entrega}</p>
                        </div>
                      )}
                      {sub.data.tempo_preparo && (
                        <div>
                          <p className="text-xs tracking-wide text-gray-400 uppercase">
                            Tempo preparo
                          </p>
                          <p className="font-medium">{sub.data.tempo_preparo}</p>
                        </div>
                      )}
                    </div>

                    {/* Cardápio */}
                    <div>
                      <p className="mb-2 text-xs tracking-wide text-gray-400 uppercase">
                        Cardápio enviado
                      </p>
                      <div className="space-y-2">
                        {sub.data.categorias.map((cat, ci) => (
                          <div key={ci} className="rounded-lg border bg-white px-4 py-3">
                            <p className="mb-1 text-sm font-semibold">{cat.nome}</p>
                            <ul className="space-y-1">
                              {cat.produtos.map((prod, pi) => (
                                <li
                                  key={pi}
                                  className="flex justify-between gap-2 text-sm text-gray-700"
                                >
                                  <span>
                                    {prod.nome}
                                    {prod.descricao ? ` — ${prod.descricao}` : ''}
                                  </span>
                                  <span className="shrink-0 font-medium">R$ {prod.preco}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Links e ações */}
                    <div className="flex flex-wrap items-center gap-3 border-t pt-2">
                      {sub.restaurant_id && (
                        <a
                          href={`/admin/cardapios`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ver delivery no admin
                        </a>
                      )}

                      <div className="ml-auto flex gap-2">
                        {sub.status !== 'in_production' && (
                          <button
                            onClick={() => updateStatus(sub.id, 'in_production')}
                            disabled={updating === sub.id}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {updating === sub.id ? 'Salvando…' : 'Iniciar'}
                          </button>
                        )}
                        {sub.status !== 'completed' && (
                          <button
                            onClick={() => updateStatus(sub.id, 'completed')}
                            disabled={updating === sub.id}
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            {updating === sub.id ? 'Salvando…' : 'Concluir'}
                          </button>
                        )}
                        {sub.status !== 'rejected' && (
                          <button
                            onClick={() => updateStatus(sub.id, 'rejected')}
                            disabled={updating === sub.id}
                            className="rounded-lg bg-red-100 px-3 py-1.5 text-xs text-red-700 hover:bg-red-200 disabled:opacity-50"
                          >
                            {updating === sub.id ? 'Salvando…' : 'Rejeitar'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
