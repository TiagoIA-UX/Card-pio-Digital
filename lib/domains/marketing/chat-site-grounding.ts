import type { ChatPageType } from '@/lib/domains/marketing/chat-page-context'

export function buildSiteOnlyGroundingPrompt(pageType: ChatPageType, pathname?: string): string {
  return [
    '## Grounding obrigatorio no site',
    `- Contexto atual da conversa: ${pageType}${pathname ? ` em ${pathname}` : ''}.`,
    '- Responda somente com informacoes presentes neste site e no contexto recebido.',
    '- Nao invente dados externos, estatisticas de terceiros, concorrentes ou links fora do site.',
    '- Se faltar dado no contexto atual, diga explicitamente que nao ha esse dado publicado no site agora.',
    '- Nunca afirme que consultou fontes externas ou navegou fora desta pagina.',
  ].join('\n')
}

export function hasOutsideSiteClaimRisk(reply: string): boolean {
  const normalized = reply
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  const externalSourcePatterns = [
    /segundo\s+(o|a)?\s*(google|wikipedia|ifood|openai|chatgpt|concorrente)/,
    /dados\s+de\s+mercado\s+externo/,
    /vi\s+(na|em)\s+internet/,
    /consult(ei|amos)\s+fontes\s+externas/,
    /https?:\/\//,
  ]

  return externalSourcePatterns.some((pattern) => pattern.test(normalized))
}

export function buildSiteOnlyFallbackReply(): string {
  return [
    'Posso te orientar apenas com informacoes publicadas neste site e nesta pagina.',
    'Se voce quiser, eu organizo agora os proximos passos com base no que ja esta disponivel aqui.',
  ].join(' ')
}

