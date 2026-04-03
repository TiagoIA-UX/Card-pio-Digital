import {
  COMPANY_CNPJ,
  COMPANY_LEGAL_NAME,
  COMPANY_NAME,
  PRODUCT_NAME,
  SUPPORT_EMAIL,
} from '@/lib/brand'

export const FISCAL_SUPPORTED_PROVIDERS = ['focusnfe', 'enotas', 'plugnotas', 'webmania'] as const
export const FISCAL_SUPPORTED_DOCUMENT_KINDS = ['nfse', 'nfe'] as const

export type FiscalProvider = (typeof FISCAL_SUPPORTED_PROVIDERS)[number]
export type FiscalDocumentKind = (typeof FISCAL_SUPPORTED_DOCUMENT_KINDS)[number]
export type FiscalPreparationStatus =
  | 'disabled'
  | 'dry_run_ready'
  | 'needs_configuration'
  | 'needs_manual_review'
  | 'ready_for_provider'

export interface FiscalAutomationConfig {
  enabled: boolean
  dryRun: boolean
  provider: FiscalProvider | null
  documentKind: FiscalDocumentKind
  municipalRegistration: string | null
  serviceCode: string | null
  serviceCityCode: string | null
  serviceDescriptionPrefix: string
  missingProviderCredentials: string[]
}

export interface FiscalPreparationInput {
  orderId: string
  paymentId: string | null
  paymentAmount: number | null
  approvedAt: string | null
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  restaurantName: string | null
  restaurantId?: string | null
  restaurantSlug?: string | null
  orderMetadata?: Record<string, unknown>
}

export interface FiscalPreparationMetadata {
  workflow_version: 1
  trigger: 'payment_approved'
  status: FiscalPreparationStatus
  enabled: boolean
  dry_run: boolean
  provider: FiscalProvider | null
  document_kind: FiscalDocumentKind
  prepared_at: string
  reason: string
  missing_fields: string[]
  missing_provider_credentials: string[]
  company: {
    brand_name: string
    legal_name: string
    cnpj: string
    support_email: string
  }
  customer: {
    name: string | null
    email: string | null
    phone: string | null
  }
  service: {
    municipal_registration: string | null
    service_code: string | null
    city_code: string | null
    description: string
    amount: number | null
  }
  payment: {
    order_id: string
    payment_id: string | null
    approved_at: string | null
  }
  restaurant: {
    name: string | null
    id: string | null
    slug: string | null
  }
}

