'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  MessageSquare,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Star,
  Filter,
  TrendingUp,
  Bell,
} from 'lucide-react'

interface Feedback {
  id: string
  order_id: string
  restaurant_id: string
  restaurant_nome?: string
  rating: number
  comment: string
  sentimento: string | null
  categoria: string | null
  prioridade: string | null
  resumo_ia: string | null
  acao_sugerida: string | null
  created_at: string
}

const RATING_EMOJI = ['', '😠', '😐', '😊', '🤩']
const PRIORIDADE_COLOR: Record<string, string> = {
  critica: 'bg-red-500/20 text-red-400',
  alta: 'bg-orange-500/20 text-orange-400',
  media: 'bg-yellow-500/20 text-yellow-400',
  baixa: 'bg-green-500/20 text-green-400',
}
const SENTIMENTO_ICON: Record<string, typeof ThumbsUp> = {
  positivo: ThumbsUp,
  negativo: ThumbsDown,
  neutro: Minus,
}

export default function AdminFeedbacksPage() {
  const supabase = createClient()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPrioridade, setFilterPrioridade] = useState<string>('all')
  const [filterCategoria, setFilterCategoria] = useState<string>('all')
  const [newFeedbackAlert, setNewFeedbackAlert] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    // Fetch feedbacks with restaurant names
    let query = supabase
      .from('order_feedbacks')
      .select('*, restaurants!inner(nome)')
      .order('created_at', { ascending: false })
      .limit(200)

    const { data } = await query
    if (data) {
      setFeedbacks(
        data.map((f: Record<string, unknown>) => ({
          ...f,
          restaurant_nome: (f.restaurants as { nome: string })?.nome,
        })) as Feedback[]
      )
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    const timeout = setTimeout(() => {
      void load()
    }, 0)
    return () => clearTimeout(timeout)
  }, [load])

  // Realtime: new feedbacks arriving
  useEffect(() => {
    const channel = supabase
      .channel('admin-feedbacks')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_feedbacks' },
        (payload: { new: Record<string, unknown> }) => {
          const newF = payload.new as unknown as Feedback
          setFeedbacks((prev) => [newF, ...prev])
          setNewFeedbackAlert(true)
          setTimeout(() => setNewFeedbackAlert(false), 5000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const filtered = feedbacks.filter((f) => {
    return (
      (filterPrioridade === 'all' || f.prioridade === filterPrioridade) &&
      (filterCategoria === 'all' || f.categoria === filterCategoria)
    )
  })

  // Sort: prioridade alta/critica first
  const sorted = [...filtered].sort((a, b) => {
    const pOrder: Record<string, number> = { critica: 0, alta: 1, media: 2, baixa: 3 }
    const aP = pOrder[a.prioridade || 'baixa'] ?? 4
    const bP = pOrder[b.prioridade || 'baixa'] ?? 4
    return aP - bP
  })

  const totalPositivo = feedbacks.filter((f) => f.sentimento === 'positivo').length
  const totalNegativo = feedbacks.filter((f) => f.sentimento === 'negativo').length
  const totalCritico = feedbacks.filter(
    (f) => f.prioridade === 'critica' || f.prioridade === 'alta'
  ).length
  const avgRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
      : '0'

  // NPS: rating 4 = promoter, 3 = passive, 1-2 = detractor
  const promoters = feedbacks.filter((f) => f.rating === 4).length
  const detractors = feedbacks.filter((f) => f.rating <= 2).length
  const nps =
    feedbacks.length > 0 ? Math.round(((promoters - detractors) / feedbacks.length) * 100) : 0
  const npsColor = nps >= 50 ? 'text-green-400' : nps >= 0 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="space-y-6">
      {/* Alert banner */}
      {newFeedbackAlert && (
        <div className="animate-in fade-in flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3">
          <Bell className="h-4 w-4 animate-bounce text-blue-400" />
          <span className="text-sm font-medium text-blue-300">Novo feedback recebido!</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs">Total</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-zinc-100">{feedbacks.length}</p>
        </div>
        <div className="rounded-xl border border-green-600/30 bg-green-500/5 p-4">
          <div className="flex items-center gap-2 text-green-400">
            <ThumbsUp className="h-4 w-4" />
            <span className="text-xs">Positivos</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-green-400">{totalPositivo}</p>
        </div>
        <div className="rounded-xl border border-red-600/30 bg-red-500/5 p-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs">Críticos</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-red-400">{totalCritico}</p>
        </div>
        <div className="rounded-xl border border-yellow-600/30 bg-yellow-500/5 p-4">
          <div className="flex items-center gap-2 text-yellow-400">
            <Star className="h-4 w-4" />
            <span className="text-xs">Média</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-yellow-400">{avgRating}</p>
        </div>
        <div className="rounded-xl border border-purple-600/30 bg-purple-500/5 p-4">
          <div className="flex items-center gap-2 text-purple-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">NPS</span>
          </div>
          <p className={`mt-1 text-2xl font-bold ${npsColor}`}>{nps}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-zinc-500" />
        <select
          value={filterPrioridade}
          onChange={(e) => setFilterPrioridade(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300"
        >
          <option value="all">Todas prioridades</option>
          <option value="critica">Crítica</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
        <select
          value={filterCategoria}
          onChange={(e) => setFilterCategoria(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300"
        >
          <option value="all">Todas categorias</option>
          <option value="produto">Produto</option>
          <option value="entrega">Entrega</option>
          <option value="atendimento">Atendimento</option>
          <option value="app">App</option>
          <option value="elogio">Elogio</option>
          <option value="geral">Geral</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
          <MessageSquare className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
          <p className="text-zinc-400">Nenhum feedback encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((f) => {
            const SentIcon = SENTIMENTO_ICON[f.sentimento || ''] || Minus
            return (
              <div
                key={f.id}
                className={`rounded-xl border p-4 ${
                  f.prioridade === 'critica'
                    ? 'border-red-600/40 bg-red-500/5'
                    : f.prioridade === 'alta'
                      ? 'border-orange-600/30 bg-orange-500/5'
                      : 'border-zinc-800 bg-zinc-900'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-lg">{RATING_EMOJI[f.rating] || '⭐'}</span>
                      <span className="text-sm font-medium text-zinc-200">{f.restaurant_nome}</span>
                      {f.prioridade && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORIDADE_COLOR[f.prioridade] || ''}`}
                        >
                          {f.prioridade}
                        </span>
                      )}
                      {f.categoria && (
                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                          {f.categoria}
                        </span>
                      )}
                      <SentIcon
                        className={`h-3.5 w-3.5 ${f.sentimento === 'positivo' ? 'text-green-400' : f.sentimento === 'negativo' ? 'text-red-400' : 'text-zinc-500'}`}
                      />
                    </div>
                    {f.comment && (
                      <p className="mb-2 text-sm text-zinc-300">&ldquo;{f.comment}&rdquo;</p>
                    )}
                    {f.resumo_ia && (
                      <p className="text-xs text-zinc-500">
                        <span className="font-medium text-zinc-400">IA:</span> {f.resumo_ia}
                      </p>
                    )}
                    {f.acao_sugerida && (
                      <p className="mt-1 text-xs text-blue-400">
                        <span className="font-medium">Ação:</span> {f.acao_sugerida}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-zinc-500">
                    {new Date(f.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
