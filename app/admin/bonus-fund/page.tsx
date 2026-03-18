'use client'

/**
 * /admin/bonus-fund — Painel de gestão do Fundo de Bônus de Afiliados.
 *
 * O fundo é alimentado automaticamente com 10% de cada setup pago.
 * O saldo fica em conta-corrente rendimento externa.
 * O owner credita os rendimentos mensalmente após extrato.
 */

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Wallet,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  PlusCircle,
  X,
  CheckCircle2,
} from 'lucide-react'

interface Movimentacao {
  id: string
  tipo: 'entrada' | 'bonus' | 'rendimento'
  valor: number
  descricao: string | null
  created_at: string
}

interface FundoData {
  saldo_atual: number
  total_entradas: number
  total_saques: number
  total_rendimentos: number
  ultimas_movimentacoes: Movimentacao[]
  projecao_proximos_30dias: number
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

function tipoBadge(tipo: Movimentacao['tipo']) {
  if (tipo === 'entrada')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
        <ArrowDownCircle className="h-3 w-3" />
        Entrada
      </span>
    )
  if (tipo === 'rendimento')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
        <TrendingUp className="h-3 w-3" />
        Rendimento
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
      <ArrowUpCircle className="h-3 w-3" />
      Bônus pago
    </span>
  )
}

export default function BonusFundPage() {
  const router = useRouter()
  const supabase = createClient()

  const [authorized, setAuthorized] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [fundo, setFundo] = useState<FundoData | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [rendValor, setRendValor] = useState('')
  const [rendDesc, setRendDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadFundo = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch('/api/admin/bonus-fund', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (res.ok) {
      const data: FundoData = await res.json()
      setFundo(data)
    }
  }, [supabase])

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

      setAuthorized(true)
      setIsOwner(rec.role === 'owner')
      await loadFundo()
      setLoading(false)
    }
    init()
  }, [router, supabase, loadFundo])

  async function handleCreditarRendimento() {
    const valor = parseFloat(rendValor.replace(',', '.'))
    if (!valor || valor <= 0) {
      setError('Informe um valor válido.')
      return
    }
    if (!rendDesc.trim()) {
      setError('Informe a descrição (ex: Rendimento CDB fevereiro).')
      return
    }

    setSubmitting(true)
    setError('')

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const res = await fetch('/api/admin/bonus-fund', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({ valor, descricao: rendDesc.trim() }),
    })

    const json = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(json.error ?? 'Erro ao creditar rendimento.')
      return
    }

    setSuccess(`Rendimento de ${fmt(valor)} creditado com sucesso!`)
    setModalOpen(false)
    setRendValor('')
    setRendDesc('')
    await loadFundo()
    setTimeout(() => setSuccess(''), 4000)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!authorized || !fundo) {
    return null
  }

  const saldoCor =
    fundo.saldo_atual >= 500
      ? 'text-green-700'
      : fundo.saldo_atual < 200
        ? 'text-amber-600'
        : 'text-gray-900'

  const saldoBg =
    fundo.saldo_atual >= 500
      ? 'bg-green-50 border-green-200'
      : fundo.saldo_atual < 200
        ? 'bg-amber-50 border-amber-200'
        : 'bg-white border-gray-200'

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fundo de Bônus</h1>
            <p className="text-sm text-gray-500">
              Reserva automática de 10% de cada setup para cobrir bônus de afiliados
            </p>
          </div>
        </div>

        {/* Aviso operacional */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <strong>Como funciona:</strong> a cada setup pago, 10% é reservado automaticamente neste
          fundo. O saldo é mantido em conta-rendimento externa. Creditite o rendimento mensalmente
          após extrair o extrato da conta.
        </div>

        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        {/* Saldo principal */}
        <div className={`rounded-xl border p-6 ${saldoBg}`}>
          <div className="flex items-center gap-3">
            <Wallet className={`h-8 w-8 ${saldoCor}`} />
            <div>
              <p className="text-sm font-medium text-gray-600">Saldo Atual</p>
              <p className={`text-4xl font-bold ${saldoCor}`}>{fmt(fundo.saldo_atual)}</p>
            </div>
          </div>
          {fundo.saldo_atual < 200 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Saldo baixo — considere verificar se há entradas pendentes de novos setups.
            </div>
          )}
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              Total de Entradas
            </p>
            <p className="mt-1 text-xl font-bold text-green-700">{fmt(fundo.total_entradas)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              Total Saques
            </p>
            <p className="mt-1 text-xl font-bold text-orange-700">{fmt(fundo.total_saques)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              Projeção 30 dias
            </p>
            <p className="mt-1 text-xl font-bold text-blue-700">
              {fmt(fundo.projecao_proximos_30dias)}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">Baseado nos últimos 90 dias</p>
          </div>
        </div>

        {/* Ações */}
        {isOwner && (
          <div className="flex justify-end">
            <button
              onClick={() => {
                setError('')
                setModalOpen(true)
              }}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <PlusCircle className="h-4 w-4" />
              Creditar Rendimento
            </button>
          </div>
        )}

        {/* Últimas movimentações */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Últimas Movimentações</h2>
          </div>
          {fundo.ultimas_movimentacoes.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">
              Nenhuma movimentação registrada.
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {fundo.ultimas_movimentacoes.map((mov) => (
                <div key={mov.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    {tipoBadge(mov.tipo)}
                    <span className="text-sm text-gray-700">{mov.descricao ?? '—'}</span>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${mov.tipo === 'entrada' || mov.tipo === 'rendimento' ? 'text-green-700' : 'text-orange-700'}`}
                    >
                      {mov.tipo === 'bonus' ? '−' : '+'}
                      {fmt(mov.valor)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(mov.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal — Creditar Rendimento */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Creditar Rendimento</h3>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Fechar modal"
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-500">
              Informe o valor gerado pela conta-rendimento externa e a descrição do extrato.
            </p>

            {error && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Valor (R$)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={rendValor}
                  onChange={(e) => setRendValor(e.target.value)}
                  placeholder="Ex: 45.80"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Descrição</label>
                <input
                  type="text"
                  value={rendDesc}
                  onChange={(e) => setRendDesc(e.target.value)}
                  placeholder="Ex: Rendimento CDB fevereiro 2026"
                  maxLength={120}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreditarRendimento}
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Creditar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
