'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/shared/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Github, KeyRound, Loader2, RefreshCw, Search, ShieldBan } from 'lucide-react'

type AccessPlan = 'starter' | 'pro' | 'lifetime'

interface AccessGrantRecord {
  id: string
  repository: string
  github_username: string
  customer_name: string
  customer_email: string
  template_slug: string
  plan: AccessPlan
  paid_amount_cents: number
  paid_currency: string
  permission: 'pull'
  visibility: 'private'
  license_model: string
  expires_at: string | null
  granted_at: string
  granted_by_admin_email: string
  revoked_at: string | null
  revoked_by_admin_email: string | null
  revoked_reason: string | null
  metadata: {
    invite_command?: string
    revoke_command?: string
    checklist?: string[]
    granted_by_label?: string
  } | null
}

interface FeedbackState {
  type: 'success' | 'error'
  message: string
}

const DEFAULT_REPOSITORY = 'TiagoIA-UX/Cardapio-Digital'

const PLAN_OPTIONS: Array<{ value: AccessPlan; label: string }> = [
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'lifetime', label: 'Lifetime' },
]

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency || 'BRL',
  }).format(cents / 100)
}

function formatDate(value: string | null) {
  if (!value) return 'Sem data'
  return new Date(value).toLocaleString('pt-BR')
}

