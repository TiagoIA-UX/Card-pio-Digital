'use client'

/**
 * /admin/equipe — Gestão de admins do sistema.
 * Apenas role 'owner' pode acessar.
 */

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  Crown,
  ShieldCheck,
  Headphones,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  Mail,
  ArrowLeft,
} from 'lucide-react'

interface AdminMember {
  id: string
  user_id: string
  email: string
  role: 'owner' | 'admin' | 'support'
  created_at: string
}

const ROLE_META = {
  owner: {
    label: 'Dono',
    icon: Crown,
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  admin: {
    label: 'Admin',
    icon: ShieldCheck,
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
  },
  support: {
    label: 'Suporte',
    icon: Headphones,
    bg: 'bg-zinc-100',
    text: 'text-zinc-700',
    border: 'border-zinc-200',
  },
}

export default function AdminEquipePage() {
  const router = useRouter()
  const supabase = createClient()

  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<AdminMember[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'support'>('admin')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadTeam = useCallback(async () => {
    const res = await fetch('/api/admin/team', { credentials: 'include' })
    if (!res.ok) return
    const data = await res.json()
    setTeam(data.team ?? [])
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

      if (!rec || rec.role !== 'owner') {
        router.push('/admin/dashboard')
        return
      }

      setIsOwner(true)
      await loadTeam()
      setLoading(false)
    }
    void init()
  }, [supabase, router, loadTeam])

  const handleAdd = async () => {
    const email = newEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      setError('Email inválido')
      return
    }
    setAdding(true)
    setError('')
    setSuccess('')

    const res = await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, role: newRole }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Erro ao adicionar')
    } else {
      setSuccess(`${email} adicionado como ${newRole}`)
      setNewEmail('')
      await loadTeam()
    }
    setAdding(false)
  }

  const handleRemove = async (userId: string) => {
    if (!confirm('Remover este admin?')) return
    setRemoving(userId)
    setError('')
    setSuccess('')

    const res = await fetch(`/api/admin/team?id=${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Erro ao remover')
    } else {
      setSuccess('Admin removido')
      await loadTeam()
    }
    setRemoving(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!isOwner) return null

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-amber-500" />
            <div>
              <h1 className="text-lg font-bold text-zinc-900">Equipe Admin</h1>
              <p className="text-xs text-zinc-500">Apenas visível para o dono da empresa</p>
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

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        {/* Feedback */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            ✓ {success}
          </div>
        )}

        {/* Adicionar */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="mb-4 flex items-center gap-2 font-semibold text-zinc-800">
            <Plus className="h-4 w-4 text-orange-500" />
            Adicionar membro
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="email@exemplo.com"
                className="w-full rounded-lg border border-zinc-200 py-2 pr-3 pl-9 text-sm focus:border-orange-400 focus:outline-none"
              />
            </div>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as 'admin' | 'support')}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
            >
              <option value="admin">Admin</option>
              <option value="support">Suporte</option>
            </select>
            <button
              onClick={handleAdd}
              disabled={adding}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Adicionar
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-5 py-4">
            <p className="flex items-center gap-2 font-semibold text-zinc-800">
              <Users className="h-4 w-4" />
              Membros ({team.length})
            </p>
          </div>
          <div className="divide-y divide-zinc-50">
            {team.map((m) => {
              const meta = ROLE_META[m.role]
              const Icon = meta.icon
              return (
                <div key={m.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${meta.bg} ${meta.border} border`}
                    >
                      <Icon className={`h-4 w-4 ${meta.text}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-800">{m.email}</p>
                      <span
                        className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${meta.bg} ${meta.text}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>
                  {m.role !== 'owner' && (
                    <button
                      onClick={() => handleRemove(m.user_id)}
                      disabled={removing === m.user_id}
                      className="rounded-lg p-2 text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      {removing === m.user_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              )
            })}
            {team.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-zinc-500">Nenhum membro ainda.</p>
            )}
          </div>
        </div>

        {/* Legenda */}
        <div className="space-y-1 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-xs text-zinc-500">
          <p>
            <Crown className="inline h-3 w-3 text-amber-500" /> <strong>Dono</strong> — acesso
            total, não pode ser removido
          </p>
          <p>
            <ShieldCheck className="inline h-3 w-3 text-blue-500" /> <strong>Admin</strong> —
            gerencia clientes, comissões e métricas
          </p>
          <p>
            <Headphones className="inline h-3 w-3 text-zinc-500" /> <strong>Suporte</strong> —
            acesso de leitura apenas
          </p>
        </div>
      </main>
    </div>
  )
}
