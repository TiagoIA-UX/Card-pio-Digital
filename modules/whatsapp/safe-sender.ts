// =====================================================
// WHATSAPP SAFE SENDER — Proteção Anti-Ban Meta
// Throttling, cooldown e compliance para proteger o
// número do cliente contra ban pela Meta.
// =====================================================

/**
 * Regras da Meta para WhatsApp Business (2024-2026):
 *
 * 1. Rate limits:
 *    - Números novos: ~250 mensagens únicas/24h
 *    - Números verificados: até 1.000/24h (Tier 1)
 *    - Tier 2+: até 10.000-100.000/24h
 *
 * 2. Motivos comuns de ban:
 *    - Envio em massa de mensagens não solicitadas
 *    - Muitos contatos novos em curto período
 *    - Mensagens repetitivas (spam patterns)
 *    - Alto volume de "report" ou "block" pelos destinatários
 *    - Uso de links encurtados suspeitos
 *    - Mensagens genéricas sem personalização
 *
 * 3. Boas práticas que evitam ban:
 *    - Atendimento via IA in-app (reduz dependência do WhatsApp)
 *    - Mensagens personalizadas por pedido (não template genérico)
 *    - Intervalo mínimo entre mensagens para o MESMO número
 *    - Limite diário por delivery
 *    - Cooldown progressivo quando volume sobe
 */

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface SafeSenderConfig {
  /** Máximo de mensagens por delivery por hora (padrão: 30) */
  maxPerHour: number
  /** Máximo de mensagens por delivery por dia (padrão: 200) */
  maxPerDay: number
  /** Intervalo mínimo entre mensagens em ms (padrão: 3000 = 3s) */
  minIntervalMs: number
  /** Cooldown progressivo: multiplicador quando > 50% do limite (padrão: 1.5) */
  cooldownMultiplier: number
  /** Limite de mensagens para o MESMO destinatário por hora (padrão: 5) */
  maxPerRecipientPerHour: number
}

export interface MessageRecord {
  restaurantId: string
  recipientPhone: string
  timestamp: number
  type: 'order' | 'status_update' | 'promo' | 'support'
}

export interface SafeSendResult {
  allowed: boolean
  reason?: string
  waitMs?: number
  riskLevel: 'safe' | 'caution' | 'danger' | 'blocked'
  stats: {
    hourCount: number
    dayCount: number
    recipientHourCount: number
    hourLimit: number
    dayLimit: number
    recipientLimit: number
  }
}

export interface WhatsAppHealthReport {
  restaurantId: string
  riskLevel: 'safe' | 'caution' | 'danger'
  hourUsage: number
  hourLimit: number
  dayUsage: number
  dayLimit: number
  topRecipients: Array<{ phone: string; count: number }>
  recommendation: string
}

// ── Configuração padrão ────────────────────────────────────────────────────

const DEFAULT_CONFIG: SafeSenderConfig = {
  maxPerHour: 30,
  maxPerDay: 200,
  minIntervalMs: 3_000,
  cooldownMultiplier: 1.5,
  maxPerRecipientPerHour: 5,
}

// ── Tipos de mensagem e seus pesos de risco ────────────────────────────────

const MESSAGE_RISK_WEIGHT: Record<MessageRecord['type'], number> = {
  order: 1, // pedido legítimo — baixo risco
  status_update: 1, // atualização de status — baixo risco
  support: 2, // suporte manual — risco médio
  promo: 5, // promoção — alto risco de ban
}

// ── Buffer in-memory (por processo) ────────────────────────────────────────
// Em produção com múltiplas instâncias, usar Redis (Upstash)

const messageLog = new Map<string, MessageRecord[]>()

function getLog(restaurantId: string): MessageRecord[] {
  let log = messageLog.get(restaurantId)
  if (!log) {
    log = []
    messageLog.set(restaurantId, log)
  }
  return log
}

function pruneOldRecords(records: MessageRecord[], maxAgeMs: number): MessageRecord[] {
  const cutoff = Date.now() - maxAgeMs
  return records.filter((r) => r.timestamp > cutoff)
}

// ── API Pública ────────────────────────────────────────────────────────────

/**
 * Verifica se é seguro enviar uma mensagem WhatsApp agora.
 * NÃO envia a mensagem — apenas valida se o envio é seguro.
 */
