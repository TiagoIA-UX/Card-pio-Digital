// =====================================================
// NFC-e Payload Builder – Pure functions (testable)
// =====================================================

export interface NfceOrderData {
  id: string
  restaurant_id: string
  numero_pedido: number
  total: number
  forma_pagamento: string | null
  cliente_nome: string | null
}

export interface NfceOrderItem {
  nome_snapshot: string
  preco_snapshot: number
  quantidade: number
}

export interface NfceFiscalConfig {
  cnpj: string
  razao_social: string
  nome_fantasia: string | null
  inscricao_estadual: string
  regime_tributario: number
  logradouro: string
  numero: string
  bairro: string
  municipio: string
  codigo_municipio: string
  uf: string
  cep: string
  ncm_padrao: string | null
  cfop_padrao: string | null
  csosn_padrao: string | null
  ambiente: string | null
  serie_nfce: number | null
  certificado_senha_encrypted: string | null
}

export interface NfcePayload {
  restaurant_id: string
  order_id: string
  numero_pedido: number
  emitente: {
    cnpj: string
    razao_social: string
    nome_fantasia: string
    inscricao_estadual: string
    regime_tributario: number
    logradouro: string
    numero: string
    bairro: string
    municipio: string
    codigo_municipio: string
    uf: string
    cep: string
  }
  consumidor: { nome?: string }
  itens: Array<{
    nome: string
    ncm: string
    cfop: string
    unidade: string
    quantidade: number
    valor_unitario: number
    csosn: string
  }>
  forma_pagamento: string
  valor_total: number
  certificado_base64: string
  certificado_senha: string
  ambiente: string
  numero_nfce: number
  serie: number
}

const FORMA_PAGAMENTO_VALID = [
  'dinheiro',
  'cartao_credito',
  'cartao_debito',
  'pix',
  'vale_alimentacao',
  'vale_refeicao',
] as const

export function buildNfcePayload(
  order: NfceOrderData,
  items: NfceOrderItem[],
  fiscal: NfceFiscalConfig,
  certBase64: string,
  numeroNfce: number
): NfcePayload {
  return {
    restaurant_id: order.restaurant_id,
    order_id: order.id,
    numero_pedido: order.numero_pedido,
    emitente: {
      cnpj: fiscal.cnpj,
      razao_social: fiscal.razao_social,
      nome_fantasia: fiscal.nome_fantasia || fiscal.razao_social,
      inscricao_estadual: fiscal.inscricao_estadual,
      regime_tributario: fiscal.regime_tributario,
      logradouro: fiscal.logradouro,
      numero: fiscal.numero,
      bairro: fiscal.bairro,
      municipio: fiscal.municipio,
      codigo_municipio: fiscal.codigo_municipio,
      uf: fiscal.uf,
      cep: fiscal.cep,
    },
    consumidor: {
      nome: order.cliente_nome || undefined,
    },
    itens: items.map((item) => ({
      nome: item.nome_snapshot,
      ncm: fiscal.ncm_padrao || '21069090',
      cfop: fiscal.cfop_padrao || '5102',
      unidade: 'UN',
      quantidade: item.quantidade,
      valor_unitario: item.preco_snapshot,
      csosn: fiscal.csosn_padrao || '102',
    })),
    forma_pagamento: order.forma_pagamento || 'pix',
    valor_total: order.total,
    certificado_base64: certBase64,
    certificado_senha: fiscal.certificado_senha_encrypted || '',
    ambiente: fiscal.ambiente || 'homologacao',
    numero_nfce: numeroNfce,
    serie: fiscal.serie_nfce || 1,
  }
}

export function validateNfceFiscalConfig(fiscal: NfceFiscalConfig): string[] {
  const errors: string[] = []

  if (!fiscal.cnpj || fiscal.cnpj.replace(/\D/g, '').length !== 14) {
    errors.push('CNPJ inválido (deve ter 14 dígitos)')
  }
  if (!fiscal.razao_social) {
    errors.push('Razão social é obrigatória')
  }
  if (!fiscal.inscricao_estadual) {
    errors.push('Inscrição estadual é obrigatória')
  }
  if (![1, 2, 3].includes(fiscal.regime_tributario)) {
    errors.push('Regime tributário deve ser 1, 2 ou 3')
  }
  if (!fiscal.uf || fiscal.uf.length !== 2) {
    errors.push('UF deve ter 2 caracteres')
  }
  if (!fiscal.cep || fiscal.cep.replace(/\D/g, '').length !== 8) {
    errors.push('CEP inválido (deve ter 8 dígitos)')
  }
  if (!fiscal.codigo_municipio || fiscal.codigo_municipio.replace(/\D/g, '').length !== 7) {
    errors.push('Código IBGE do município deve ter 7 dígitos')
  }
  if (!fiscal.logradouro) errors.push('Logradouro é obrigatório')
  if (!fiscal.bairro) errors.push('Bairro é obrigatório')
  if (!fiscal.municipio) errors.push('Município é obrigatório')

  return errors
}

export function validateNfceOrderItems(items: NfceOrderItem[]): string[] {
  const errors: string[] = []

  if (items.length === 0) {
    errors.push('Pedido sem itens')
    return errors
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (!item.nome_snapshot) errors.push(`Item ${i + 1}: nome vazio`)
    if (item.preco_snapshot <= 0) errors.push(`Item ${i + 1}: preço deve ser positivo`)
    if (item.quantidade <= 0) errors.push(`Item ${i + 1}: quantidade deve ser positiva`)
  }

  return errors
}
