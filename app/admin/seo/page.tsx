'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Loader2,
  Search,
  Globe,
  MousePointerClick,
  Eye,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────
interface GSCRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface GSCOverview {
  totalClicks: number
  totalImpressions: number
  avgCtr: number
  avgPosition: number
  topQueries: GSCRow[]
  topPages: GSCRow[]
  dailyData: GSCRow[]
}

interface SetupInfo {
  required: string[]
  docs: string
}

type DateRange = '7d' | '28d' | '3m'

const RANGE_LABELS: Record<DateRange, string> = {
  '7d': '7 dias',
  '28d': '28 dias',
  '3m': '3 meses',
}

// ─── Helpers ─────────────────────────────────────────────────
function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('pt-BR')
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

function fmtPos(n: number): string {
  return n.toFixed(1)
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname === '/' ? '/' : u.pathname
  } catch {
    return url
  }
}

// ─── Components ──────────────────────────────────────────────
function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Search
  label: string
  value: string
  color: string
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-zinc-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-zinc-100">{value}</p>
    </div>
  )
}

function MiniChart({ data }: { data: GSCRow[] }) {
  if (data.length === 0) return null

  const maxClicks = Math.max(...data.map((d) => d.clicks), 1)
  const barWidth = 100 / data.length

  return (
    <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-300">Cliques por dia</h3>
      <div className="flex h-32 items-end gap-0.5">
        {data.map((row, i) => {
          const height = (row.clicks / maxClicks) * 100
          return (
            <div
              key={row.keys[0]}
              className="group relative flex flex-col items-center"
              style={{ width: `${barWidth}%` }}
            >
              <div className="pointer-events-none absolute -top-10 left-1/2 z-10 hidden -translate-x-1/2 rounded bg-zinc-800 px-2 py-1 text-[10px] whitespace-nowrap text-zinc-300 group-hover:block">
                {row.keys[0]}: {row.clicks} cliques
              </div>
              <div
                className="w-full min-w-px rounded-t bg-orange-500/80 transition-colors hover:bg-orange-400"
                style={{ height: `${Math.max(height, 2)}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
        <span>{data[0]?.keys[0]}</span>
        <span>{data[data.length - 1]?.keys[0]}</span>
      </div>
    </div>
  )
}

function DataTable({
  title,
  rows,
  keyLabel,
  formatKey,
}: {
  title: string
  rows: GSCRow[]
  keyLabel: string
  formatKey?: (k: string) => string
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="mb-2 text-sm font-semibold text-zinc-300">{title}</h3>
        <p className="text-xs text-zinc-500">Sem dados no período.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 px-5 py-3">
        <h3 className="text-sm font-semibold text-zinc-300">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-500">
              <th className="px-5 py-2 text-left font-medium">{keyLabel}</th>
              <th className="px-3 py-2 text-right font-medium">Cliques</th>
              <th className="px-3 py-2 text-right font-medium">Impressões</th>
              <th className="px-3 py-2 text-right font-medium">CTR</th>
              <th className="px-3 py-2 text-right font-medium">Posição</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {rows.map((row, i) => (
              <tr key={i} className="transition-colors hover:bg-zinc-800/30">
                <td className="max-w-50 truncate px-5 py-2.5 text-zinc-200">
                  {formatKey ? formatKey(row.keys[0]) : row.keys[0]}
                </td>
                <td className="px-3 py-2.5 text-right font-medium text-orange-400">
                  {fmtNum(row.clicks)}
                </td>
                <td className="px-3 py-2.5 text-right text-zinc-400">{fmtNum(row.impressions)}</td>
                <td className="px-3 py-2.5 text-right text-zinc-400">{fmtPct(row.ctr)}</td>
                <td className="px-3 py-2.5 text-right text-zinc-400">{fmtPos(row.position)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SetupGuide({ setup }: { setup: SetupInfo }) {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-yellow-800/50 bg-yellow-950/30 p-6">
      <div className="mb-4 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-500" />
        <h2 className="text-lg font-bold text-yellow-400">Configuração necessária</h2>
      </div>
      <p className="mb-4 text-sm text-zinc-300">
        Para ativar o painel de SEO, configure as seguintes variáveis de ambiente no seu{' '}
        <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-orange-400">
          .env.local
        </code>
        :
      </p>
      <div className="mb-4 space-y-2">
        {setup.required.map((v) => (
          <div key={v} className="rounded bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-300">
            {v}=...
          </div>
        ))}
      </div>
      <h3 className="mb-2 text-sm font-semibold text-zinc-300">Como configurar:</h3>
      <ol className="mb-4 space-y-1 text-sm text-zinc-400">
        <li>
          1. Acesse{' '}
          <a
            href="https://console.cloud.google.com/iam-admin/serviceaccounts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 underline"
          >
            Google Cloud Console
          </a>{' '}
          e crie uma Service Account
        </li>
        <li>2. Gere uma chave JSON da service account</li>
        <li>
          3. No{' '}
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 underline"
          >
            Search Console
          </a>
          , adicione o email da service account como usuário
        </li>
        <li>
          4. Habilite a <strong className="text-zinc-200">Search Console API</strong> no Google
          Cloud
        </li>
        <li>5. Copie os valores para o .env.local</li>
      </ol>
      <a
        href={setup.docs}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm font-medium text-orange-400 hover:text-orange-300"
      >
        Ver documentação completa
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────
export default function AdminSeoPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [setup, setSetup] = useState<SetupInfo | null>(null)
  const [data, setData] = useState<GSCOverview | null>(null)
  const [range, setRange] = useState<DateRange>('28d')

  const load = useCallback(async (r: DateRange) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/seo?range=${r}`)
      const json = await res.json()

      if (res.status === 501 && json.setup) {
        setSetup(json.setup)
        setData(null)
      } else if (!res.ok) {
        setError(json.error || 'Erro ao carregar dados')
        setData(null)
      } else {
        setData(json.data)
        setSetup(null)
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(range)
  }, [range, load])

  // ── Loading ──
  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  // ── Setup needed ──
  if (setup) {
    return <SetupGuide setup={setup} />
  }

  // ── Error ──
  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-zinc-400">{error}</p>
        <button
          onClick={() => load(range)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header + Range Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">SEO — Google Search Console</h1>
          <p className="text-sm text-zinc-500">Desempenho orgânico do seu site no Google</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-zinc-900 p-1">
          {(Object.keys(RANGE_LABELS) as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                range === r
                  ? 'bg-orange-500 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Loading overlay for range change */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Atualizando...
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={MousePointerClick}
          label="Cliques totais"
          value={fmtNum(data.totalClicks)}
          color="text-orange-400"
        />
        <MetricCard
          icon={Eye}
          label="Impressões"
          value={fmtNum(data.totalImpressions)}
          color="text-blue-400"
        />
        <MetricCard
          icon={TrendingUp}
          label="CTR médio"
          value={fmtPct(data.avgCtr)}
          color="text-green-400"
        />
        <MetricCard
          icon={Search}
          label="Posição média"
          value={fmtPos(data.avgPosition)}
          color="text-purple-400"
        />
      </div>

      {/* Daily Chart */}
      <MiniChart data={data.dailyData} />

      {/* Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DataTable title="Top Consultas" rows={data.topQueries} keyLabel="Palavra-chave" />
        <DataTable
          title="Top Páginas"
          rows={data.topPages}
          keyLabel="Página"
          formatKey={shortenUrl}
        />
      </div>
    </div>
  )
}
