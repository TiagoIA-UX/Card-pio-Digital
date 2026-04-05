/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MAESTRO — Orquestrador de Agentes de Conversação e IA
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Parte do sistema de dois orquestradores da Zairyx:
 *
 *   MAESTRO (este arquivo)    — Agentes de IA voltados ao cliente
 *     ├── Zai IA              — Assistente de conversação no cardápio
 *     ├── Suporte             — Atendimento e resolução de dúvidas
 *     ├── Prospecção          — Qualificação e onboarding de leads
 *     └── Venda Direta        — Conversão B2B via IA
 *
 *   FORGE (lib/orchestrator.ts) — Agentes de Engenharia e DevOps
 *     ├── Scanner             — Detecta erros de TypeScript e lint
 *     ├── Surgeon             — Aplica correções automáticas via IA
 *     ├── Validator           — Health checks operacionais da plataforma
 *     └── Sentinel            — Monitoramento e alertas operacionais no Telegram
 *
 * ── Responsabilidades do MAESTRO ────────────────────────────────────────────
 *
 *  1. Gerenciar contexto de conversação por restaurante + sessão
 *  2. Rotear intenção do usuário para o agente correto
 *  3. Armazenar histórico de interações no Supabase
 *  4. Agendar follow-ups e notificações pós-conversa
 *  5. Escalar para humano quando confiança < limiar definido
 *
 * ── Diagrama de fluxo ────────────────────────────────────────────────────────
 *
 *   Cliente digita →  [MAESTRO]  →  detectIntent()
 *                          │
 *              ┌───────────┼──────────────┐
 *              ▼           ▼              ▼
 *         [Zai IA]    [Suporte]    [Prospecção]
 *        Cardápio     Dúvidas       Lead B2B
 *              │           │              │
 *              └───────────┼──────────────┘
 *                          ▼
 *                   buildResponse()
 *                          │
 *                          ▼
 *                   saveConversation()
 *                          │
 *                          ▼
 *              Response → Cliente / WhatsApp
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import Groq from 'groq-sdk'
import { createAdminClient } from '@/lib/shared/supabase/admin'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ChatAgentName = 'zai' | 'support' | 'prospecting' | 'direct_sale'

export type ConversationIntent =
  | 'order_query' // dúvida sobre pedido
  | 'menu_help' // ajuda com o cardápio
  | 'support_ticket' // problema técnico
  | 'lead_qualify' // prospect B2B interessado em assinar
  | 'general_chat' // conversa geral
  | 'unknown'

export interface ChatContext {
  restaurantId: string
  sessionId: string
  intent: ConversationIntent
  agent: ChatAgentName
  messages: { role: 'user' | 'assistant'; content: string }[]
  metadata?: Record<string, unknown>
}

export interface MaestroResult {
  response: string
  intent: ConversationIntent
  agent: ChatAgentName
  confidence: number
  escalated: boolean
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ESCALATE_CONFIDENCE_THRESHOLD = 0.45 // abaixo disso, escalar para humano
const MAX_CONTEXT_MESSAGES = 10 // janela de contexto da conversa

const INTENT_KEYWORDS: Record<ConversationIntent, string[]> = {
  order_query: ['pedido', 'entrega', 'acompanhar', 'rastrear', 'status do pedido'],
  menu_help: ['cardápio', 'produto', 'preço', 'ingrediente', 'opção', 'combo'],
  support_ticket: ['erro', 'problema', 'não funciona', 'bug', 'ajuda técnica'],
  lead_qualify: ['assinar', 'contratar', 'quanto custa', 'plano', 'cadastro', 'quero usar'],
  general_chat: ['olá', 'oi', 'obrigado', 'tudo bem'],
  unknown: [],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Detecta intenção do usuário por keywords. Retorna intent + confiança (0–1) */
export function detectIntent(message: string): { intent: ConversationIntent; confidence: number } {
  const lower = message.toLowerCase()
  let bestIntent: ConversationIntent = 'unknown'
  let bestScore = 0

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [
    ConversationIntent,
    string[],
  ][]) {
    if (keywords.length === 0) continue
    const matches = keywords.filter((kw) => lower.includes(kw)).length
    const score = matches / keywords.length
    if (score > bestScore) {
      bestScore = score
      bestIntent = intent
    }
  }

  return { intent: bestIntent, confidence: bestScore > 0 ? Math.min(bestScore * 2, 1) : 0.1 }
}

/** Seleciona o agente correto com base na intenção */
export function selectAgent(intent: ConversationIntent): ChatAgentName {
  const map: Record<ConversationIntent, ChatAgentName> = {
    order_query: 'zai',
    menu_help: 'zai',
    support_ticket: 'support',
    lead_qualify: 'prospecting',
    general_chat: 'zai',
    unknown: 'zai',
  }
  return map[intent]
}

// ── Core functions ────────────────────────────────────────────────────────────

/**
 * Ponto de entrada principal do MAESTRO.
 * Recebe uma mensagem, detecta intenção, seleciona agente e retorna resposta.
 */
export async function maestroDispatch(
  message: string,
  context: Omit<ChatContext, 'intent' | 'agent'>
): Promise<MaestroResult> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const { intent, confidence } = detectIntent(message)
  const agent = selectAgent(intent)
  const escalated = confidence < ESCALATE_CONFIDENCE_THRESHOLD

