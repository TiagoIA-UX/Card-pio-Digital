/**
 * /afiliados/ranking — Página pública de ranking de afiliados.
 * Exibe podium (top 3) + tabela dos demais.
 * Nomes são anonimizados na view do banco: "João S."
 */
import { Metadata } from 'next'
import Link from 'next/link'
import { Trophy, Star, Users, TrendingUp, ArrowRight } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'

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
  is_lider: boolean
  total_indicados: number
  rede_indicados: number
  mrr_direto: number
  mrr_rede: number
  mrr_estimado: number
}

async function getRanking(): Promise<RankingItem[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('affiliate_ranking')
    .select(
      'posicao, nome_publico, is_lider, total_indicados, rede_indicados, mrr_direto, mrr_rede, mrr_estimado'
    )
    .order('posicao', { ascending: true })
    .limit(50)

  return (data ?? []).map((r) => ({
    posicao: Number(r.posicao),
    nome: r.nome_publico as string,
    is_lider: Boolean(r.is_lider),
    total_indicados: Number(r.total_indicados),
    rede_indicados: Number(r.rede_indicados),
    mrr_direto: Number(r.mrr_direto),
    mrr_rede: Number(r.mrr_rede),
    mrr_estimado: Number(r.mrr_estimado),
  }))
}

const podiumColors = [
  {
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    text: 'text-yellow-700',
    trophy: 'text-yellow-500',
    size: 'text-5xl',
  },
  {
    bg: 'bg-zinc-50',
    border: 'border-zinc-300',
    text: 'text-zinc-600',
    trophy: 'text-zinc-400',
    size: 'text-4xl',
  },
  {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    trophy: 'text-orange-400',
    size: 'text-3xl',
  },
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

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      {/* Cabeçalho */}
      <div className="mb-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100">
          <Trophy className="h-7 w-7 text-yellow-600" />
        </div>
        <h1 className="text-3xl font-bold text-zinc-900">Ranking de Afiliados</h1>
        <p className="mt-2 text-zinc-500">
          Os parceiros que mais indicam restaurantes para o Cardápio Digital.
        </p>
      </div>

      {/* Podium */}
      {top3.length > 0 && (
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {top3.map((r, i) => {
            const c = podiumColors[i]
            return (
              <div
                key={r.posicao}
                className={`relative flex flex-col items-center rounded-2xl border-2 p-5 text-center shadow-sm ${c.bg} ${c.border}`}
              >
                <span className={`mb-2 ${c.size}`}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                <p className="font-bold text-zinc-800">{r.nome}</p>
                {/* Badge tier no pódium */}
                <span
                  className={`mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.is_lider ? tierLabel.lider.className : tierLabel.vendedor.className
                  }`}
                >
                  {r.is_lider ? tierLabel.lider.label : tierLabel.vendedor.label}
                </span>
                <div className="mt-3 space-y-0.5">
                  <p className={`text-2xl font-extrabold ${c.text}`}>{r.total_indicados}</p>
                  <p className="text-xs text-zinc-500">restaurantes</p>{' '}
                  {r.is_lider && r.rede_indicados > 0 && (
                    <p className="text-xs text-zinc-400">+ {r.rede_indicados} na rede</p>
                  )}{' '}
                </div>
                <p className="mt-2 text-sm font-semibold text-zinc-600">
                  {fmt(r.mrr_estimado)}
                  <span className="text-xs font-normal">/mês</span>
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabela restante */}
      {rest.length > 0 && (
        <div className="mb-10 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50 text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-3 text-center">#</th>
                <th className="px-4 py-3 text-left">Afiliado</th>
                <th className="px-4 py-3 text-center">
                  <Users className="inline h-3.5 w-3.5" /> Restaurantes
                </th>
                <th className="px-4 py-3 text-right">
                  <TrendingUp className="inline h-3.5 w-3.5" /> MRR est.
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {rest.map((r) => (
                <tr key={r.posicao} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 text-center text-xs font-bold text-zinc-500">
                    {r.posicao}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-zinc-800">{r.nome}</span>
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.is_lider ? tierLabel.lider.className : tierLabel.vendedor.className
                      }`}
                    >
                      {r.is_lider ? tierLabel.lider.label : tierLabel.vendedor.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div>
                      <span className="font-semibold text-zinc-700">{r.total_indicados}</span>
                      {r.is_lider && r.rede_indicados > 0 && (
                        <span className="ml-1 text-xs text-zinc-400">+{r.rede_indicados} rede</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-zinc-600">
                    {fmt(r.mrr_estimado)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ranking.length === 0 && (
        <div className="mb-10 rounded-2xl border border-dashed border-zinc-200 p-12 text-center text-zinc-400">
          Ainda não há afiliados no ranking. Seja o primeiro!
        </div>
      )}

      {/* CTA */}
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-8 text-center">
        <p className="mb-1 text-lg font-bold text-orange-800">Quer aparecer aqui?</p>
        <p className="mb-6 text-sm text-orange-700">
          Cadastre-se no programa de afiliados, compartilhe seu link e ganhe{' '}
          <strong>30% de comissão recorrente</strong> por cada restaurante ativo.
        </p>
        <Link
          href="/painel/afiliados"
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
        >
          Quero ser afiliado <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Footer disclaimer */}
      <p className="mt-8 text-center text-xs text-zinc-400">
        Nomes exibidos são parcialmente anonimizados para preservar privacidade. Dados atualizados a
        cada 2 minutos.
      </p>
    </main>
  )
}
