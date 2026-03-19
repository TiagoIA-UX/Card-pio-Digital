'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle,
  ChevronUp,
  Filter,
  Loader2,
  User,
  Send,
  ArrowRightLeft,
} from 'lucide-react'

interface Ticket {
  id: string
  subject: string
  priority: string
  category: string
  status: string
  assigned_type: string
  assigned_to: string | null
  sla_deadline: string | null
  first_response_at: string | null
  escalated_at: string | null
  created_at: string
  restaurants?: { nome: string }
}

interface Message {
  id: string
  sender_type: string
  sender_id: string | null
  content: string
  created_at: string
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  operational: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-600',
}

const STATUS_COLOR: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  waiting_customer: 'bg-orange-100 text-orange-800',
  escalated: 'bg-red-100 text-red-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
}

export default function AdminSuportePage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [replyContent, setReplyContent] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadTickets = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (priorityFilter) params.set('priority', priorityFilter)

    const res = await fetch(`/api/admin/suporte?${params}`)
    if (res.status === 401) {
      router.push('/login')
      return
    }
    const json = await res.json()
    setTickets(json.data ?? [])
    setTotal(json.total ?? 0)
    setLoading(false)
  }, [statusFilter, priorityFilter, router])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const openTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket)
    const res = await fetch(`/api/admin/suporte?id=${ticket.id}`)
    const json = await res.json()
    setMessages(json.messages ?? [])
  }

  const handleReply = async () => {
    if (!selectedTicket || !replyContent.trim()) return
    setActionLoading(true)
    await fetch('/api/admin/suporte', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reply',
        ticket_id: selectedTicket.id,
        content: replyContent,
      }),
    })
    setReplyContent('')
    await openTicket(selectedTicket)
    setActionLoading(false)
  }

  const handleResolve = async () => {
    if (!selectedTicket) return
    setActionLoading(true)
    await fetch('/api/admin/suporte', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resolve', ticket_id: selectedTicket.id }),
    })
    setSelectedTicket(null)
    await loadTickets()
    setActionLoading(false)
  }

  const slaStatus = (ticket: Ticket) => {
    if (ticket.first_response_at)
      return { icon: CheckCircle, color: 'text-green-500', label: 'SLA OK' }
    if (ticket.escalated_at)
      return { icon: AlertTriangle, color: 'text-red-500', label: 'Escalado' }
    if (!ticket.sla_deadline) return { icon: Clock, color: 'text-gray-400', label: '—' }
    // eslint-disable-next-line react-hooks/purity -- Date.now() intentional for SLA countdown
    const remaining = new Date(ticket.sla_deadline).getTime() - Date.now()
    if (remaining < 0) return { icon: AlertTriangle, color: 'text-red-500', label: 'SLA Estourado' }
    const mins = Math.floor(remaining / 60000)
    return {
      icon: Clock,
      color: mins < 10 ? 'text-orange-500' : 'text-blue-500',
      label: `${mins}min`,
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">
          <MessageSquare className="mr-2 inline h-6 w-6" />
          Suporte — Tickets ({total})
        </h1>

        {/* Filtros */}
        <div className="mb-4 flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Todos os status</option>
            <option value="open">Aberto</option>
            <option value="in_progress">Em Andamento</option>
            <option value="escalated">Escalado</option>
            <option value="waiting_customer">Aguardando Cliente</option>
            <option value="resolved">Resolvido</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Todas prioridades</option>
            <option value="critical">Crítico</option>
            <option value="operational">Operacional</option>
            <option value="low">Baixo</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Lista de Tickets */}
          <div className="lg:col-span-1">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : tickets.length === 0 ? (
              <p className="py-8 text-center text-gray-500">Nenhum ticket encontrado.</p>
            ) : (
              <div className="space-y-2">
                {tickets.map((t) => {
                  const sla = slaStatus(t)
                  return (
                    <button
                      key={t.id}
                      onClick={() => openTicket(t)}
                      className={`w-full rounded-lg border p-3 text-left transition hover:shadow-md ${
                        selectedTicket?.id === t.id ? 'border-blue-500 bg-blue-50' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="line-clamp-1 text-sm font-medium text-gray-900">
                          {t.subject}
                        </span>
                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 text-xs ${PRIORITY_COLOR[t.priority]}`}
                        >
                          {t.priority}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <span className={`rounded-full px-2 py-0.5 ${STATUS_COLOR[t.status]}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                        <sla.icon className={`h-3.5 w-3.5 ${sla.color}`} />
                        <span className={sla.color}>{sla.label}</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">
                        {t.restaurants?.nome ?? '—'} ·{' '}
                        {new Date(t.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Detalhe do Ticket */}
          <div className="lg:col-span-2">
            {selectedTicket ? (
              <div className="rounded-lg border bg-white p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedTicket.subject}</h2>
                    <p className="text-sm text-gray-500">
                      {selectedTicket.category} · {selectedTicket.assigned_type}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleResolve}
                      disabled={actionLoading}
                      className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" /> Resolver
                    </button>
                  </div>
                </div>

                {/* Mensagens */}
                <div className="mb-4 max-h-96 space-y-3 overflow-y-auto rounded-lg bg-gray-50 p-4">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-lg p-3 ${
                        m.sender_type === 'admin'
                          ? 'ml-8 bg-blue-100'
                          : m.sender_type === 'system'
                            ? 'bg-yellow-50 text-center text-sm italic'
                            : 'mr-8 bg-white'
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-1 text-xs text-gray-500">
                        <User className="h-3 w-3" />
                        {m.sender_type} · {new Date(m.created_at).toLocaleString('pt-BR')}
                      </div>
                      <p className="text-sm whitespace-pre-wrap text-gray-800">{m.content}</p>
                    </div>
                  ))}
                </div>

                {/* Responder */}
                <div className="flex gap-2">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Responder ao ticket..."
                    className="flex-1 resize-none rounded-lg border p-3 text-sm"
                    rows={2}
                  />
                  <button
                    onClick={handleReply}
                    disabled={actionLoading || !replyContent.trim()}
                    className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-lg border bg-white text-gray-400">
                Selecione um ticket para ver detalhes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
