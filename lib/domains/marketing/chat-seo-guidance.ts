function normalizeInput(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const SEO_KEYWORDS = [
  'seo',
  'search engine optimization',
  'intencao de busca',
  'eeat',
  'core web vitals',
  'lcp',
  'cls',
  'inp',
  'mobile first',
  'on-page',
  'backlinks',
  'sitemap',
  'robots.txt',
  'schema markup',
  'featured snippets',
  'ctr',
]

function countSeoSignals(normalized: string): number {
  return SEO_KEYWORDS.filter((keyword) => normalized.includes(keyword)).length
}

export function isSeoGuidanceRequest(message: string): boolean {
  const normalized = normalizeInput(message)
  if (!normalized) return false

  const signalCount = countSeoSignals(normalized)
  if (signalCount >= 2) return true

  const explicitChecklistIntent =
    normalized.includes('checklist') &&
    (normalized.includes('seo') || normalized.includes('trafego organico'))

  return explicitChecklistIntent
}

export function buildSeoPracticalChecklistReply(): string {
  return [
    'Perfeito. Vou aplicar isso como checklist operacional de SEO com foco em dados reais e conversao.',
    '',
    'Checklist pratico (execucao):',
    '1. Intencao de busca definida por pagina: informacional, comercial, transacional ou navegacional.',
    '2. Conteudo com EEAT: autor, experiencia real, fonte verificavel e atualizacao periodica.',
    '3. Core Web Vitals em meta: LCP abaixo de 2.5s, CLS baixo e INP estavel.',
    '4. Mobile first sem friccao: leitura facil, botoes tocaveis e sem pop-up agressivo.',
    '5. SEO on-page por pagina: H1, primeiro paragrafo, URL, meta description, H2/H3 e ALT.',
    '6. Links internos por cluster de tema e backlinks de qualidade (nao volume cego).',
    '7. SEO tecnico sem falhas: sitemap.xml, robots.txt, HTTPS, schema e 404 monitorado.',
    '8. Atualizacao de conteudo por sinal real: queda de CTR, posicao ou mudanca de intencao.',
    '9. Titulos e metas para CTR com proposta clara de valor e sem clickbait enganoso.',
    '10. SEO para IA: respostas objetivas, listas, blocos FAQ e foco em featured snippets.',
    '',
    'Regra de integridade: nada de dado inventado. Toda afirmacao de mercado precisa de fonte auditavel.',
    'Se quiser, eu ja converto isso em plano de 30 dias por prioridade (alto impacto primeiro).',
  ].join('\n')
}

