import { PLAN_LIMITS, PUBLIC_SUBSCRIPTION_PRICES } from '@/lib/domains/marketing/pricing'

function normalizeInput(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function parsePtBrNumber(raw: string): number {
  const cleaned = raw.replace(/\./g, '').replace(',', '.').trim()
  return Number(cleaned)
}

export function isPricingOrLimitQuestion(message: string): boolean {
  const normalized = normalizeInput(message)
  if (!normalized) return false

  const keywords = [
    'quanto custa',
    'preco',
    'preco mensal',
    'mensal',
    'plano',
    'quantos produtos',
    'limite de produtos',
    'maximo de produtos',
  ]

  const hasKeyword = keywords.some((keyword) => normalized.includes(keyword))
  if (hasKeyword) return true

  const hasMonthlyCurrency =
    /r\$\s*\d[\d\.,]*/.test(normalized) && /(?:por\s*)?(?:mes|mensal)/.test(normalized)
  const hasProductsMention = /\d[\d\.,]*\s*produt/.test(normalized)

  return hasMonthlyCurrency || hasProductsMention
}

export function buildCanonicalPricingAndLimitsReply(): string {
  return [
    'Aqui estao os valores e limites oficiais atuais (sem estimativa):',
    '',
    `- Plano Semente: R$ ${PUBLIC_SUBSCRIPTION_PRICES.semente.monthly}/mes, limite ${PLAN_LIMITS.semente.maxProducts} produtos.`,
    `- Plano Basico: R$ ${PUBLIC_SUBSCRIPTION_PRICES.basico.monthly}/mes, limite ${PLAN_LIMITS.basico.maxProducts} produtos.`,
    `- Plano Profissional: R$ ${PUBLIC_SUBSCRIPTION_PRICES.pro.monthly}/mes, limite ${PLAN_LIMITS.pro.maxProducts} produtos.`,
    `- Plano Premium: R$ ${PUBLIC_SUBSCRIPTION_PRICES.premium.monthly}/mes, limite ${PLAN_LIMITS.premium.maxProducts} produtos.`,
    '',
    'Nao existe plano oficial com 300000 produtos.',
    'Se quiser, eu te indico agora o plano ideal para o seu volume real.',
  ].join('\n')
}

export function hasCommercialHallucinationRisk(reply: string): boolean {
  const normalized = normalizeInput(reply)

  const hugeProductsMatch = normalized.match(/(\d[\d\.,]{3,})\s*produt/)
  if (hugeProductsMatch) {
    const value = parsePtBrNumber(hugeProductsMatch[1])
    if (Number.isFinite(value) && value > PLAN_LIMITS.premium.maxProducts) {
      return true
    }
  }

  const monthlyMatch = normalized.match(/r\$\s*(\d[\d\.,]*)\s*(?:\/\s*)?(?:por\s*)?(?:mes|mensal)/)
  if (monthlyMatch) {
    const value = parsePtBrNumber(monthlyMatch[1])
    const allowed = new Set<number>([
      PUBLIC_SUBSCRIPTION_PRICES.semente.monthly,
      PUBLIC_SUBSCRIPTION_PRICES.basico.monthly,
      PUBLIC_SUBSCRIPTION_PRICES.pro.monthly,
      PUBLIC_SUBSCRIPTION_PRICES.premium.monthly,
    ])

    if (Number.isFinite(value) && !allowed.has(value)) {
      return true
    }
  }

  return false
}

