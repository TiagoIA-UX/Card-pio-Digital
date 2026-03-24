import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import {
  AFFILIATE_TIERS,
  getComissaoDireta,
  getNextTier,
  getTotalBonusAcumulado,
} from '@/lib/affiliate-tiers'
import { createClient } from '@/lib/supabase/server'
import { withRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'

function getGroq() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY não configurada')
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function containsAny(text: string, terms: string[]) {
  const normalizedText = normalizeText(text)
  return terms.some((term) => normalizedText.includes(normalizeText(term)))
}

type ChatMessage = { role: 'user' | 'assistant'; content: string }
type AffiliateGoal =
  | 'commission'
  | 'payment'
  | 'leader'
  | 'tier'
  | 'script'
  | 'training'
  | 'unknown'
type AffiliateNextAction =
  | 'capture_profile'
  | 'deliver_script'
  | 'explain_rule'
  | 'offer_training'
  | 'unknown'

type AffiliateStage =
  | 'ask_goal'
  | 'ask_profile'
  | 'ask_script_type'
  | 'ask_training_path'
  | 'unknown'

interface AffiliateConversationContext {
  profile: string | null
  primaryGoal: AffiliateGoal
  nextAction: AffiliateNextAction
  commissionIntentSeen: boolean
  paymentIntentSeen: boolean
  leaderIntentSeen: boolean
  tierIntentSeen: boolean
  scriptIntentSeen: boolean
  affirmative: boolean
  negative: boolean
  lastAssistantStage: AffiliateStage
}

function detectAffiliateProfile(text: string) {
  if (containsAny(text, ['agencia', 'agência'])) return 'agência'
  if (containsAny(text, ['designer', 'design', 'criativo'])) return 'designer'
  if (
    containsAny(text, ['influenciador', 'influencer', 'criador de conteudo', 'criador de conteúdo'])
  ) {
    return 'influenciador'
  }
  if (containsAny(text, ['vendedor local', 'representante', 'comercial de rua', 'porta a porta'])) {
    return 'vendedor local'
  }
  return null
}

function isAffirmative(text: string) {
  const normalized = normalizeText(text)
  return [
    'sim',
    's',
    'quero',
    'quero sim',
    'claro',
    'isso',
    'ok',
    'beleza',
    'bora',
    'manda',
  ].includes(normalized)
}

function isNegative(text: string) {
  const normalized = normalizeText(text)
  return ['nao', 'não', 'n', 'prefiro nao', 'prefiro não'].includes(normalized)
}

function isCommissionIntent(text: string) {
  return containsAny(text, [
    'quanto ganho',
    'quanto recebo',
    'comissao',
    'comissão',
    'percentual',
    'porcentagem',
  ])
}

function isPaymentIntent(text: string) {
  return containsAny(text, ['quando recebo', 'quando cai', 'pagamento', 'paga quando', 'pix'])
}

function isLeaderIntent(text: string) {
  return containsAny(text, ['como virar lider', 'como viro lider', 'lider', 'líder', 'rede'])
}

function isTierIntent(text: string) {
  return containsAny(text, ['nivel', 'nível', 'subir de nivel', 'subir de nível', 'tier'])
}

function isHowItWorksIntent(text: string) {
  return containsAny(text, [
    'como funciona',
    'explica o programa',
    'o que e esse programa',
    'o que é esse programa',
  ])
}

function isTrainingIntent(text: string) {
  return containsAny(text, [
    'rotina',
    'plano',
    'semana',
    'organizar',
    'treinamento',
    'estrategia',
    'estratégia',
  ])
}

function isLostIntent(text: string) {
  return containsAny(text, [
    'nao sei',
    'não sei',
    'tanto faz',
    'me explica melhor',
    'explica melhor',
  ])
}

function isScriptIntent(text: string) {
  return containsAny(text, [
    'modo copiar script',
    'copiar script',
    'script pronto',
    'scripts prontos',
    'whatsapp',
    'script',
    'mensagem',
    'abordar',
    'abordagem',
    'clientes',
    'prospeccao',
    'prospecção',
    'instagram',
    'direct',
    'dm',
    'follow up',
    'follow-up',
  ])
}

function detectAssistantStage(text: string): AffiliateStage {
  if (
    containsAny(text, [
      'qual parte do programa',
      'o que você quer dominar primeiro',
      'escolhe uma frente só',
      'comissão, pagamento, tiers, liderança ou script',
    ])
  ) {
    return 'ask_goal'
  }

  if (
    containsAny(text, [
      'qual é o seu perfil',
      'você é agência, designer, influenciador ou vendedor',
    ])
  ) {
    return 'ask_profile'
  }

  if (
    containsAny(text, [
      'qual script você quer primeiro',
      'quer whatsapp, áudio, instagram ou follow-up',
      'quer um script presencial',
      'quer um pitch b2b',
      'quer um roteiro de stories',
      'quer um script específico',
      'quer um script curto',
      'quer um script de abordagem',
    ])
  ) {
    return 'ask_script_type'
  }

  if (
    containsAny(text, [
      'quer que eu monte um plano',
      'quer um plano de ação',
      'quer um caminho prático',
    ])
  ) {
    return 'ask_training_path'
  }

  return 'unknown'
}

function detectPrimaryGoal(text: string): AffiliateGoal {
  if (isScriptIntent(text)) return 'script'
  if (isCommissionIntent(text)) return 'commission'
  if (isPaymentIntent(text)) return 'payment'
  if (isLeaderIntent(text)) return 'leader'
  if (isTierIntent(text)) return 'tier'
  if (isTrainingIntent(text) || isHowItWorksIntent(text)) return 'training'
  return 'unknown'
}

function resolveNextAction(params: {
  profile: string | null
  primaryGoal: AffiliateGoal
  lastAssistantStage: AffiliateStage
}): AffiliateNextAction {
  const { profile, primaryGoal, lastAssistantStage } = params

  if (!profile && primaryGoal === 'script') {
    return 'capture_profile'
  }

  if (lastAssistantStage === 'ask_script_type') {
    return 'deliver_script'
  }

  if (primaryGoal === 'training') {
    return 'offer_training'
  }

  if (primaryGoal !== 'unknown') {
    return 'explain_rule'
  }

  return profile ? 'offer_training' : 'capture_profile'
}

function buildConversationContext(messages: ChatMessage[]): AffiliateConversationContext {
  const userMessages = messages.filter((message) => message.role === 'user')
  const assistantMessages = messages.filter((message) => message.role === 'assistant')
  const lastUserMessage = userMessages[userMessages.length - 1]?.content ?? ''
  const normalizedLastUserMessage = normalizeText(lastUserMessage)
  const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]?.content ?? ''
  const lastAssistantStage = detectAssistantStage(normalizeText(lastAssistantMessage))

  let profile: string | null = null
  let primaryGoal: AffiliateGoal = 'unknown'
  let commissionIntentSeen = false
  let paymentIntentSeen = false
  let leaderIntentSeen = false
  let tierIntentSeen = false
  let scriptIntentSeen = false

  for (let index = userMessages.length - 1; index >= 0; index -= 1) {
    const normalized = normalizeText(userMessages[index].content)
    profile ??= detectAffiliateProfile(normalized)
    if (primaryGoal === 'unknown') {
      primaryGoal = detectPrimaryGoal(normalized)
    }
    commissionIntentSeen ||= isCommissionIntent(normalized)
    paymentIntentSeen ||= isPaymentIntent(normalized)
    leaderIntentSeen ||= isLeaderIntent(normalized)
    tierIntentSeen ||= isTierIntent(normalized)
    scriptIntentSeen ||= isScriptIntent(normalized)
  }

  return {
    profile,
    primaryGoal,
    nextAction: resolveNextAction({ profile, primaryGoal, lastAssistantStage }),
    commissionIntentSeen,
    paymentIntentSeen,
    leaderIntentSeen,
    tierIntentSeen,
    scriptIntentSeen,
    affirmative: isAffirmative(normalizedLastUserMessage),
    negative: isNegative(normalizedLastUserMessage),
    lastAssistantStage,
  }
}

