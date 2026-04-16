'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, CheckCircle2, RefreshCcw, ShieldAlert } from 'lucide-react'

type ReadinessItem = {
  id: string
  label: string
  ok: boolean
  detail: string
  impact: 'critical' | 'operational' | 'optional'
}

type ReadinessCategory = {
  key: string
  title: string
  items: ReadinessItem[]
}

type ReadinessResponse = {
  generatedAt: string
  status: 'ok' | 'degraded' | 'critical'
  summary: {
    total: number
    healthy: number
    attention: number
    actionable: number
    critical: number
    operational: number
    optional: number
  }
  categories: ReadinessCategory[]
}

const STATUS_META = {
  ok: {
    badge: 'OK',
    title: 'Sistema totalmente operacional',
    description: 'Nenhuma pendência acionável encontrada nos scripts essenciais.',
    container: 'border-green-300 bg-green-50',
    badgeClass: 'bg-green-100 text-green-700',
    titleClass: 'text-green-800',
    descriptionClass: 'text-green-700',
  },
  degraded: {
    badge: 'Degradado',
    title: 'Operação degradada sem quebra crítica',
    description:
      'Há perda de capacidade operacional ou observabilidade, sem afetar o núcleo crítico.',
    container: 'border-amber-300 bg-amber-50',
    badgeClass: 'bg-amber-100 text-amber-700',
    titleClass: 'text-amber-800',
    descriptionClass: 'text-amber-700',
  },
  critical: {
    badge: 'Crítico',
    title: 'Requer ação imediata',
    description: 'Há pendência que compromete execução essencial do sistema.',
    container: 'border-red-300 bg-red-50',
    badgeClass: 'bg-red-100 text-red-700',
    titleClass: 'text-red-800',
    descriptionClass: 'text-red-700',
  },
} as const

const IMPACT_META = {
  critical: {
    label: 'Crítico',
    itemClass: 'bg-red-100 text-red-700',
    cardClass: 'border-red-300 bg-red-50',
  },
  operational: {
    label: 'Operacional',
    itemClass: 'bg-amber-100 text-amber-700',
    cardClass: 'border-amber-300 bg-amber-50',
  },
  optional: {
    label: 'Opcional',
    itemClass: 'bg-zinc-200 text-zinc-700',
    cardClass: 'border-zinc-300 bg-zinc-50',
  },
} as const

