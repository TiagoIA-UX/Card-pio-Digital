'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/shared/supabase/client'
import { Loader2, Bot, TrendingUp, Clock } from 'lucide-react'

interface Metrics {
  totalRestaurants: number
  activeSubscriptions: number
  mrr: number
  activationRate: number
}

interface AIMetrics {
  totalEscalations: number
  pendingEscalations: number
  resolvedEscalations: number
  resolutionRate: number
  totalLearningEntries: number
  avgResolutionTimeHours: number | null
  topReasons: { reason: string; count: number }[]
}

export default function AdminMetricsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [aiMetrics, setAiMetrics] = useState<AIMetrics | null>(null)

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      // Proteção por email do administrador
      if (session.user.email !== 'globemarket7@gmail.com') {
        setLoading(false)
        return
      }

      try {
        const { count: restCount } = await supabase
          .from('restaurants')
          .select('id', { count: 'exact', head: true })

        const { data: subs } = await supabase.from('subscriptions').select('status, plan_id')

        // plans table may not exist in all deployments
        let plans: { id: string; price_month: number }[] = []
        try {
          const { data: plansData } = await supabase.from('plans').select('id, price_month')
          plans = plansData || []
        } catch {
          // plans table doesn't exist, use defaults
        }

        // activation_events may not exist
        let activatedRes: { restaurant_id: string }[] = []
        try {
          const { data: activatedData } = await supabase
            .from('activation_events')
            .select('restaurant_id')
            .eq('event_type', 'received_first_order')
          activatedRes = activatedData || []
        } catch {
          // activation_events table doesn't exist
        }

        const totalRestaurants = restCount || 0
        const activeSubscriptions = (subs || []).filter(
          (s: { status: string }) => s.status === 'active'
        ).length

        const planPriceMap = new Map<string, number>()
        plans.forEach((p) => planPriceMap.set(p.id, Number(p.price_month)))

        let mrr = 0
        ;(subs || []).forEach((s: { status: string; plan_id?: string }) => {
          if (s.status === 'active' && s.plan_id && planPriceMap.has(s.plan_id)) {
            mrr += planPriceMap.get(s.plan_id) || 0
          }
        })

        const activatedRestaurants = new Set(
          activatedRes.map((e) => e.restaurant_id)
        ).size
        const activationRate =
          totalRestaurants > 0 ? (activatedRestaurants / totalRestaurants) * 100 : 0

        // AI tables may not exist - wrap in try/catch
        let totalEscalations = 0
        let pendingEscalations = 0
        let resolvedEscalations = 0
        let totalLearningEntries = 0
        let topReasons: { reason: string; count: number }[] = []
        let avgResolutionTimeHours: number | null = null

        try {
          const { count: escCount } = await supabase
            .from('ai_escalations')
            .select('id', { count: 'exact', head: true })
          totalEscalations = escCount || 0

          const { count: pendCount } = await supabase
            .from('ai_escalations')
            .select('id', { count: 'exact', head: true })
            .eq('resolved', false)
          pendingEscalations = pendCount || 0

          const { count: resCount } = await supabase
            .from('ai_escalations')
            .select('id', { count: 'exact', head: true })
            .eq('resolved', true)
          resolvedEscalations = resCount || 0

          const { count: learnCount } = await supabase
            .from('ai_learning_entries')
            .select('id', { count: 'exact', head: true })
          totalLearningEntries = learnCount || 0

          // Escalation reasons breakdown
          const { data: escalationReasons } = await supabase.from('ai_escalations').select('reason')

          const reasonCounts = new Map<string, number>()
          for (const e of escalationReasons ?? []) {
            const reason = (e as { reason?: string }).reason ?? 'unknown'
            reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1)
          }
          topReasons = [...reasonCounts.entries()]
            .map(([reason, count]) => ({ reason, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)

          // Average resolution time
          const { data: resolvedEscalationsData } = await supabase
            .from('ai_escalations')
            .select('created_at, resolved_at')
            .eq('resolved', true)
            .not('resolved_at', 'is', null)

          const resolved = resolvedEscalationsData ?? []
          if (resolved.length > 0) {
            const totalMs = resolved.reduce((sum: number, e: { created_at: string; resolved_at: string }) => {
              const created = new Date(e.created_at).getTime()
              const resolvedAt = new Date(e.resolved_at).getTime()
              return sum + (resolvedAt - created)
            }, 0)
            avgResolutionTimeHours = Math.round((totalMs / resolved.length / 3_600_000) * 10) / 10
          }
        } catch {
          // AI tables don't exist yet - that's OK
        }

        const resolutionRate =
          totalEscalations > 0
            ? (resolvedEscalations / totalEscalations) * 100
            : 0

        setMetrics({
          totalRestaurants,
          activeSubscriptions,
          mrr,
          activationRate,
        })
        setAiMetrics({
          totalEscalations,
          pendingEscalations,
          resolvedEscalations,
          resolutionRate,
          totalLearningEntries,
          avgResolutionTimeHours,
          topReasons,
        })
      } catch (error) {
        console.error('Error loading metrics:', error)
        // Set empty metrics on error
        setMetrics({
          totalRestaurants: 0,
          activeSubscriptions: 0,
          mrr: 0,
          activationRate: 0,
        })
        setAiMetrics({
          totalEscalations: 0,
          pendingEscalations: 0,
          resolvedEscalations: 0,
          resolutionRate: 0,
          totalLearningEntries: 0,
          avgResolutionTimeHours: null,
          topReasons: [],
        })
      }
      setLoading(false)
    }

    void load()
  }, [supabase])

  if (loading) {
    return (
      <main className="bg-background flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </main>
    )
  }

  if (!metrics) {
    return (
      <main className="bg-background flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Não foi possível carregar as métricas. Verifique se você está autenticado.
        </p>
      </main>
    )
  }

  return (
    <main className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-2">
          <TrendingUp className="text-primary h-6 w-6" />
          <h1 className="text-foreground text-2xl font-bold">Métricas do SaaS</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-card border-border rounded-xl border p-4">
            <p className="text-muted-foreground mb-1 text-sm">Total de deliverys</p>
            <p className="text-foreground text-2xl font-bold">{metrics.totalRestaurants}</p>
          </div>

          <div className="bg-card border-border rounded-xl border p-4">
            <p className="text-muted-foreground mb-1 text-sm">Assinaturas ativas</p>
            <p className="text-foreground text-2xl font-bold">{metrics.activeSubscriptions}</p>
          </div>

          <div className="bg-card border-border rounded-xl border p-4">
            <p className="text-muted-foreground mb-1 text-sm">MRR estimado</p>
            <p className="text-foreground text-2xl font-bold">
              R$ {metrics.mrr.toFixed(2).replace('.', ',')}
            </p>
          </div>

          <div className="bg-card border-border rounded-xl border p-4">
            <p className="text-muted-foreground mb-1 text-sm">Taxa de ativação</p>
            <p className="text-foreground text-2xl font-bold">
              {metrics.activationRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {aiMetrics && (
          <section className="mt-8">
            <div className="mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5 text-orange-500" />
              <h2 className="text-foreground text-xl font-semibold">Métricas de IA</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-card border-border rounded-xl border p-4">
                <p className="text-muted-foreground mb-1 text-sm">Escalações totais</p>
                <p className="text-foreground text-2xl font-bold">{aiMetrics.totalEscalations}</p>
              </div>

              <div className="bg-card border-border rounded-xl border p-4">
                <p className="text-muted-foreground mb-1 text-sm">Escalações pendentes</p>
                <p className="text-foreground text-2xl font-bold">{aiMetrics.pendingEscalations}</p>
              </div>

              <div className="bg-card border-border rounded-xl border p-4">
                <p className="text-muted-foreground mb-1 text-sm">Escalações resolvidas</p>
                <p className="text-foreground text-2xl font-bold">
                  {aiMetrics.resolvedEscalations}
                </p>
              </div>

              <div className="bg-card border-border rounded-xl border p-4">
                <p className="text-muted-foreground mb-1 text-sm">Taxa de resolução</p>
                <p className="text-foreground text-2xl font-bold">
                  {aiMetrics.resolutionRate.toFixed(1)}%
                </p>
              </div>

              <div className="bg-card border-border rounded-xl border p-4">
                <div className="flex items-center gap-1.5">
                  <Clock className="text-muted-foreground h-3.5 w-3.5" />
                  <p className="text-muted-foreground mb-1 text-sm">Tempo médio de resolução</p>
                </div>
                <p className="text-foreground text-2xl font-bold">
                  {aiMetrics.avgResolutionTimeHours !== null
                    ? `${aiMetrics.avgResolutionTimeHours}h`
                    : '—'}
                </p>
              </div>

              <div className="bg-card border-border rounded-xl border p-4">
                <p className="text-muted-foreground mb-1 text-sm">Entradas de aprendizado</p>
                <p className="text-foreground text-2xl font-bold">
                  {aiMetrics.totalLearningEntries}
                </p>
              </div>
            </div>

            {aiMetrics.topReasons.length > 0 && (
              <div className="bg-card border-border mt-4 rounded-xl border p-4">
                <p className="text-foreground mb-3 text-sm font-semibold">
                  Top motivos de escalação
                </p>
                <div className="space-y-2">
                  {aiMetrics.topReasons.map((r) => (
                    <div key={r.reason} className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm capitalize">
                        {r.reason.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-zinc-200">
                          <div
                            className="h-full rounded-full bg-orange-500"
                            style={{
                              width: `${Math.min(100, (r.count / (aiMetrics.topReasons[0]?.count || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-foreground text-xs font-medium">{r.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
