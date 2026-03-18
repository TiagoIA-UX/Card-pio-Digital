/**
 * /afiliados/mapa — Mapa de afiliados por cidade/estado.
 * Mostra presença geográfica da rede Cardápio Digital.
 * Ferramenta de prova social + recrutamento territorial.
 */
import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Users, Store, TrendingUp, ArrowRight, Globe } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = {
  title: 'Mapa de Afiliados · Cardápio Digital',
  description:
    'Veja onde estão os afiliados do Cardápio Digital e descubra se sua cidade ainda está disponível.',
  openGraph: {
    title: 'Mapa de Afiliados · Cardápio Digital',
    description: 'Rede de afiliados em todo o Brasil. Sua cidade pode ser a próxima.',
  },
}

export const revalidate = 300 // 5 minutos

// ── Tipos ──────────────────────────────────────────────────────────────────

interface CityData {
  estado: string
  cidade: string
  total_afiliados: number
  total_restaurantes: number
}

interface StateGroup {
  estado: string
  uf: string
  total_afiliados: number
  total_restaurantes: number
  cidades: CityData[]
}

// ── Mapeamento UF → Nome ───────────────────────────────────────────────────

const ESTADOS: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
}

// Inverte mapa: nome → UF
const NOME_TO_UF: Record<string, string> = Object.fromEntries(
  Object.entries(ESTADOS).map(([uf, nome]) => [nome.toLowerCase(), uf])
)

function resolveUF(estado: string): string {
  if (!estado || estado === 'Não informado') return '??'
  if (estado.length === 2) return estado.toUpperCase()
  return NOME_TO_UF[estado.toLowerCase()] ?? estado.substring(0, 2).toUpperCase()
}

// ── Busca de dados ─────────────────────────────────────────────────────────

async function getMapData(): Promise<StateGroup[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('affiliate_city_map')
    .select('estado, cidade, total_afiliados, total_restaurantes')

  if (!data || data.length === 0) return []

  // Agrupa por estado
  const map = new Map<string, StateGroup>()

  for (const row of data as CityData[]) {
    const uf = resolveUF(row.estado)
    const label = ESTADOS[uf] ?? row.estado

    if (!map.has(uf)) {
      map.set(uf, {
        estado: label,
        uf,
        total_afiliados: 0,
        total_restaurantes: 0,
        cidades: [],
      })
    }
    const g = map.get(uf)!
    g.total_afiliados += Number(row.total_afiliados)
    g.total_restaurantes += Number(row.total_restaurantes)
    if (row.cidade && row.cidade !== 'Não informado') {
      g.cidades.push({
        ...row,
        total_afiliados: Number(row.total_afiliados),
        total_restaurantes: Number(row.total_restaurantes),
      })
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => b.total_restaurantes - a.total_restaurantes || b.total_afiliados - a.total_afiliados
  )
}

async function getTotals() {
  const admin = createAdminClient()
  const [{ count: totalAfiliados }, { count: totalRestaurantes }] = await Promise.all([
    admin.from('affiliates').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
    admin
      .from('affiliate_referrals')
      .select('id', { count: 'exact', head: true })
      .in('status', ['aprovado', 'pago']),
  ])
  return { totalAfiliados: totalAfiliados ?? 0, totalRestaurantes: totalRestaurantes ?? 0 }
}

// ── Componente de tier de cobertura ───────────────────────────────────────

function CoverageBadge({ total }: { total: number }) {
  if (total === 0) {
    return (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
        Disponível
      </span>
    )
  }
  if (total <= 2) {
    return (
      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
        Pouca cobertura
      </span>
    )
  }
  return (
    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
      Ativa
    </span>
  )
}

// ── Página ─────────────────────────────────────────────────────────────────

export default async function MapaAfiliadosPage() {
  const [states, totals] = await Promise.all([getMapData(), getTotals()])

  const totalEstados = states.length
  const estadosDisponiveis = 27 - totalEstados

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Hero */}
      <section className="border-b border-zinc-100 bg-white px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
            <Globe className="h-7 w-7 text-orange-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 sm:text-4xl">
            Nossa rede no Brasil
          </h1>
          <p className="mt-3 text-lg text-zinc-500">
            Afiliados ativos em {totalEstados} estado{totalEstados !== 1 ? 's' : ''}. Ainda há{' '}
            {estadosDisponiveis} estado{estadosDisponiveis !== 1 ? 's' : ''} disponíveis.
          </p>

          {/* Totais */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-2xl font-extrabold text-orange-600">{totals.totalAfiliados}</p>
              <p className="mt-0.5 text-xs text-zinc-500">Afiliados ativos</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-2xl font-extrabold text-orange-600">{totals.totalRestaurantes}</p>
              <p className="mt-0.5 text-xs text-zinc-500">Restaurantes indicados</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-2xl font-extrabold text-orange-600">{totalEstados}</p>
              <p className="mt-0.5 text-xs text-zinc-500">Estados cobertos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mapa em lista por estado */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        {states.length === 0 ? (
          // Estado vazio — nenhum afiliado com cidade cadastrada
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-16 text-center">
            <MapPin className="mx-auto mb-4 h-10 w-10 text-zinc-500" />
            <h2 className="text-xl font-semibold text-zinc-700">Nenhuma cidade cadastrada ainda</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Afiliados podem adicionar sua cidade no painel para aparecer aqui.
            </p>
            <Link
              href="/afiliados"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Seja o primeiro na sua cidade
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {states.map((s) => (
              <div
                key={s.uf}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
              >
                {/* Cabeçalho do estado */}
                <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-extrabold text-orange-700">
                      {s.uf}
                    </span>
                    <div>
                      <p className="font-semibold text-zinc-800">{s.estado}</p>
                      <p className="text-xs text-zinc-500">
                        {s.total_afiliados} afiliado{s.total_afiliados !== 1 ? 's' : ''} ·{' '}
                        {s.total_restaurantes} restaurante{s.total_restaurantes !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CoverageBadge total={s.total_afiliados} />
                  </div>
                </div>

                {/* Cidades */}
                {s.cidades.length > 0 && (
                  <div className="divide-y divide-zinc-50">
                    {s.cidades.map((c) => (
                      <div key={c.cidade} className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                          <span className="text-zinc-700">{c.cidade}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {c.total_afiliados}
                          </span>
                          <span className="flex items-center gap-1">
                            <Store className="h-3 w-3" />
                            {c.total_restaurantes}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA — atração de novos afiliados */}
        <div className="mt-12 rounded-2xl border border-orange-200 bg-orange-50 p-8 text-center">
          <TrendingUp className="mx-auto mb-3 h-8 w-8 text-orange-500" />
          <p className="text-xl font-bold text-orange-900">Sua cidade não está no mapa?</p>
          <p className="mt-2 text-sm text-orange-700">
            Seja o afiliado pioneiro na sua região e lucre 30% recorrente por restaurante indicado.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/afiliados"
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
            >
              Quero ser afiliado
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/afiliados/ranking"
              className="inline-flex items-center gap-2 rounded-lg border border-orange-300 bg-white px-6 py-3 text-sm font-semibold text-orange-700 hover:bg-orange-50"
            >
              Ver ranking
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