export function checkSafeSend(
  restaurantId: string,
  recipientPhone: string,
  messageType: MessageRecord['type'],
  config: Partial<SafeSenderConfig> = {}
): SafeSendResult {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const now = Date.now()

  // Limpa registros antigos (mantém 24h)
  const log = pruneOldRecords(getLog(restaurantId), 24 * 60 * 60 * 1000)
  messageLog.set(restaurantId, log)

  // Contagem por período
  const oneHourAgo = now - 60 * 60 * 1000
  const hourRecords = log.filter((r) => r.timestamp > oneHourAgo)
  const dayRecords = log // já está filtrado para 24h

  // Contagem ponderada por risco
  const hourWeighted = hourRecords.reduce((sum, r) => sum + (MESSAGE_RISK_WEIGHT[r.type] || 1), 0)

  // Contagem por destinatário
  const normalizedPhone = recipientPhone.replace(/\D/g, '')
  const recipientHourRecords = hourRecords.filter(
    (r) => r.recipientPhone.replace(/\D/g, '') === normalizedPhone
  )

  const stats = {
    hourCount: hourRecords.length,
    dayCount: dayRecords.length,
    recipientHourCount: recipientHourRecords.length,
    hourLimit: cfg.maxPerHour,
    dayLimit: cfg.maxPerDay,
    recipientLimit: cfg.maxPerRecipientPerHour,
  }

  // Mensagens promo são bloqueadas se já passou de 50% do limite diário
  if (messageType === 'promo' && dayRecords.length > cfg.maxPerDay * 0.5) {
    return {
      allowed: false,
      reason: 'Limite de promoções atingido. Promoções bloqueadas para proteger o número.',
      riskLevel: 'blocked',
      stats,
    }
  }

  // Limite por destinatário
  if (recipientHourRecords.length >= cfg.maxPerRecipientPerHour) {
    return {
      allowed: false,
      reason: `Limite de ${cfg.maxPerRecipientPerHour} mensagens/hora para o mesmo número atingido.`,
      riskLevel: 'blocked',
      stats,
    }
  }

  // Limite diário absoluto
  if (dayRecords.length >= cfg.maxPerDay) {
    return {
      allowed: false,
      reason: `Limite diário de ${cfg.maxPerDay} mensagens atingido. Aguarde o próximo dia.`,
      riskLevel: 'blocked',
      stats,
    }
  }

  // Limite por hora
  if (hourRecords.length >= cfg.maxPerHour) {
    return {
      allowed: false,
      reason: `Limite horário de ${cfg.maxPerHour} mensagens atingido. Aguarde.`,
      waitMs: 60 * 60 * 1000 - (now - hourRecords[0].timestamp),
      riskLevel: 'blocked',
      stats,
    }
  }

  // Intervalo mínimo entre mensagens
  const lastRecord = log[log.length - 1]
  if (lastRecord) {
    const elapsed = now - lastRecord.timestamp
    const requiredInterval =
      hourWeighted > cfg.maxPerHour * 0.5
        ? cfg.minIntervalMs * cfg.cooldownMultiplier
        : cfg.minIntervalMs

    if (elapsed < requiredInterval) {
      return {
        allowed: false,
        reason: 'Aguarde alguns segundos entre mensagens.',
        waitMs: requiredInterval - elapsed,
        riskLevel: 'caution',
        stats,
      }
    }
  }

  // Determinar nível de risco
  let riskLevel: SafeSendResult['riskLevel'] = 'safe'
  const hourUsageRatio = hourRecords.length / cfg.maxPerHour
  const dayUsageRatio = dayRecords.length / cfg.maxPerDay

  if (hourUsageRatio > 0.8 || dayUsageRatio > 0.8) {
    riskLevel = 'danger'
  } else if (hourUsageRatio > 0.5 || dayUsageRatio > 0.5) {
    riskLevel = 'caution'
  }

  return { allowed: true, riskLevel, stats }
}

/**
 * Registra que uma mensagem foi enviada com sucesso.
 * Chamar DEPOIS de confirmar que o link foi aberto / mensagem enviada.
 */
export function recordMessageSent(
  restaurantId: string,
  recipientPhone: string,
  type: MessageRecord['type']
) {
  const log = getLog(restaurantId)
  log.push({
    restaurantId,
    recipientPhone: recipientPhone.replace(/\D/g, ''),
    timestamp: Date.now(),
    type,
  })
}

