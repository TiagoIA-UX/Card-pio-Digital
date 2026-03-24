'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getActiveRestaurantForUser } from '@/lib/active-restaurant'
import {
  Loader2,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Star,
  Filter,
} from 'lucide-react'

interface Feedback {
  id: string
  order_id: string
  rating: number
  comment: string
  sentimento: string | null
  categoria: string | null
  prioridade: string | null
  resumo_ia: string | null
  acao_sugerida: string | null
  cupom_gerado: string | null
  created_at: string
}

const EMOJI_MAP: Record<number, string> = {
  1: '😡',
  2: '😕',
  3: '😊',
  4: '🤩',
}

const SENTIMENTO_CONFIG: Record<string, { color: string; icon: typeof TrendingUp; label: string }> =
  {
    positivo: {
      color: 'bg-green-500/10 text-green-600 border-green-500/20',
      icon: TrendingUp,
      label: 'Positivo',
    },
    neutro: {
      color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      icon: Star,
      label: 'Neutro',
    },
    negativo: {
      color: 'bg-red-500/10 text-red-600 border-red-500/20',
      icon: TrendingDown,
      label: 'Negativo',
    },
  }

const PRIORIDADE_CONFIG: Record<string, string> = {
  baixa: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  media: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  alta: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  critica: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const CATEGORIA_LABELS: Record<string, string> = {
  produto: '🍕 Produto',
  entrega: '🚚 Entrega',
  atendimento: '👤 Atendimento',
  app: '📱 App',
  elogio: '❤️ Elogio',
  geral: '📋 Geral',
}

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroSentimento, setFiltroSentimento] = useState<string>('todos')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos')
  const supabase = createClient()

  const loadFeedbacks = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const rest = await getActiveRestaurantForUser<{ id: string }>(supabase, session.user.id, 'id')

    if (!rest) return

    let query = supabase
      .from('order_feedbacks')
      .select('*')
      .eq('restaurant_id', rest.id)
      .order('created_at', { ascending: false })

    if (filtroSentimento !== 'todos') {
      query = query.eq('sentimento', filtroSentimento)
    }
    if (filtroCategoria !== 'todos') {
      query = query.eq('categoria', filtroCategoria)
    }

    const { data } = await query.limit(100)
    setFeedbacks(data || [])
    setLoading(false)
  }, [supabase, filtroSentimento, filtroCategoria])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadFeedbacks()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadFeedbacks])

  // ── Métricas ───────────────────────────────────────
  const total = feedbacks.length
  const avgRating = total > 0 ? feedbacks.reduce((s, f) => s + f.rating, 0) / total : 0
  const positivos = feedbacks.filter((f) => f.sentimento === 'positivo').length
  const negativos = feedbacks.filter((f) => f.sentimento === 'negativo').length
  const criticos = feedbacks.filter(
    (f) => f.prioridade === 'critica' || f.prioridade === 'alta'
  ).length

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-foreground text-2xl font-bold">Feedbacks</h1>
        <p className="text-muted-foreground">Avaliações dos clientes com classificação por IA</p>
      </div>

      {/* Cards de métricas */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="bg-card border-border rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-orange-500" />
            <span className="text-muted-foreground text-sm">Total</span>
          </div>
          <p className="text-foreground mt-1 text-2xl font-bold">{total}</p>
        </div>

        <div className="bg-card border-border rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="text-muted-foreground text-sm">Nota média</span>
          </div>
          <p className="text-foreground mt-1 text-2xl font-bold">{avgRating.toFixed(1)}/4</p>
        </div>

        <div className="bg-card border-border rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span className="text-muted-foreground text-sm">Positivos</span>
          </div>
          <p className="text-foreground mt-1 text-2xl font-bold">
            {positivos}
            {total > 0 && (
              <span className="text-sm font-normal text-green-500">
                {' '}
                ({Math.round((positivos / total) * 100)}%)
              </span>
            )}
          </p>
        </div>

        <div className="bg-card border-border rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-muted-foreground text-sm">Críticos</span>
          </div>
          <p className="text-foreground mt-1 text-2xl font-bold">{criticos}</p>
          {negativos > 0 && <p className="text-xs text-red-500">{negativos} negativos no total</p>}
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Filter className="text-muted-foreground h-4 w-4" />
        <select
          title="Filtro de sentimento"
          value={filtroSentimento}
          onChange={(e) => {
            setFiltroSentimento(e.target.value)
            setLoading(true)
          }}
          className="bg-card border-border text-foreground rounded-lg border px-3 py-1.5 text-sm"
        >
          <option value="todos">Todos os sentimentos</option>
          <option value="positivo">Positivo</option>
          <option value="neutro">Neutro</option>
          <option value="negativo">Negativo</option>
        </select>

        <select
          title="Filtro de categoria"
          value={filtroCategoria}
          onChange={(e) => {
            setFiltroCategoria(e.target.value)
            setLoading(true)
          }}
          className="bg-card border-border text-foreground rounded-lg border px-3 py-1.5 text-sm"
        >
          <option value="todos">Todas as categorias</option>
          <option value="produto">Produto</option>
          <option value="entrega">Entrega</option>
          <option value="atendimento">Atendimento</option>
          <option value="app">App</option>
          <option value="elogio">Elogio</option>
          <option value="geral">Geral</option>
        </select>
      </div>

      {/* Lista de feedbacks */}
      {feedbacks.length === 0 ? (
        <div className="bg-card border-border rounded-xl border py-12 text-center">
          <MessageSquare className="text-muted-foreground mx-auto mb-4 h-12 w-12 opacity-50" />
          <h3 className="text-foreground mb-2 font-semibold">Nenhum feedback ainda</h3>
          <p className="text-muted-foreground text-sm">
            Os feedbacks aparecerão aqui quando clientes avaliarem pedidos.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((fb) => {
            const sentConfig = fb.sentimento ? SENTIMENTO_CONFIG[fb.sentimento] : null
            const SentIcon = sentConfig?.icon || Star

            return (
              <div
                key={fb.id}
                className={`bg-card border-border rounded-xl border p-4 transition-colors ${
                  fb.prioridade === 'critica'
                    ? 'border-l-4 border-l-red-500'
                    : fb.prioridade === 'alta'
                      ? 'border-l-4 border-l-orange-500'
                      : ''
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {/* Emoji + Info */}
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{EMOJI_MAP[fb.rating] || '❓'}</span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Sentimento badge */}
                        {sentConfig && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${sentConfig.color}`}
                          >
                            <SentIcon className="h-3 w-3" />
                            {sentConfig.label}
                          </span>
                        )}

                        {/* Categoria */}
                        {fb.categoria && (
                          <span className="text-muted-foreground text-xs">
                            {CATEGORIA_LABELS[fb.categoria] || fb.categoria}
                          </span>
                        )}

                        {/* Prioridade */}
                        {fb.prioridade && fb.prioridade !== 'baixa' && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORIDADE_CONFIG[fb.prioridade] || ''}`}
                          >
                            {fb.prioridade}
                          </span>
                        )}
                      </div>

                      {/* Comentário */}
                      {fb.comment && (
                        <p className="text-foreground mt-1 text-sm">&quot;{fb.comment}&quot;</p>
                      )}

                      {/* Resumo IA */}
                      {fb.resumo_ia && (
                        <p className="text-muted-foreground mt-1 text-xs">🤖 {fb.resumo_ia}</p>
                      )}

                      {/* Ação sugerida */}
                      {fb.acao_sugerida && fb.sentimento === 'negativo' && (
                        <p className="mt-1 text-xs font-medium text-orange-600 dark:text-orange-400">
                          💡 {fb.acao_sugerida}
                        </p>
                      )}

                      {/* Cupom gerado */}
                      {fb.cupom_gerado && (
                        <p className="mt-1 text-xs text-green-600">
                          🎫 Cupom gerado: <code className="font-mono">{fb.cupom_gerado}</code>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Data */}
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {new Date(fb.created_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
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
