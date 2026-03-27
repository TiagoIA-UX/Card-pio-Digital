/**
 * Network Expansion — Pricing, validation & helpers
 *
 * Gerencia preços para expansão de rede (matriz + filiais),
 * descontos por volume e validação de emails de filiais.
 */

// ── Pricing ────────────────────────────────────────────────────────────────

export interface NetworkPricing {
  /** Preço unitário por filial (PIX) */
  pixPrice: number
  /** Preço unitário por filial (Cartão) */
  cardPrice: number
  /** Mensalidade por filial */
  monthlyPrice: number
  /** Desconto aplicado (0-1) */
  discountRate: number
  /** Total à vista (PIX) */
  totalPix: number
  /** Total à vista (Cartão) */
  totalCard: number
  /** Total mensal */
  totalMonthly: number
}

const BASE_PIX_PRICE = 147
const BASE_CARD_PRICE = 177
const BASE_MONTHLY_PRICE = 47

/** Faixas de desconto por volume */
const VOLUME_DISCOUNTS: { minBranches: number; discount: number; label: string }[] = [
  { minBranches: 20, discount: 0.25, label: 'Franquia' },
  { minBranches: 10, discount: 0.2, label: 'Enterprise' },
  { minBranches: 5, discount: 0.15, label: 'Rede grande' },
  { minBranches: 3, discount: 0.1, label: 'Rede' },
]

export function calculateNetworkPrice(branchCount: number): NetworkPricing {
  if (branchCount < 1) {
    return {
      pixPrice: BASE_PIX_PRICE,
      cardPrice: BASE_CARD_PRICE,
      monthlyPrice: BASE_MONTHLY_PRICE,
      discountRate: 0,
      totalPix: 0,
      totalCard: 0,
      totalMonthly: 0,
    }
  }

  const discountTier = VOLUME_DISCOUNTS.find((d) => branchCount >= d.minBranches)
  const discountRate = discountTier?.discount ?? 0

  const pixPrice = Math.round(BASE_PIX_PRICE * (1 - discountRate))
  const cardPrice = Math.round(BASE_CARD_PRICE * (1 - discountRate))
  const monthlyPrice = Math.round(BASE_MONTHLY_PRICE * (1 - discountRate))

  return {
    pixPrice,
    cardPrice,
    monthlyPrice,
    discountRate,
    totalPix: pixPrice * branchCount,
    totalCard: cardPrice * branchCount,
    totalMonthly: monthlyPrice * branchCount,
  }
}

// ── Validation ─────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface BranchEmailValidation {
  valid: string[]
  invalid: string[]
  duplicates: string[]
}

export function validateBranchEmails(emails: string[]): BranchEmailValidation {
  const seen = new Set<string>()
  const valid: string[] = []
  const invalid: string[] = []
  const duplicates: string[] = []

  for (const raw of emails) {
    const email = raw.trim().toLowerCase()
    if (!email) continue

    if (!EMAIL_REGEX.test(email)) {
      invalid.push(email)
      continue
    }

    if (seen.has(email)) {
      duplicates.push(email)
      continue
    }

    seen.add(email)
    valid.push(email)
  }

  return { valid, invalid, duplicates }
}

// ── Slug generation ────────────────────────────────────────────────────────

export function generateBranchSlug(parentSlug: string, branchName: string): string {
  const sanitized = branchName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return `${parentSlug}-${sanitized}`
}

// ── Formatting helpers ─────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDiscountPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`
}

export function getDiscountTierLabel(branchCount: number): string {
  const tier = VOLUME_DISCOUNTS.find((d) => branchCount >= d.minBranches)
  return tier?.label ?? 'Padrão'
}

export function getVolumeDiscountTiers() {
  return VOLUME_DISCOUNTS.map((d) => ({
    minBranches: d.minBranches,
    discount: d.discount,
    label: d.label,
    discountPercent: formatDiscountPercent(d.discount),
  }))
}

// ── Format helpers ─────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDiscount(rate: number): string {
  return `${Math.round(rate * 100)}%`
}
