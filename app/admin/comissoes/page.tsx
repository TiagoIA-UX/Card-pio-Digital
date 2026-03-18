'use client'

/**
 * /admin/comissoes — Painel de pagamento de comissões de afiliados.
 * Lista saldos aprovados pendentes e permite registrar pagamento via PIX.
 */

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CircleDollarSign,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Copy,
  CheckCheck,
} from 'lucide-react'

interface AffiliateBalance {
  id: string
  nome: string
  code: string
  chave_pix: string | null
  cidade: string | null
  estado: string | null
  saldo_aprovado: number
  total_pago: number
  ultimo_pagamento: string | null
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

export default function AdminComissoesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [balances, setBalances] = useState<AffiliateBalance[]>([])
  const [paying, setPaying] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [obs, setObs] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadBalances = useCallback(async () => {
    const res = await fetch('/api/admin/afiliados/comissoes', { credentials: 'include' })
    if (!res.ok) return
    const data = await res.json()
    setBalances(data.balances ?? [])
  }, [])

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: rec } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!rec) {
        router.push('/painel')
        return
      }

      setIsAdmin(true)
      await loadBalances()
      setLoading(false)
    }
    void init()
  }, [supabase, router, loadBalances])

  const handlePagar = async (aff: AffiliateBalance) => {
    if (!confirm(`Confirmar pagamento de ${fmt(aff.saldo_aprovado)} para ${aff.nome}?`)) return

    setPaying(aff.id)
    setError('')
    setSuccess('')

    const res = await fetch('/api/admin/afiliados/comissoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        affiliate_id: aff.id,
        valor: aff.saldo_aprovado,
        observacao: obs[aff.id] ?? '',
      }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Erro ao registrar pagamento')
    } else {
      setSuccess(`Pagamento de ${fmt(aff.saldo_aprovado)} registrado para ${aff.nome}`)
      await loadBalances()
    }
    setPaying(null)
  }

  const copyPix = (pix: string, id: string) => {
    navigator.clipboard.writeText(pix)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!isAdmin) return null

  const totalPendente = balances.reduce((s, b) => s + b.saldo_aprovado, 0)

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <CircleDollarSign className="h-5 w-5 text-orange-500" />
            <div>
              <h1 className="text-lg font-bold text-zinc-900">Comissões de Afiliados</h1>
              <p className="text-xs text-zinc-500">
                {balances.length} afiliado{balances.length !== 1 ? 's' : ''} com saldo pendente ·{' '}
                <strong className="text-zinc-600">{fmt(totalPendente)} total</strong>
              </p>
            </div>
          </div>
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 px-4 py-8">
        {/* Feedback */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        {balances.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-16 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-green-400" />
            <p className="text-lg font-semibold text-zinc-700">Nenhuma comissão pendente</p>
            <p className="text-sm text-zinc-500">Todos os afiliados estão em dia.</p>
          </div>
        )}

        {/* Cards de afiliados com saldo */}
        {balances.map((b) => (
          <div key={b.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              {/* Info do afiliado */}
              <div>
                <p className="font-bold text-zinc-800">{b.nome}</p>
                <p className="text-xs text-zinc-500">
                  Código: <span className="font-mono text-zinc-600">{b.code}</span>
                  {(b.cidade || b.estado) &&
                    ` · ${[b.cidade, b.estado].filter(Boolean).join(', ')}`}
                </p>
                {b.chave_pix ? (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-700">
                      {b.chave_pix}
                    </span>
                    <button
                      onClick={() => copyPix(b.chave_pix!, b.id)}
                      className="text-zinc-500 hover:text-orange-500"
                      title="Copiar chave PIX"
                    >
                      {copied === b.id ? (
                        <CheckCheck className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-amber-600">⚠ Sem chave PIX cadastrada</p>
                )}
              </div>

              {/* Saldo + botão */}
              <div className="shrink-0 text-right">
                <p className="text-2xl font-extrabold text-orange-600">{fmt(b.saldo_aprovado)}</p>
                <p className="text-xs text-zinc-500">
                  Já pago: {fmt(b.total_pago)}
                  {b.ultimo_pagamento &&
                    ` · último em ${new Date(b.ultimo_pagamento).toLocaleDateString('pt-BR')}`}
                </p>
              </div>
            </div>

            {/* Obs + botão pagar */}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                placeholder="Observação (opcional)"
                value={obs[b.id] ?? ''}
                onChange={(e) => setObs((prev) => ({ ...prev, [b.id]: e.target.value }))}
                className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
              />
              <button
                onClick={() => handlePagar(b)}
                disabled={paying === b.id}
                className="flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {paying === b.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Banknote className="h-4 w-4" />
                )}
                Marcar como pago
              </button>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
