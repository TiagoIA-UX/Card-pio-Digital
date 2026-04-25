/**
 * Network Expansion — Pricing, validation & helpers
 *
 * Gerencia preços para expansão de rede (matriz + filiais),
 * descontos por volume e validação de emails de filiais.
 */

// ── Pricing ────────────────────────────────────────────────────────────────

export interface NetworkPricing {
  /** Mensalidade por filial (com desconto aplicado) */
  monthlyPrice: number
  /** Desconto aplicado (0-1) */
  discountRate: number
  /** Total mensal */
  totalMonthly: number
}

/** Faixas de desconto por volume */
const VOLUME_DISCOUNTS: { branchCount: number; discount: number; label: string }[] = [
  { branchCount: 20, discount: 0.25, label: 'Franquia' },
  { branchCount: 10, discount: 0.2, label: 'Enterprise' },
  { branchCount: 5, discount: 0.15, label: 'Rede grande' },
  { branchCount: 3, discount: 0.1, label: 'Rede' },
]

export function calculateNetworkPrice(
  branchCount: number,
  planMonthlyPrice: number
): NetworkPricing {
  if (branchCount < 1) {
    return {
      monthlyPrice: planMonthlyPrice,
      discountRate: 0,
      totalMonthly: 0,
    }
  }

  const discountTier = VOLUME_DISCOUNTS.find((d) => branchCount === d.branchCount)
  const discountRate = discountTier?.discount ?? 0

  const monthlyPrice = Math.round(planMonthlyPrice * (1 - discountRate))

  return {
    monthlyPrice,
    discountRate,
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
  const tier = VOLUME_DISCOUNTS.find((d) => branchCount === d.branchCount)
  return tier?.label ?? 'Padrão'
}

export function getVolumeDiscountTiers() {
  return VOLUME_DISCOUNTS.map((d) => ({
    branchCount: d.branchCount,
    discount: d.discount,
    label: d.label,
    discountPercent: formatDiscountPercent(d.discount),
  }))
}

