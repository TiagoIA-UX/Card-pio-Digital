export const AFFILIATE_APPROVAL_WINDOW_DAYS = 30
export const AFFILIATE_PAYOUT_DAYS = [1, 15] as const

const DAY_IN_MS = 24 * 60 * 60 * 1000

function toUtcDate(value: Date | string) {
  const date = value instanceof Date ? new Date(value) : new Date(value)
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0)
  )
}

function formatDateOnly(date: Date) {
  return date.toISOString().split('T')[0]
}

function diffDays(target: Date, now: Date) {
  return Math.max(0, Math.floor((target.getTime() - now.getTime()) / DAY_IN_MS))
}

export function getAffiliateApprovalDate(createdAt: Date | string) {
  const createdDate = toUtcDate(createdAt)
  createdDate.setUTCDate(createdDate.getUTCDate() + AFFILIATE_APPROVAL_WINDOW_DAYS)
  return createdDate
}

export function getAffiliateApprovalThreshold(now = new Date()) {
  const threshold = new Date(now)
  threshold.setUTCDate(threshold.getUTCDate() - AFFILIATE_APPROVAL_WINDOW_DAYS)
  return threshold
}

export function getNextAffiliatePayoutDate(now = new Date()) {
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const day = now.getUTCDate()

  let target: Date
  if (day <= AFFILIATE_PAYOUT_DAYS[0]) {
    target = new Date(Date.UTC(year, month, AFFILIATE_PAYOUT_DAYS[0]))
  } else if (day <= AFFILIATE_PAYOUT_DAYS[1]) {
    target = new Date(Date.UTC(year, month, AFFILIATE_PAYOUT_DAYS[1]))
  } else {
    target = new Date(Date.UTC(year, month + 1, AFFILIATE_PAYOUT_DAYS[0]))
  }

  return {
    data: formatDateOnly(target),
    dias: diffDays(target, now),
  }
}

export function getAffiliatePayoutWindow(now = new Date()) {
  const day = now.getUTCDate()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()

  if (day === 15) {
    const periodStart = new Date(Date.UTC(year, month, 1))
    const periodEnd = new Date(Date.UTC(year, month, 15, 23, 59, 59, 999))
    return {
      referencia: `${year}-${String(month + 1).padStart(2, '0')}-Q1`,
      periodStart,
      periodEnd,
    }
  }

  if (day === 1) {
    const previousMonthDate = new Date(Date.UTC(year, month - 1, 1))
    const refYear = previousMonthDate.getUTCFullYear()
    const refMonth = previousMonthDate.getUTCMonth()
    const lastDay = new Date(Date.UTC(refYear, refMonth + 1, 0)).getUTCDate()
    const periodStart = new Date(Date.UTC(refYear, refMonth, 16))
    const periodEnd = new Date(Date.UTC(refYear, refMonth, lastDay, 23, 59, 59, 999))

    return {
      referencia: `${refYear}-${String(refMonth + 1).padStart(2, '0')}-Q2`,
      periodStart,
      periodEnd,
    }
  }

  return null
}
