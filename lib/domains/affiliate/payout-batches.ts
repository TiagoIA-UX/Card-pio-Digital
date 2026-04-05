import { normalizePixKey, validatePixKey } from '@/lib/domains/core/pix'

export type PayoutValidationStatus = 'pendente' | 'pronto' | 'bloqueado'

export interface PayoutValidationIssue {
  code: 'missing_pix' | 'invalid_pix' | 'invalid_amount' | 'missing_affiliate'
  message: string
}

export interface PayoutItemSnapshot {
  affiliateId: string
  affiliateName: string | null
  amount: number
  pixKey: string | null
}

export interface PayoutItemValidationResult {
  status: PayoutValidationStatus
  normalizedPixKey: string | null
  issues: PayoutValidationIssue[]
}

export interface PayoutBatchValidationSummary {
  status: PayoutValidationStatus
  totalItems: number
  readyItems: number
  blockedItems: number
  totalAmount: number
  blockedAmount: number
  invalidPixCount: number
  missingPixCount: number
  invalidAmountCount: number
  generatedAt: string
}

export interface PayoutExportRow {
  affiliate_id: string
  affiliate_name: string
  tipo: string
  valor: number
  chave_pix: string
  referencia: string
  validation_status: PayoutValidationStatus
  validation_errors: string
}

export function validatePayoutItemSnapshot(
  snapshot: PayoutItemSnapshot
): PayoutItemValidationResult {
  const issues: PayoutValidationIssue[] = []
  const cleanName = snapshot.affiliateName?.trim() || ''
  const cleanPix = snapshot.pixKey?.trim() || ''
  let normalizedPixKey: string | null = null

  if (!snapshot.affiliateId || !cleanName) {
    issues.push({
      code: 'missing_affiliate',
      message: 'Afiliado sem identificação completa no snapshot.',
    })
  }

  if (snapshot.amount <= 0 || !Number.isFinite(snapshot.amount)) {
    issues.push({
      code: 'invalid_amount',
      message: 'Valor do item inválido para pagamento.',
    })
  }

  if (!cleanPix) {
    issues.push({
      code: 'missing_pix',
      message: 'Afiliado sem chave PIX cadastrada.',
    })
  } else {
    normalizedPixKey = normalizePixKey(cleanPix)
    if (!validatePixKey(normalizedPixKey).valid) {
      issues.push({
        code: 'invalid_pix',
        message: 'Chave PIX inválida para pagamento.',
      })
    }
  }

  return {
    status: issues.length > 0 ? 'bloqueado' : 'pronto',
    normalizedPixKey,
    issues,
  }
}

export function buildPayoutBatchValidationSummary(
  snapshots: PayoutItemSnapshot[],
  validations: PayoutItemValidationResult[]
): PayoutBatchValidationSummary {
  const totalAmount = snapshots.reduce((sum, item) => sum + Number(item.amount || 0), 0)

  return {
    status: validations.some((item) => item.status === 'bloqueado') ? 'bloqueado' : 'pronto',
    totalItems: snapshots.length,
    readyItems: validations.filter((item) => item.status === 'pronto').length,
    blockedItems: validations.filter((item) => item.status === 'bloqueado').length,
    totalAmount,
    blockedAmount: snapshots.reduce(
      (sum, item, index) =>
        sum + (validations[index]?.status === 'bloqueado' ? Number(item.amount || 0) : 0),
      0
    ),
    invalidPixCount: validations.filter((item) =>
      item.issues.some((issue) => issue.code === 'invalid_pix')
    ).length,
    missingPixCount: validations.filter((item) =>
      item.issues.some((issue) => issue.code === 'missing_pix')
    ).length,
    invalidAmountCount: validations.filter((item) =>
      item.issues.some((issue) => issue.code === 'invalid_amount')
    ).length,
    generatedAt: new Date().toISOString(),
  }
}

export function formatValidationErrors(issues: PayoutValidationIssue[]): string {
  if (issues.length === 0) return ''
  return issues.map((issue) => issue.message).join(' | ')
}

function escapeCsvCell(value: string | number) {
  const stringValue = String(value ?? '')
  if (/[",\n;]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

export function buildPayoutCsv(rows: PayoutExportRow[]) {
  const header = [
    'affiliate_id',
    'affiliate_name',
    'tipo',
    'valor',
    'chave_pix',
    'referencia',
    'validation_status',
    'validation_errors',
  ]

  const body = rows.map((row) =>
    [
      row.affiliate_id,
      row.affiliate_name,
      row.tipo,
      row.valor.toFixed(2),
      row.chave_pix,
      row.referencia,
      row.validation_status,
      row.validation_errors,
    ]
      .map(escapeCsvCell)
      .join(';')
  )

  return [header.join(';'), ...body].join('\n')
}