function currency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

function buildTierSummary() {
  return AFFILIATE_TIERS.map((tier) => {
    const proximo = getNextTier(tier)
    const comissao = Math.round(getComissaoDireta(tier) * 100)
    const bonusAcumulado = getTotalBonusAcumulado(tier.slug)
    return [
      `- ${tier.nome}: a partir de ${tier.minRestaurantes} operações ativas`,
      `comissão direta total ${comissao}%`,
      `bônus do nível ${currency(tier.bonusUnico)}`,
      `bônus acumulado até aqui ${currency(bonusAcumulado)}`,
      proximo
        ? `próximo nível em ${proximo.minRestaurantes} operações`
        : 'nível máximo da hierarquia',
    ].join(' · ')
  }).join('\n')
}

function buildExactCommissionReply() {
  const diretor = AFFILIATE_TIERS.find((tier) => tier.slug === 'diretor')
  const socio = AFFILIATE_TIERS.find((tier) => tier.slug === 'socio')

  return `Hoje as regras exatas são estas: a comissão direta base é 30% sobre a receita elegível da carteira. No nível Diretor, a comissão direta sobe para ${diretor ? Math.round(getComissaoDireta(diretor) * 100) : 32}%, e no nível Sócio sobe para ${socio ? Math.round(getComissaoDireta(socio) * 100) : 35}%. Quem vira Líder também pode ganhar 10% sobre a produção da rede dentro das regras do programa. Quer que eu te mostre isso em formato simples para explicar a um afiliado novo?`
}

