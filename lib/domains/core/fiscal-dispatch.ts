import { COMPANY_NAME } from '@/lib/shared/brand'
import type { FiscalPreparationMetadata } from '@/lib/domains/core/fiscal'

export type FiscalDispatchStatus = 'skipped' | 'blocked' | 'dry_run' | 'submitted' | 'failed'

export interface FiscalDispatchResult {
  status: FiscalDispatchStatus
  provider: string | null
  attempted_at: string
  reason: string
  endpoint: string | null
  payload_preview: FiscalDispatchPayloadPreview
  provider_reference: string | null
  http_status: number | null
  response_summary: string | null
}

export interface FiscalDispatchPayloadPreview {
  order_id: string
  source: 'mercado_pago_webhook'
  provider: string | null
  document_kind: string
  company: {
    brand_name: string
    legal_name: string
    cnpj: string
  }
  customer: {
    name: string | null
    email: string | null
    phone: string | null
    document: string | null
    document_type: 'cpf' | 'cnpj' | null
  }
  service: {
    description: string
    amount: number | null
    municipal_registration: string | null
    service_code: string | null
    city_code: string | null
  }
  payment: {
    payment_id: string | null
    approved_at: string | null
  }
  restaurant: {
    id: string | null
    slug: string | null
    name: string | null
  }
}

export interface DispatchFiscalInvoiceInput {
  orderId: string
  fiscal: FiscalPreparationMetadata
}

function summarizeJson(data: unknown) {
  if (!data || typeof data !== 'object') return null

  const entries = Object.entries(data as Record<string, unknown>).slice(0, 8)
  return entries
    .map(([key, value]) => `${key}:${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join(', ')
}

export function buildFiscalDispatchPayloadPreview(
  input: DispatchFiscalInvoiceInput
): FiscalDispatchPayloadPreview {
  return {
    order_id: input.orderId,
    source: 'mercado_pago_webhook',
    provider: input.fiscal.provider,
    document_kind: input.fiscal.document_kind,
    company: {
      brand_name: input.fiscal.company.brand_name || COMPANY_NAME,
      legal_name: input.fiscal.company.legal_name,
      cnpj: input.fiscal.company.cnpj,
    },
    customer: {
      name: input.fiscal.customer.name,
      email: input.fiscal.customer.email,
      phone: input.fiscal.customer.phone,
      document: input.fiscal.customer.document,
      document_type: input.fiscal.customer.document_type,
    },
    service: {
      description: input.fiscal.service.description,
      amount: input.fiscal.service.amount,
      municipal_registration: input.fiscal.service.municipal_registration,
      service_code: input.fiscal.service.service_code,
      city_code: input.fiscal.service.city_code,
    },
    payment: {
      payment_id: input.fiscal.payment.payment_id,
      approved_at: input.fiscal.payment.approved_at,
    },
    restaurant: {
      id: input.fiscal.restaurant.id,
      slug: input.fiscal.restaurant.slug,
      name: input.fiscal.restaurant.name,
    },
  }
}

export async function dispatchFiscalInvoice(
  input: DispatchFiscalInvoiceInput,
  env: NodeJS.ProcessEnv = process.env
): Promise<FiscalDispatchResult> {
  const attemptedAt = new Date().toISOString()
  const payloadPreview = buildFiscalDispatchPayloadPreview(input)
  const endpoint = env.FISCAL_DISPATCH_WEBHOOK_URL?.trim() || null

  if (!input.fiscal.enabled || input.fiscal.status === 'disabled') {
    return {
      status: 'skipped',
      provider: input.fiscal.provider,
      attempted_at: attemptedAt,
      reason: 'Automação fiscal desligada; nenhuma emissão foi tentada.',
      endpoint,
      payload_preview: payloadPreview,
      provider_reference: null,
      http_status: null,
      response_summary: null,
    }
  }

  if (
    input.fiscal.status === 'needs_configuration' ||
    input.fiscal.status === 'needs_manual_review'
  ) {
    return {
      status: 'blocked',
      provider: input.fiscal.provider,
      attempted_at: attemptedAt,
      reason: 'A nota fiscal ainda não está pronta para envio automático.',
      endpoint,
      payload_preview: payloadPreview,
      provider_reference: null,
      http_status: null,
      response_summary: null,
    }
  }

  if (input.fiscal.dry_run) {
    return {
      status: 'dry_run',
      provider: input.fiscal.provider,
      attempted_at: attemptedAt,
      reason: 'Dry-run ativo; payload preparado sem envio ao provedor.',
      endpoint,
      payload_preview: payloadPreview,
      provider_reference: null,
      http_status: null,
      response_summary: null,
    }
  }

  if (!endpoint) {
    return {
      status: 'blocked',
      provider: input.fiscal.provider,
      attempted_at: attemptedAt,
      reason: 'Webhook bridge fiscal não configurado para envio automático.',
      endpoint: null,
      payload_preview: payloadPreview,
      provider_reference: null,
      http_status: null,
      response_summary: null,
    }
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(env.FISCAL_DISPATCH_WEBHOOK_SECRET
          ? { Authorization: `Bearer ${env.FISCAL_DISPATCH_WEBHOOK_SECRET}` }
          : {}),
      },
      body: JSON.stringify(payloadPreview),
    })

    let responseBody: unknown = null
    try {
      responseBody = await response.json()
    } catch {
      responseBody = null
    }

    if (!response.ok) {
      return {
        status: 'failed',
        provider: input.fiscal.provider,
        attempted_at: attemptedAt,
        reason: 'O bridge fiscal respondeu com erro.',
        endpoint,
        payload_preview: payloadPreview,
        provider_reference:
          typeof responseBody === 'object' && responseBody && 'reference' in responseBody
            ? String((responseBody as Record<string, unknown>).reference || '') || null
            : null,
        http_status: response.status,
        response_summary: summarizeJson(responseBody) || response.statusText,
      }
    }

    return {
      status: 'submitted',
      provider: input.fiscal.provider,
      attempted_at: attemptedAt,
      reason: 'Payload fiscal enviado ao bridge configurado.',
      endpoint,
      payload_preview: payloadPreview,
      provider_reference:
        typeof responseBody === 'object' && responseBody && 'reference' in responseBody
          ? String((responseBody as Record<string, unknown>).reference || '') || null
          : null,
      http_status: response.status,
      response_summary: summarizeJson(responseBody) || response.statusText,
    }
  } catch (error) {
    return {
      status: 'failed',
      provider: input.fiscal.provider,
      attempted_at: attemptedAt,
      reason: 'Falha de rede ao enviar payload fiscal para o bridge.',
      endpoint,
      payload_preview: payloadPreview,
      provider_reference: null,
      http_status: null,
      response_summary: error instanceof Error ? error.message : 'unknown_error',
    }
  }
}

