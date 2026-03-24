'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import {
  Users,
  Link2,
  Copy,
  CheckCheck,
  TrendingUp,
  Clock,
  CircleDollarSign,
  BadgeCheck,
  AlertCircle,
  Loader2,
  Trophy,
  Star,
  Gift,
  Network,
  UserPlus,
  Settings,
  Info,
  QrCode,
  Download,
} from 'lucide-react'
import Link from 'next/link'
import { getRestaurantScopedHref } from '@/lib/active-restaurant'
import { AFFILIATE_TIERS } from '@/lib/affiliate-tiers'

interface Affiliate {
  id: string
  code: string
  nome: string
  chave_pix: string | null
  status: string
  tier: string // trainee | analista | coordenador | gerente | diretor | socio
  commission_rate: number
  cidade: string | null
  estado: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
}

interface Referral {
  id: string
  plano: string | null
  valor_assinatura: number | null
  comissao: number | null
  status: 'pendente' | 'aprovado' | 'pago'
  referencia_mes: string | null
  created_at: string
}

interface Stats {
  total_indicados: number
  pendente_analise: number
  aprovado_aguardando: number
  comissao_pendente: number
  comissao_aprovada: number
  comissao_paga: number
  proxima_data_pagamento: string
  mrr_direto: number
  mrr_rede: number
  mrr_estimado: number
  total_vendedores: number
  rede_indicados: number
}

interface SaldoInfo {
  aprovado_aguardando: number
  proxima_data_pagamento: string
  dias_ate_pagamento: number
  rendimento_estimado: number
}

interface Bonus {
  id: string
  nivel: number
  valor_bonus: number
  status: 'pendente' | 'pago'
  referencia_mes: string | null
  created_at: string
}

interface Vendedor {
  id: string
  nome: string
  code: string
  status: string
  created_at: string
}

// ── Constantes ─────────────────────────────────────────────────────────────

function getAffiliateSiteUrl() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return window.location.origin
    }
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zairyx.com'
}

const PCT_VENDEDOR = 30
const PCT_LIDER = 10
const LIDER_MIN_VENDEDORES = 5

// Bônus derivados da fonte de verdade (affiliate-tiers.ts)
const BONUS_MILESTONES = AFFILIATE_TIERS.filter((t) => t.bonusUnico > 0).map((t) => ({
  nivel: t.minRestaurantes,
  valor: t.bonusUnico,
  nome: t.nome,
  label: `${t.minRestaurantes} restaurantes (${t.nome})`,
}))

const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> =
  {
    pendente: { label: 'Pendente', className: 'bg-amber-100 text-amber-700', icon: Clock },
    aprovado: { label: 'Aprovado', className: 'bg-blue-100 text-blue-700', icon: BadgeCheck },
    pago: { label: 'Pago', className: 'bg-green-100 text-green-700', icon: CircleDollarSign },
  }