/**
 * Gera relatório de saúde do WhatsApp para o painel admin.
 */
export function getWhatsAppHealth(
  restaurantId: string,
  config: Partial<SafeSenderConfig> = {}
): WhatsAppHealthReport {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const now = Date.now()

  const log = pruneOldRecords(getLog(restaurantId), 24 * 60 * 60 * 1000)
  const oneHourAgo = now - 60 * 60 * 1000
  const hourRecords = log.filter((r) => r.timestamp > oneHourAgo)

  // Top destinatários na última hora
  const recipientCounts = new Map<string, number>()
  for (const record of hourRecords) {
    const phone = record.recipientPhone
    recipientCounts.set(phone, (recipientCounts.get(phone) || 0) + 1)
  }

  const topRecipients = [...recipientCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phone, count]) => ({
      phone: phone.slice(0, 4) + '****' + phone.slice(-2), // mascara
      count,
    }))

  const hourUsageRatio = hourRecords.length / cfg.maxPerHour
  const dayUsageRatio = log.length / cfg.maxPerDay

  let riskLevel: WhatsAppHealthReport['riskLevel'] = 'safe'
  let recommendation = 'Número seguro. Volume dentro dos limites recomendados.'

  if (hourUsageRatio > 0.8 || dayUsageRatio > 0.8) {
    riskLevel = 'danger'
    recommendation =
      'Volume crítico! Reduza o envio manual. A IA do cardápio digital absorve atendimento automaticamente.'
  } else if (hourUsageRatio > 0.5 || dayUsageRatio > 0.5) {
    riskLevel = 'caution'
    recommendation =
      'Volume moderado. Considere usar mais o atendimento por IA para reduzir mensagens manuais.'
  }

  return {
    restaurantId,
    riskLevel,
    hourUsage: hourRecords.length,
    hourLimit: cfg.maxPerHour,
    dayUsage: log.length,
    dayLimit: cfg.maxPerDay,
    topRecipients,
    recommendation,
  }
}

/**
 * Verifica se um texto de mensagem segue boas práticas anti-ban.
 * Retorna alertas sobre padrões que podem causar ban.
 */
export function auditMessageContent(text: string): string[] {
  const warnings: string[] = []

  // Mensagem muito curta (parece spam)
  if (text.length < 20) {
    warnings.push('Mensagem muito curta — pode ser classificada como spam.')
  }

  // Mensagem muito longa (parece bulk)
  if (text.length > 4000) {
    warnings.push('Mensagem muito longa — divida em partes para parecer mais natural.')
  }

  // Links encurtados suspeitos
  const shortUrlPattern = /bit\.ly|tinyurl|goo\.gl|t\.co|is\.gd|shorturl/i
  if (shortUrlPattern.test(text)) {
    warnings.push('Evite links encurtados — a Meta sinaliza como suspeito.')
  }

  // Muitas letras maiúsculas (gritando)
  const upperRatio =
    text.replace(/[^A-Za-z]/g, '').length > 0
      ? text.replace(/[^A-Z]/g, '').length / text.replace(/[^A-Za-z]/g, '').length
      : 0
  if (upperRatio > 0.6 && text.length > 30) {
    warnings.push('Excesso de letras maiúsculas — pode parecer spam agressivo.')
  }

  // Palavras de urgência excessiva
  const urgencyPattern = /\b(URGENTE|ÚLTIMA CHANCE|SÓ HOJE|CORRA|NÃO PERCA|OFERTA IMPERDÍVEL)\b/gi
  const urgencyMatches = text.match(urgencyPattern) || []
  if (urgencyMatches.length > 2) {
    warnings.push('Muitas palavras de urgência — a Meta pode classificar como spam comercial.')
  }

  return warnings
}

// ── Limpeza periódica ──────────────────────────────────────────────────────

/**
 * Limpa logs antigos de todos os deliverys. Chamar periodicamente (ex: cron 1x/hora).
 */
export function pruneAllLogs() {
  const maxAge = 24 * 60 * 60 * 1000
  for (const [restaurantId, records] of messageLog.entries()) {
    const pruned = pruneOldRecords(records, maxAge)
    if (pruned.length === 0) {
      messageLog.delete(restaurantId)
    } else {
      messageLog.set(restaurantId, pruned)
    }
  }
}

