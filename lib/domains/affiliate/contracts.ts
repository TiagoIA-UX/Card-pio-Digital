// ═══════════════════════════════════════════════════════════════
// CONTRACTS: AFFILIATE — API pública do domínio de afiliados
// Status: DESATIVADO para MVP (retorna 410 Gone)
// ═══════════════════════════════════════════════════════════════

/** Tier de afiliado com regras de comissão */
export interface AffiliateTier {
  slug: string
  nome: string
  minRestaurantes: number
  maxRestaurantes: number
  bonusUnico: number
  comissaoExtra: number
}

/** Resultado de cálculo de data de payout */
export interface PayoutDateResult {
  nextDate: Date
  cutoffDate: Date
}

/** Contrato público do serviço de afiliados */
export interface IAffiliateService {
  getAffiliateApprovalDate(createdAt: Date): Date
  getNextAffiliatePayoutDate(now?: Date): Date
  getTiers(): readonly AffiliateTier[]
  getTierBySlug(slug: string): AffiliateTier | undefined
}

