'use client'

/**
 * HierarquiaWidget — exibe a progressão corporativa do afiliado.
 * Hierarquia: Trainee → Analista → Coordenador → Gerente → Diretor → Sócio
 */

import { CheckCircle2, Lock } from 'lucide-react'

export interface HierarquiaProps {
  /** Total de restaurantes ativos indicados pelo afiliado */
  totalRestaurantes: number
  /** Total de bônus já recebidos em reais */
  totalBonusRecebido: number
  /** Nome do nível atual (para exibir "Coordenador pendente" etc.) */
  nomePendente?: string
}

// ── Definição dos níveis ────────────────────────────────────────────────────

interface Nivel {
  nome: string
  minRest: number // restaurantes para entrar neste nível
  maxRest: number // limite superior (exclusive), Infinity para o topo
  bonus: number // bônus único ao atingir o mínimo (R$)
  extraComissao?: string // ex: "+2% comissão"
}

const NIVEIS: Nivel[] = [
  { nome: 'Trainee', minRest: 0, maxRest: 3, bonus: 0 },
  { nome: 'Analista', minRest: 3, maxRest: 10, bonus: 50 },
  { nome: 'Coordenador', minRest: 10, maxRest: 25, bonus: 150 },
  { nome: 'Gerente', minRest: 25, maxRest: 50, bonus: 300 },
  { nome: 'Diretor', minRest: 50, maxRest: 100, bonus: 600, extraComissao: '+2% comissão' },
  { nome: 'Sócio', minRest: 100, maxRest: Infinity, bonus: 1500, extraComissao: '+5% comissão' },
]

// ── Helpers ─────────────────────────────────────────────────────────────────

function getNivelIndex(restaurantes: number): number {
  for (let i = NIVEIS.length - 1; i >= 0; i--) {
    if (restaurantes >= NIVEIS[i].minRest) return i
  }
  return 0
}

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

// ── Componente principal ────────────────────────────────────────────────────

export function HierarquiaWidget({
  totalRestaurantes,
  totalBonusRecebido,
  nomePendente,
}: HierarquiaProps) {
  const atualIdx = getNivelIndex(totalRestaurantes)
  const proximo = NIVEIS[atualIdx + 1] ?? null

  const faltamParaProximo = proximo ? proximo.minRest - totalRestaurantes : 0

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 text-zinc-100">
      {/* Título */}
      <div className="border-b border-zinc-700 px-5 py-3">
        <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
          Hierarquia Corporativa · Rede de Afiliados
        </p>
      </div>

      {/* Lista de níveis */}
      <div className="divide-y divide-zinc-800">
        {NIVEIS.map((nivel, idx) => {
          const concluido = totalRestaurantes >= nivel.maxRest
          const atual = idx === atualIdx
          const bloqueado = idx > atualIdx

          // Progresso dentro deste nível
          const alcancado = Math.max(0, totalRestaurantes - nivel.minRest)
          const range =
            nivel.maxRest === Infinity ? Math.max(alcancado, 1) : nivel.maxRest - nivel.minRest
          const pct =
            nivel.maxRest === Infinity ? 100 : Math.min(100, Math.round((alcancado / range) * 100))

          const label =
            nivel.maxRest === Infinity
              ? `${nivel.minRest}+ restaurantes`
              : `${nivel.minRest} – ${nivel.maxRest - 1} restaurantes`

          const faltam = bloqueado ? nivel.minRest - totalRestaurantes : null

          return (
            <div
              key={nivel.nome}
              className={`px-5 py-4 transition-colors ${
                atual
                  ? 'border-l-2 border-orange-500 bg-zinc-800/60'
                  : bloqueado
                    ? 'opacity-60'
                    : ''
              }`}
            >
              <div className="flex flex-wrap items-start gap-3">
                {/* Nome + faixa */}
                <div className="min-w-[140px] flex-1">
                  <p
                    className={`text-base font-bold ${atual ? 'text-orange-400' : bloqueado ? 'text-zinc-500' : 'text-zinc-100'}`}
                  >
                    {nivel.nome}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">{label}</p>

                  {/* Badges */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {nivel.bonus > 0 && (
                      <span className="rounded-full border border-zinc-600 px-2 py-0.5 text-[11px] text-zinc-300">
                        Bônus {fmtBRL(nivel.bonus)}
                      </span>
                    )}
                    {nivel.extraComissao && (
                      <span className="rounded-full border border-zinc-600 px-2 py-0.5 text-[11px] text-zinc-300">
                        {nivel.extraComissao}
                      </span>
                    )}
                    {concluido && (
                      <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">
                        concluído
                      </span>
                    )}
                    {atual && (
                      <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[11px] text-orange-300">
                        você está aqui
                      </span>
                    )}
                  </div>
                </div>

                {/* Barra de progresso + status */}
                <div className="flex min-w-[180px] flex-1 items-center gap-3">
                  {!bloqueado ? (
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
                        <span>
                          {nivel.maxRest === Infinity
                            ? `${totalRestaurantes} / ${nivel.minRest}`
                            : `${Math.min(totalRestaurantes, nivel.maxRest)} / ${nivel.maxRest}`}
                          {' restaurantes'}
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-700">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            concluido ? 'bg-teal-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between text-xs text-zinc-600">
                        <span>
                          {totalRestaurantes} / {nivel.minRest}
                        </span>
                        <span>–</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-800" />
                    </div>
                  )}

                  {/* Botão de status */}
                  <div className="shrink-0">
                    {concluido ? (
                      <span className="flex items-center gap-1 rounded-lg bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        feito
                      </span>
                    ) : atual ? (
                      <span className="rounded-lg border border-orange-500 px-3 py-1 text-xs font-bold text-orange-400">
                        atual
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-500">
                        <Lock className="h-3 w-3" />
                        bloqueado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Faltam X para desbloquear */}
              {bloqueado && faltam !== null && (
                <p className="mt-2 text-xs text-zinc-600">
                  faltam {faltam} restaurante{faltam !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Rodapé — resumo */}
      <div className="grid grid-cols-2 divide-x divide-zinc-700 border-t border-zinc-700">
        <div className="px-5 py-4">
          <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
            Próxima promoção
          </p>
          {proximo ? (
            <>
              <p className="mt-1 text-2xl font-black text-zinc-100">
                {faltamParaProximo} <span className="text-sm font-normal text-zinc-400">rest.</span>
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                para {proximo.nome} · bônus {fmtBRL(proximo.bonus)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm font-semibold text-teal-400">Nível máximo atingido! 🏆</p>
          )}
        </div>
        <div className="px-5 py-4">
          <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
            Bônus já recebidos
          </p>
          <p className="mt-1 text-2xl font-black text-zinc-100">{fmtBRL(totalBonusRecebido)}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {nomePendente ?? `${NIVEIS[atualIdx].nome} ativo`}
          </p>
        </div>
      </div>
    </div>
  )
}
