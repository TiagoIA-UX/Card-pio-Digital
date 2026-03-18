/**
 * lib/get-affiliate-tier.ts
 * Utilitário de acesso rápido ao sistema de tiers.
 * Wrapper sobre lib/affiliate-tiers.ts (fonte de verdade).
 */
import {
  AffiliateTier,
  AFFILIATE_TIERS,
  getTierByRestaurantes,
  getComissaoDireta,
  getNextTier,
} from '@/lib/affiliate-tiers'

export type { AffiliateTier }

/**
 * Retorna o tier atual com base no total de restaurantes indicados.
 * Alias semântico de getTierByRestaurantes().
 */
export function getTierForReferrals(count: number): AffiliateTier {
  return getTierByRestaurantes(count)
}

/**
 * Retorna o percentual de comissão direta como número inteiro (ex: 30, 32, 35).
 * Alias semântico de getComissaoDireta(), que retorna fração (0.30, 0.32, 0.35).
 */
export function getCommissionRate(tier: AffiliateTier): number {
  return Math.round(getComissaoDireta(tier) * 100)
}

export { AFFILIATE_TIERS, getNextTier, getComissaoDireta }