  // Janela de contexto — limitar histórico
  const recentMessages = context.messages.slice(-MAX_CONTEXT_MESSAGES)

  const systemPrompt = buildSystemPrompt(agent, context.restaurantId)

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      ...recentMessages,
      { role: 'user', content: message },
    ],
    temperature: agent === 'zai' ? 0.7 : 0.3,
    max_tokens: 512,
  })

  const response = completion.choices[0]?.message?.content ?? 'Desculpe, tente novamente.'

  // Persistir conversa no Supabase
  await saveConversationTurn({
    restaurantId: context.restaurantId,
    sessionId: context.sessionId,
    userMessage: message,
    assistantMessage: response,
    intent,
    agent,
    confidence,
    escalated,
    metadata: context.metadata,
  })

  return { response, intent, agent, confidence, escalated }
}

/** Monta o system prompt correto para cada agente */
function buildSystemPrompt(agent: ChatAgentName, restaurantId: string): string {
  const base = `Você é um assistente da plataforma Zairyx para deliverys. Restaurante ID: ${restaurantId}.`

  const prompts: Record<ChatAgentName, string> = {
    zai: `${base}
Seu nome é Zai. Você ajuda clientes a fazer pedidos, tirar dúvidas sobre o cardápio e fechar vendas.
Seja simpático, objetivo e sempre sugira combos quando pertinente.
Responda sempre em português do Brasil. Evite markdown excessivo.`,

    support: `${base}
Você é o Suporte Zairyx. Resolva problemas técnicos e dúvidas sobre a plataforma.
Seja preciso, empático e sempre ofereça uma solução ou próximo passo claro.
Se não souber a resposta, diga que vai escalar para a equipe humana.`,

    prospecting: `${base}
Você está conversando com um dono de delivery que tem interesse em assinar a Zairyx.
Qualifique o lead: pergunte sobre o faturamento mensal, se usa iFood, quantos pedidos por dia.
Mostre o valor: R$147/mês fixo, 0% comissão, IA 24h, cardápio pronto em 30min.
CTA: direcione para /precos ou /templates para começar o trial.`,

    direct_sale: `${base}
Você está fazendo uma venda direta B2B. Seja consultivo, mostre ROI claro.
Compare o custo iFood (15% + taxas) com Zairyx (R$147 fixo).
Foque no retorno: para R$8k/mês de faturamento, economiza ~R$1.300/mês.`,
  }

  return prompts[agent]
}

/** Salva um turno de conversa no Supabase */
async function saveConversationTurn(params: {
  restaurantId: string
  sessionId: string
  userMessage: string
  assistantMessage: string
  intent: ConversationIntent
  agent: ChatAgentName
  confidence: number
  escalated: boolean
  metadata?: Record<string, unknown>
}) {
  try {
    const supabase = createAdminClient()
    await supabase.from('chat_conversations').insert({
      restaurant_id: params.restaurantId,
      session_id: params.sessionId,
      user_message: params.userMessage,
      assistant_message: params.assistantMessage,
      intent: params.intent,
      agent_name: params.agent,
      confidence: params.confidence,
      escalated: params.escalated,
      metadata: params.metadata ?? {},
    })
  } catch {
    // Non-critical: falha silenciosa para não bloquear a resposta ao usuário
    // A tabela chat_conversations pode não existir ainda — criação em migration futura
  }
}
