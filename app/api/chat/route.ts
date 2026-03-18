import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { PUBLIC_SUBSCRIPTION_PRICES, TEMPLATE_PRICING, type TemplatePricing } from '@/lib/pricing'
import type { RestaurantTemplateSlug } from '@/lib/restaurant-customization'
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
type SalesGoal = 'price' | 'payment' | 'deadline' | 'template' | 'start' | 'unknown'
type SalesNextAction =
  | 'capture_niche'
  | 'show_exact_price'
  | 'show_template'
  | 'explain_deadline'
  | 'explain_payment'
  | 'capture_edit_preference'
  | 'send_checkout'
  | 'unknown'

type AssistantStage =
  | 'ask_niche'
  | 'ask_price_or_templates'
  | 'ask_experience'
  | 'ask_plan_fit'
  | 'unknown'

interface ConversationContext {
  templateSlug: RestaurantTemplateSlug | null
  businessType: string | null
  primaryGoal: SalesGoal
  nextAction: SalesNextAction
  priceIntentSeen: boolean
  paymentIntentSeen: boolean
  deadlineIntentSeen: boolean
  templateIntentSeen: boolean
  affirmative: boolean
  negative: boolean
  lastAssistantStage: AssistantStage
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function isAffirmative(text: string) {
  const normalized = normalizeText(text)
  return [
    'sim',
    's',
    'quero',
    'quero sim',
    'pode ser',
    'isso',
    'claro',
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

function isPriceIntent(text: string) {
  return containsAny(text, [
    'quanto',
    'quanto custa',
    'preco',
    'preço',
    'valor',
    'investimento',
    'mensalidade',
    'quanto fica',
    'quanto sai',
  ])
}

function isPaymentIntent(text: string) {
  return containsAny(text, [
    'forma de pagamento',
    'formas de pagamento',
    'aceita pix',
    'aceita boleto',
    'aceita cartao',
    'aceita cartão',
    'parcelar',
    'parcelado',
    'parcelas',
    'meio de pagamento',
  ])
}

function isDeadlineIntent(text: string) {
  return containsAny(text, [
    'prazo',
    'quanto tempo',
    'demora',
    'quando fica pronto',
    'quanto tempo demora',
    'publicacao',
    'publicação',
    'ativacao',
    'ativação',
    'entrega',
  ])
}

function isTemplateIntent(text: string) {
  return containsAny(text, [
    'qual template',
    'qual modelo',
    'que template',
    'que modelo',
    'template de',
    'modelo de',
    'tem template',
    'tem modelo',
  ])
}

function isStartIntent(text: string) {
  return containsAny(text, [
    'quero comecar',
    'quero começar',
    'quero fechar',
    'fechar hoje',
    'comprar',
    'contratar',
    'assinar',
    'vamos fechar',
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

function isOffFlowIntent(text: string) {
  return containsAny(text, ['fazem site', 'tem app', 'aplicativo', 'app proprio', 'app próprio'])
}

function detectTemplateSlug(text: string): RestaurantTemplateSlug | null {
  const templateMatchers: Array<{ slug: RestaurantTemplateSlug; terms: string[] }> = [
    { slug: 'acai', terms: ['acai', 'açai', 'acaiteria', 'açaiteria'] },
    {
      slug: 'lanchonete',
      terms: ['lanchonete', 'lanche', 'salgado', 'hamburgueria', 'hamburguer', 'burger'],
    },
    {
      slug: 'restaurante',
      terms: [
        'restaurante',
        'self service',
        'self-service',
        'prato feito',
        'marmitaria',
        'marmita',
      ],
    },
    { slug: 'cafeteria', terms: ['cafeteria', 'cafe', 'café'] },
    { slug: 'bar', terms: ['bar', 'drink', 'cerveja'] },
    { slug: 'pizzaria', terms: ['pizzaria', 'pizza'] },
    { slug: 'sushi', terms: ['sushi', 'japones', 'japones', 'temaki'] },
    { slug: 'adega', terms: ['adega', 'bebida', 'vinho', 'destilado'] },
    {
      slug: 'mercadinho',
      terms: ['mercadinho', 'minimercado', 'conveniencia', 'conveniência', 'mercearia'],
    },
    { slug: 'padaria', terms: ['padaria', 'confeitaria', 'pão', 'pao', 'panificadora'] },
    { slug: 'sorveteria', terms: ['sorveteria', 'sorvete', 'gelateria', 'picolé', 'picole'] },
    { slug: 'acougue', terms: ['acougue', 'açougue', 'casa de carne', 'churrasco', 'carne'] },
    {
      slug: 'hortifruti',
      terms: ['hortifruti', 'sacolao', 'sacolão', 'feira', 'frutas', 'verduras'],
    },
    { slug: 'petshop', terms: ['petshop', 'pet shop', 'pet', 'racao', 'ração'] },
    { slug: 'doceria', terms: ['doceria', 'doce', 'brigadeiro', 'bolo', 'cake'] },
  ]

  const matched = templateMatchers.find((item) => containsAny(text, item.terms))
  return matched?.slug ?? null
}

function getTemplateLabel(templateSlug: RestaurantTemplateSlug) {
  const templateLabelMap: Record<RestaurantTemplateSlug, string> = {
    acai: 'Açaí',
    lanchonete: 'Lanchonete / Hamburgueria',
    restaurante: 'Restaurante / Marmitaria',
    cafeteria: 'Cafeteria',
    bar: 'Bar / Pub',
    pizzaria: 'Pizzaria',
    sushi: 'Japonês / Sushi',
    adega: 'Adega / Delivery de Bebidas',
    mercadinho: 'Mercadinho / Minimercado',
    padaria: 'Padaria / Confeitaria',
    sorveteria: 'Sorveteria',
    acougue: 'Açougue / Casa de Carnes',
    hortifruti: 'Hortifruti',
    petshop: 'Petshop',
    doceria: 'Doceria / Confeitaria',
  }

  return templateLabelMap[templateSlug]
}

function detectAssistantStage(text: string): AssistantStage {
  if (containsAny(text, ['qual é o seu nicho', 'tipo de delivery', 'me diga o nicho'])) {
    return 'ask_niche'
  }

  if (containsAny(text, ['quer ver preço ou templates', 'quer ver preço ou o template'])) {
    return 'ask_price_or_templates'
  }

  if (
    containsAny(text, [
      'você já tem familiaridade para editar',
      'você já tem familiaridade',
      'você tem familiaridade',
    ])
  ) {
    return 'ask_experience'
  }

  if (
    containsAny(text, [
      'qual das duas opções faz mais sentido',
      'indique o plano certo',
      'opção mais adequada',
    ])
  ) {
    return 'ask_plan_fit'
  }

  return 'unknown'
}

function detectPrimaryGoal(text: string): SalesGoal {
  if (isPriceIntent(text)) return 'price'
  if (isPaymentIntent(text)) return 'payment'
  if (isDeadlineIntent(text)) return 'deadline'
  if (isTemplateIntent(text)) return 'template'
  if (isStartIntent(text)) return 'start'
  return 'unknown'
}

function resolveNextAction(params: {
  templateSlug: RestaurantTemplateSlug | null
  primaryGoal: SalesGoal
  lastAssistantStage: AssistantStage
}): SalesNextAction {
  const { templateSlug, primaryGoal, lastAssistantStage } = params

  if (!templateSlug) {
    return 'capture_niche'
  }

  if (lastAssistantStage === 'ask_experience') {
    return 'capture_edit_preference'
  }

  if (primaryGoal === 'template') {
    return 'show_template'
  }

  if (primaryGoal === 'payment') {
    return 'explain_payment'
  }

  if (primaryGoal === 'deadline') {
    return 'explain_deadline'
  }

  if (primaryGoal === 'start') {
    return 'send_checkout'
  }

  return 'show_exact_price'
}

function buildConversationContext(messages: ChatMessage[]): ConversationContext {
  const userMessages = messages.filter((message) => message.role === 'user')
  const assistantMessages = messages.filter((message) => message.role === 'assistant')
  const lastUserMessage = userMessages[userMessages.length - 1]?.content ?? ''
  const normalizedLastUserMessage = normalizeText(lastUserMessage)
  const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]?.content ?? ''
  const lastAssistantStage = detectAssistantStage(normalizeText(lastAssistantMessage))

  let templateSlug: RestaurantTemplateSlug | null = null
  let businessType: string | null = null
  let primaryGoal: SalesGoal = 'unknown'
  let priceIntentSeen = false
  let paymentIntentSeen = false
  let deadlineIntentSeen = false
  let templateIntentSeen = false

  for (let index = userMessages.length - 1; index >= 0; index -= 1) {
    const normalized = normalizeText(userMessages[index].content)
    templateSlug ??= detectTemplateSlug(normalized)
    businessType ??= detectBusinessType(normalized)
    if (primaryGoal === 'unknown') {
      primaryGoal = detectPrimaryGoal(normalized)
    }
    priceIntentSeen ||= isPriceIntent(normalized)
    paymentIntentSeen ||= isPaymentIntent(normalized)
    deadlineIntentSeen ||= isDeadlineIntent(normalized)
    templateIntentSeen ||= isTemplateIntent(normalized)
  }

  return {
    templateSlug,
    businessType,
    primaryGoal,
    nextAction: resolveNextAction({ templateSlug, primaryGoal, lastAssistantStage }),
    priceIntentSeen,
    paymentIntentSeen,
    deadlineIntentSeen,
    templateIntentSeen,
    affirmative: isAffirmative(normalizedLastUserMessage),
    negative: isNegative(normalizedLastUserMessage),
    lastAssistantStage,
  }
}

function buildExactTemplatePriceReply(templateSlug: RestaurantTemplateSlug) {
  const pricing = TEMPLATE_PRICING[templateSlug]
  const label = getTemplateLabel(templateSlug)

  return `Para ${label}, o valor exato hoje é este: Você configura custa ${formatCurrency(pricing.selfService.pix)} no Pix ou ${formatCurrency(pricing.selfService.card)} no cartão, com continuidade de ${formatCurrency(pricing.selfService.monthly)}/mês. Se preferir a equipe configurando tudo, o valor é ${formatCurrency(pricing.feitoPraVoce.pix)} no Pix ou ${formatCurrency(pricing.feitoPraVoce.card)} no cartão, com continuidade de ${formatCurrency(pricing.feitoPraVoce.monthly)}/mês. Agora me diz: você já tem familiaridade para editar fotos, preços e produtos em painel ou prefere que a equipe faça tudo para você?`
}

function buildExactTemplateIdentityReply(templateSlug: RestaurantTemplateSlug) {
  return `Para esse nicho, o template correspondente é ${getTemplateLabel(templateSlug)}. Se quiser, eu já posso te passar o valor exato no Pix, no cartão e a mensalidade dessa opção.`
}

function buildExactPaymentReply() {
  return 'As formas de pagamento aceitas hoje são estas: Pix, boleto bancário, cartão de crédito em até 12x, cartão de débito e carteira Mercado Pago. Se você quiser o menor valor total, o Pix é a opção mais econômica. Quer que eu te diga o valor exato no Pix para o seu template?'
}

function buildExactDeadlineReply() {
  return 'O prazo funciona assim: na opção em que a equipe configura, a publicação acontece em até 2 dias úteis após o envio completo das informações do onboarding. Na opção Você configura, você recebe acesso ao painel para avançar no seu ritmo. Quer que eu te indique a rota mais rápida ou a mais econômica?'
}

function buildAskNicheReply() {
  return 'Perfeito. Para eu te passar o valor certo e indicar o plano ideal, me diga só o nicho da sua operação: Açaí, pizzaria, hamburgueria, marmitaria/restaurante, cafeteria, bar ou sushi.'
}

function buildAskExperienceReply(templateSlug: RestaurantTemplateSlug) {
  return `Perfeito. Para ${getTemplateLabel(templateSlug)}, agora me diz uma coisa: você já tem familiaridade para editar fotos, preços e produtos em painel? Se sim, a opção Você configura costuma encaixar melhor. Se não, a equipe configura tende a ser a melhor rota.`
}

function buildPlanRecommendationReply(templateSlug: RestaurantTemplateSlug, userCanEdit: boolean) {
  const pricing = TEMPLATE_PRICING[templateSlug]

  if (userCanEdit) {
    return `Como você consegue editar, a opção mais indicada para ${getTemplateLabel(templateSlug)} é Você configura. O valor exato é ${formatCurrency(pricing.selfService.pix)} no Pix ou ${formatCurrency(pricing.selfService.card)} no cartão, com continuidade de ${formatCurrency(pricing.selfService.monthly)}/mês. Ela costuma fazer mais sentido para quem quer economizar e tem autonomia para mexer no painel. Quer que eu te passe o link certo para começar?`
  }

  return `Como você prefere não editar, a opção mais indicada para ${getTemplateLabel(templateSlug)} é a equipe configurar tudo para você. O valor exato é ${formatCurrency(pricing.feitoPraVoce.pix)} no Pix ou ${formatCurrency(pricing.feitoPraVoce.card)} no cartão, com continuidade de ${formatCurrency(pricing.feitoPraVoce.monthly)}/mês. Ela faz mais sentido para quem quer acelerar e entrar no ar com menos fricção. Quer que eu te mande o caminho mais direto para fechar?`
}

function buildClarifyPlanFitReply(templateSlug: RestaurantTemplateSlug) {
  return `Para ${getTemplateLabel(templateSlug)}, eu vou simplificar em uma escolha só: você quer economizar e editar pelo painel, ou quer ganhar tempo e deixar a equipe montar a implantação inicial?`
}

function buildStartCheckoutReply(templateSlug: RestaurantTemplateSlug) {
  return `Perfeito. Para ${getTemplateLabel(templateSlug)}, eu já consigo te levar para o fechamento certo. Antes de eu te apontar a rota final, você quer a opção mais econômica ou a opção com implantação feita pela equipe?`
}

function buildOffFlowReply() {
  return 'Hoje o foco principal aqui é cardápio digital com pedido direto no WhatsApp, link próprio e operação sem comissão por pedido no cardápio. Se o seu objetivo é vender mais no canal próprio, me diga o nicho da operação e eu te levo para a melhor rota.'
}

function buildGuidedSalesReply(message: string, context?: ConversationContext) {
  const normalized = normalizeText(message)
  const templateSlug = detectTemplateSlug(normalized) ?? context?.templateSlug ?? null
  const nextAction = context?.nextAction ?? 'capture_niche'

  if (!message.trim()) {
    return 'Vamos direto ao ponto: me diga o nicho da sua operação e eu sigo com a resposta certa. Pode ser Açaí, pizzaria, hamburgueria, marmitaria/restaurante, cafeteria, bar ou sushi.'
  }

  if (isOffFlowIntent(normalized)) {
    return buildOffFlowReply()
  }

  if (
    isLostIntent(normalized) &&
    templateSlug &&
    context?.lastAssistantStage === 'ask_experience'
  ) {
    return buildClarifyPlanFitReply(templateSlug)
  }

  if (isLostIntent(normalized) && !templateSlug) {
    return buildAskNicheReply()
  }

  if (containsAny(normalized, ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite'])) {
    return buildAskNicheReply()
  }

  if (containsAny(normalized, ['quanto', 'quero']) && !templateSlug) {
    return buildAskNicheReply()
  }

  if (!templateSlug || nextAction === 'capture_niche') {
    return buildAskNicheReply()
  }

  if (nextAction === 'show_template') {
    return buildExactTemplateIdentityReply(templateSlug)
  }

  if (nextAction === 'explain_payment') {
    return buildExactPaymentReply()
  }

  if (nextAction === 'explain_deadline') {
    return buildExactDeadlineReply()
  }

  if (nextAction === 'send_checkout') {
    return buildStartCheckoutReply(templateSlug)
  }

  if (nextAction === 'capture_edit_preference') {
    return buildClarifyPlanFitReply(templateSlug)
  }

  return buildExactTemplatePriceReply(templateSlug)
}

function scoreSalesReplyQuality(reply: string) {
  const normalized = normalizeText(reply)

  if (!normalized) {
    return 0
  }

  let score = 0

  if (reply.includes('?')) score += 2
  if (
    /[0-9]/.test(reply) ||
    normalized.includes('pix') ||
    normalized.includes('cartao') ||
    normalized.includes('template')
  )
    score += 2
  if (
    containsAny(normalized, [
      'acai',
      'pizzaria',
      'hamburgueria',
      'marmitaria',
      'cafeteria',
      'bar',
      'sushi',
    ])
  )
    score += 2
  if (containsAny(normalized, ['me diga', 'me diz', 'você quer', 'voce quer', 'quer que eu']))
    score += 1
  if (
    containsAny(normalized, [
      'consigo te ajudar',
      'posso te ajudar com',
      'se quiser começar rápido',
      'se quiser comecar rapido',
    ])
  )
    score -= 3
  if (normalized.split(',').length > 4 && !reply.includes('?')) score -= 1

  return score
}

function isGenericSalesReply(reply: string) {
  return scoreSalesReplyQuality(reply) < 2
}

function buildDeterministicReply(message: string, context?: ConversationContext) {
  const normalized = normalizeText(message)
  const templateSlug = detectTemplateSlug(normalized) ?? context?.templateSlug ?? null

  if (
    templateSlug &&
    isLostIntent(normalized) &&
    context?.lastAssistantStage === 'ask_experience'
  ) {
    return buildClarifyPlanFitReply(templateSlug)
  }

  if (!templateSlug && context?.affirmative && context.lastAssistantStage === 'ask_niche') {
    return buildAskNicheReply()
  }

  if (
    templateSlug &&
    context?.affirmative &&
    context.lastAssistantStage === 'ask_price_or_templates'
  ) {
    return buildExactTemplatePriceReply(templateSlug)
  }

  if (templateSlug && context?.affirmative && context.lastAssistantStage === 'ask_plan_fit') {
    return buildAskExperienceReply(templateSlug)
  }

  if (templateSlug && context?.affirmative && context.lastAssistantStage === 'ask_experience') {
    return buildPlanRecommendationReply(templateSlug, true)
  }

  if (templateSlug && context?.negative && context.lastAssistantStage === 'ask_experience') {
    return buildPlanRecommendationReply(templateSlug, false)
  }

  if (templateSlug && (isStartIntent(normalized) || context?.primaryGoal === 'start')) {
    return buildStartCheckoutReply(templateSlug)
  }

  if (templateSlug && isPriceIntent(normalized)) {
    return buildExactTemplatePriceReply(templateSlug)
  }

  if (isPaymentIntent(normalized)) {
    return buildExactPaymentReply()
  }

  if (isDeadlineIntent(normalized)) {
    return buildExactDeadlineReply()
  }

  if (templateSlug && isTemplateIntent(normalized)) {
    return buildExactTemplateIdentityReply(templateSlug)
  }

  if (
    !templateSlug &&
    (isPriceIntent(normalized) || (context?.priceIntentSeen && context?.affirmative))
  ) {
    return buildAskNicheReply()
  }

  if (
    templateSlug &&
    context?.priceIntentSeen &&
    detectTemplateSlug(normalized) &&
    !isPriceIntent(normalized)
  ) {
    return buildExactTemplatePriceReply(templateSlug)
  }

  return null
}

function detectBusinessType(text: string) {
  if (containsAny(text, ['pizzaria', 'pizza'])) return 'pizzaria'
  if (containsAny(text, ['hamburgueria', 'hamburguer', 'burger'])) return 'hamburgueria'
  if (containsAny(text, ['restaurante', 'self service', 'self-service', 'prato feito'])) {
    return 'operação de alimentação'
  }
  if (containsAny(text, ['lanchonete', 'lanche', 'salgado'])) return 'lanchonete'
  if (containsAny(text, ['acai', 'açai'])) return 'açaiteria'
  if (containsAny(text, ['cafeteria', 'cafe', 'café'])) return 'cafeteria'
  if (containsAny(text, ['bar', 'cerveja', 'drink'])) return 'bar'
  if (containsAny(text, ['sushi', 'japones', 'japones', 'temaki'])) return 'sushi'
  if (containsAny(text, ['delivery'])) return 'delivery'
  return null
}

function getMinimumSetupPrices() {
  const pricing = Object.values(TEMPLATE_PRICING) as TemplatePricing[]

  return {
    selfServicePixMin: Math.min(...pricing.map((item) => item.selfService.pix)),
    feitoPraVocePixMin: Math.min(...pricing.map((item) => item.feitoPraVoce.pix)),
  }
}

function buildSystemPrompt() {
  const { selfServicePixMin, feitoPraVocePixMin } = getMinimumSetupPrices()
  const selfServiceMonthly = PUBLIC_SUBSCRIPTION_PRICES.basico.monthly
  const feitoPraVoceMonthly = PUBLIC_SUBSCRIPTION_PRICES.pro.monthly

  return `Você é o Cadu, assistente comercial especialista do Cardápio Digital — a plataforma que transforma o delivery de restaurantes, pizzarias, hamburguerias, lanchonetes, açaiterias, cafeterias e quiosques. Seu único objetivo é VENDER: responder dúvidas, apresentar benefícios e empurrar o visitante para a compra.

## PRODUTO
Cardápio Digital é uma plataforma SaaS brasileira onde o dono do negócio cria e edita o cardápio online pelo painel (sem precisar de programador), recebe pedidos diretamente no WhatsApp e fatura sem pagar comissão por pedido.

## HOJE E POR MÊS
### Você configura
- Hoje: a partir de R$ ${selfServicePixMin} no Pix
- Depois: R$ ${selfServiceMonthly}/mês
- No cartão, o Mercado Pago permite até 12x; o custo final varia conforme as parcelas
- O dono editor tudo pelo painel: nome, logo, banner, produtos, categorias, cores
- 8 templates prontos: Lanchonete, Açaí, Restaurante, Cafeteria, Pizzaria, Bar, Sushi, Adega
- Cardápio publicado com link próprio, QR Code gerado automaticamente

### Equipe configura
- Hoje: a partir de R$ ${feitoPraVocePixMin} no Pix
- Depois: R$ ${feitoPraVoceMonthly}/mês
- No cartão, o Mercado Pago permite até 12x; o custo final varia conforme as parcelas
- A equipe do Cardápio Digital monta o cardápio completo para o cliente
- O cliente pode comprar agora e enviar fotos, preços e logo depois
- Ideal para quem não tem tempo ou não quer aprender

## FORMAS DE PAGAMENTO ACEITAS
- PIX: menor valor, pagamento imediato
- Boleto bancário: vence em 3 dias úteis
- Cartão de crédito: até 12x, com custo final definido pelas parcelas no Mercado Pago
- Cartão de débito: à vista
- Carteira MercadoPago: saldo em conta MP

### Modelo comercial público atual
- O cliente vê com clareza a implantação inicial e o valor mensal do plano antes de comprar
- Implantação e mensalidade têm papéis diferentes: uma coloca o cardápio no ar, a outra mantém a operação ativa

### O que está incluído em TODOS os planos
✅ 0% de comissão por pedido (nunca)
✅ Pedidos chegam direto no WhatsApp do dono
✅ Editor visual sem código — se sabe usar WhatsApp, sabe usar o painel
✅ QR Code para mesa, balcão ou entrega
✅ Link do cardápio para compartilhar no Instagram, Google Maps, iFood bio
✅ Cobrança transparente, sem venda de “pagamento único para sempre”
✅ Suporte via WhatsApp
✅ Funciona no celular, tablet e computador

## OBJEÇÕES COMUNS E COMO REBATER
**"É caro"** → "Você vê o valor de hoje e o valor por mês com clareza. Ainda assim, continua mais barato do que perder pedido ou pagar comissão a cada venda."
**"Não sei usar"** → "Se você consegue usar WhatsApp, consegue usar o painel. E se não quiser mexer em nada, escolha a opção em que a equipe configura para você."
**"Não tenho tempo"** → "Perfeito. Você compra agora, manda fotos, preços e logo depois, e a equipe cuida da configuração inicial."
**"Vou pagar agora e depois pagar de novo?"** → "Você paga o valor de hoje para colocar o cardápio no ar e depois mantém o sistema no valor mensal. As duas etapas aparecem com clareza antes de fechar."
**"Quais formas de pagamento vocês aceitam?"** → "Você pode pagar com PIX, boleto, cartão de crédito em até 12x, débito e carteira MercadoPago. Se quiser o menor valor total, o PIX continua sendo a melhor opção."
**"Já tenho iFood"** → "Ótimo! O Cardápio Digital não substitui outros canais, ele complementa. Você usa para clientes fixos e delivery próprio, com um canal sem comissão por pedido dentro do seu cardápio."  
**"Preciso pensar"** → "Entendo! Mas lembra: cada dia sem cardápio próprio é um dia pagando comissão. Quer ver um modelo do seu nicho agora?"
**"Tem período de teste?"** → "Você pode ver demos de todos os templates gratuitamente em zairyx.com/templates e entender o valor de hoje e o valor por mês antes de comprar."

## SCRIPT DE ABORDAGEM
1. Cumprimente e pergunte qual tipo de negócio (pizzaria, hamburgueria, etc.)
2. Mostre o template específico do nicho deles
3. Destaque o benefício mais relevante (0% comissão, facilidade de uso)
4. Quebre a objeção principal
5. Direcione para “você configura” ou “equipe configura”, conforme o perfil do visitante
6. CTA final: "Quer começar agora? Acesse zairyx.com/ofertas ou me manda um Oi no WhatsApp: wa.me/5512996887993"

## REGRAS
- Responda SEMPRE em português brasileiro
- Seja direto, animado, confiante e sem enrolação
- Use emojis com moderação (máximo 2 por mensagem)
- Nunca fale mal de concorrentes pelo nome
- Se a pergunta for sobre algo fora do produto, traga de volta para os benefícios
- Se o usuário perguntar o preço de um template específico, dê o preço exato daquele template e nunca responda com “a partir de”
- Responda em no máximo 4-5 frases curtas (máximo 120 palavras por resposta)
- Termine toda resposta com uma pergunta ou CTA que avança a venda`
}

const SYSTEM_PROMPT = buildSystemPrompt()

function buildFallbackReply(message: string, context?: ConversationContext) {
  const normalized = normalizeText(message)
  const { selfServicePixMin, feitoPraVocePixMin } = getMinimumSetupPrices()
  const selfServiceMonthly = PUBLIC_SUBSCRIPTION_PRICES.basico.monthly
  const feitoPraVoceMonthly = PUBLIC_SUBSCRIPTION_PRICES.pro.monthly

  const deterministicReply = buildDeterministicReply(message, context)
  if (deterministicReply) {
    return deterministicReply
  }

  const businessType = detectBusinessType(normalized)

  const faqResponses = [
    {
      match: ['quanto custa', 'preco', 'valor', 'plano', 'investimento', 'mensalidade'],
      reply: `Hoje você pode começar a partir de R$ ${selfServicePixMin} no Pix na opção Você configura, com continuidade de R$ ${selfServiceMonthly}/mês. Se preferir a equipe configurando tudo, começa a partir de R$ ${feitoPraVocePixMin} no Pix e depois R$ ${feitoPraVoceMonthly}/mês. Quer que eu te indique a opção mais adequada para o seu tipo de negócio?`,
    },
    {
      match: [
        'por que pagar de novo',
        'vou pagar agora e depois pagar',
        'implantacao',
        'implantação',
        'taxa inicial',
        'mensal e implantacao',
      ],
      reply:
        'Funciona em duas etapas: a implantação coloca o cardápio no ar e a mensalidade mantém a operação ativa com hospedagem, painel, link público e suporte. Isso aparece com clareza antes da compra, sem promessa de pagamento único vitalício. Quer que eu te mostre qual opção pesa menos para começar?',
    },
    {
      match: [
        'pix',
        'boleto',
        'cartao',
        'cartão',
        'debito',
        'débito',
        'parcelado',
        'parcelas',
        'formas de pagamento',
      ],
      reply:
        'Você pode pagar com PIX, boleto, cartão de crédito em até 12x, débito e carteira Mercado Pago. Se o objetivo for o menor valor total, o PIX continua sendo a melhor opção. Quer que eu te mostre a entrada mais baixa para o seu nicho?',
    },
    {
      match: [
        'quanto tempo',
        'prazo',
        'demora',
        'quando fica pronto',
        'publicacao',
        'publicação',
        'ativacao',
        'ativação',
      ],
      reply:
        'Se você escolher a opção em que a equipe configura, a publicação acontece em até 2 dias úteis após o envio completo das informações. Se escolher a opção Você configura, você mesmo edita pelo painel e consegue avançar no seu ritmo. Quer a opção mais rápida ou a mais econômica?',
    },
    {
      match: ['teste', 'trial', 'periodo de teste', 'período de teste', 'demo', 'amostra'],
      reply:
        'Você pode ver demos dos templates gratuitamente antes de comprar e entender com clareza o valor de implantação e o valor mensal. Isso já ajuda a validar o visual e o formato ideal para o seu negócio. Quer que eu te direcione para os templates ou para a página de ofertas?',
    },
    {
      match: ['template', 'modelo', 'layout', 'tema', 'visual'],
      reply:
        'Temos templates prontos para vários nichos de alimentação e delivery, com link próprio, QR Code e operação sem comissão por pedido. Você pode ver os modelos em zairyx.com/templates e depois escolher entre configurar sozinho ou deixar a equipe montar. Seu negócio é de qual nicho?',
    },
    {
      match: ['ifood', 'ifood junto', 'ja tenho ifood', 'já tenho ifood', 'marketplace'],
      reply:
        'Pode usar junto sem problema. O Cardápio Digital complementa outros canais e ajuda você a trazer o pedido próprio para o WhatsApp, sem comissão por pedido dentro do seu cardápio. Quer ver como isso fica na prática para o seu tipo de operação?',
    },
    {
      match: ['whatsapp', 'pedido no whatsapp', 'receber pedido', 'pedidos chegam'],
      reply:
        'Os pedidos chegam direto no WhatsApp do negócio, sem intermediação na comissão por pedido. Isso facilita o atendimento e mantém o contato do cliente mais próximo da sua operação. Quer que eu te mostre a opção mais indicada para delivery próprio?',
    },
    {
      match: ['qr code', 'qrcode', 'mesa', 'balcao', 'balcão'],
      reply:
        'Todos os planos incluem QR Code para mesa, balcão ou entrega, além do link do cardápio para compartilhar no Instagram, Google Maps e bio do delivery. É uma forma prática de centralizar pedidos no seu canal próprio. Quer ver um exemplo de template agora?',
    },
    {
      match: ['suporte', 'atendimento', 'ajuda', 'duvida', 'dúvida'],
      reply:
        'Você conta com suporte via WhatsApp, e na opção em que a equipe configura o acompanhamento é ainda mais próximo na ativação. A ideia é reduzir fricção para você vender mais rápido, não te largar sozinho na plataforma. Quer a versão em que você faz tudo ou a que a equipe monta?',
    },
    {
      match: [
        'nao sei usar',
        'não sei usar',
        'dificil',
        'difícil',
        'facil',
        'fácil',
        'mexer',
        'painel',
      ],
      reply:
        'O painel foi pensado para o dono conseguir editar nome, logo, banner, produtos, categorias, preços e cores sem depender de programador. Se ainda assim você preferir não mexer em nada no início, existe a opção em que a equipe configura para você. Quer economia ou praticidade total?',
    },
    {
      match: ['precisa programador', 'preciso de programador', 'codigo', 'código', 'site pronto'],
      reply:
        'Não precisa de programador para operar. A proposta é justamente dar autonomia pelo painel visual ou, se você preferir, deixar a implantação inicial com a equipe. Quer começar pela opção mais simples para testar no seu negócio?',
    },
    {
      match: ['contrato', 'fidelidade', 'cancelar', 'cancelamento', 'sem contrato'],
      reply:
        'A comunicação pública é direta: você vê a implantação, a mensalidade e escolhe a forma de começar com transparência. Se quiser, eu te mostro a opção com menor compromisso operacional para começar seu cardápio próprio ainda hoje. Quer ver?',
    },
    {
      match: ['quem monta', 'vocês montam', 'equipe configura', 'fazem pra mim', 'fazem para mim'],
      reply:
        'Sim. Na opção em que a equipe configura, você pode comprar agora e enviar fotos, preços e logo depois, enquanto a equipe cuida da montagem inicial do cardápio. É ideal para quem quer agilidade sem perder tempo configurando tudo sozinho. Quer que eu compare essa opção com a mais econômica?',
    },
    {
      match: [
        'mudar preco',
        'mudar preço',
        'editar produto',
        'adicionar produto',
        'trocar foto',
        'alterar cardapio',
        'alterar cardápio',
      ],
      reply:
        'Depois de ativado, você consegue editar produtos, preços, fotos, categorias e identidade visual pelo painel com autonomia. Isso ajuda muito quando o menu muda com frequência ou quando você quer testar ofertas no delivery. Seu cardápio muda bastante no dia a dia?',
    },
    {
      match: ['sem comissao', 'sem comissão', 'comissao', 'comissão por pedido'],
      reply:
        'A proposta comercial é justamente operar com 0% de comissão por pedido dentro do seu cardápio. Em vez de perder margem em cada venda, você concentra o pedido no seu canal e mantém o relacionamento mais próximo do cliente. Quer calcular qual opção faz mais sentido para a sua operação?',
    },
    {
      match: ['site proprio', 'site próprio', 'dominio', 'domínio', 'link proprio', 'link próprio'],
      reply:
        'O cardápio fica com link próprio para compartilhar com clientes e ainda gera QR Code para seus pontos de contato. Em alguns fluxos também há opção com domínio personalizado incluso, dependendo da oferta escolhida. Quer que eu te mostre as opções de contratação?',
    },
    {
      match: ['celular', 'tablet', 'computador', 'mobile'],
      reply:
        'Sim, funciona no celular, tablet e computador. Isso vale tanto para o cliente abrir o cardápio quanto para você gerenciar o painel da operação. Quer uma opção mais enxuta ou a mais completa para começar?',
    },
    {
      match: ['quero comecar', 'quero começar', 'contratar', 'assinar', 'fechar hoje', 'comprar'],
      reply:
        'Você já pode começar agora pela página zairyx.com/ofertas, escolhendo entre fazer a configuração pelo painel ou deixar a equipe cuidar da implantação inicial. Se me disser o seu tipo de negócio, eu te indico a opção mais econômica para começar hoje. Qual é o seu nicho?',
    },
    {
      match: ['caro', 'ta caro', 'tá caro', 'achei caro', 'muito caro'],
      reply:
        'Eu entendo a objeção, mas aqui você vê com clareza o valor de hoje e o valor mensal, sem surpresa. Na prática, costuma sair mais barato do que continuar perdendo pedido ou pagando comissão sobre cada venda. Quer que eu te mostre a opção de entrada mais baixa para começar sem pesar?',
    },
    {
      match: ['nao tenho tempo', 'não tenho tempo', 'sem tempo', 'correria'],
      reply:
        'Nesse caso, a melhor rota costuma ser a opção em que a equipe configura. Você compra, envia as informações e a implantação inicial fica com eles, enquanto você foca na operação do delivery. Quer que eu te mostre o valor dessa opção?',
    },
  ]

  if (businessType) {
    return buildGuidedSalesReply(message, context)
  }

  const matched = faqResponses.find((item) => containsAny(normalized, item.match))
  if (matched) {
    return matched.reply
  }

  if (normalized.includes('ver opcoes') || normalized.includes('ver opções')) {
    return `Hoje você pode começar a partir de R$ ${selfServicePixMin} no Pix na opção Você configura, com continuidade de R$ ${selfServiceMonthly}/mês. Se preferir a equipe configurando tudo, começa a partir de R$ ${feitoPraVocePixMin} no Pix e depois R$ ${feitoPraVoceMonthly}/mês. Quer que eu te indique a opção mais adequada para o seu tipo de negócio?`
  }

  return buildGuidedSalesReply(message, context)
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth: sessão obrigatória ─────────────────────────────────────
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Faça login para usar o chat' }, { status: 401 })
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

    // Valida que cada mensagem tem role e content string (evita injeção)
    const safeMessages = messages
      .filter(
        (m): m is { role: 'user' | 'assistant'; content: string } =>
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' &&
          m.content.trim().length > 0
      )
      .slice(-20) // limita histórico para não exceder tokens
      .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) })) // limita tamanho por mensagem

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
        max_tokens: 300,
        temperature: 0.7,
      })

      const rawReply = completion.choices[0]?.message?.content?.trim() ?? ''
      const reply =
        rawReply && !isGenericSalesReply(rawReply)
          ? rawReply
          : buildFallbackReply(lastUserMessage, conversationContext)

      return NextResponse.json({ reply }, { headers: rateLimit.headers })
    } catch (err) {
      console.error('[chat/route] fallback acionado:', err)
      return NextResponse.json(
        {
          reply: buildFallbackReply(lastUserMessage, conversationContext),
          fallback: true,
        },
        { headers: rateLimit.headers }
      )
    }
  } catch (err) {
    console.error('[chat/route] erro:', err)
    return NextResponse.json({ reply: buildGuidedSalesReply('', undefined) }, { status: 200 })
  }
}