export default function ScriptsPage() {
  const [loading, setLoading] = useState(true)
  const [notifying, setNotifying] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<ReadinessResponse | null>(null)
  const [notice, setNotice] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/scripts/readiness', { cache: 'no-store' })
      const payload = await response.json()

      if (!response.ok) {
        setError(payload?.error || 'Nao foi possivel carregar o diagnostico')
        setData(null)
        return
      }

      setData(payload as ReadinessResponse)
    } catch (err) {
      setError((err as Error).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const statusMeta = data ? STATUS_META[data.status] : null
  const groupedAttention = data
    ? {
        critical: data.categories.flatMap((category) =>
          category.items
            .filter((item) => !item.ok && item.impact === 'critical')
            .map((item) => ({ ...item, categoryTitle: category.title }))
        ),
        operational: data.categories.flatMap((category) =>
          category.items
            .filter((item) => !item.ok && item.impact === 'operational')
            .map((item) => ({ ...item, categoryTitle: category.title }))
        ),
        optional: data.categories.flatMap((category) =>
          category.items
            .filter((item) => !item.ok && item.impact === 'optional')
            .map((item) => ({ ...item, categoryTitle: category.title }))
        ),
      }
    : null

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/painel"
            className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao painel
          </Link>
          <h1 className="text-foreground text-2xl font-bold">Central de Scripts Essenciais</h1>
          <p className="text-muted-foreground text-sm">
            Diagnostico de automacoes, seguranca, pagamentos e marketing do seu SaaS.
          </p>
        </div>

        <button
          onClick={() => {
            void loadData()
          }}
          className="border-border bg-card hover:bg-secondary inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium"
        >
          <RefreshCcw className="h-4 w-4" />
          Atualizar
        </button>

        <button
          onClick={async () => {
            setNotifying(true)
            setNotice('')

            try {
              const response = await fetch('/api/admin/scripts/readiness/notify', {
                method: 'POST',
              })
              const payload = await response.json()

              if (!response.ok) {
                setNotice(payload?.error || 'Falha ao notificar ForgeOps AI')
                return
              }

              if (payload?.sentToForgeOps) {
                setNotice('Notificacao enviada ao ForgeOps AI com sucesso.')
              } else {
                setNotice(
                  payload?.reason ||
                    'Sem pendencias acionáveis. Notificação externa suprimida corretamente.'
                )
              }
            } catch (err) {
              setNotice((err as Error).message)
            } finally {
              setNotifying(false)
            }
          }}
          disabled={notifying}
          className="border-border bg-card hover:bg-secondary inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ShieldAlert className="h-4 w-4" />
          {notifying ? 'Notificando...' : 'Notificar ForgeOps AI'}
        </button>
      </div>

      {loading && <p className="text-muted-foreground">Carregando diagnostico...</p>}

      {!loading && error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {notice && (
        <div className="mb-4 rounded-xl border border-blue-300 bg-blue-50 p-4 text-sm text-blue-700">
          {notice}
        </div>
      )}

      {!loading && data && (
        <>
          {statusMeta ? (
            <div className={`mb-6 rounded-2xl border p-5 ${statusMeta.container}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className={`text-sm font-semibold ${statusMeta.titleClass}`}>
                    {statusMeta.title}
                  </p>
                  <p className={`mt-1 text-sm ${statusMeta.descriptionClass}`}>
                    {statusMeta.description}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.badgeClass}`}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {statusMeta.badge}
                </span>
              </div>
            </div>
          ) : null}

          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="bg-card border-border rounded-xl border p-4">
              <p className="text-muted-foreground text-xs">Total de verificacoes</p>
              <p className="text-foreground mt-1 text-2xl font-bold">{data.summary.total}</p>
            </div>
            <div className="rounded-xl border border-green-300 bg-green-50 p-4">
              <p className="text-xs text-green-700">Saudaveis</p>
              <p className="mt-1 text-2xl font-bold text-green-700">{data.summary.healthy}</p>
            </div>
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-xs text-amber-700">Precisam de atencao</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">{data.summary.attention}</p>
            </div>
            <div className="rounded-xl border border-red-300 bg-red-50 p-4">
              <p className="text-xs text-red-700">Criticos</p>
              <p className="mt-1 text-2xl font-bold text-red-700">{data.summary.critical}</p>
            </div>
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-xs text-amber-700">Operacionais</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">{data.summary.operational}</p>
            </div>
            <div className="rounded-xl border border-zinc-300 bg-zinc-50 p-4">
              <p className="text-xs text-zinc-700">Opcionais</p>
              <p className="mt-1 text-2xl font-bold text-zinc-700">{data.summary.optional}</p>
            </div>
          </div>

          {groupedAttention ? (
            <div className="mb-6 grid gap-3 lg:grid-cols-3">
              {(['critical', 'operational', 'optional'] as const).map((impact) => {
                const meta = IMPACT_META[impact]
                const items = groupedAttention[impact]

                return (
                  <section key={impact} className={`rounded-xl border p-4 ${meta.cardClass}`}>
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-sm font-semibold text-zinc-900">
                        Pendências {meta.label.toLowerCase()}
                      </h2>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${meta.itemClass}`}
                      >
                        {items.length}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {items.length === 0 ? (
                        <p className="text-xs text-zinc-600">Sem pendências deste tipo.</p>
                      ) : (
                        items.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-white/60 bg-white/70 p-3"
                          >
                            <p className="text-sm font-medium text-zinc-900">{item.label}</p>
                            <p className="mt-1 text-xs text-zinc-600">{item.detail}</p>
                            <p className="mt-2 text-[11px] font-medium tracking-[0.12em] text-zinc-500 uppercase">
                              {item.categoryTitle}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                )
              })}
            </div>
          ) : null}

          <div className="space-y-4">
            {data.categories.map((category) => (
              <section key={category.key} className="bg-card border-border rounded-xl border p-4">
                <h2 className="text-foreground mb-3 text-base font-semibold">{category.title}</h2>
                <div className="space-y-2">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className="border-border flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-foreground text-sm font-medium">{item.label}</p>
                        <p className="text-muted-foreground text-xs">{item.detail}</p>
                      </div>

                      {item.ok ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          OK
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${IMPACT_META[item.impact].itemClass}`}
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                            {IMPACT_META[item.impact].label}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700">
                            Ajustar
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="text-muted-foreground mt-6 text-xs">
            Atualizado em: {new Date(data.generatedAt).toLocaleString('pt-BR')}
          </p>
        </>
      )}
    </div>
  )
}
