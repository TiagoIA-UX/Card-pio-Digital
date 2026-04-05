'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/shared/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Wallet,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
  MessageCircle,
  Banknote,
  Percent,
} from 'lucide-react'

interface Summary {
  total_entradas: number
  total_reservado: number
  total_pago: number
  total_rendimento_cdi: number
  total_estornos: number
  saldo_total: number
  saldo_disponivel: number
}

interface Batch {
  id: string
  referencia: string
  period_start: string
  period_end: string
  status: 'pendente' | 'aprovado' | 'pago' | 'cancelado'
  validation_status: 'pendente' | 'pronto' | 'bloqueado'
  validation_summary: {
    totalItems?: number
    readyItems?: number
    blockedItems?: number
    blockedAmount?: number
    invalidPixCount?: number
    missingPixCount?: number
  } | null
  total_amount: number
  items_count: number
  approved_at: string | null
  paid_at: string | null
  created_at: string
}

interface LedgerEntry {
  id: string
  tipo: string
  valor: number
  referencia: string | null
  descricao: string | null
  created_at: string
}

const WHATSAPP_NUMBER = '5512996887993'

function buildWhatsAppLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

function formatCurrency(val: number) {
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const TIPO_LABELS: Record<string, { label: string; color: string }> = {
  entrada_assinatura: { label: 'Assinatura', color: 'text-green-600' },
  entrada_setup: { label: 'Setup', color: 'text-green-600' },
  reserva_afiliado: { label: 'Reserva Vendedor', color: 'text-amber-600' },
  reserva_lider: { label: 'Reserva Líder', color: 'text-amber-600' },
  pagamento_afiliado: { label: 'Pago Vendedor', color: 'text-red-600' },
  pagamento_lider: { label: 'Pago Líder', color: 'text-red-600' },
  rendimento_cdi: { label: 'CDI', color: 'text-blue-600' },
  bonus_afiliado: { label: 'Bônus', color: 'text-purple-600' },
  estorno: { label: 'Estorno', color: 'text-gray-600' },
}

const BATCH_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pendente: { label: 'Pendente', color: 'text-amber-700', bg: 'bg-amber-100' },
  aprovado: { label: 'Aprovado', color: 'text-blue-700', bg: 'bg-blue-100' },
  pago: { label: 'Pago', color: 'text-green-700', bg: 'bg-green-100' },
  cancelado: { label: 'Cancelado', color: 'text-gray-700', bg: 'bg-gray-100' },
}

const VALIDATION_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pendente: { label: 'Não validado', color: 'text-zinc-700', bg: 'bg-zinc-200' },
  pronto: { label: 'Pronto', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  bloqueado: { label: 'Bloqueado', color: 'text-red-700', bg: 'bg-red-100' },
}

