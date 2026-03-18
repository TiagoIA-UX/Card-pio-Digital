/**
 * /afiliados/ranking — Página pública de ranking gamificado.
 * Exibe pódio (top 3) + tabela dos demais com XP, níveis e emblemas.
 * Nomes são anonimizados na view do banco: "João S."
 */
import { Metadata } from 'next'
import Link from 'next/link'
import { Trophy, Star, Users, TrendingUp, ArrowRight, Zap, MapPin, Shield } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import stylesModule from './ranking.module.css'

export const metadata: Metadata = {
  title: 'Ranking de Afiliados · Cardápio Digital',
  description:
    'Veja os afiliados que mais indicam restaurantes e inspire-se a crescer junto com a gente.',
}

// Revalida a cada 2 minutos
export const revalidate = 120

interface RankingItem {
  posicao: number
  nome: string
  avatar_url: string | null
  cidade: string | null
  estado: string | null
  is_lider: boolean
  total_indicados: number
  rede_indicados: number
  mrr_direto: number
  mrr_rede: number
  mrr_estimado: number
}

// ── Sistema de XP/Níveis ───────────────────────────────────────────────────
// 1 restaurante = 120 XP (= R$39/mês × ~3 = valor vitalício aproximado)

const XP_POR_RESTAURANTE = 120
const XP_REDE = 40

const XP_LEVELS = [
  { nivel: 1, nome: 'Iniciante', min: 0, max: 599, cor: 'zinc', icon: '🌱' },
  { nivel: 2, nome: 'Vendedor', min: 600, max: 1799, cor: 'blue', icon: '⚡' },
  { nivel: 3, nome: 'Especialista', min: 1800, max: 3599, cor: 'violet', icon: '🔥' },
  { nivel: 4, nome: 'Master', min: 3600, max: 7199, cor: 'amber', icon: '👑' },
  { nivel: 5, nome: 'Líder Zairyx', min: 7200, max: Infinity, cor: 'orange', icon: '🏆' },
]

function calcXP(item: RankingItem): number {
  return item.total_indicados * XP_POR_RESTAURANTE + item.rede_indicados * XP_REDE
}

function getLevel(xp: number) {
  return XP_LEVELS.findLast((l) => xp >= l.min) ?? XP_LEVELS[0]
}

function xpProgressPct(xp: number, level: (typeof XP_LEVELS)[0]): number {
  if (level.max === Infinity) return 100
  const range = level.max - level.min + 1
  const gained = xp - level.min
  return Math.min(100, Math.round((gained / range) * 100))
}

async function getRanking(): Promise<RankingItem[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('affiliate_ranking')
    .select(
      'posicao, nome_publico, avatar_url, cidade, estado, is_lider, total_indicados, rede_indicados, mrr_direto, mrr_rede, mrr_estimado'
    )
    .order('posicao', { ascending: true })
    .limit(50)

  return (data ?? []).map((r) => ({
    posicao: Number(r.posicao),
    nome: r.nome_publico as string,
    avatar_url: (r.avatar_url as string | null) ?? null,
    cidade: (r.cidade as string | null) ?? null,
    estado: (r.estado as string | null) ?? null,
    is_lider: Boolean(r.is_lider),
    total_indicados: Number(r.total_indicados),
    rede_indicados: Number(r.rede_indicados),
    mrr_direto: Number(r.mrr_direto),
    mrr_rede: Number(r.mrr_rede),
    mrr_estimado: Number(r.mrr_estimado),
  }))
}

// ── Cores por nível ───────────────────────────────────────────────────────