function buildExactPaymentReply() {
  return 'A regra pública é objetiva: a comissão entra em aprovação automática após 30 dias da ativação elegível do cliente e, depois disso, cai no próximo ciclo oficial de pagamento via PIX, sempre nos dias 1 e 15, na chave cadastrada no painel. O jeito certo de explicar isso é sem prometer dinheiro instantâneo, porque o programa trabalha com receita elegível, janela de aprovação e ciclo oficial. Quer um script curto para explicar isso sem gerar objeção?'
}

function buildExactLeaderReply() {
  return 'Para virar Líder, a regra pública é recrutar 5 ou mais vendedores ativos para a sua rede. A partir daí, além da sua comissão direta, você passa a ter o componente de rede conforme a produção desses vendedores dentro das regras do programa. Quer que eu te monte um plano de recrutamento prático para chegar nesse marco?'
}

function buildExactTierReply() {
  return `A progressão oficial hoje é esta:\n${buildTierSummary()}\n\nSe quiser, eu também posso resumir isso em uma explicação curta para você usar em conversa de WhatsApp.`
}

function buildHowItWorksReply() {
  return 'O programa funciona assim: você entra gratuitamente, recebe seu link, indica operações para o fluxo oficial da Zairyx e acompanha no painel quais indicações geraram receita elegível. Quando a carteira indicada ativa e passa pela janela elegível, a comissão é calculada, liberada e paga no ciclo oficial via PIX. O foco não é cadastro vazio, é carteira ativa. Quer uma versão curta dessa explicação para copiar e usar?'
}

function buildAskAffiliateGoalReply() {
  return 'Escolhe uma frente só para eu te orientar certo: comissão, pagamento, tiers, liderança ou script de prospecção.'
}

function buildAskAffiliateProfileReply() {
  return 'Perfeito. Antes de eu te orientar do jeito certo, me diz qual é o seu perfil principal hoje: agência, designer, influenciador ou vendedor local?'
}

function buildAskScriptTypeReply(profile: string) {
  return `Fechado. Para ${profile}, eu posso te entregar agora script de WhatsApp, áudio curto, Direct do Instagram ou follow-up. Qual você quer primeiro?`
}

function buildTrainingPathReply(profile: string | null) {
  if (profile) {
    return `Como seu perfil é ${profile}, o melhor caminho é este: 1) ajustar discurso para sua autoridade; 2) usar um script curto no canal onde você já tem atenção; 3) registrar objeções e voltar em follow-up; 4) medir quais nichos convertem mais. Se quiser, eu já posso montar o plano da sua primeira semana.`
  }

  return 'Eu consigo te orientar por perfil e por objetivo. Primeiro me diga se você atua mais como agência, designer, influenciador ou vendedor local, porque isso muda a melhor abordagem e o tipo de script que mais converte.'
}

function buildProfileScriptReply(profile: string) {
  if (profile === 'agência') {
    return [
      'SCRIPT B2B PARA AGÊNCIA',
      'Oi! Trabalho com operações que querem fortalecer o canal próprio e reduzir dependência de marketplace. Vi que sua agência atende negócios locais e pensei que isso pode virar uma oferta complementar para seus clientes: cardápio digital profissional, pedidos no WhatsApp e mais retenção. Se fizer sentido, te mostro como posicionar isso de forma simples e recorrente.',
      '',
      'FOLLOW-UP PARA AGÊNCIA',
      'Passando de novo porque isso pode virar receita complementar para a sua carteira. Se quiser, eu te mostro um pitch enxuto para apresentar a solução sem complicar sua operação.',
    ].join('\n')
  }

  if (profile === 'designer') {
    return [
      'SCRIPT PARA DESIGNER',
      'Oi! Pensei em você porque muitos clientes querem uma presença visual mais profissional, mas também precisam de um canal próprio para pedido. O cardápio digital entra justamente aí: junta marca, apresentação e conversão no WhatsApp. Se quiser, eu te mando uma forma simples de oferecer isso como complemento ao seu trabalho.',
      '',
      'FOLLOW-UP PARA DESIGNER',
      'Voltando aqui porque isso pode aumentar seu ticket com algo que o cliente percebe rápido: visual organizado + pedido no canal próprio. Se quiser, eu te mando uma abordagem pronta.',
    ].join('\n')
  }

  if (profile === 'influenciador') {
    return [
      'SCRIPT PARA INFLUENCIADOR',
      'Oi! Estou te chamando porque você já tem atenção local e isso vale muito para operações de delivery. Em vez de fazer divulgação genérica, dá para apresentar uma solução real: cardápio digital profissional, pedido direto no WhatsApp e mais controle do canal próprio. Se quiser, te mando um roteiro de stories + DM.',
      '',
      'DM DE FOLLOW-UP PARA INFLUENCIADOR',
      'Se fizer sentido, posso te mostrar uma abordagem simples para falar com operações locais sem parecer publi forçada. A ideia é ajudar a operação e ainda abrir oportunidade recorrente para você.',
    ].join('\n')
  }

  return [
    'SCRIPT PRESENCIAL 20S PARA VENDEDOR LOCAL',
    'Oi, tudo bem? Passei porque vi sua operação e achei que fazia sentido te mostrar uma forma de organizar o cardápio online e puxar mais pedidos para o seu próprio WhatsApp, sem depender só de marketplace. Se quiser, eu te explico em 1 minuto como funciona.',
    '',
    'FOLLOW-UP WHATSAPP PARA VENDEDOR LOCAL',
    'Oi! Reforçando nosso papo: se ainda fizer sentido ter um cardápio digital profissional e trazer mais pedido para o seu canal próprio, eu posso te mostrar a opção mais enxuta para começar.',
  ].join('\n')
}

