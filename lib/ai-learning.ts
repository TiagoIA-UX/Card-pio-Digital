/**
 * AI Learning — Escalation management & knowledge base
 *
 * Gerencia escalações do chat IA para humano,
 * entries de aprendizado e métricas do sistema.
 */

import { createAdminClient } from '@/lib/supabase/admin'

// ── Types ──────────────────────────────────────────────────────────────────

export interface EscalationInput {
  restaurantId: string
  sessionId: string
  userMessage: string
  aiResponse: string
  reason: 'keyword' | 'repeated_failure' | 'user_request' | 'message_threshold'
  metadata?: Record<string, unknown>
}

export interface Escalation {
  id: string
  restaurant_id: string
  session_id: string
  user_message: string
  ai_response: string
  reason: string
  status: 'pending' | 'resolved' | 'dismissed'
  resolution_notes: string | null
  resolved_by: string | null
  resolved_at: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface LearningEntry {
  id: string
  restaurant_id: string
  question_pattern: string
  correct_answer: string
  source: 'escalation_resolution' | 'admin_input' | 'feedback'
  created_by: string | null
  created_at: string
}

export interface AILearningMetrics {
  totalEscalations: number
  pendingEscalations: number
  resolvedEscalations: number
  learningEntries: number
  resolutionRate: number
  avgResolutionTimeHours: number | null
  topEscalationReasons: { reason: string; count: number }[]
}

// ── Escalation keywords ────────────────────────────────────────────────────

export const ESCALATION_KEYWORDS = [
  'falar com humano',
  'atendente',
  'pessoa real',
  'gerente',
  'reclamação',
  'reclamar',
  'problema sério',
  'não resolveu',
  'quero falar com alguém',
  'suporte humano',
]

export const ESCALATION_MESSAGE_THRESHOLD = 6

export function shouldEscalate(
  message: string,
  messageCount: number
): { escalate: boolean; reason: EscalationInput['reason'] } | null {
  const lower = message.toLowerCase()

  for (const keyword of ESCALATION_KEYWORDS) {
    if (lower.includes(keyword)) {
      return { escalate: true, reason: 'keyword' }
    }
  }

  if (messageCount >= ESCALATION_MESSAGE_THRESHOLD) {
    return { escalate: true, reason: 'message_threshold' }
  }

  return null
}

// ── Sentiment & Topic Detection ────────────────────────────────────────────

export type SentimentLabel = 'positive' | 'neutral' | 'negative' | 'frustrated'

const NEGATIVE_SIGNALS = [
  'ruim',
  'péssimo',
  'horrível',
  'não funciona',
  'travou',
  'bug',
  'lento',
  'demora',
  'caro demais',
  'decepcionado',
  'arrependido',
]

const FRUSTRATED_SIGNALS = [
  'absurdo',
  'ridículo',
  'palhaçada',
  'vergonha',
  'pior',
  'nunca mais',
  'raiva',
  'inaceitável',
]

const POSITIVE_SIGNALS = [
  'ótimo',
  'excelente',
  'maravilhoso',
  'adorei',
  'perfeito',
  'parabéns',
  'recomendo',
  'top',
  'show',
  'amei',
]

export function detectSentiment(message: string): SentimentLabel {
  const lower = message.toLowerCase()

  if (FRUSTRATED_SIGNALS.some((s) => lower.includes(s))) return 'frustrated'
  if (NEGATIVE_SIGNALS.some((s) => lower.includes(s))) return 'negative'
  if (POSITIVE_SIGNALS.some((s) => lower.includes(s))) return 'positive'
  return 'neutral'
}

export type TopicCategory = 'pricing' | 'technical' | 'onboarding' | 'complaint' | 'general'

const TOPIC_RULES: { category: TopicCategory; keywords: string[] }[] = [
  {
    category: 'pricing',
    keywords: ['preço', 'custo', 'valor', 'plano', 'desconto', 'taxa', 'mensalidade'],
  },
  {
    category: 'technical',
    keywords: ['bug', 'erro', 'travou', 'não carrega', 'lento', 'crash', 'api'],
  },
  {
    category: 'onboarding',
    keywords: ['cadastro', 'primeiro acesso', 'como começo', 'template', 'criar conta'],
  },
  {
    category: 'complaint',
    keywords: ['reclamação', 'reclamar', 'problema', 'insatisf', 'cancelar'],
  },
]

export function categorizeMessage(message: string): TopicCategory {
  const lower = message.toLowerCase()
  for (const rule of TOPIC_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) return rule.category
  }
  return 'general'
}

