type ForgeOpsEnvSource = 'ALERT_WEBHOOK_URL' | 'FORGEOPS_URL' | 'MERGEFORGE_URL'

export type ResolvedForgeOpsWebhookConfig = {
  source: ForgeOpsEnvSource | null
  baseUrl: string | null
  alertWebhookUrl: string | null
}

function normalizeBaseUrl(value?: string | null): string | null {
  if (!value) return null

  const normalized = value.trim().replace(/\/+$/, '')
  return normalized.length > 0 ? normalized : null
}

function buildAlertWebhookUrl(baseUrl: string): string {
  if (baseUrl.endsWith('/api/webhook/alert')) {
    return baseUrl
  }

  return `${baseUrl}/api/webhook/alert`
}

export function resolveForgeOpsWebhookConfig(): ResolvedForgeOpsWebhookConfig {
  const candidates: Array<{ source: ForgeOpsEnvSource; value?: string | null }> = [
    { source: 'ALERT_WEBHOOK_URL', value: process.env.ALERT_WEBHOOK_URL },
    { source: 'FORGEOPS_URL', value: process.env.FORGEOPS_URL },
    { source: 'MERGEFORGE_URL', value: process.env.MERGEFORGE_URL },
  ]

  for (const candidate of candidates) {
    const baseUrl = normalizeBaseUrl(candidate.value)
    if (!baseUrl) continue

    return {
      source: candidate.source,
      baseUrl,
      alertWebhookUrl: buildAlertWebhookUrl(baseUrl),
    }
  }

  return {
    source: null,
    baseUrl: null,
    alertWebhookUrl: null,
  }
}
