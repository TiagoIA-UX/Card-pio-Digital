function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

function allDigitsEqual(value: string) {
  return /^(\d)\1+$/.test(value)
}

function calculateCpfCheckDigit(base: string) {
  let sum = 0

  for (let index = 0; index < base.length; index += 1) {
    sum += Number(base[index]) * (base.length + 1 - index)
  }

  const remainder = (sum * 10) % 11
  return remainder === 10 ? 0 : remainder
}

function calculateCnpjCheckDigit(base: string) {
  const weights =
    base.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0

  for (let index = 0; index < base.length; index += 1) {
    sum += Number(base[index]) * weights[index]
  }

  const remainder = sum % 11
  return remainder < 2 ? 0 : 11 - remainder
}

export function normalizeTaxDocument(value: string | null | undefined) {
  return onlyDigits(value?.trim() || '')
}

export function detectTaxDocumentType(value: string | null | undefined) {
  const normalized = normalizeTaxDocument(value)

  if (normalized.length === 11) return 'cpf'
  if (normalized.length === 14) return 'cnpj'
  return null
}

export function isValidCpf(value: string | null | undefined) {
  const normalized = normalizeTaxDocument(value)
  if (normalized.length !== 11 || allDigitsEqual(normalized)) return false

  const firstDigit = calculateCpfCheckDigit(normalized.slice(0, 9))
  const secondDigit = calculateCpfCheckDigit(normalized.slice(0, 9) + String(firstDigit))

  return normalized === `${normalized.slice(0, 9)}${firstDigit}${secondDigit}`
}

export function isValidCnpj(value: string | null | undefined) {
  const normalized = normalizeTaxDocument(value)
  if (normalized.length !== 14 || allDigitsEqual(normalized)) return false

  const firstDigit = calculateCnpjCheckDigit(normalized.slice(0, 12))
  const secondDigit = calculateCnpjCheckDigit(normalized.slice(0, 12) + String(firstDigit))

  return normalized === `${normalized.slice(0, 12)}${firstDigit}${secondDigit}`
}

export function isValidTaxDocument(value: string | null | undefined) {
  const type = detectTaxDocumentType(value)
  if (type === 'cpf') return isValidCpf(value)
  if (type === 'cnpj') return isValidCnpj(value)
  return false
}

export function formatTaxDocument(value: string | null | undefined) {
  const normalized = normalizeTaxDocument(value)

  if (normalized.length <= 11) {
    return normalized
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  return normalized
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function normalizeValidatedTaxDocument(value: string | null | undefined) {
  const normalized = normalizeTaxDocument(value)
  return normalized && isValidTaxDocument(normalized) ? normalized : null
}