// ── Database operations ────────────────────────────────────────────────────

export async function saveEscalation(input: EscalationInput): Promise<Escalation | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('ai_escalations')
    .insert({
      restaurant_id: input.restaurantId,
      session_id: input.sessionId,
      user_message: input.userMessage,
      ai_response: input.aiResponse,
      reason: input.reason,
      status: 'pending',
      metadata: input.metadata ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('[ai-learning] saveEscalation error:', error.message)
    return null
  }

  return data
}

export async function resolveEscalation(
  escalationId: string,
  resolvedBy: string,
  resolutionNotes: string,
  learnFromResolution = true
): Promise<boolean> {
  const supabase = createAdminClient()

  const { data: escalation, error: fetchError } = await supabase
    .from('ai_escalations')
    .select('*')
    .eq('id', escalationId)
    .single()

  if (fetchError || !escalation) {
    console.error('[ai-learning] resolveEscalation fetch error:', fetchError?.message)
    return false
  }

  const { error: updateError } = await supabase
    .from('ai_escalations')
    .update({
      status: 'resolved',
      resolved_by: resolvedBy,
      resolution_notes: resolutionNotes,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', escalationId)

  if (updateError) {
    console.error('[ai-learning] resolveEscalation update error:', updateError.message)
    return false
  }

  if (learnFromResolution && resolutionNotes.trim()) {
    await supabase.from('ai_learning_entries').insert({
      restaurant_id: escalation.restaurant_id,
      question_pattern: escalation.user_message,
      correct_answer: resolutionNotes,
      source: 'escalation_resolution',
      created_by: resolvedBy,
    })
  }

  return true
}

export async function getPendingEscalations(restaurantId?: string): Promise<Escalation[]> {
  const supabase = createAdminClient()

  let query = supabase
    .from('ai_escalations')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50)

  if (restaurantId) {
    query = query.eq('restaurant_id', restaurantId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[ai-learning] getPendingEscalations error:', error.message)
    return []
  }

  return data ?? []
}

export async function getLearningEntries(restaurantId: string): Promise<LearningEntry[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('ai_learning_entries')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[ai-learning] getLearningEntries error:', error.message)
    return []
  }

  return data ?? []
}

export async function getAIKnowledgeContext(restaurantId: string): Promise<string> {
  const entries = await getLearningEntries(restaurantId)

  if (entries.length === 0) return ''

  return entries.map((e) => `P: ${e.question_pattern}\nR: ${e.correct_answer}`).join('\n\n')
}

export async function getAILearningMetrics(restaurantId?: string): Promise<AILearningMetrics> {
  const supabase = createAdminClient()

  let escalationQuery = supabase
    .from('ai_escalations')
    .select('status, reason, created_at, resolved_at')

  let learningQuery = supabase
    .from('ai_learning_entries')
    .select('id', { count: 'exact', head: true })

  if (restaurantId) {
    escalationQuery = escalationQuery.eq('restaurant_id', restaurantId)
    learningQuery = learningQuery.eq('restaurant_id', restaurantId)
  }

  const [escalationResult, learningResult] = await Promise.all([escalationQuery, learningQuery])

  const escalations = escalationResult.data ?? []
  const totalEscalations = escalations.length
  const pendingEscalations = escalations.filter((e) => e.status === 'pending').length
  const resolvedEscalations = escalations.filter((e) => e.status === 'resolved').length
  const learningEntries = learningResult.count ?? 0
  const resolutionRate = totalEscalations > 0 ? resolvedEscalations / totalEscalations : 0

  // Calculate average resolution time
  let avgResolutionTimeHours: number | null = null
  const resolvedWithTimes = escalations.filter(
    (e) => e.status === 'resolved' && e.created_at && e.resolved_at
  )
  if (resolvedWithTimes.length > 0) {
    const totalMs = resolvedWithTimes.reduce((sum, e) => {
      return sum + (new Date(e.resolved_at!).getTime() - new Date(e.created_at).getTime())
    }, 0)
    avgResolutionTimeHours = Math.round((totalMs / resolvedWithTimes.length / 3_600_000) * 10) / 10
  }

  // Top escalation reasons
  const reasonCounts = new Map<string, number>()
  for (const e of escalations) {
    const reason = e.reason ?? 'unknown'
    reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1)
  }
  const topEscalationReasons = [...reasonCounts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    totalEscalations,
    pendingEscalations,
    resolvedEscalations,
    learningEntries,
    resolutionRate,
    avgResolutionTimeHours,
    topEscalationReasons,
  }
}