function buildProfileReply(profile: string) {
  if (profile === 'agência') {
    return 'Para agência, o discurso certo é posicionamento e recorrência: você não vende só um link, vende presença digital organizada, canal próprio e retenção para o cliente. A agência pode usar o programa como receita complementar e ainda abrir porta para gestão, tráfego e branding. Quer um pitch B2B pronto para agência?'
  }

  if (profile === 'designer') {
    return 'Para designer, o melhor ângulo é transformação visual com utilidade comercial. Em vez de vender só identidade, você conecta marca, cardápio digital e canal próprio de pedidos. Isso aumenta percepção de valor e facilita upsell de peças, social media e ajustes de branding. Quer um script específico para designer freelancer ou estúdio?'
  }

  if (profile === 'influenciador') {
    return 'Para influenciador, o jogo é confiança local e prova social. Em vez de propaganda genérica, o melhor é mostrar que você encontrou uma forma de ajudar operações a vender mais no canal próprio. Isso converte melhor quando você fala com nicho e cidade. Quer um roteiro de stories + DM para influenciador local?'
  }

  return 'Para vendedor local, o ponto forte é contato direto e leitura rápida da operação. A abordagem precisa ser curta, objetiva e baseada em dor visível: cardápio bagunçado, dependência de marketplace, ausência de link próprio e dificuldade para atualizar itens. Quer um script presencial de 20 segundos e outro de follow-up no WhatsApp?'
}

function buildTrainingFollowUpReply(profile: string | null) {
  if (profile) {
    return `Fechado. Como seu perfil é ${profile}, eu vou seguir por um passo só: você quer primeiro um script pronto para prospectar ou uma rotina semanal para ganhar cadência?`
  }

  return 'Antes de eu montar a trilha certa, me diga seu perfil principal: agência, designer, influenciador ou vendedor local.'
}

