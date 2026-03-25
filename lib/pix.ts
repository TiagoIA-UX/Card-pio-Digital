export const PIX_PATTERNS = [
  { type: 'cpf', regex: /^\d{11}$/ },
  { type: 'cnpj', regex: /^\d{14}$/ },
  { type: 'email', regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  { type: 'telefone', regex: /^\+55\d{10,11}$/ },
  {
    type: 'chave_aleatoria',
    regex: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  },
] as const

export function normalizePixKey(key: string): string {
  const trimmed = key.trim()

  if (trimmed.includes('@')) return trimmed
  if (/^[0-9a-f-]{36}$/i.test(trimmed)) return trimmed.toLowerCase()
  if (trimmed.startsWith('+')) return trimmed.replace(/[\s\-()]/g, '')

  return trimmed.replace(/[\s.\-/()]/g, '')
}

export function validatePixKey(key: string): { valid: boolean; type: string } {
  const normalized = normalizePixKey(key)

  for (const { type, regex } of PIX_PATTERNS) {
    if (regex.test(normalized)) return { valid: true, type }
  }

  return { valid: false, type: 'desconhecido' }
}