function isTruthy(value: string | undefined, fallback: boolean) {
  if (!value) return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

function toNullableString(value: string | undefined | null) {
  const normalized = value?.trim() || ''
  return normalized.length > 0 ? normalized : null
}

function resolveProvider(value: string | undefined): FiscalProvider | null {
  const normalized = value?.trim().toLowerCase() || ''
  if (!normalized) return null

  return (FISCAL_SUPPORTED_PROVIDERS as readonly string[]).includes(normalized)
    ? (normalized as FiscalProvider)
    : null
}

function resolveDocumentKind(value: string | undefined): FiscalDocumentKind {
  const normalized = value?.trim().toLowerCase() || 'nfse'
  return (FISCAL_SUPPORTED_DOCUMENT_KINDS as readonly string[]).includes(normalized)
    ? (normalized as FiscalDocumentKind)
    : 'nfse'
}

function resolveMissingProviderCredentials(
  provider: FiscalProvider | null,
  env: NodeJS.ProcessEnv
): string[] {
  if (!provider) return []

  if (provider === 'focusnfe') {
    return env.FOCUSNFE_API_KEY ? [] : ['FOCUSNFE_API_KEY']
  }

  if (provider === 'enotas') {
    return env.ENOTAS_API_KEY ? [] : ['ENOTAS_API_KEY']
  }

  if (provider === 'plugnotas') {
    return env.PLUGNOTAS_API_KEY ? [] : ['PLUGNOTAS_API_KEY']
  }

  const missing: string[] = []
  if (!env.WEBMANIA_CONSUMER_KEY) missing.push('WEBMANIA_CONSUMER_KEY')
  if (!env.WEBMANIA_CONSUMER_SECRET) missing.push('WEBMANIA_CONSUMER_SECRET')
  return missing
}

export function resolveFiscalAutomationConfig(
  env: NodeJS.ProcessEnv = process.env
): FiscalAutomationConfig {
  const provider = resolveProvider(env.FISCAL_PROVIDER)

  return {
    enabled: isTruthy(env.FISCAL_AUTOMATION_ENABLED, false),
    dryRun: isTruthy(env.FISCAL_AUTOMATION_DRY_RUN, true),
    provider,
    documentKind: resolveDocumentKind(env.FISCAL_DOCUMENT_KIND),
    municipalRegistration: toNullableString(env.FISCAL_MUNICIPAL_REGISTRATION),
    serviceCode: toNullableString(env.FISCAL_SERVICE_CODE),
    serviceCityCode: toNullableString(env.FISCAL_SERVICE_CITY_CODE),
    serviceDescriptionPrefix:
      toNullableString(env.FISCAL_SERVICE_DESCRIPTION_PREFIX) ||
      `Assinatura e implantação de ${PRODUCT_NAME}`,
    missingProviderCredentials: resolveMissingProviderCredentials(provider, env),
  }
}

function buildServiceDescription(config: FiscalAutomationConfig, restaurantName: string | null) {
  return restaurantName
    ? `${config.serviceDescriptionPrefix} para ${restaurantName}`
    : config.serviceDescriptionPrefix
}

export function prepareFiscalInvoiceMetadata(
  input: FiscalPreparationInput,
  env: NodeJS.ProcessEnv = process.env
): FiscalPreparationMetadata {
  const config = resolveFiscalAutomationConfig(env)
  const missingFields: string[] = []

  if (!input.customerName) missingFields.push('customer_name')
  if (!input.customerEmail) missingFields.push('customer_email')
  if (!input.paymentAmount || input.paymentAmount <= 0) missingFields.push('payment_amount')
  if (!input.approvedAt) missingFields.push('approved_at')

  if (config.documentKind === 'nfse') {
    if (!config.municipalRegistration) missingFields.push('fiscal_municipal_registration')
    if (!config.serviceCode) missingFields.push('fiscal_service_code')
  }

  let status: FiscalPreparationStatus = 'disabled'
  let reason = 'Automação fiscal desabilitada por feature flag.'

  if (config.enabled) {
    if (missingFields.length > 0) {
      status = 'needs_manual_review'
      reason = 'Faltam dados mínimos para emitir ou revisar a nota fiscal automaticamente.'
    } else if (!config.provider || config.missingProviderCredentials.length > 0) {
      status = 'needs_configuration'
      reason =
        'A automação fiscal foi habilitada, mas o provedor ou as credenciais ainda não estão completos.'
    } else if (config.dryRun) {
      status = 'dry_run_ready'
      reason =
        'Estrutura fiscal pronta em modo seguro; nenhuma nota será emitida automaticamente enquanto o dry-run estiver ativo.'
    } else {
      status = 'ready_for_provider'
      reason =
        'Dados mínimos disponíveis para integrar a emissão automática com o provedor configurado.'
    }
  }

  return {
    workflow_version: 1,
    trigger: 'payment_approved',
    status,
    enabled: config.enabled,
    dry_run: config.dryRun,
    provider: config.provider,
    document_kind: config.documentKind,
    prepared_at: new Date().toISOString(),
    reason,
    missing_fields: missingFields,
    missing_provider_credentials: config.missingProviderCredentials,
    company: {
      brand_name: COMPANY_NAME,
      legal_name: COMPANY_LEGAL_NAME,
      cnpj: COMPANY_CNPJ,
      support_email: SUPPORT_EMAIL,
    },
    customer: {
      name: input.customerName,
      email: input.customerEmail,
      phone: input.customerPhone,
    },
    service: {
      municipal_registration: config.municipalRegistration,
      service_code: config.serviceCode,
      city_code: config.serviceCityCode,
      description: buildServiceDescription(config, input.restaurantName),
      amount: input.paymentAmount,
    },
    payment: {
      order_id: input.orderId,
      payment_id: input.paymentId,
      approved_at: input.approvedAt,
    },
    restaurant: {
      name: input.restaurantName,
      id: input.restaurantId || null,
      slug: input.restaurantSlug || null,
    },
  }
}