export default function AdminFinanceiroPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [batches, setBatches] = useState<Batch[]>([])
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [cdiTaxa, setCdiTaxa] = useState(13.15)

  const loadData = useCallback(async () => {
    setLoading(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const res = await fetch('/api/admin/financeiro', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (!res.ok) {
      router.push('/painel')
      return
    }
    const json = await res.json()
    setSummary(json.summary)
    setBatches(json.batches)
    setLedger(json.ledger)
    setCdiTaxa(json.cdi_taxa)
    setLoading(false)
  }, [supabase, router])

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadData()
    }, 0)
    return () => clearTimeout(timeout)
  }, [loadData])

  const performAction = async (action: string, data: Record<string, unknown> = {}) => {
    setActionLoading(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    await fetch('/api/admin/financeiro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, ...data }),
    })
    await loadData()
    setActionLoading(false)
  }

  const exportBatch = async (batchId: string, format: 'csv' | 'json') => {
    window.open(`/api/admin/financeiro/export?batch_id=${batchId}&format=${format}`, '_blank')
  }

  // ── WhatsApp alert ──
  const now = new Date()
  const isPayoutDay = now.getDate() === 1 || now.getDate() === 15

  const payoutAlertMsg = `🔔 ALERTA DE PAGAMENTO — ${now.toLocaleDateString('pt-BR')}

Hoje é dia de pagamento de afiliados!

${batches.length > 0 ? `📋 Batch mais recente: ${batches[0]?.referencia} — ${formatCurrency(batches[0]?.total_amount ?? 0)} (${batches[0]?.items_count} afiliados)` : 'Nenhum batch pendente.'}

💰 Saldo disponível: ${formatCurrency(summary?.saldo_disponivel ?? 0)}
📊 CDI acumulado: ${formatCurrency(summary?.total_rendimento_cdi ?? 0)}

⏰ Acesse o painel para aprovar e pagar:
https://zairyx.com.br/admin/financeiro`

  // Self-reminder links (dias 1 e 15)
  const reminderMsg = `⏰ LEMBRETE: Configurar alarme para pagar afiliados nos dias 1 e 15 de cada mês (5h da manhã).

Dashboard financeiro: https://zairyx.com.br/admin/financeiro

Checklist:
1. Abrir painel financeiro
2. Revisar batch pendente
3. Aprovar batch
4. Fazer PIX para cada afiliado
5. Marcar como pago`

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  const reservadoPendente = summary.total_reservado - summary.total_pago
  const seuLucro = summary.saldo_total - reservadoPendente

  return (
    <div className="space-y-6">
      {/* Alerta dia de pagamento */}
      {isPayoutDay && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-orange-300 bg-orange-50 p-4">
          <AlertTriangle className="h-6 w-6 text-orange-600" />
          <div className="flex-1">
            <p className="font-bold text-orange-800">Hoje é dia de pagamento de afiliados!</p>
            <p className="text-sm text-orange-600">
              Revise o batch pendente, aprove e faça os PIX.
            </p>
          </div>
          <a
            href={buildWhatsAppLink(payoutAlertMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            <MessageCircle className="h-4 w-4" />
            Enviar Alerta WhatsApp
          </a>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPI
          icon={<DollarSign className="h-4 w-4" />}
          label="Saldo Total"
          value={formatCurrency(summary.saldo_total)}
          color="green"
        />
        <KPI
          icon={<Wallet className="h-4 w-4" />}
          label="Seu Lucro Disponível"
          value={formatCurrency(seuLucro > 0 ? seuLucro : 0)}
          sub="Pode gastar"
          color="blue"
        />
        <KPI
          icon={<Users className="h-4 w-4" />}
          label="Reservado Afiliados"
          value={formatCurrency(reservadoPendente > 0 ? reservadoPendente : 0)}
          sub="Não gaste!"
          color="yellow"
        />
        <KPI
          icon={<TrendingUp className="h-4 w-4" />}
          label="Rendimento CDI"
          value={formatCurrency(summary.total_rendimento_cdi)}
          sub={`${cdiTaxa}% a.a.`}
          color="purple"
        />
      </div>

      {/* Barras visuais — 3 baldes */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="mb-4 text-sm font-semibold text-zinc-300">
          <Banknote className="mr-2 inline h-4 w-4" />
          Distribuição do Saldo
        </h3>
        {(() => {
          const total = summary.saldo_total || 1
          const lucPct = Math.max(0, (seuLucro / total) * 100)
          const resPct = Math.max(0, (reservadoPendente / total) * 100)
          const cdiPct = Math.max(0, (summary.total_rendimento_cdi / total) * 100)
          return (
            <div className="space-y-3">
              <Bar label="Lucro (disponível)" pct={lucPct} value={seuLucro} color="bg-green-500" />
              <Bar
                label="Reservado (afiliados)"
                pct={resPct}
                value={reservadoPendente}
                color="bg-amber-500"
              />
              <Bar
                label="Rendimento CDI"
                pct={cdiPct}
                value={summary.total_rendimento_cdi}
                color="bg-blue-500"
              />
            </div>
          )
        })()}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Batches de pagamento */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-300">
            <Clock className="mr-2 inline h-4 w-4" /> Pagamentos Quinzenais
          </h3>
          {batches.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500">
              Nenhum batch gerado ainda. O cron cria automaticamente nos dias 1 e 15.
            </p>
          ) : (
            <div className="space-y-3">
              {batches.map((b) => {
                const st = BATCH_STATUS[b.status]
                const validation = VALIDATION_STATUS[b.validation_status]
                const blockedItems = b.validation_summary?.blockedItems ?? 0
                const invalidPixCount = b.validation_summary?.invalidPixCount ?? 0
                const missingPixCount = b.validation_summary?.missingPixCount ?? 0
                return (
                  <div key={b.id} className="rounded-lg border border-zinc-800 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-zinc-200">{b.referencia}</p>
                        <p className="text-xs text-zinc-500">
                          {new Date(b.period_start).toLocaleDateString('pt-BR')} →{' '}
                          {new Date(b.period_end).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${st.bg} ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 ${validation.bg} ${validation.color}`}
                      >
                        Validação: {validation.label}
                      </span>
                      {blockedItems > 0 && (
                        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-red-300">
                          {blockedItems} itens bloqueados
                        </span>
                      )}
                      {(invalidPixCount > 0 || missingPixCount > 0) && (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-300">
                          PIX inválido/faltando: {invalidPixCount + missingPixCount}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-zinc-400">{b.items_count} itens</span>
                      <span className="font-mono font-semibold text-zinc-200">
                        {formatCurrency(b.total_amount)}
                      </span>
                    </div>
                    {/* Ações */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(b.status === 'pendente' || b.status === 'aprovado') && (
                        <button
                          onClick={() => performAction('validate_batch', { batch_id: b.id })}
                          disabled={actionLoading}
                          className="flex items-center gap-1 rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-600 disabled:opacity-50"
                        >
                          <CheckCircle className="h-3 w-3" /> Validar
                        </button>
                      )}
                      <button
                        onClick={() => exportBatch(b.id, 'csv')}
                        disabled={actionLoading}
                        className="flex items-center gap-1 rounded bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-100 hover:bg-zinc-700 disabled:opacity-50"
                      >
                        <ArrowRight className="h-3 w-3" /> CSV
                      </button>
                      <button
                        onClick={() => exportBatch(b.id, 'json')}
                        disabled={actionLoading}
                        className="flex items-center gap-1 rounded bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-100 hover:bg-zinc-700 disabled:opacity-50"
                      >
                        <ArrowRight className="h-3 w-3" /> JSON
                      </button>
                      {b.status === 'pendente' && (
                        <button
                          onClick={() => performAction('approve_batch', { batch_id: b.id })}
                          disabled={actionLoading || b.validation_status !== 'pronto'}
                          className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          <CheckCircle className="h-3 w-3" /> Aprovar
                        </button>
                      )}
                      {b.status === 'aprovado' && (
                        <button
                          onClick={() => performAction('mark_paid', { batch_id: b.id })}
                          disabled={actionLoading || b.validation_status !== 'pronto'}
                          className="flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          <Banknote className="h-3 w-3" /> Marcar Pago
                        </button>
                      )}
                      {b.status === 'aprovado' && (
                        <a
                          href={buildWhatsAppLink(
                            `✅ Pagamento aprovado!\n\nBatch: ${b.referencia}\nTotal: ${formatCurrency(b.total_amount)}\nAfiliados: ${b.items_count}\n\nFazer PIX agora!`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded bg-green-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-900"
                        >
                          <MessageCircle className="h-3 w-3" /> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Ledger recente */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-300">
            <DollarSign className="mr-2 inline h-4 w-4" /> Extrato Financeiro
          </h3>
          {ledger.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500">Nenhuma movimentação.</p>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {ledger.map((entry) => {
                const info = TIPO_LABELS[entry.tipo] ?? {
                  label: entry.tipo,
                  color: 'text-zinc-400',
                }
                const isIncome = entry.tipo.startsWith('entrada') || entry.tipo === 'rendimento_cdi'
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2"
                  >
                    <div>
                      <span className={`text-sm font-medium ${info.color}`}>{info.label}</span>
                      {entry.descricao && (
                        <p className="max-w-xs truncate text-xs text-zinc-500">{entry.descricao}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-mono text-sm font-semibold ${isIncome ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {isIncome ? '+' : '-'} {formatCurrency(entry.valor)}
                      </p>
                      <p className="text-xs text-zinc-600">
                        {new Date(entry.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Reminders */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="mb-4 text-sm font-semibold text-zinc-300">
          <MessageCircle className="mr-2 inline h-4 w-4 text-green-400" />
          Alertas via WhatsApp
        </h3>
        <p className="mb-4 text-sm text-zinc-400">
          Nos dias 1 e 15, o sistema gera o batch automaticamente às 5h BRT. Use os links abaixo
          para se lembrar de pagar:
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={buildWhatsAppLink(reminderMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
          >
            <MessageCircle className="h-4 w-4" />
            Salvar Lembrete no WhatsApp
          </a>
          <a
            href={buildWhatsAppLink(payoutAlertMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-green-600 px-5 py-2.5 text-sm font-semibold text-green-400 hover:bg-green-600/10"
          >
            <Wallet className="h-4 w-4" />
            Enviar Resumo Financeiro
          </a>
        </div>
      </div>

      {/* CDI Config */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="mb-3 text-sm font-semibold text-zinc-300">
          <Percent className="mr-2 inline h-4 w-4" /> Configuração CDI
        </h3>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-zinc-500">Taxa anual atual</p>
            <p className="text-xl font-bold text-zinc-200">{cdiTaxa}% a.a.</p>
            <p className="text-xs text-zinc-500">
              ≈ {((Math.pow(1 + cdiTaxa / 100, 1 / 365) - 1) * 100).toFixed(6)}% ao dia
            </p>
          </div>
          <button
            onClick={() => {
              const nova = prompt('Nova taxa CDI anual (ex: 13.15):', String(cdiTaxa))
              if (!nova) return
              const val = parseFloat(nova)
              if (isNaN(val) || val <= 0 || val > 50) return
              performAction('update_cdi', { taxa_anual: val })
            }}
            disabled={actionLoading}
            className="rounded bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
          >
            Alterar taxa
          </button>
        </div>
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
  value: string
  sub?: string
  color: string
}) {
  const borderColor: Record<string, string> = {
    green: 'border-green-600/30',
    blue: 'border-blue-600/30',
    yellow: 'border-yellow-600/30',
    purple: 'border-purple-600/30',
  }
  const textColor: Record<string, string> = {
    green: 'text-green-400',
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
  }

  return (
    <div className={`rounded-xl border ${borderColor[color]} bg-zinc-900 p-4`}>
      <div className={`flex items-center gap-2 ${textColor[color]}`}>
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={`mt-1 text-2xl font-bold ${textColor[color]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </div>
  )
}

function Bar({
  label,
  pct,
  value,
  color,
}: {
  label: string
  pct: number
  value: number
  color: string
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="font-mono text-zinc-300">
          {formatCurrency(value)} ({pct.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}