export default function AdminRepoAccessPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [submittingGrant, setSubmittingGrant] = useState(false)
  const [submittingRevokeId, setSubmittingRevokeId] = useState<string | null>(null)
  const [accessGrants, setAccessGrants] = useState<AccessGrantRecord[]>([])
  const [adminEmail, setAdminEmail] = useState('')
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [search, setSearch] = useState('')
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [filters, setFilters] = useState({
    repository: DEFAULT_REPOSITORY,
    githubUsername: '',
    activeOnly: true,
  })
  const [grantForm, setGrantForm] = useState({
    repository: DEFAULT_REPOSITORY,
    githubUsername: '',
    customerName: '',
    customerEmail: '',
    templateSlug: 'pizzaria',
    plan: 'pro' as AccessPlan,
    paidAmountCents: 99700,
    paidCurrency: 'BRL',
    grantedBy: '',
    expiresAt: '',
  })

  const ensureAdmin = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return false
    }

    const { data: adminCheck } = await supabase
      .from('admin_users')
      .select('email')
      .eq('user_id', session.user.id)
      .single()

    if (!adminCheck?.email) {
      router.push('/painel')
      return false
    }

    setAdminEmail(adminCheck.email)
    setGrantForm((current) => ({
      ...current,
      grantedBy: current.grantedBy || adminCheck.email.split('@')[0] || 'admin',
    }))

    return true
  }, [router, supabase])

  const loadAccessGrants = useCallback(async () => {
    setLoading(true)
    setFeedback(null)

    try {
      const params = new URLSearchParams()
      if (filters.repository.trim()) params.set('repository', filters.repository.trim())
      if (filters.githubUsername.trim()) params.set('githubUsername', filters.githubUsername.trim())
      if (filters.activeOnly) params.set('activeOnly', 'true')

      const res = await fetch(`/api/admin/repo-access?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao carregar ledger de acesso')
      }

      setAccessGrants(data.accessGrants ?? [])
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Falha ao carregar acessos',
      })
    } finally {
      setLoading(false)
    }
  }, [filters.githubUsername, filters.activeOnly, filters.repository])

  useEffect(() => {
    queueMicrotask(async () => {
      const isAdmin = await ensureAdmin()
      if (!isAdmin) return
      await loadAccessGrants()
    })
  }, [ensureAdmin, loadAccessGrants])

  const visibleGrants = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return accessGrants

    return accessGrants.filter((grant) =>
      [
        grant.repository,
        grant.github_username,
        grant.customer_name,
        grant.customer_email,
        grant.template_slug,
        grant.plan,
      ].some((value) => value.toLowerCase().includes(normalizedSearch))
    )
  }, [accessGrants, search])

  const summary = useMemo(() => {
    const active = accessGrants.filter((grant) => !grant.revoked_at)
    const revoked = accessGrants.length - active.length
    const revenue = active.reduce((total, grant) => total + grant.paid_amount_cents, 0)

    return {
      active: active.length,
      revoked,
      revenue,
    }
  }, [accessGrants])

  const handleGrantChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setGrantForm((current) => ({
      ...current,
      [name]: name === 'paidAmountCents' ? Number(value) : value,
    }))
  }

  const handleGrantSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmittingGrant(true)
    setFeedback(null)

    try {
      const payload = {
        action: 'grant',
        repository: grantForm.repository.trim(),
        githubUsername: grantForm.githubUsername.trim(),
        customerName: grantForm.customerName.trim(),
        customerEmail: grantForm.customerEmail.trim(),
        templateSlug: grantForm.templateSlug.trim(),
        plan: grantForm.plan,
        paidAmountCents: Number(grantForm.paidAmountCents),
        paidCurrency: grantForm.paidCurrency.trim() || 'BRL',
        grantedBy: grantForm.grantedBy.trim(),
        expiresAt: grantForm.expiresAt ? new Date(grantForm.expiresAt).toISOString() : null,
      }

      const res = await fetch('/api/admin/repo-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao registrar grant')
      }

      setFeedback({
        type: 'success',
        message: `Grant registrado para ${data.grant.github_username}.`,
      })
      setGrantForm((current) => ({
        ...current,
        githubUsername: '',
        customerName: '',
        customerEmail: '',
        templateSlug: current.templateSlug,
        expiresAt: '',
      }))
      await loadAccessGrants()
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Falha ao registrar grant',
      })
    } finally {
      setSubmittingGrant(false)
    }
  }

  const handleRevoke = async (grant: AccessGrantRecord) => {
    if (!revokeReason.trim()) {
      setFeedback({ type: 'error', message: 'Informe o motivo da revogação.' })
      return
    }

    setSubmittingRevokeId(grant.id)
    setFeedback(null)

    try {
      const res = await fetch('/api/admin/repo-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke',
          repository: grant.repository,
          githubUsername: grant.github_username,
          templateSlug: grant.template_slug,
          reason: revokeReason.trim(),
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao revogar grant')
      }

      setFeedback({
        type: 'success',
        message: `Grant revogado para ${data.grant.github_username}.`,
      })
      setRevokeTargetId(null)
      setRevokeReason('')
      await loadAccessGrants()
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Falha ao revogar grant',
      })
    } finally {
      setSubmittingRevokeId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-300">
              <KeyRound className="h-3.5 w-3.5" />
              Comercial privado
            </div>
            <h1 className="text-2xl font-bold text-zinc-100">Acesso ao repositório privado</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              Operação centralizada para grants e revogações do código pago. A tela consome o ledger
              persistente e expõe os comandos operacionais gerados no backend.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-xs text-zinc-400">
            <p className="font-medium text-zinc-200">Admin ativo</p>
            <p>{adminEmail || 'Carregando...'}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs tracking-[0.2em] text-zinc-500 uppercase">Ativos</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-100">{summary.active}</p>
          <p className="mt-2 text-sm text-zinc-400">Acessos atualmente válidos no ledger.</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs tracking-[0.2em] text-zinc-500 uppercase">Revogados</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-100">{summary.revoked}</p>
          <p className="mt-2 text-sm text-zinc-400">Entradas encerradas com rastreabilidade.</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs tracking-[0.2em] text-zinc-500 uppercase">Receita ativa</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-100">
            {formatMoney(summary.revenue, 'BRL')}
          </p>
          <p className="mt-2 text-sm text-zinc-400">Soma dos grants não revogados carregados.</p>
        </div>
      </section>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-green-500/30 bg-green-500/10 text-green-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form
          onSubmit={handleGrantSubmit}
          className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
        >
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Registrar grant</h2>
            <p className="mt-1 text-sm text-zinc-400">
              O convite e o checklist operacional são gerados automaticamente pela API.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Repositório</label>
            <input
              title="Repositório"
              name="repository"
              value={grantForm.repository}
              onChange={handleGrantChange}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 transition outline-none focus:border-orange-500"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Usuário GitHub</label>
              <input
                title="Usuário GitHub"
                name="githubUsername"
                value={grantForm.githubUsername}
                onChange={handleGrantChange}
                placeholder="cliente-pago"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 transition outline-none focus:border-orange-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Template</label>
              <input
                title="Template"
                name="templateSlug"
                value={grantForm.templateSlug}
                onChange={handleGrantChange}
                placeholder="pizzaria"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 transition outline-none focus:border-orange-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Nome do cliente</label>
            <input
              title="Nome do cliente"
              name="customerName"
              value={grantForm.customerName}
              onChange={handleGrantChange}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 transition outline-none focus:border-orange-500"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Email do cliente</label>
            <input
              title="Email do cliente"
              type="email"
              name="customerEmail"
              value={grantForm.customerEmail}
              onChange={handleGrantChange}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 transition outline-none focus:border-orange-500"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Plano</label>
              <select
                title="Plano"
                name="plan"
                value={grantForm.plan}
                onChange={handleGrantChange}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 transition outline-none focus:border-orange-500"
              >
                {PLAN_OPTIONS.map((plan) => (
                  <option key={plan.value} value={plan.value}>
                    {plan.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Valor pago em centavos</label>
              <input
                title="Valor pago em centavos"
                type="number"
                min={1}
                name="paidAmountCents"
                value={grantForm.paidAmountCents}
                onChange={handleGrantChange}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 transition outline-none focus:border-orange-500"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Moeda</label>
              <input
                title="Moeda"
                name="paidCurrency"
                value={grantForm.paidCurrency}
                onChange={handleGrantChange}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 uppercase transition outline-none focus:border-orange-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Etiqueta operacional</label>
              <input
                title="Etiqueta operacional"
                name="grantedBy"
                value={grantForm.grantedBy}
                onChange={handleGrantChange}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 transition outline-none focus:border-orange-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Expira em</label>
            <input
              title="Expira em"
              type="datetime-local"
              name="expiresAt"
              value={grantForm.expiresAt}
              onChange={handleGrantChange}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 transition outline-none focus:border-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={submittingGrant}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submittingGrant ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Registrar grant
          </button>
        </form>

        <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Ledger operacional</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Filtre grants ativos ou revogados, revise comandos e acione revogação quando
                preciso.
              </p>
            </div>
            <button
              type="button"
              onClick={loadAccessGrants}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
          </div>

          <div className="grid gap-3 xl:grid-cols-[1fr_1fr_auto]">
            <input
              value={filters.repository}
              onChange={(event) =>
                setFilters((current) => ({ ...current, repository: event.target.value }))
              }
              placeholder="Filtrar por repositório"
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 transition outline-none focus:border-orange-500"
            />
            <input
              value={filters.githubUsername}
              onChange={(event) =>
                setFilters((current) => ({ ...current, githubUsername: event.target.value }))
              }
              placeholder="Filtrar por usuário GitHub"
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 transition outline-none focus:border-orange-500"
            />
            <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2.5 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={filters.activeOnly}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, activeOnly: event.target.checked }))
                }
              />
              Apenas ativos
            </label>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-zinc-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Busca local por cliente, template, plano ou GitHub"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-2.5 pr-3 pl-9 text-sm text-zinc-100 transition outline-none focus:border-orange-500"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            </div>
          ) : visibleGrants.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/40 px-6 py-14 text-center text-sm text-zinc-500">
              Nenhuma entrada encontrada para os filtros atuais.
            </div>
          ) : (
            <div className="space-y-4">
              {visibleGrants.map((grant) => {
                const isRevoked = Boolean(grant.revoked_at)
                const isRevokeOpen = revokeTargetId === grant.id

                return (
                  <article
                    key={grant.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950/40"
                  >
                    <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
                            <Github className="h-3.5 w-3.5" />
                            {grant.github_username}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              isRevoked
                                ? 'bg-red-500/15 text-red-300'
                                : 'bg-green-500/15 text-green-300'
                            }`}
                          >
                            {isRevoked ? 'Revogado' : 'Ativo'}
                          </span>
                          <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-medium text-orange-300">
                            {grant.plan.toUpperCase()}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-semibold text-zinc-100">
                            {grant.customer_name}
                          </h3>
                          <p className="text-sm text-zinc-400">{grant.customer_email}</p>
                        </div>

                        <div className="grid gap-2 text-sm text-zinc-400 md:grid-cols-2">
                          <p>
                            <span className="text-zinc-500">Repositório:</span> {grant.repository}
                          </p>
                          <p>
                            <span className="text-zinc-500">Template:</span> {grant.template_slug}
                          </p>
                          <p>
                            <span className="text-zinc-500">Valor:</span>{' '}
                            {formatMoney(grant.paid_amount_cents, grant.paid_currency)}
                          </p>
                          <p>
                            <span className="text-zinc-500">Grant:</span>{' '}
                            {formatDate(grant.granted_at)}
                          </p>
                          <p>
                            <span className="text-zinc-500">Operador:</span>{' '}
                            {grant.granted_by_admin_email}
                          </p>
                          <p>
                            <span className="text-zinc-500">Expiração:</span>{' '}
                            {grant.expires_at ? formatDate(grant.expires_at) : 'Sem expiração'}
                          </p>
                        </div>
                      </div>

                      <div className="flex min-w-55 flex-col gap-2">
                        {!isRevoked && (
                          <button
                            type="button"
                            onClick={() => {
                              setRevokeTargetId(grant.id)
                              setRevokeReason('')
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/40 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
                          >
                            <ShieldBan className="h-4 w-4" />
                            Revogar acesso
                          </button>
                        )}

                        <details className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-sm text-zinc-300">
                          <summary className="cursor-pointer list-none font-medium text-zinc-200">
                            Ver comandos e checklist
                          </summary>
                          <div className="mt-3 space-y-3 text-xs text-zinc-400">
                            <div>
                              <p className="mb-1 font-medium text-zinc-300">Invite command</p>
                              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-3 text-[11px] leading-5 text-zinc-400">
                                {grant.metadata?.invite_command || 'Não disponível'}
                              </pre>
                            </div>
                            <div>
                              <p className="mb-1 font-medium text-zinc-300">Revoke command</p>
                              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-3 text-[11px] leading-5 text-zinc-400">
                                {grant.metadata?.revoke_command || 'Não disponível'}
                              </pre>
                            </div>
                            <div>
                              <p className="mb-1 font-medium text-zinc-300">Checklist</p>
                              <ul className="space-y-1">
                                {(grant.metadata?.checklist || []).map((item) => (
                                  <li key={item}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </details>
                      </div>
                    </div>

                    {isRevoked && (
                      <div className="border-t border-zinc-800 bg-red-500/5 px-5 py-3 text-sm text-red-200">
                        Revogado em {formatDate(grant.revoked_at)} por{' '}
                        {grant.revoked_by_admin_email || 'admin'}.
                        {grant.revoked_reason ? ` Motivo: ${grant.revoked_reason}` : ''}
                      </div>
                    )}

                    {!isRevoked && isRevokeOpen && (
                      <div className="border-t border-zinc-800 bg-zinc-900/70 p-5">
                        <label className="mb-2 block text-sm font-medium text-zinc-200">
                          Motivo da revogação
                        </label>
                        <textarea
                          value={revokeReason}
                          onChange={(event) => setRevokeReason(event.target.value)}
                          rows={3}
                          placeholder="Ex.: chargeback confirmado, cancelamento comercial, inadimplência"
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 transition outline-none focus:border-orange-500"
                        />
                        <div className="mt-3 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => handleRevoke(grant)}
                            disabled={submittingRevokeId === grant.id}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {submittingRevokeId === grant.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ShieldBan className="h-4 w-4" />
                            )}
                            Confirmar revogação
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRevokeTargetId(null)
                              setRevokeReason('')
                            }}
                            className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
