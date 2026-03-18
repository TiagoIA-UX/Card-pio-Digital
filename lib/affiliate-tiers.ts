/**
 * FONTE DA VERDADE — Hierarquia e bônus do programa de afiliados.
 *
 * ⚠️  NÃO edite valores de tier, bônus ou comissão em outros lugares.
 *     Toda a lógica de negócio (migrations SQL, APIs, UI) importa daqui.
 *
 * Hierarquia: Trainee → Analista → Coordenador → Gerente → Diretor → Sócio
 */

export interface AffiliateTier {
  /** Slug único (usado no banco e nas APIs) */
  slug: string
  /** Nome exibido ao usuário */
  nome: string
  /** Mínimo de restaurantes ativos para atingir este nível */
  minRestaurantes: number
  /** Limite superior (exclusive). Infinity para o topo. */
  maxRestaurantes: number
  /** Bônus único pago ao atingir o mínimo (R$). 0 = sem bônus. */
  bonusUnico: number
  /**
   * Percentual extra de comissão direta somado aos 30% base.
   * Ex: 0.02 = +2% → vendedor recebe 32% no total.
   * 0 = sem acréscimo.
   */
  comissaoExtra: number
}

// ── Bônus simbólicos — validados pela análise financeira (docs/financeiro.md) ──
// Margem da empresa por restaurante c/ afiliado: ~59% da receita bruta (R$35-39/mês).
// Escala: R$10 (10 rest) · R$25 (25 rest) · R$50 (50 rest) · R$100 (100 rest).
// Total acumulado 0→100: R$185. Antes da revisão eram R$2.600 — comprometia a margem.
export const AFFILIATE_TIERS: AffiliateTier[] = [
  {
    slug: 'trainee',
    nome: 'Trainee',
    minRestaurantes: 0,
    maxRestaurantes: 3,
    bonusUnico: 0,
    comissaoExtra: 0,
  },
  {
    slug: 'analista',
    nome: 'Analista',
    minRestaurantes: 3,
    maxRestaurantes: 10,
    bonusUnico: 0, // Primeiro marco real é no Coordenador (10 rest)
    comissaoExtra: 0,
  },
  {
    slug: 'coordenador',
    nome: 'Coordenador',
    minRestaurantes: 10,
    maxRestaurantes: 25,
    bonusUnico: 10, // R$10 simbólico — recouped em <1 dia de receita
    comissaoExtra: 0,
  },
  {
    slug: 'gerente',
    nome: 'Gerente',
    minRestaurantes: 25,
    maxRestaurantes: 50,
    bonusUnico: 25, // R$25 simbólico — recouped em ~1 dia de receita
    comissaoExtra: 0,
  },
  {
    slug: 'diretor',
    nome: 'Diretor',
    minRestaurantes: 50,
    maxRestaurantes: 100,
    bonusUnico: 50, // R$50 máximo por ciclo — empresa ganha R$1.900+/mês deste afiliado
    comissaoExtra: 0.02, // +2% → total 32% direto
  },
  {
    slug: 'socio',
    nome: 'Sócio',
    minRestaurantes: 100,
    maxRestaurantes: Infinity,
    bonusUnico: 100, // R$100 — empresa fatura R$3.900+/mês com 100 rest
    comissaoExtra: 0.05, // +5% → total 35% direto
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────

/** Retorna o tier atual com base no número de restaurantes ativos. */
export function getTierByRestaurantes(total: number): AffiliateTier {
  for (let i = AFFILIATE_TIERS.length - 1; i >= 0; i--) {
    if (total >= AFFILIATE_TIERS[i].minRestaurantes) return AFFILIATE_TIERS[i]
  }
  return AFFILIATE_TIERS[0]
}

/** Retorna o próximo tier (ou null se já for Sócio). */
export function getNextTier(current: AffiliateTier): AffiliateTier | null {
  const idx = AFFILIATE_TIERS.findIndex((t) => t.slug === current.slug)
  return AFFILIATE_TIERS[idx + 1] ?? null
}

/** Percentual total de comissão direta (base 30% + extra do nível). */
export function getComissaoDireta(tier: AffiliateTier): number {
  return 0.3 + tier.comissaoExtra
}

/** Total de bônus acumulados até determinado nível (inclusivo). */
export function getTotalBonusAcumulado(slugAtual: string): number {
  const idx = AFFILIATE_TIERS.findIndex((t) => t.slug === slugAtual)
  return AFFILIATE_TIERS.slice(0, idx + 1).reduce((s, t) => s + t.bonusUnico, 0)
}
