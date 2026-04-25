import type { RestaurantTemplateSlug } from '@/lib/domains/core/restaurant-customization'
import { getRestaurantTemplateConfig } from '@/lib/domains/marketing/templates-config'
import type { ChatPageType } from '@/lib/domains/marketing/chat-page-context'

type BusinessHint = {
  templateSlug: RestaurantTemplateSlug
  businessLabel: string
}

const BUSINESS_TYPE_HINTS: Array<BusinessHint & { keywords: string[] }> = [
  { templateSlug: 'acai', businessLabel: 'açaíteria', keywords: ['acai', 'açaí', 'acaiteria', 'açaiteria'] },
  { templateSlug: 'pizzaria', businessLabel: 'pizzaria', keywords: ['pizza', 'pizzaria'] },
  { templateSlug: 'lanchonete', businessLabel: 'lanchonete', keywords: ['lanchonete', 'hamburgueria', 'hamburguer', 'burger'] },
  { templateSlug: 'restaurante', businessLabel: 'restaurante', keywords: ['restaurante', 'marmitaria', 'marmita', 'self service', 'self-service'] },
  { templateSlug: 'adega', businessLabel: 'adega', keywords: ['adega', 'bebidas', 'delivery de bebidas'] },
  { templateSlug: 'mercadinho', businessLabel: 'mercadinho', keywords: ['mercadinho', 'conveniencia', 'conveniência'] },
  { templateSlug: 'minimercado', businessLabel: 'minimercado', keywords: ['minimercado', 'mini mercado', 'dark store'] },
  { templateSlug: 'padaria', businessLabel: 'padaria', keywords: ['padaria', 'confeitaria'] },
  { templateSlug: 'sushi', businessLabel: 'japonês', keywords: ['sushi', 'japones', 'japonês', 'temaki'] },
  { templateSlug: 'bar', businessLabel: 'bar', keywords: ['bar', 'pub'] },
  { templateSlug: 'cafeteria', businessLabel: 'cafeteria', keywords: ['cafeteria', 'cafe', 'café'] },
  { templateSlug: 'sorveteria', businessLabel: 'sorveteria', keywords: ['sorveteria', 'sorvete'] },
  { templateSlug: 'acougue', businessLabel: 'açougue', keywords: ['acougue', 'açougue', 'casa de carnes'] },
  { templateSlug: 'hortifruti', businessLabel: 'hortifruti', keywords: ['hortifruti', 'hortifrute', 'frutas', 'verduras'] },
  { templateSlug: 'petshop', businessLabel: 'pet shop', keywords: ['petshop', 'pet shop', 'racao', 'ração'] },
  { templateSlug: 'doceria', businessLabel: 'doceria', keywords: ['doceria', 'doces', 'brigadeiro'] },
]

const BUSINESS_INTENT_PATTERNS = [
  /\bquero\b.*\btemplate\b/,
  /\bqual\b.*\btemplate\b/,
  /\bserve para\b/,
  /\bideal para\b/,
  /\bmeu\b.*\b(negocio|comercio|delivery|nicho)\b/,
  /\btenho\b.*\b(um|uma)\b/,
  /\bsou\b.*\b(um|uma)\b/,
  /\btrabalho com\b/,
  /\bestou\b.*\b(montando|abrindo)\b/,
  /\bpara\b.*\b(um|uma)\b/,
]

function normalizeInput(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function matchesKeyword(normalized: string, keyword: string): boolean {
  const escapedKeyword = escapeRegex(normalizeInput(keyword)).replace(/\s+/g, '\\s+')
  return new RegExp(`(?:^|\\b)${escapedKeyword}(?:$|\\b)`).test(normalized)
}

function hasBusinessIntent(normalized: string): boolean {
  return BUSINESS_INTENT_PATTERNS.some((pattern) => pattern.test(normalized))
}

function isShortBusinessReply(normalized: string): boolean {
  const wordCount = normalized.split(/\s+/).filter(Boolean).length
  return wordCount > 0 && wordCount <= 3
}

function shouldOfferBusinessGuidance(normalized: string, pageType?: ChatPageType): boolean {
  if (hasBusinessIntent(normalized)) return true

  if (pageType === 'marketing' || pageType === 'template-preview' || pageType === 'checkout') {
    return isShortBusinessReply(normalized)
  }

  return false
}

export function detectBusinessTypeHint(message: string): BusinessHint | null {
  const normalized = normalizeInput(message)
  if (!normalized) return null

  const exact = BUSINESS_TYPE_HINTS.find((entry) =>
    entry.keywords.some((keyword) => normalizeInput(keyword) === normalized)
  )
  if (exact) {
    return { templateSlug: exact.templateSlug, businessLabel: exact.businessLabel }
  }

  const contained = BUSINESS_TYPE_HINTS.find((entry) =>
    entry.keywords.some((keyword) => matchesKeyword(normalized, keyword))
  )

  return contained
    ? { templateSlug: contained.templateSlug, businessLabel: contained.businessLabel }
    : null
}

function buildTemplateLabel(templateSlug: RestaurantTemplateSlug): string {
  return getRestaurantTemplateConfig(templateSlug).name
}

export function buildBusinessTypeGuidance(params: {
  message: string
  pageType?: ChatPageType
  currentTemplateSlug?: string | null
}): string | null {
  const normalizedMessage = normalizeInput(params.message)
  if (!shouldOfferBusinessGuidance(normalizedMessage, params.pageType)) return null

  const hint = detectBusinessTypeHint(params.message)
  if (!hint) return null

  const suggestedTemplateName = buildTemplateLabel(hint.templateSlug)
  const currentTemplateSlug = params.currentTemplateSlug as RestaurantTemplateSlug | null
  const currentTemplateName = currentTemplateSlug ? buildTemplateLabel(currentTemplateSlug) : null

  if (params.pageType === 'template-preview') {
    if (currentTemplateSlug === hint.templateSlug) {
      return `Sim, este é o template certo para ${hint.businessLabel}. Ele já nasce pensado para esse tipo de operação. Se quiser, eu posso te explicar o que ele prioriza e qual plano combina melhor.`
    }

    return `Você está vendo o template ${currentTemplateName || 'atual'}, mas para ${hint.businessLabel} o mais indicado é o template ${suggestedTemplateName}. Se quiser, eu posso comparar os dois e te dizer qual faz mais sentido.`
  }

  if (params.pageType === 'checkout') {
    if (currentTemplateSlug === hint.templateSlug) {
      return `Sim, esta compra já está no template ideal para ${hint.businessLabel}. Se quiser, eu posso te explicar a diferença entre os planos e o que entra na ativação.`
    }

    return `Esta compra está no template ${currentTemplateName || 'atual'}, mas para ${hint.businessLabel} o mais indicado costuma ser o template ${suggestedTemplateName}. Se foi um engano, eu posso te orientar a trocar antes de concluir.`
  }

  return `Para ${hint.businessLabel}, o template mais indicado é o ${suggestedTemplateName}. Ele já vem pensado para esse tipo de operação. Se quiser, eu posso te mostrar como ele funciona ou comparar com outro template.`
}
