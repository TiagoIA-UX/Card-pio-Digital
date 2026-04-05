'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/shared/supabase/client'
import Link from 'next/link'
import {
  Users,
  Store,
  TrendingUp,
  Clock,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  Activity,
  Shield,
  Heart,
  KeyRound,
} from 'lucide-react'

interface DashboardData {
  totalUsers: number
  totalRestaurants: number
  activeRestaurants: number
  suspendedRestaurants: number
  trialsActive: number
  trialsCritical: number
  mrr: number
  byPlan: Record<string, number>
  recentRestaurants: {
    id: string
    nome: string
    slug: string
    plan_slug: string
    created_at: string
  }[]
  totalAffiliates: number
  affiliatesMrr: number
  affiliatesAtivos: number
  totalFeedbacks: number
  avgRating: number
  nps: number
  healthStatus: 'ok' | 'degraded' | 'down' | 'unknown'
}

export default function AdminOverviewPage() {
  const supabase = createClient()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)

    // Parallel data fetches
    const [
      { data: restaurants },
      { data: subscriptions },
      { data: affiliates },
      { data: feedbacks },
      { data: healthChecks },
      { data: affRefs },
    ] = await Promise.all([
      supabase
        .from('restaurants')
        .select('id, nome, slug, plan_slug, ativo, suspended, created_at'),
      supabase.from('subscriptions').select('status, trial_ends_at, plan_slug'),
      supabase.from('affiliates').select('id, status'),
      supabase.from('order_feedbacks').select('rating'),
      supabase
        .from('health_checks')
        .select('status')
        .order('checked_at', { ascending: false })
        .limit(1),
      supabase.from('affiliate_referrals').select('status, comissao'),
    ])

    const rList = (restaurants || []) as {
      id: string
      nome: string
      slug: string
      plan_slug: string
      ativo: boolean
      suspended: boolean
      created_at: string
    }[]
    const sList = (subscriptions || []) as {
      status: string
      trial_ends_at: string | null
      plan_slug: string
    }[]

    const activeR = rList.filter((r) => r.ativo && !r.suspended).length
    const suspendedR = rList.filter((r) => r.suspended).length

    const trials = sList.filter((s) => s.status === 'trial')
    const now = Date.now()
    const trialsCritical = trials.filter((s) => {
      if (!s.trial_ends_at) return false
      const left = Math.ceil((new Date(s.trial_ends_at).getTime() - now) / 86400000)
      return left <= 2 && left >= 0
    }).length

    const byPlan: Record<string, number> = {}
    rList.forEach((r) => {
      const p = r.plan_slug || 'basico'
      byPlan[p] = (byPlan[p] || 0) + 1
    })

    const mrr = (byPlan.basico || 0) * 49 + (byPlan.pro || 0) * 99 + (byPlan.premium || 0) * 199

    const fList = (feedbacks || []) as { rating: number }[]
    const avgRating = fList.length > 0 ? fList.reduce((s, f) => s + f.rating, 0) / fList.length : 0

    // NPS: 4 = promoter, 3 = passive, 1-2 = detractor
    const promoters = fList.filter((f) => f.rating === 4).length
    const detractors = fList.filter((f) => f.rating <= 2).length
    const nps = fList.length > 0 ? Math.round(((promoters - detractors) / fList.length) * 100) : 0

    const healthStatus =
      ((healthChecks?.[0] as { status: string } | undefined)
        ?.status as DashboardData['healthStatus']) ?? 'unknown'

    const recent = [...rList]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)

    const affList = (affiliates || []) as { id: string; status: string }[]
    const affRefList = (affRefs || []) as { status: string; comissao: number | null }[]
    const affiliatesMrr = affRefList
      .filter((r) => r.status === 'aprovado' || r.status === 'pago')
      .reduce((s, r) => s + (r.comissao ?? 0), 0)

    setData({
      totalUsers: rList.length,
      totalRestaurants: rList.length,
      activeRestaurants: activeR,
      suspendedRestaurants: suspendedR,
      trialsActive: trials.length,
      trialsCritical,
      mrr,
      byPlan,
      recentRestaurants: recent,
      totalAffiliates: affList.length,
      affiliatesMrr,
      affiliatesAtivos: affList.filter((a) => a.status === 'ativo').length,
      totalFeedbacks: fList.length,
      avgRating,
      nps,
      healthStatus,
    })
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    const timeout = setTimeout(() => {
      void load()
    }, 0)
    return () => clearTimeout(timeout)
  }, [load])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPI
          icon={<DollarSign className="h-4 w-4" />}
          label="MRR"
          value={`R$ ${data.mrr.toLocaleString()}`}
          color="green"
        />
        <KPI
          icon={<Store className="h-4 w-4" />}
          label="Restaurantes"
          value={data.totalRestaurants}
          sub={`${data.activeRestaurants} ativos`}
          color="blue"
        />
        <KPI
          icon={<Clock className="h-4 w-4" />}
          label="Trials"
          value={data.trialsActive}
          sub={data.trialsCritical > 0 ? `${data.trialsCritical} críticos` : undefined}
          color="yellow"
        />
        <KPI
          icon={<Users className="h-4 w-4" />}
          label="Afiliados"
          value={data.totalAffiliates}
          sub={`${data.affiliatesAtivos} ativos · R$ ${data.affiliatesMrr.toFixed(0)} comissões`}
          color="purple"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plan Distribution */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-300">Distribuição de Planos</h3>
          <div className="space-y-3">
            {Object.entries(data.byPlan).map(([plan, count]) => {
              const pct = data.totalRestaurants > 0 ? (count / data.totalRestaurants) * 100 : 0
              const color =
                plan === 'premium'
                  ? 'bg-purple-500'
                  : plan === 'pro'
                    ? 'bg-blue-500'
                    : 'bg-zinc-600'
              return (
                <div key={plan}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-zinc-400">{plan.toUpperCase()}</span>
                    <span className="text-zinc-300">
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-300">
            <span className="mr-2">Saúde do Sistema</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                data.healthStatus === 'ok'
                  ? 'bg-green-500/20 text-green-400'
                  : data.healthStatus === 'degraded'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : data.healthStatus === 'down'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              <Heart className="h-3 w-3" />
              {data.healthStatus === 'ok'
                ? 'Saudável'
                : data.healthStatus === 'degraded'
                  ? 'Degradado'
                  : data.healthStatus === 'down'
                    ? 'Fora do ar'
                    : 'N/A'}
            </span>
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <MiniStat label="Feedbacks" value={data.totalFeedbacks} />
            <MiniStat label="Nota Média" value={data.avgRating.toFixed(1)} />
            <MiniStat label="NPS" value={data.nps} warn={data.nps < 0} />
            <MiniStat
              label="Suspensos"
              value={data.suspendedRestaurants}
              warn={data.suspendedRestaurants > 0}
            />
          </div>
        </div>
      </div>

      {/* Recent Restaurants */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-300">Últimos Cadastros</h3>
          <Link
            href="/admin/cardapios"
            className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300"
          >
            Ver todos <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {data.recentRestaurants.map((r) => (
            <Link
              key={r.id}
              href={`/admin/clientes/${r.id}`}
              className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-zinc-800"
            >
              <div>
                <p className="text-sm font-medium text-zinc-200">{r.nome}</p>
                <p className="text-xs text-zinc-500">/{r.slug}</p>
              </div>
              <div className="text-right">
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
                <p className="mt-0.5 text-xs text-zinc-500">
                  {new Date(r.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: '/admin/usuarios', label: 'Usuários', icon: Users, color: 'text-blue-400' },
          { href: '/admin/trials', label: 'Trials', icon: Clock, color: 'text-yellow-400' },
          { href: '/admin/feedbacks', label: 'Feedbacks', icon: Activity, color: 'text-green-400' },
          {
            href: '/admin/repo-access',
            label: 'Acesso Repo',
            icon: KeyRound,
            color: 'text-orange-400',
          },
          {
            href: '/admin/afiliados',
            label: 'Afiliados',
            icon: TrendingUp,
            color: 'text-purple-400',
          },
          {
            href: '/admin/agentes',
            label: 'Agentes ZAEA',
            icon: Shield,
            color: 'text-pink-400',
          },
        ].map(({ href, label, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 hover:border-zinc-700 hover:bg-zinc-800/80"
          >
            <Icon className={`h-5 w-5 ${color}`} />
            <span className="text-sm font-medium text-zinc-300">{label}</span>
            <ArrowRight className="ml-auto h-4 w-4 text-zinc-600" />
          </Link>
        ))}
      </div>
    </div>
  )
}

function KPI({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  color: string
}) {
  const borderColor =
    {
      green: 'border-green-600/30',
      blue: 'border-blue-600/30',
      yellow: 'border-yellow-600/30',
      purple: 'border-purple-600/30',
    }[color] || 'border-zinc-800'
  const textColor =
    {
      green: 'text-green-400',
      blue: 'text-blue-400',
      yellow: 'text-yellow-400',
      purple: 'text-purple-400',
    }[color] || 'text-zinc-400'

  return (
    <div className={`rounded-xl border ${borderColor} bg-zinc-900 p-4`}>
      <div className={`flex items-center gap-2 ${textColor}`}>
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={`mt-1 text-2xl font-bold ${textColor}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </div>
  )
}

function MiniStat({
  label,
  value,
  warn,
}: {
  label: string
  value: string | number
  warn?: boolean
}) {
  return (
    <div className="text-center">
      <p className={`text-xl font-bold ${warn ? 'text-red-400' : 'text-zinc-200'}`}>{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  )
}