const defaultStatus = {
  label: 'Desconhecido',
  className: 'bg-zinc-100 text-zinc-500',
  icon: AlertCircle,
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        highlight ? 'border-orange-200 bg-orange-50' : 'border-zinc-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="text-muted-foreground text-xs">{label}</span>
        <Icon className={`h-4 w-4 ${highlight ? 'text-orange-500' : 'text-zinc-400'}`} />
      </div>
      <p className={`mt-2 text-2xl font-bold ${highlight ? 'text-orange-600' : 'text-zinc-800'}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </div>
  )
}

function BonusMilestones({ total }: { total: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Gift className="h-4 w-4 text-purple-500" />
        <span className="font-semibold text-zinc-800">Bônus por volume</span>
        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
          Acumulativas
        </span>
      </div>
      <div className="space-y-3">
        {BONUS_MILESTONES.map((m) => {
          const atingido = total >= m.nivel
          const pct = Math.min(100, Math.round((total / m.nivel) * 100))
          return (
            <div key={m.nivel} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className={atingido ? 'font-semibold text-green-700' : 'text-zinc-600'}>
                  {m.label}
                  {atingido && ' ✓'}
                </span>
                <span className={`font-bold ${atingido ? 'text-green-600' : 'text-zinc-500'}`}>
                  + R$ {m.valor.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 w-[${pct}%] ${atingido ? 'bg-green-500' : 'bg-orange-400'}`}
                />
              </div>
              {!atingido && (
                <p className="text-xs text-zinc-400">
                  {total}/{m.nivel} restaurantes ({pct}%)
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AfiliadosPage() {
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [posicaoRanking, setPosicaoRanking] = useState<number | null>(null)
  const [isLider, setIsLider] = useState(false)
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [saldoInfo, setSaldoInfo] = useState<SaldoInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [showQr, setShowQr] = useState(false)
  const [nome, setNome] = useState('')
  const [chavePix, setChavePix] = useState('')
  const [liderCode, setLiderCode] = useState('')
  const [error, setError] = useState('')
  const affLink = affiliate ? `${getAffiliateSiteUrl()}/?ref=${affiliate.code}` : ''

  const fetchData = useCallback(async () => {
    const [meRes, saldoRes] = await Promise.all([
      fetch('/api/afiliados/me'),
      fetch('/api/afiliados/saldo-info'),
    ])
    const data = await meRes.json()
    setAffiliate(data.affiliate ?? null)
    setReferrals(data.referrals ?? [])
    setStats(data.stats ?? null)
    setPosicaoRanking(data.posicao_ranking ?? null)
    setIsLider(data.is_lider ?? false)
    setBonuses(data.bonuses ?? [])
    setVendedores(data.vendedores ?? [])
    setLoading(false)
    if (saldoRes.ok) {
      const sData = await saldoRes.json()
      setSaldoInfo(sData)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/afiliados/me')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setAffiliate(data.affiliate ?? null)
        setReferrals(data.referrals ?? [])
        setStats(data.stats ?? null)
        setPosicaoRanking(data.posicao_ranking ?? null)
        setIsLider(data.is_lider ?? false)
        setBonuses(data.bonuses ?? [])
        setVendedores(data.vendedores ?? [])
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [fetchData])

  useEffect(() => {
    if (!affLink) {
      const timeout = setTimeout(() => {
        setQrDataUrl(null)
      }, 0)
      return () => clearTimeout(timeout)
    }

    import('qrcode')
      .then((mod) => {
        const QR = mod.default ?? mod
        return QR.toDataURL(affLink, {
          width: 300,
          margin: 2,
          color: { dark: '#000', light: '#fff' },
        })
      })
      .then(setQrDataUrl)
      .catch(() => {})
  }, [affLink])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setRegistering(true)
    setError('')
    const res = await fetch('/api/afiliados/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: nome.trim(),
        chave_pix: chavePix.trim() || undefined,
        lider_code: liderCode.trim() || undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Erro ao registrar')
    } else {
      await fetchData()
    }
    setRegistering(false)
  }

  function copyLink() {
    if (!affiliate) return
    navigator.clipboard.writeText(affLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  // ─── Formulário de cadastro ───────────────────────────────────────────────
  if (!affiliate) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="mb-8 text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
            <Users className="text-primary h-7 w-7" />
          </div>
          <h1 className="text-foreground text-2xl font-bold">Programa de Afiliados</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Indique restaurantes e ganhe <strong>30% de comissão recorrente</strong> enquanto o
            cliente permanecer ativo.
          </p>
        </div>

        {/* Como funciona */}
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {[
            { step: '1', text: 'Compartilhe seu link' },
            { step: '2', text: 'Restaurante se cadastra' },
            { step: '3', text: 'Você ganha comissão' },
          ].map((s) => (
            <div
              key={s.step}
              className="flex flex-col items-center rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-center"
            >
              <span className="bg-primary text-primary-foreground mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold">
                {s.step}
              </span>
              <p className="text-foreground text-sm font-medium">{s.text}</p>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleRegister}
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-foreground mb-4 font-semibold">Criar minha conta de afiliado</h2>
          <div className="space-y-4">
            <div>
              <label className="text-muted-foreground mb-1 block text-xs font-medium">
                Seu nome completo *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João Silva"
                required
                className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs font-medium">
                Chave PIX para receber comissões
              </label>
              <input
                type="text"
                value={chavePix}
                onChange={(e) => setChavePix(e.target.value)}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Pode adicionar depois nas configurações.
              </p>
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs font-medium">
                Código de quem te indicou (opcional)
              </label>
              <input
                type="text"
                value={liderCode}
                onChange={(e) => setLiderCode(e.target.value)}
                placeholder="Ex: joaosilva3x9kq"
                className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Seja parte da rede de um Líder Zairyx e ajude-o a crescer.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={registering || !nome.trim()}
              className="bg-primary text-primary-foreground w-full rounded-xl py-2.5 font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {registering ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Criando...
                </span>
              ) : (
                'Quero ser afiliado'
              )}
            </button>
          </div>
        </form>

        {/* Teaser modelo 2 níveis */}
        <div className="mt-5 space-y-2">
          <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
            <p className="mb-2 text-sm font-semibold text-orange-800">💸 Como você ganha</p>
            <ul className="space-y-1 text-sm text-orange-700">
              <li>
                • <strong>{PCT_VENDEDOR}% recorrente</strong> por cada restaurante que você indicar
              </li>
              <li>
                • <strong>{PCT_LIDER}% da rede</strong> se você recrutar {LIDER_MIN_VENDEDORES}+
                vendedores (Líder Zairyx)
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
            <p className="mb-2 text-sm font-semibold text-purple-800">🎁 Bônus por volume</p>
            <ul className="space-y-1 text-sm text-purple-700">
              {BONUS_MILESTONES.map((m) => (
                <li key={m.nivel}>
                  • {m.label} ativos → <strong>+R$ {m.valor.toLocaleString('pt-BR')}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // ─── Dashboard do afiliado ────────────────────────────────────────────────
  const total = stats?.total_indicados ?? 0

  const downloadQr = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `qrcode-afiliado-${affiliate.code}.png`
    a.click()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {/* Cabeçalho + badge Líder + posição */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Meu painel de afiliado</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Você ganha <strong>{PCT_VENDEDOR}% recorrente</strong> por cada restaurante ativo
            {isLider && (
              <>
                , mais <strong>{PCT_LIDER}% da sua rede</strong> como Líder Zairyx
              </>
            )}
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {isLider ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
              <Star className="h-3.5 w-3.5 text-amber-500" />
              Líder Zairyx · +{PCT_LIDER}% rede
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
              <UserPlus className="h-3.5 w-3.5" />
              Vendedor · {PCT_VENDEDOR}%
              {vendedores.length > 0 && ` · ${vendedores.length}/${LIDER_MIN_VENDEDORES} p/ Líder`}
            </span>
          )}
          {posicaoRanking != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-800">
              <Trophy className="h-3.5 w-3.5 text-yellow-500" />#{posicaoRanking} no ranking
            </span>
          )}
          <Link
            href={getRestaurantScopedHref('/painel/afiliados/configuracoes')}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-200"
          >
            <Settings className="h-3.5 w-3.5" />
            Configurações
          </Link>
        </div>
      </div>

      {/* Progresso para Líder Zairyx */}
      {!isLider && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-amber-800">
              🏆 Progresso para Líder Zairyx
            </span>
            <span className="text-xs text-amber-700">
              {vendedores.length}/{LIDER_MIN_VENDEDORES} vendedores
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-amber-100">
            <div
              className={`h-full rounded-full bg-amber-400 transition-all duration-500 w-[${Math.min(100, Math.round((vendedores.length / LIDER_MIN_VENDEDORES) * 100))}%]`}
            />
          </div>
          <p className="mt-2 text-xs text-amber-700">
            Recrute {LIDER_MIN_VENDEDORES - vendedores.length} vendedor
            {LIDER_MIN_VENDEDORES - vendedores.length !== 1 ? 'es' : ''} ativos e ganhe{' '}
            <strong>{PCT_LIDER}% de toda a sua rede</strong> como comissão recorrente extra.
          </p>
        </div>
      )}

      {/* Link de afiliado */}
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
        <div className="mb-2 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-semibold text-orange-700">Seu link de indicação</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="text-foreground flex-1 truncate rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm">
            {affLink}
          </code>
          <button
            onClick={copyLink}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
          >
            {copied ? (
              <>
                <CheckCheck className="h-4 w-4" /> Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copiar
              </>
            )}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-orange-600">
            Este link serve para restaurantes <em>e</em> para recrutar novos vendedores.
          </p>
          <a
            href="/afiliados/ranking"
            target="_blank"
            className="flex items-center gap-1 text-xs font-medium text-orange-700 underline underline-offset-2 hover:text-orange-900"
          >
            <Trophy className="h-3.5 w-3.5" /> Ver ranking público
          </a>
        </div>
        {/* QR Code toggle */}
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => setShowQr(!showQr)}
            className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 transition-colors hover:bg-orange-100"
          >
            <QrCode className="h-3.5 w-3.5" />
            {showQr ? 'Ocultar QR Code' : 'Mostrar QR Code'}
          </button>
          {showQr && qrDataUrl && (
            <button
              onClick={downloadQr}
              className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 transition-colors hover:bg-orange-100"
            >
              <Download className="h-3.5 w-3.5" />
              Baixar QR
            </button>
          )}
        </div>
        {showQr && qrDataUrl && (
          <div className="mt-3 flex flex-col items-center gap-2">
            <Image
              src={qrDataUrl}
              alt="QR Code do link de afiliado"
              width={192}
              height={192}
              unoptimized
              className="h-48 w-48 rounded-lg border border-orange-200"
            />
            <p className="text-xs text-orange-600">Escaneie para acessar seu link de indicação</p>
          </div>
        )}
      </div>

      {/* Stats — 4 cards (TAREFA 6: comissão desagregada em análise / aprovada) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Restaurantes indicados" value={String(total)} />
        <StatCard
          icon={TrendingUp}
          label="MRR direto"
          value={`R$ ${(stats?.mrr_direto ?? 0).toFixed(2)}`}
          highlight
          sub={`${affiliate.commission_rate ?? 30}% — seus indicados ativos`}
        />
        {isLider ? (
          <StatCard
            icon={Network}
            label="MRR da rede (10%)"
            value={`R$ ${(stats?.mrr_rede ?? 0).toFixed(2)}`}
            highlight
            sub={`${stats?.rede_indicados ?? 0} restaurantes na rede`}
          />
        ) : (
          <StatCard
            icon={Clock}
            label="🕐 Em análise"
            value={`R$ ${(stats?.pendente_analise ?? 0).toFixed(2)}`}
            sub="Janela automática de 30 dias para aprovação"
          />
        )}
        {/* Card aprovado — customizado para exibir rendimento estimado */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-xs">✅ Aprovado</span>
            <BadgeCheck className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-800">
            R$ {(stats?.aprovado_aguardando ?? 0).toFixed(2)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {stats?.aprovado_aguardando && stats.aprovado_aguardando > 0
              ? `Pagamento em ${stats.proxima_data_pagamento ?? '—'}`
              : 'via PIX nos dias 1 e 15'}
          </p>
          {/* Badge saldo rendendo */}
          {(stats?.aprovado_aguardando ?? 0) > 0 && (
            <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2">
              <p className="text-xs font-medium text-emerald-800">
                💰 Seu saldo rende enquanto aguarda o pagamento
              </p>
              <p className="mt-0.5 text-xs text-emerald-600">Pago via PIX nos dias 1 e 15</p>
              {saldoInfo && saldoInfo.rendimento_estimado > 0 && (
                <div className="mt-1.5 flex items-center gap-1">
                  <p className="text-xs text-emerald-700">
                    ≈ R$ {saldoInfo.rendimento_estimado.toFixed(2)} de rendimento até{' '}
                    {saldoInfo.proxima_data_pagamento}
                  </p>
                  <span
                    title="Estimativa baseada em CDI 13% a.a. Valor informativo."
                    className="cursor-help"
                  >
                    <Info className="h-3 w-3 text-emerald-500" />
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card total recebido — separado para não misturar com pendentes */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs">Total já recebido</p>
            <p className="mt-1 text-2xl font-bold text-zinc-800">
              R$ {(stats?.comissao_paga ?? 0).toFixed(2)}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">Histórico acumulado via PIX</p>
          </div>
          <CircleDollarSign className="h-6 w-6 text-green-500" />
        </div>
      </div>

      {/* Bônus por volume */}
      <BonusMilestones total={total} />

      {/* Minha Rede — vendedores recrutados */}
      {(vendedores.length > 0 || isLider) && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Network className="h-4 w-4 text-amber-500" />
            <h2 className="text-foreground font-semibold">Minha Rede</h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              {vendedores.length} vendedor{vendedores.length !== 1 ? 'es' : ''}
            </span>
            {isLider && stats?.rede_indicados != null && stats.rede_indicados > 0 && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                {stats.rede_indicados} restaurantes na rede
              </span>
            )}
          </div>
          {vendedores.length === 0 ? (
            <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-700">
              Nenhum vendedor na rede ainda. Compartilhe seu link e recrute vendedores para ganhar{' '}
              <strong>{PCT_LIDER}% da rede deles</strong>.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50 text-xs text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Vendedor</th>
                    <th className="px-4 py-3 text-left">Código</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Desde</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {vendedores.map((v) => (
                    <tr key={v.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-800">{v.nome}</td>
                      <td className="px-4 py-3">
                        <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600">
                          {v.code}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            v.status === 'ativo'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {v.status === 'ativo' ? 'Ativo' : v.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-zinc-500">
                        {new Date(v.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Histórico de bônus */}
      {bonuses.length > 0 && (
        <div>
          <h2 className="text-foreground mb-3 font-semibold">Histórico de bônus</h2>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50 text-xs text-zinc-500">
                <tr>
                  <th className="px-4 py-3 text-left">Nível</th>
                  <th className="px-4 py-3 text-right">Bônus</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {bonuses.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 text-zinc-700">{b.nivel} restaurantes</td>
                    <td className="px-4 py-3 text-right font-semibold text-zinc-800">
                      R$ {Number(b.valor_bonus).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          b.status === 'pago'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {b.status === 'pago' ? (
                          <>
                            <CircleDollarSign className="h-3 w-3" /> Pago
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" /> Pendente
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Regra de pagamento */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
        <strong>Como funciona o pagamento:</strong> comissões entram em aprovação automática após 30
        dias do cadastro do restaurante e são pagas via PIX no próximo ciclo oficial, sempre nos
        dias 1 e 15.{' '}
        {!affiliate.chave_pix && (
          <span className="font-semibold text-blue-800">
            ⚠️ Cadastre sua chave PIX em Configurações para receber.
          </span>
        )}
      </div>

      {/* Histórico de indicações */}
      <div>
        <h2 className="text-foreground mb-3 font-semibold">Histórico de indicações</h2>
        {referrals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-400">
            Você ainda não tem indicações. Compartilhe seu link para começar a ganhar.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50 text-xs text-zinc-500">
                <tr>
                  <th className="px-4 py-3 text-left">Mês</th>
                  <th className="px-4 py-3 text-left">Plano</th>
                  <th className="px-4 py-3 text-right">Comissão</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {referrals.map((r) => {
                  const s = statusConfig[r.status] ?? defaultStatus
                  return (
                    <tr key={r.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 text-zinc-600">{r.referencia_mes ?? '—'}</td>
                      <td className="px-4 py-3 text-zinc-700 capitalize">{r.plano ?? '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-zinc-800">
                        {r.comissao != null ? `R$ ${Number(r.comissao).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}
                        >
                          <s.icon className="h-3 w-3" />
                          {s.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
