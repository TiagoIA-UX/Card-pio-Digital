'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  ImageIcon,
  Loader2,
  ScanSearch,
  XCircle,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────
interface Tenant {
  id: string
  nome: string
  slug: string
  total_products: number
  products_with_image: number
}

interface Product {
  id: string
  nome: string
  descricao: string | null
  imagem_url: string
  categoria: string
  preco_base: number
  disponivel: boolean
}

interface AuditResult {
  product_id: string
  nome: string
  categoria: string
  imagem_url: string
  width: number | null
  height: number | null
  status: 'ok' | 'mismatch' | 'low_quality' | 'error' | 'no_image'
  confidence: number
  reason: string
}

interface AuditSummary {
  total: number
  ok: number
  mismatch: number
  low_quality: number
  error: number
  no_image: number
}

const STATUS_CONFIG = {
  ok: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', label: 'OK' },
  mismatch: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Não corresponde' },
  low_quality: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    label: 'Qualidade baixa',
  },
  error: {
    icon: AlertTriangle,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    label: 'Erro na análise',
  },
  no_image: { icon: ImageIcon, color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Sem imagem' },
} as const

// ── Helpers ──────────────────────────────────────────────────────────────────
async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AuditPhotosPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [results, setResults] = useState<AuditResult[]>([])
  const [summary, setSummary] = useState<AuditSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [auditing, setAuditing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'mismatch' | 'low_quality' | 'ok'>('all')

  // Load tenants
  const loadTenants = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchApi<{ tenants: Tenant[] }>('/api/admin/audit-photos')
      setTenants(data.tenants)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar deliverys')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTenants()
  }, [loadTenants])

  // Select tenant → load products
  const selectTenant = useCallback(async (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setProducts([])
    setResults([])
    setSummary(null)
    setLoading(true)
    try {
      const data = await fetchApi<{ products: Product[] }>(
        `/api/admin/audit-photos?tenant_id=${tenant.id}`
      )
      setProducts(data.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }, [])

  // Run audit in batches
  const runAudit = useCallback(async () => {
    if (!selectedTenant || products.length === 0) return

    setAuditing(true)
    setResults([])
    setSummary(null)
    setProgress(0)
    setError(null)

    const BATCH_SIZE = 10
    const allResults: AuditResult[] = []

    try {
      for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE)
        const data = await fetchApi<{ summary: AuditSummary; results: AuditResult[] }>(
          '/api/admin/audit-photos',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenant_id: selectedTenant.id,
              product_ids: batch.map((p) => p.id),
            }),
          }
        )
        allResults.push(...data.results)
        setResults([...allResults])
        setProgress(Math.min(100, Math.round(((i + batch.length) / products.length) * 100)))
      }

      // Calculate final summary
      const finalSummary: AuditSummary = {
        total: allResults.length,
        ok: allResults.filter((r) => r.status === 'ok').length,
        mismatch: allResults.filter((r) => r.status === 'mismatch').length,
        low_quality: allResults.filter((r) => r.status === 'low_quality').length,
        error: allResults.filter((r) => r.status === 'error').length,
        no_image: allResults.filter((r) => r.status === 'no_image').length,
      }
      setSummary(finalSummary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na auditoria')
    } finally {
      setAuditing(false)
      setProgress(100)
    }
  }, [selectedTenant, products])

  const filteredResults = filter === 'all' ? results : results.filter((r) => r.status === filter)

  // ── Render ──────────────────────────────────────────────────────────────────

  // Tenant list
  if (!selectedTenant) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <ScanSearch className="h-6 w-6 text-violet-400" />
            Auditoria de Fotos
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Analisa se as fotos dos produtos correspondem ao título usando IA Vision
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => selectTenant(tenant)}
                className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-left transition-colors hover:border-violet-600/50 hover:bg-zinc-800/70"
              >
                <div>
                  <div className="font-medium text-white">{tenant.nome}</div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    {tenant.products_with_image} fotos · {tenant.total_products} produtos
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600" />
              </button>
            ))}
            {tenants.length === 0 && (
              <p className="py-12 text-center text-sm text-zinc-500">Nenhum delivery encontrado</p>
            )}
          </div>
        )}
      </div>
    )
  }

  // Products / audit view
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            onClick={() => {
              setSelectedTenant(null)
              setResults([])
              setSummary(null)
            }}
            className="mb-1 text-xs text-violet-400 hover:underline"
          >
            ← Voltar
          </button>
          <h1 className="flex items-center gap-2 text-xl font-bold text-white">
            <ScanSearch className="h-5 w-5 text-violet-400" />
            {selectedTenant.nome}
          </h1>
          <p className="text-xs text-zinc-400">{products.length} produtos com foto para auditar</p>
        </div>

        <button
          onClick={runAudit}
          disabled={auditing || products.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
        >
          {auditing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analisando… {progress}%
            </>
          ) : (
            <>
              <ScanSearch className="h-4 w-4" />
              {results.length > 0 ? 'Reauditar' : 'Iniciar Auditoria'}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Progress bar */}
      {auditing && (
        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-violet-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(
            [
              { key: 'total', label: 'Total', value: summary.total, color: 'text-white' },
              { key: 'ok', label: 'Corretas', value: summary.ok, color: 'text-green-400' },
              {
                key: 'mismatch',
                label: 'Não corresponde',
                value: summary.mismatch,
                color: 'text-red-400',
              },
              {
                key: 'low_quality',
                label: 'Qualidade baixa',
                value: summary.low_quality,
                color: 'text-yellow-400',
              },
              { key: 'error', label: 'Erros', value: summary.error, color: 'text-orange-400' },
            ] as const
          ).map((stat) => (
            <div
              key={stat.key}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-center"
            >
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      {results.length > 0 && (
        <div className="flex gap-1 rounded-lg bg-zinc-900 p-1">
          {(
            [
              { key: 'all', label: 'Todos' },
              { key: 'mismatch', label: '❌ Não corresponde' },
              { key: 'low_quality', label: '⚠️ Baixa qualidade' },
              { key: 'ok', label: '✅ Corretas' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === tab.key ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Results grid */}
      {filteredResults.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredResults.map((result) => {
            const config = STATUS_CONFIG[result.status]
            const Icon = config.icon
            return (
              <div
                key={result.product_id}
                className={`overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 ${
                  result.status === 'mismatch' ? 'ring-1 ring-red-600/40' : ''
                }`}
              >
                {/* Image */}
                {result.imagem_url && (
                  <div className="relative h-32 w-full bg-zinc-800">
                    <Image
                      src={result.imagem_url}
                      alt={result.nome}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 33vw"
                      unoptimized
                    />
                    {/* Status badge */}
                    <div
                      className={`absolute top-2 right-2 flex items-center gap-1 rounded-full ${config.bg} px-2 py-0.5 text-xs font-medium ${config.color} backdrop-blur-sm`}
                    >
                      <Icon className="h-3 w-3" />
                      {result.confidence > 0 && `${result.confidence}%`}
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-white">{result.nome}</div>
                      <div className="text-xs text-zinc-500">{result.categoria}</div>
                    </div>
                    <span
                      className={`shrink-0 rounded-md ${config.bg} px-1.5 py-0.5 text-[10px] font-medium ${config.color}`}
                    >
                      {config.label}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">{result.reason}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state — before audit */}
      {!auditing && results.length === 0 && !loading && (
        <div className="rounded-xl border border-dashed border-zinc-700 py-16 text-center">
          <ScanSearch className="mx-auto h-10 w-10 text-zinc-600" />
          <p className="mt-3 text-sm text-zinc-400">
            Clique em &quot;Iniciar Auditoria&quot; para analisar as fotos com IA
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            O Zaea vai verificar se cada foto corresponde ao produto usando Vision AI
          </p>
        </div>
      )}

      {/* Loading products */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      )}
    </div>
  )
}
