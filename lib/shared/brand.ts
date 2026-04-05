// ── Identidade de marca ──────────────────────────────────────────
export const BRAND_SHORT = 'Zairyx'
export const PRODUCT_NAME = 'Canal Digital'
export const BRAND_FULL = 'Zairyx — Canal Digital'
export const COMPANY_NAME = 'Zairyx Soluções Tecnológicas'
export const COMPANY_LEGAL_NAME =
  process.env.NEXT_PUBLIC_COMPANY_LEGAL_NAME ?? '61.699.939 TIAGO AURELIANO DA ROCHA'

const COMPANY_CNPJ_RAW = (process.env.NEXT_PUBLIC_COMPANY_CNPJ ?? '61699939000180').replace(
  /\D/g,
  ''
)

export const COMPANY_CNPJ = COMPANY_CNPJ_RAW.replace(
  /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
  '$1.$2.$3/$4-$5'
)
export const COMPANY_PAYMENT_DESCRIPTOR = 'Zairyx Solucoes'
export const SUPPORT_EMAIL = 'zairyx.ai@gmail.com'
export const DOMAIN = 'zairyx.com.br'

// ── Textos de pagamento ──────────────────────────────────────────
export const PAYMENT_BRAND_EXPLANATION =
  'Ao continuar, o pagamento será processado pelo Mercado Pago e pode aparecer como Zairyx Soluções Tecnológicas.'

export const PRODUCT_ENDORSEMENT = `Canal Digital é uma plataforma da marca ${COMPANY_NAME}, operada juridicamente por ${COMPANY_LEGAL_NAME}, inscrita no CNPJ ${COMPANY_CNPJ}.`

export const PAYMENT_OPERATOR_NOTE = `${COMPANY_LEGAL_NAME}, inscrito no CNPJ ${COMPANY_CNPJ}, é o responsável jurídico pela operação do Canal Digital sob a marca ${COMPANY_NAME}.`

export const PAYMENT_DESCRIPTOR_NOTE = `No pagamento ou no comprovante, a cobrança do Canal Digital pode aparecer como ${COMPANY_NAME}.`