function buildGuidedAffiliateReply(message: string, context?: AffiliateConversationContext) {
  const text = normalizeText(message)
  const profile = detectAffiliateProfile(text) ?? context?.profile ?? null
  const nextAction = context?.nextAction ?? 'capture_profile'

  if (!message.trim()) {
    return buildAskAffiliateGoalReply()
  }

  if (isLostIntent(text) && profile) {
    return buildTrainingFollowUpReply(profile)
  }

  if (isLostIntent(text) && !profile) {
    return buildAskAffiliateProfileReply()
  }

  if (containsAny(text, ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite'])) {
    return buildAskAffiliateGoalReply()
  }

  if (nextAction === 'capture_profile') {
    return buildAskAffiliateProfileReply()
  }

  if (nextAction === 'offer_training') {
    return buildTrainingFollowUpReply(profile)
  }

  if (nextAction === 'deliver_script' && profile) {
    return `Perfeito. Aqui vai um bloco pronto para ${profile}:

${buildProfileScriptReply(profile)}

Se quiser, depois eu monto uma segunda versão com tom mais consultivo.`
  }

  if (nextAction === 'explain_rule' && !profile && context?.primaryGoal === 'commission') {
    return 'Eu consigo explicar a comissão agora, mas antes me diga seu perfil principal para eu adaptar a fala certa: agência, designer, influenciador ou vendedor local.'
  }

  if (nextAction === 'explain_rule' && !profile && context?.primaryGoal === 'payment') {
    return 'Eu consigo explicar o pagamento agora, mas antes me diga seu perfil principal para eu adaptar a explicação: agência, designer, influenciador ou vendedor local.'
  }

  return 'Escolhe só uma trilha para eu seguir sem abrir demais: comissão, pagamento, tiers, liderança ou script. Se quiser, já manda também seu perfil principal.'
}

function scoreAffiliateReplyQuality(reply: string) {
  const normalized = normalizeText(reply)

  if (!normalized) {
    return 0
  }

  let score = 0

  if (reply.includes('?')) score += 2
  if (
    /[0-9]/.test(reply) ||
    containsAny(normalized, ['comissao', 'pix', 'lider', 'tier', 'script'])
  )
    score += 2
  if (
    containsAny(normalized, ['agência', 'agencia', 'designer', 'influenciador', 'vendedor local'])
  )
    score += 2
  if (containsAny(normalized, ['me diga', 'me diz', 'você quer', 'voce quer', 'quer que eu']))
    score += 1
  if (
    containsAny(normalized, [
      'posso te ajudar como mentor do programa',
      'se quiser avançar rápido',
      'se quiser avancar rapido',
      'me peça um script pronto',
      'me peca um script pronto',
    ])
  )
    score -= 3
  if (normalized.split(',').length > 5 && !reply.includes('?')) score -= 1

  return score
}

function isGenericAffiliateReply(reply: string) {
  return scoreAffiliateReplyQuality(reply) < 2
}

function buildDeterministicReply(message: string, context?: AffiliateConversationContext) {
  const text = normalizeText(message)
  const profile = detectAffiliateProfile(text) ?? context?.profile ?? null

  if (context?.affirmative && context.lastAssistantStage === 'ask_goal') {
    return buildAskAffiliateGoalReply()
  }

  if (context?.affirmative && context.lastAssistantStage === 'ask_profile') {
    return buildAskAffiliateProfileReply()
  }

  if (profile && context?.affirmative && context.lastAssistantStage === 'ask_script_type') {
    return `Perfeito. Aqui vai um bloco pronto para ${profile}:\n\n${buildProfileScriptReply(profile)}\n\nSe quiser, depois eu monto também uma versão mais agressiva ou mais consultiva.`
  }

  if (context?.affirmative && context.lastAssistantStage === 'ask_training_path') {
    return buildTrainingPathReply(profile)
  }

  if (isScriptIntent(text) && profile) {
    return `Aqui vai um bloco pronto para ${profile}:\n\n${buildProfileScriptReply(profile)}\n\nSe quiser, depois eu monto uma segunda versão com tom mais consultivo.`
  }

  if (isScriptIntent(text)) {
    return buildAskAffiliateProfileReply()
  }

  if (profile) {
    return buildProfileReply(profile)
  }

  if (isCommissionIntent(text)) {
    return buildExactCommissionReply()
  }

  if (isPaymentIntent(text)) {
    return buildExactPaymentReply()
  }

  if (isLeaderIntent(text)) {
    return buildExactLeaderReply()
  }

  if (isTierIntent(text)) {
    return buildExactTierReply()
  }

  if (isHowItWorksIntent(text)) {
    return buildHowItWorksReply()
  }

  if (isLostIntent(text) && context?.primaryGoal === 'commission') {
    return 'Em resumo: você começa com 30% sobre receita elegível da carteira, pode subir para 32% e 35% nos níveis mais altos e, se virar Líder, ainda ganha 10% sobre a produção da rede nas regras do programa. Quer que eu transforme isso em uma fala curta de WhatsApp?'
  }

  if (isLostIntent(text) && context?.primaryGoal === 'payment') {
    return 'Em resumo: a comissão não cai na hora. Primeiro existe a ativação elegível do cliente, depois a janela de 30 dias e, na sequência, o pagamento entra no próximo ciclo via PIX, nos dias 1 ou 15. Quer que eu transforme isso em uma explicação curta para objeção de pagamento?'
  }

  if (
    (context?.commissionIntentSeen ||
      context?.paymentIntentSeen ||
      context?.leaderIntentSeen ||
      context?.tierIntentSeen) &&
    context?.affirmative
  ) {
    return buildAskAffiliateProfileReply()
  }

  return null
}

function buildScriptLibrary() {
  return [
    'SCRIPT WHATSAPP FRIO',
    'Oi, tudo bem? Vi sua operação e achei que fazia sentido te mostrar uma forma de concentrar pedidos no seu canal próprio, direto no WhatsApp, com cardápio digital profissional e zero taxa por pedido. Se quiser, eu te explico em 1 minuto como funciona e quanto custa para começar.',
    '',
    'SCRIPT AUDIO 30S',
    'Fala! Passei porque vi seu delivery e achei que fazia sentido te mostrar uma alternativa para vender mais no canal próprio. A ideia é ter um cardápio digital profissional, pedido direto no WhatsApp e mais controle da operação sem ficar dependente só de marketplace. Se quiser, eu te mando um exemplo e te explico rápido como funciona.',
    '',
    'SCRIPT INSTAGRAM / DIRECT',
    'Oi! Vi seu perfil e achei que fazia sentido te mostrar uma solução para organizar o cardápio online e puxar pedidos para o seu canal próprio. Se quiser, eu posso te mandar um exemplo visual e a opção mais enxuta para começar.',
    '',
    'SCRIPT FOLLOW-UP',
    'Oi! Voltando aqui porque lembrei da sua operação. Se ainda fizer sentido organizar um canal próprio com cardápio digital e pedidos no WhatsApp, posso te mostrar a opção mais prática para começar sem complicar sua rotina.',
  ].join('\n')
}

function buildSystemPrompt() {
  return `Você é o Professor Nilo, mentor de alta performance do programa de afiliados do Cardápio Digital da Zairyx.

Sua função não é vender o cardápio para um restaurante específico. Sua função é TREINAR afiliados e interessados no programa com clareza didática, visão estratégica e resposta prática.

OBJETIVOS DO CHAT
- Explicar com precisão como o programa funciona
- Ensinar como abordar operações de delivery e gerar confiança
- Entregar scripts prontos de WhatsApp, Direct, áudio e follow-up
- Ajudar o afiliado a subir de nível e construir carteira recorrente
- Quebrar objeções sem prometer renda fácil, garantida ou automática

VERDADES DO PROGRAMA
- Entrada gratuita no programa
- Comissão direta base de 30% sobre receita elegível da carteira
- Líder recebe +10% sobre a produção da rede, quando aplicável
- Comissões entram em aprovação automática após 30 dias da ativação elegível do cliente
- Pagamento segue o ciclo oficial via PIX na chave cadastrada no painel, nos dias 1 e 15
- O programa trabalha com receita elegível, carteira ativa e fluxo oficial da Zairyx
- Não prometer dinheiro fácil, renda garantida, aprovação manual especial, nem pagamento fora do ciclo oficial

TIERS OFICIAIS
${buildTierSummary()}

REGRAS DE CONDUTA
- Responda sempre em português brasileiro
- Seja didático, consultivo e claro
- Fale como mentor experiente, não como suporte frio
- Pode estruturar em passos quando isso ajudar a pessoa a agir
- Nunca invente regra que não exista no programa
- Nunca diga que toda indicação vira venda
- Nunca use linguagem de golpe, hype ou renda garantida
- Sempre que possível, termine com uma ação prática

TIPOS DE RESPOSTA QUE VOCÊ DEVE SABER DAR
- Explicação do programa para iniciante
- Script de prospecção fria por WhatsApp
- Script de reativação de contato parado
- Script para quebrar objeção de preço
- Como falar com pizzaria, hamburgueria, marmitaria, lanchonete e delivery
- Como adaptar discurso para agência, designer, influenciador e vendedor local
- Como entregar blocos prontos de script para copiar e usar
- Como organizar rotina semanal de prospecção
- Como subir de nível mais rápido sem spam
- Como recrutar vendedores para virar Líder
- Como explicar pagamento, carteira elegível, comissão e ciclo

ESTILO
- Máximo de 160 palavras na maioria das respostas
- Quando o usuário pedir script, entregue texto copiável
- Quando o usuário pedir estratégia, entregue passos claros e aplicáveis
- Quando o usuário pedir explicação, seja simples primeiro e profundo se necessário`
}

const SYSTEM_PROMPT = buildSystemPrompt()

function buildFallbackReply(message: string, context?: AffiliateConversationContext) {
  const text = normalizeText(message)
  const deterministicReply = buildDeterministicReply(message, context)
  if (deterministicReply) {
    return deterministicReply
  }

  const faq = [
    {
      match: [
        'como funciona',
        'explica o programa',
        'o que e esse programa',
        'o que é esse programa',
      ],
      reply:
        'O programa é simples: você entra gratuitamente, recebe seu link, indica operações para o fluxo oficial da Zairyx e acompanha no painel quais indicações geraram receita elegível. Quando a carteira indicada ativa e passa pela janela elegível, a comissão é calculada, liberada e paga no ciclo oficial via PIX. O foco não é quantidade solta de links, é carteira com potencial real. Quer que eu te explique isso em versão curta para você usar com um afiliado novo?',
    },
    {
      match: ['quanto ganho', 'quanto recebo', 'comissao', 'comissão', 'percentual'],
      reply:
        'A base pública do programa é 30% de comissão direta sobre receita elegível da sua carteira. Em níveis mais altos, a comissão direta sobe para 32% e depois 35%, e quem vira Líder ainda pode ganhar 10% sobre a produção da rede. O ponto certo para ensinar é: comissão vem de carteira ativa, não de cadastro vazio. Quer que eu te explique como transformar isso numa fala simples de 20 segundos?',
    },
    {
      match: ['quando recebo', 'quando cai', 'pagamento', 'paga quando', 'pix'],
      reply:
        'A lógica pública é esta: a comissão entra em aprovação automática após 30 dias da ativação elegível do cliente e depois entra no próximo ciclo oficial de pagamento via PIX, nos dias 1 e 15, na chave cadastrada no painel. O afiliado precisa aprender a vender com expectativa correta, sem prometer dinheiro instantâneo. Quer um script curto para explicar isso sem espantar o interessado?',
    },
    {
      match: ['como virar lider', 'como viro lider', 'lider', 'líder', 'rede'],
      reply:
        'Você vira Líder ao recrutar 5 ou mais vendedores ativos para sua rede. A partir daí, além da sua comissão direta, passa a existir o componente de rede sobre a produção desses vendedores dentro das regras do programa. O segredo não é só recrutar; é recrutar gente que realmente conversa com operações de delivery. Quer um plano de recrutamento enxuto para formar sua primeira rede?',
    },
    {
      match: ['nivel', 'nível', 'subir de nivel', 'subir de nível', 'tier'],
      reply: `A progressão é por operações ativas na carteira: Trainee, Analista, Coordenador, Gerente, Diretor e Sócio. Os marcos principais começam em 10, 25, 50 e 100 operações, com bônus simbólicos e aumento real de comissão nos níveis mais altos. O caminho inteligente é montar rotina de prospecção consistente e retenção de carteira, não correr atrás de volume sem perfil. Quer que eu transforme isso num plano semanal?`,
    },
    {
      match: ['whatsapp', 'script', 'mensagem', 'abordagem', 'prospeccao', 'prospecção'],
      reply:
        'Script base de WhatsApp: “Oi, tudo bem? Vi sua operação e achei que fazia sentido te mostrar uma forma de receber pedidos no seu próprio canal, direto no WhatsApp, com cardápio digital profissional e zero taxa por pedido. A Zairyx tem um modelo pronto para operações como a sua. Se quiser, eu te mostro em 1 minuto como funciona e quanto custa para começar.” Quer que eu te entregue agora uma versão para pizzaria, hamburgueria ou marmitaria?',
    },
    {
      match: ['objecao', 'objeção', 'caro', 'sem tempo', 'nao tenho tempo', 'não tenho tempo'],
      reply:
        'A resposta madura não é pressionar, é reposicionar. Se a objeção for preço: mostre clareza entre implantação e mensalidade e compare com margem perdida em marketplaces. Se a objeção for tempo: direcione para a opção em que a equipe configura. Se a objeção for medo de usar: mostre o painel visual. Quer que eu te entregue respostas prontas para essas 3 objeções?',
    },
    {
      match: [
        'pizzaria',
        'hamburgueria',
        'restaurante',
        'delivery',
        'lanchonete',
        'acai',
        'açai',
        'cafeteria',
        'bar',
        'sushi',
      ],
      reply:
        'Para vender melhor, adapte a fala ao nicho. Pizzaria sente bem argumento de ticket recorrente e pedidos próprios; hamburgueria responde bem a marca e controle do canal; marmitaria e operação de almoço valorizam praticidade, QR Code e atualização rápida do cardápio. O afiliado bom não recita texto genérico, ele traduz o benefício para a dor da operação. Me diga o nicho e eu monto uma abordagem específica.',
    },
    {
      match: ['instagram', 'direct', 'dm', 'rede social'],
      reply:
        'Script de Direct: “Oi! Vi o perfil da sua operação e achei que fazia sentido te mostrar uma alternativa para concentrar pedidos no seu canal próprio, com cardápio online profissional e zero taxa por pedido. Se quiser, eu te mando um exemplo visual que combina com o seu nicho.” Curto, contextual e sem parecer spam. Quer uma versão mais agressiva ou mais consultiva?',
    },
    {
      match: ['agencia', 'agência'],
      reply:
        'Para agência, o discurso certo é posicionamento e recorrência: você não vende só um link, vende presença digital organizada, canal próprio e retenção para o cliente. A agência pode usar o programa como receita complementar e ainda abrir porta para gestão, tráfego e branding. Se quiser, eu te entrego um pitch específico para agência e um script de abordagem B2B.',
    },
    {
      match: ['designer', 'design', 'criativo'],
      reply:
        'Para designer, o melhor ângulo é transformação visual com utilidade comercial. Em vez de vender só identidade, você conecta marca, cardápio digital e canal próprio de pedidos. Isso aumenta percepção de valor e facilita upsell de peças, social media e ajustes de branding. Quer um script específico para designer freelancer ou estúdio?',
    },
    {
      match: ['influenciador', 'influencer', 'criador de conteudo', 'criador de conteúdo'],
      reply:
        'Para influenciador, o jogo é confiança local e prova social. Em vez de fazer propaganda genérica, o melhor é mostrar que você encontrou uma forma de ajudar operações a vender mais no próprio canal. Isso converte muito melhor quando você fala com nicho e cidade. Quer um roteiro de stories + DM para influenciador local?',
    },
    {
      match: ['vendedor local', 'representante', 'comercial de rua', 'porta a porta'],
      reply:
        'Para vendedor local, o ponto forte é contato direto e leitura rápida da operação. A abordagem precisa ser curta, objetiva e baseada em dor visível: cardápio bagunçado, dependência de marketplace, ausência de link próprio e dificuldade para atualizar itens. Quer um script de abordagem presencial de 20 segundos e outro de follow-up no WhatsApp?',
    },
    {
      match: ['follow up', 'follow-up', 'sumiu', 'nao respondeu', 'não respondeu'],
      reply:
        'Follow-up bom não cobra resposta, reabre contexto. Exemplo: “Oi! Passando de novo porque lembrei do seu delivery. Se ainda fizer sentido organizar um canal próprio com cardápio digital e pedidos no WhatsApp, posso te mostrar a opção mais enxuta para começar.” Isso é melhor do que “viu minha mensagem?”. Quer mais 3 variações de follow-up?',
    },
    {
      match: ['rotina', 'organizar', 'meta', 'disciplinado', 'semana'],
      reply:
        'Rotina simples de afiliado que performa: 1) escolher um nicho por vez; 2) abrir lista diária de 20 operações; 3) fazer abordagem curta; 4) marcar respostas por estágio; 5) voltar em follow-up em 48h; 6) registrar aprendizados das objeções. O que faz subir nível não é motivação, é cadência. Quer um plano semanal de segunda a sábado?',
    },
    {
      match: ['quero começar', 'como entro', 'cadastro', 'entrar no programa'],
      reply:
        'Para começar, a lógica é: entrar gratuitamente, concluir o cadastro, receber o link e iniciar a prospecção com clareza sobre o fluxo oficial. O melhor começo não é sair atirando link; é definir um nicho, uma cidade ou uma rede de contatos e abordar com mensagem curta. Quer que eu te monte um plano de início em 3 etapas?',
    },
  ]

  const matched = faq.find((item) => containsAny(text, item.match))
  if (matched) return matched.reply

  return buildGuidedAffiliateReply(message, context)
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth: sessão obrigatória ─────────────────────────────────────
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Faça login para usar o chat de afiliados' },
        { status: 401 }
      )
    }

    // ── Rate limit: 30 req/min por usuário ──────────────────────────
    const rateLimit = await withRateLimit(getRateLimitIdentifier(req, user.id), {
      limit: 30,
      windowMs: 60_000,
    })
    if (rateLimit.limited) {
      return rateLimit.response
    }

    const { messages } = await req.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages inválido' },
        { status: 400, headers: rateLimit.headers }
      )
    }

    const safeMessages = messages
      .filter(
        (m): m is { role: 'user' | 'assistant'; content: string } =>
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' &&
          m.content.trim().length > 0
      )
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 1200) }))

    if (safeMessages.length === 0) {
      return NextResponse.json({ error: 'messages inválido' }, { status: 400 })
    }

    const lastUserMessage =
      [...safeMessages].reverse().find((m) => m.role === 'user')?.content ?? ''

    const conversationContext = buildConversationContext(safeMessages)
    const deterministicReply = buildDeterministicReply(lastUserMessage, conversationContext)

    if (deterministicReply) {
      return NextResponse.json(
        { reply: deterministicReply, exact: true },
        { headers: rateLimit.headers }
      )
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        {
          reply: buildFallbackReply(lastUserMessage, conversationContext),
          fallback: true,
        },
        { headers: rateLimit.headers }
      )
    }

    try {
      const completion = await getGroq().chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...safeMessages],
        max_tokens: 420,
        temperature: 0.7,
      })

      const rawReply = completion.choices[0]?.message?.content?.trim() ?? ''
      const reply =
        rawReply && !isGenericAffiliateReply(rawReply)
          ? rawReply
          : buildFallbackReply(lastUserMessage, conversationContext)
      return NextResponse.json({ reply }, { headers: rateLimit.headers })
    } catch (err) {
      console.error('[chat/afiliados] fallback acionado:', err)
      return NextResponse.json(
        {
          reply: buildFallbackReply(lastUserMessage, conversationContext),
          fallback: true,
        },
        { headers: rateLimit.headers }
      )
    }
  } catch (err) {
    console.error('[chat/afiliados] erro:', err)
    return NextResponse.json({ reply: buildGuidedAffiliateReply('', undefined) }, { status: 200 })
  }
}