const levelStyles: Record<string, { bar: string; text: string; bg: string; border: string }> = {
  zinc: { bar: 'bg-zinc-400', text: 'text-zinc-600', bg: 'bg-zinc-50', border: 'border-zinc-200' },
  blue: { bar: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  violet: {
    bar: 'bg-violet-500',
    text: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
  amber: {
    bar: 'bg-amber-500',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  orange: {
    bar: 'bg-orange-500',
    text: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
}

// ── Avatar genérico ───────────────────────────────────────────────────────

function Avatar({
  url,
  nome,
  size = 'md',
}: {
  url: string | null
  nome: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const dim =
    size === 'lg' ? 'h-14 w-14 text-lg' : size === 'md' ? 'h-10 w-10 text-sm' : 'h-7 w-7 text-xs'
  const initials = nome
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img src={url} alt={nome} className={`${dim} rounded-full object-cover ring-2 ring-white`} />
    )
  }
  return (
    <div
      className={`${dim} flex items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700 ring-2 ring-white`}
    >
      {initials}
    </div>
  )
}

// ── Barra de XP ───────────────────────────────────────────────────────────

function XPBar({ item }: { item: RankingItem }) {
  const xp = calcXP(item)
  const level = getLevel(xp)
  const pct = xpProgressPct(xp, level)
  const styles = levelStyles[level.cor]
  const nextLevel = XP_LEVELS[level.nivel] // nível+1 (ou undefined no topo)

  return (
    <div className="mt-2 w-full">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className={`font-semibold ${styles.text}`}>
          {level.icon} {level.nome}
        </span>
        <span className="text-zinc-500">
          {xp.toLocaleString('pt-BR')} XP
          {nextLevel && ` / ${nextLevel.min.toLocaleString('pt-BR')}`}
        </span>
      </div>
      <progress
        className={`${stylesModule.progress} ${styles.bar}`}
        value={pct}
        max={100}
        aria-label={`Progresso de XP de ${item.nome}`}
      />
    </div>
  )
}

const podiumColors = [
  { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', size: 'text-5xl' },
  { bg: 'bg-zinc-50', border: 'border-zinc-300', text: 'text-zinc-600', size: 'text-4xl' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', size: 'text-3xl' },
]

const tierLabel = {
  lider: { label: 'Líder Zairyx', className: 'bg-amber-100 text-amber-800' },
  vendedor: { label: 'Vendedor', className: 'bg-zinc-100 text-zinc-600' },
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

export default async function RankingPage() {
  const ranking = await getRanking()
  const top3 = ranking.slice(0, 3)
  const rest = ranking.slice(3)

  // Totais globais para contextualizar
  const totalRestaurantes = ranking.reduce((s, r) => s + r.total_indicados + r.rede_indicados, 0)
  const totalMRR = ranking.reduce((s, r) => s + r.mrr_estimado, 0)

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      {/* Cabeçalho */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100">
          <Trophy className="h-7 w-7 text-yellow-600" />
        </div>
        <h1 className="text-3xl font-bold text-zinc-900">Ranking de Afiliados</h1>
        <p className="mt-2 text-zinc-500">
          Os parceiros que mais indicam restaurantes para o Cardápio Digital.
        </p>
      </div>

      {/* Totais da rede */}
      {ranking.length > 0 && (
        <div className="mb-10 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-extrabold text-orange-600">{totalRestaurantes}</p>
            <p className="text-xs text-zinc-500">restaurantes na rede</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-extrabold text-orange-600">{fmt(totalMRR)}</p>
            <p className="text-xs text-zinc-500">MRR estimado da rede</p>
          </div>
        </div>
      )}

      {/* Pódio top 3 */}
      {top3.length > 0 && (
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {top3.map((r, i) => {
            const c = podiumColors[i]
            const xp = calcXP(r)
            const level = getLevel(xp)
            const styles = levelStyles[level.cor]
            return (
              <div
                key={r.posicao}
                className={`relative flex flex-col items-center rounded-2xl border-2 p-5 text-center shadow-sm ${c.bg} ${c.border}`}
              >
                <span className={`mb-2 ${c.size}`}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                <Avatar url={r.avatar_url} nome={r.nome} size="md" />
                <p className="mt-2 font-bold text-zinc-800">{r.nome}</p>
                {(r.cidade || r.estado) && (
                  <p className="flex items-center gap-1 text-xs text-zinc-500">
                    <MapPin className="h-3 w-3" />
                    {[r.cidade, r.estado].filter(Boolean).join(', ')}
                  </p>
                )}
                {/* Badge tier */}
                <span
                  className={`mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.is_lider ? tierLabel.lider.className : tierLabel.vendedor.className
                  }`}
                >
                  {r.is_lider ? tierLabel.lider.label : tierLabel.vendedor.label}
                </span>
                {/* Nível */}
                <span
                  className={`mt-1 rounded-full px-2 py-0.5 text-xs font-semibold ${styles.bg} ${styles.text}`}
                >
                  {level.icon} {level.nome}
                </span>
                <div className="mt-3 space-y-0.5">
                  <p className={`text-2xl font-extrabold ${c.text}`}>{r.total_indicados}</p>
                  <p className="text-xs text-zinc-500">restaurantes</p>
                  {r.is_lider && r.rede_indicados > 0 && (
                    <p className="text-xs text-zinc-500">+ {r.rede_indicados} na rede</p>
                  )}
                </div>
                <p className="mt-2 text-sm font-semibold text-zinc-600">
                  {fmt(r.mrr_estimado)}
                  <span className="text-xs font-normal">/mês</span>
                </p>
                {/* Barra XP no pódio */}
                <div className="mt-3 w-full">
                  <XPBar item={r} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabela restante */}
      {rest.length > 0 && (
        <div className="mb-10 space-y-3">
          {rest.map((r) => {
            const xp = calcXP(r)
            const level = getLevel(xp)
            const styles = levelStyles[level.cor]
            return (
              <div
                key={r.posicao}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {/* Posição */}
                  <span className="w-6 text-center text-xs font-bold text-zinc-500">
                    {r.posicao}
                  </span>
                  {/* Avatar */}
                  <Avatar url={r.avatar_url} nome={r.nome} size="sm" />
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-zinc-800">{r.nome}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.is_lider ? tierLabel.lider.className : tierLabel.vendedor.className
                        }`}
                      >
                        {r.is_lider ? tierLabel.lider.label : tierLabel.vendedor.label}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${styles.bg} ${styles.text}`}
                      >
                        {level.icon} {level.nome}
                      </span>
                    </div>
                    {(r.cidade || r.estado) && (
                      <p className="flex items-center gap-1 text-xs text-zinc-500">
                        <MapPin className="h-3 w-3" />
                        {[r.cidade, r.estado].filter(Boolean).join(', ')}
                      </p>
                    )}
                    <XPBar item={r} />
                  </div>
                  {/* Métricas */}
                  <div className="text-right">
                    <p className="text-sm font-semibold text-zinc-700">
                      {r.total_indicados}
                      {r.is_lider && r.rede_indicados > 0 && (
                        <span className="text-xs font-normal text-zinc-500">
                          {' '}
                          +{r.rede_indicados}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-500">rest.</p>
                    <p className="text-xs font-semibold text-zinc-600">{fmt(r.mrr_estimado)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {ranking.length === 0 && (
        <div className="mb-10 rounded-2xl border border-dashed border-zinc-200 p-12 text-center text-zinc-500">
          Ainda não há afiliados no ranking. Seja o primeiro!
        </div>
      )}

      {/* Legenda de níveis */}
      <div className="mb-10 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
            <Zap className="h-4 w-4 text-orange-500" />
            Sistema de níveis XP
          </p>
        </div>
        <div className="divide-y divide-zinc-50">
          {XP_LEVELS.map((l) => {
            const s = levelStyles[l.cor]
            return (
              <div key={l.nivel} className="flex items-center justify-between px-5 py-2.5 text-sm">
                <span className={`font-medium ${s.text}`}>
                  {l.icon} {l.nome}
                </span>
                <span className="text-xs text-zinc-500">
                  {l.max === Infinity
                    ? `≥ ${l.min.toLocaleString('pt-BR')} XP`
                    : `${l.min.toLocaleString('pt-BR')} – ${l.max.toLocaleString('pt-BR')} XP`}
                </span>
              </div>
            )
          })}
        </div>
        <div className="border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500">
          1 restaurante indicado = {XP_POR_RESTAURANTE} XP · 1 restaurante na rede = {XP_REDE} XP
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-8 text-center">
        <p className="mb-1 text-lg font-bold text-orange-800">Quer aparecer aqui?</p>
        <p className="mb-6 text-sm text-orange-700">
          Cadastre-se no programa de afiliados, compartilhe seu link e ganhe{' '}
          <strong>30% de comissão direta</strong> sobre a carteira elegível registrada no programa.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/painel/afiliados"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
          >
            Quero ser afiliado <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/afiliados/mapa"
            className="inline-flex items-center gap-2 rounded-xl border border-orange-300 bg-white px-6 py-3 font-semibold text-orange-700 hover:bg-orange-50"
          >
            <MapPin className="h-4 w-4" />
            Ver mapa de afiliados
          </Link>
        </div>
      </div>

      {/* Footer disclaimer */}
      <p className="mt-8 text-center text-xs text-zinc-500">
        Nomes exibidos são parcialmente anonimizados para preservar privacidade. Dados atualizados a
        cada 2 minutos.
      </p>
    </main>
  )
}
