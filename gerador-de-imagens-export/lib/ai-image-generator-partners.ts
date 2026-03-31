/**
 * Parceiros do Gerador de Imagens IA
 *
 * Cada parceiro recebe uma página co-branded com sua identidade visual.
 * O processamento de pagamento é centralizado na Zairyx (Mercado Pago).
 * Parceiros podem ter um ID de afiliado para rastreamento de receita.
 *
 * URLs geradas:
 *   /gerador-imagens              → página principal Zairyx
 *   /gerador-imagens/p/zairyx     → alias Zairyx
 *   /gerador-imagens/p/blog-da-elisa → página co-branded Blog da Elisa
 */

export interface ImageGeneratorPartner {
  /** Slug único usado na URL: /gerador-imagens/p/[slug] */
  slug: string
  /** Nome curto da marca parceira */
  name: string
  /** Nome exibido na interface */
  displayName: string
  /** Slogan/tagline da página co-branded */
  tagline: string
  /** Descrição do parceiro para a seção hero */
  description: string
  /** Texto do logo (exibido como badge estilizado) */
  logoText: string
  /** Emoji identificador (usado como ícone do logo) */
  logoEmoji: string
  /** Cor principal do parceiro (classe Tailwind ou hex) */
  accentColorClass: string
  /** Domínio do site do parceiro (para backlink) */
  websiteUrl?: string
  /** ID de afiliado para rastrear receita originada pelo parceiro */
  affiliateId?: string
  /** Público-alvo do parceiro */
  targetAudience: string
  /** Casos de uso específicos para o público do parceiro */
  useCases: string[]
  /** Texto do CTA principal */
  ctaLabel: string
}

// ── Catálogo de parceiros ────────────────────────────────────────────────

export const PARTNERS: ImageGeneratorPartner[] = [
  {
    slug: 'zairyx',
    name: 'Zairyx',
    displayName: 'Zairyx — Canal Digital',
    tagline: 'Gere imagens profissionais para o seu cardápio digital',
    description:
      'A plataforma completa para deliverys e restaurantes. Cardápio digital, pedidos pelo WhatsApp, IA integrada e agora Gerador de Imagens IA para deixar seus produtos irresistíveis.',
    logoText: 'Zairyx',
    logoEmoji: '⚡',
    accentColorClass: 'text-primary',
    websiteUrl: 'https://zairyx.com',
    affiliateId: 'zairyx',
    targetAudience: 'Donos de delivery, restaurantes, lanchonetes e comércios alimentícios',
    useCases: [
      'Fotos profissionais de pratos e produtos do cardápio',
      'Imagens de packshot em fundo branco para o catálogo',
      'Conteúdo visual para redes sociais',
      'Thumbnails e banners do cardápio digital',
    ],
    ctaLabel: 'Gerar imagem para o meu cardápio',
  },
  {
    slug: 'blog-da-elisa',
    name: 'Blog da Elisa',
    displayName: 'Blog da Elisa',
    tagline: 'Crie imagens incríveis para o seu blog com IA',
    description:
      'O Blog da Elisa e a Zairyx se uniram para trazer o poder da Inteligência Artificial para criadores de conteúdo. Gere fotos profissionais de receitas, produtos e lifestyle em segundos.',
    logoText: 'Blog da Elisa',
    logoEmoji: '✨',
    accentColorClass: 'text-rose-500',
    websiteUrl: 'https://blogdaelisa.com.br',
    affiliateId: 'blog-da-elisa',
    targetAudience: 'Blogueiras, criadores de conteúdo, food bloggers e influenciadoras',
    useCases: [
      'Fotos de receitas para posts e artigos do blog',
      'Imagens lifestyle para Instagram e Pinterest',
      'Thumbnails de receitas para YouTube',
      'Conteúdo visual para e-mail marketing',
    ],
    ctaLabel: 'Gerar imagem para o meu blog',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────

/** Retorna os dados do parceiro pelo slug, ou null se não encontrado */
export function getPartner(slug: string): ImageGeneratorPartner | null {
  return PARTNERS.find((p) => p.slug === slug) ?? null
}

/** Retorna todos os slugs válidos (para validação em getStaticParams) */
export function getAllPartnerSlugs(): string[] {
  return PARTNERS.map((p) => p.slug)
}

/**
 * Referência de parceiro para exibição no rodapé da página co-branded.
 * Mostra logo do parceiro + logo Zairyx (powered by).
 */
export interface PartnerBadge {
  partnerName: string
  partnerEmoji: string
  partnerAccent: string
  poweredByName: string
}

export function buildPartnerBadge(partner: ImageGeneratorPartner): PartnerBadge {
  return {
    partnerName: partner.displayName,
    partnerEmoji: partner.logoEmoji,
    partnerAccent: partner.accentColorClass,
    poweredByName: 'Zairyx',
  }
}
