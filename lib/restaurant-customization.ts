export type RestaurantTemplateSlug =
  | 'restaurante'
  | 'pizzaria'
  | 'lanchonete'
  | 'bar'
  | 'cafeteria'
  | 'acai'
  | 'sushi'

/** Frases prontas para o banner - reduz fricção de criação */
export const HERO_SLOGAN_PRESETS = [
  { id: 'pedir_agora', label: 'Peça agora pelo WhatsApp', text: 'Peça agora pelo WhatsApp' },
  { id: 'entrega_rapida', label: 'Entrega rápida na sua casa', text: 'Entrega rápida na sua casa' },
  { id: 'cardapio_oficial', label: 'Cardápio oficial da casa', text: 'Cardápio oficial da casa' },
  { id: 'pedidos_rapidos', label: 'Pedidos rápidos e sem taxa', text: 'Pedidos rápidos e sem taxa' },
  { id: 'promocoes', label: 'Promoções do dia - Peça agora', text: 'Promoções do dia - Peça agora' },
  { id: 'delivery_retirada', label: 'Delivery e retirada', text: 'Delivery e retirada' },
] as const

export type HeroSloganPresetId = (typeof HERO_SLOGAN_PRESETS)[number]['id'] | 'custom'

export interface RestaurantCustomization {
  sections?: {
    hero?: boolean
    service?: boolean
    categories?: boolean
    about?: boolean
  }
  /** Categorias definidas pelo usuário (ordem e lista). Permite categorias vazias. */
  customCategories?: string[]
  /** ID do preset de frase ou 'custom' para texto livre */
  heroSloganPreset?: HeroSloganPresetId
  badge?: string
  heroTitle?: string
  heroDescription?: string
  primaryCtaLabel?: string
  secondaryCtaLabel?: string
  sectionTitle?: string
  sectionDescription?: string
  emptyStateTitle?: string
  emptyStateDescription?: string
  aboutTitle?: string
  aboutDescription?: string
  deliveryLabel?: string
  pickupLabel?: string
  dineInLabel?: string
}

export interface RestaurantPresentation {
  template: TemplatePreset
  customization: RestaurantCustomization
  sectionVisibility: {
    hero: boolean
    service: boolean
    categories: boolean
    about: boolean
  }
  badge: string
  heroTitle: string
  heroDescription: string
  primaryCtaLabel: string
  secondaryCtaLabel: string
  sectionTitle: string
  sectionDescription: string
  emptyStateTitle: string
  emptyStateDescription: string
  aboutTitle: string
  aboutDescription: string
  deliveryLabel: string
  pickupLabel: string
  dineInLabel: string
}

export interface RestaurantWithCustomization {
  nome: string
  template_slug?: string | null
  customizacao?: RestaurantCustomization | string | null
}

export interface TemplatePreset {
  slug: RestaurantTemplateSlug
  label: string
  badge: string
  heroTitle: string
  heroDescription: string
  sectionTitle: string
  sectionDescription: string
  aboutTitle: string
  aboutDescription: string
  emptyStateTitle: string
  emptyStateDescription: string
  accentClassName: string
}

export const TEMPLATE_PRESETS: Record<RestaurantTemplateSlug, TemplatePreset> = {
  restaurante: {
    slug: 'restaurante',
    label: 'Restaurante / Marmitaria',
    badge: 'Pratos executivos e operação diária',
    heroTitle: 'Cardápio online de almoço, marmita e combo.',
    heroDescription:
      'Delivery, retirada ou atendimento local. Pratos do dia, categorias e preços claros.',
    sectionTitle: 'Pratos, marmitas e combos',
    sectionDescription:
      'Fotos, descrições e preços para você escolher com facilidade no celular.',
    aboutTitle: 'Venda com mais clareza no digital',
    aboutDescription:
      'Use banner, logo, textos e categorias para transformar o cardápio em uma vitrine profissional e fácil de atualizar.',
    emptyStateTitle: 'Seu cardápio está quase pronto',
    emptyStateDescription:
      'Cadastre seus produtos para publicar o menu e começar a receber pedidos.',
    accentClassName: 'from-amber-500 via-orange-500 to-amber-600',
  },
  pizzaria: {
    slug: 'pizzaria',
    label: 'Pizzaria',
    badge: 'Sabores, bordas e combos com ticket alto',
    heroTitle: 'Cardápio online com visual forte, leitura rápida e pedido direto.',
    heroDescription:
      'Sabores, tamanhos, bebidas e combos para delivery, retirada ou consumo no local.',
    sectionTitle: 'Pizzas, bordas, promoções e bebidas',
    sectionDescription:
      'Encontre tudo em uma estrutura fácil de percorrer e monte seu pedido em poucos cliques.',
    aboutTitle: 'Mais controle sobre o pedido',
    aboutDescription:
      'Clientes escolhem com clareza e o pedido chega com mais contexto para o atendimento.',
    emptyStateTitle: 'A vitrine da sua pizzaria está esperando os primeiros sabores',
    emptyStateDescription: 'Cadastre pizzas, bebidas e combos para colocar tudo no ar rapidamente.',
    accentClassName: 'from-red-500 to-orange-500',
  },
  lanchonete: {
    slug: 'lanchonete',
    label: 'Lanchonete / Hamburgueria',
    badge: 'Combos, adicionais e decisão rápida',
    heroTitle: 'Cardápio de lanches, combos e adicionais.',
    heroDescription:
      'Hambúrgueres, acompanhamentos e bebidas com imagens e navegação rápida.',
    sectionTitle: 'Lanches, combos e adicionais',
    sectionDescription:
      'Encontre lanche, adicional e sobremesa em segundos.',
    aboutTitle: 'Velocidade para quem pede e para quem atende',
    aboutDescription:
      'O layout reduz dúvida na escolha e deixa o pedido mais objetivo para a operação.',
    emptyStateTitle: 'Seu cardápio ainda está sem os lanches cadastrados',
    emptyStateDescription: 'Adicione seus combos e adicionais para começar a vender online.',
    accentClassName: 'from-amber-400 via-yellow-500 to-orange-500',
  },
  bar: {
    slug: 'bar',
    label: 'Bar / Pub',
    badge: 'Petiscos, drinks e consumo local',
    heroTitle: 'Cardápio digital para delivery, retirada ou mesa.',
    heroDescription:
      'Drinks, cervejas e petiscos com visual noturno e direto ao ponto.',
    sectionTitle: 'Drinks, cervejas e petiscos',
    sectionDescription: 'Encontre rápido o que beber e o que pedir para compartilhar.',
    aboutTitle: 'Digital sem perder o clima da casa',
    aboutDescription:
      'Personalize texto, banner, fotos e cores para manter a identidade do seu bar.',
    emptyStateTitle: 'Seu bar digital precisa dos produtos para começar',
    emptyStateDescription: 'Cadastre os drinks, petiscos e promoções para publicar o menu.',
    accentClassName: 'from-zinc-800 via-amber-900/80 to-amber-700',
  },
  cafeteria: {
    slug: 'cafeteria',
    label: 'Cafeteria',
    badge: 'Atmosfera premium e pedido leve',
    heroTitle: 'Cardápio digital com apresentação elegante.',
    heroDescription: 'Cafés, doces, brunch e sazonais em uma vitrine bonita e funcional.',
    sectionTitle: 'Cafés, doces e brunch',
    sectionDescription:
      'Compare bebidas e monte seu pedido com confiança.',
    aboutTitle: 'Experiência visual alinhada com a marca',
    aboutDescription: 'Fotos, texto, banner e logo ficam centralizados para acelerar a publicação.',
    emptyStateTitle: 'Sua cafeteria ainda não publicou os produtos',
    emptyStateDescription: 'Cadastre os itens para deixar o cardápio pronto para compartilhar.',
    accentClassName: 'from-amber-900/90 via-stone-700 to-amber-800',
  },
  acai: {
    slug: 'acai',
    label: 'Açaíteria',
    badge: 'Combinações, adicionais e venda rápida',
    heroTitle: 'Cardápio de açaí com tigelas, copos e complementos.',
    heroDescription: 'Delivery, retirada ou consumo local. Layout vibrante e fácil de navegar.',
    sectionTitle: 'Tigelas, copos e complementos',
    sectionDescription:
      'Encontre tamanho, complemento e bebidas sem se perder.',
    aboutTitle: 'Atualize o menu com facilidade',
    aboutDescription:
      'Altere fotos, títulos, descrições e banner sem precisar mexer na estrutura do layout.',
    emptyStateTitle: 'Seu cardápio de açaí ainda está vazio',
    emptyStateDescription: 'Cadastre tigelas, complementos e bebidas para publicar seu menu.',
    accentClassName: 'from-fuchsia-600 via-purple-600 to-violet-700',
  },
  sushi: {
    slug: 'sushi',
    label: 'Japonês / Sushi',
    badge: 'Percepção premium e leitura refinada',
    heroTitle: 'Cardápio japonês com apresentação premium e pedido direto.',
    heroDescription:
      'Combinados, sashimis e temakis em uma vitrine elegante.',
    sectionTitle: 'Combinados, sashimis e temakis',
    sectionDescription:
      'Menus premium, porções e bebidas com leitura fluida no celular.',
    aboutTitle: 'Mais valor percebido para o seu menu',
    aboutDescription:
      'A personalização do layout ajuda a alinhar o cardápio à experiência da sua marca.',
    emptyStateTitle: 'Seu menu japonês ainda não tem itens cadastrados',
    emptyStateDescription: 'Cadastre os produtos para ativar a vitrine e começar a vender.',
    accentClassName: 'from-red-900/90 via-rose-900/70 to-stone-900',
  },
}

const DEFAULT_TEMPLATE: RestaurantTemplateSlug = 'restaurante'

export function normalizeTemplateSlug(value?: string | null): RestaurantTemplateSlug {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!normalized) return DEFAULT_TEMPLATE

  return normalized in TEMPLATE_PRESETS ? (normalized as RestaurantTemplateSlug) : DEFAULT_TEMPLATE
}

export function parseRestaurantCustomization(
  value?: RestaurantCustomization | string | null
): RestaurantCustomization {
  if (!value) return {}

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as RestaurantCustomization
    } catch {
      return {}
    }
  }

  return value
}

export function buildRestaurantCustomizationSeed(
  templateValue?: string | null,
  restaurantName?: string
): RestaurantCustomization {
  const templateSlug = normalizeTemplateSlug(templateValue)
  const template = TEMPLATE_PRESETS[templateSlug]

  return {
    sections: {
      hero: true,
      service: true,
      categories: true,
      about: true,
    },
    badge: template.badge,
    heroTitle: `${restaurantName || 'Seu restaurante'} com cardápio digital pronto para vender mais.`,
    heroDescription: template.heroDescription,
    sectionTitle: template.sectionTitle,
    sectionDescription: template.sectionDescription,
    aboutTitle: template.aboutTitle,
    aboutDescription: template.aboutDescription,
    emptyStateTitle: template.emptyStateTitle,
    emptyStateDescription: template.emptyStateDescription,
    primaryCtaLabel: 'Fazer pedido',
    secondaryCtaLabel: 'Abrir WhatsApp',
    deliveryLabel: 'Entrega',
    pickupLabel: 'Retirada',
    dineInLabel: 'Consumir no local',
  }
}

export function getRestaurantPresentation(
  restaurant: RestaurantWithCustomization
): RestaurantPresentation {
  const template = TEMPLATE_PRESETS[normalizeTemplateSlug(restaurant.template_slug)]
  const customization = parseRestaurantCustomization(restaurant.customizacao)
  const seed = buildRestaurantCustomizationSeed(restaurant.template_slug, restaurant.nome)

  // Substitui textos legados (voltados ao dono) pelos novos (voltados ao cliente)
  const LEGACY_TEXTS: Record<string, string> = {
    'Organize pizzas, bordas, promoções e bebidas em uma estrutura fácil de percorrer.':
      seed.sectionDescription || template.sectionDescription,
  }
  const sectionDescriptionRaw = customization.sectionDescription || seed.sectionDescription || ''
  const sectionDescription =
    LEGACY_TEXTS[sectionDescriptionRaw] ?? sectionDescriptionRaw

  return {
    template,
    customization,
    sectionVisibility: {
      hero: customization.sections?.hero ?? seed.sections?.hero ?? true,
      service: customization.sections?.service ?? seed.sections?.service ?? true,
      categories: customization.sections?.categories ?? seed.sections?.categories ?? true,
      about: customization.sections?.about ?? seed.sections?.about ?? true,
    },
    badge: customization.badge || seed.badge || template.badge,
    heroTitle: customization.heroTitle || seed.heroTitle || template.heroTitle,
    heroDescription: (() => {
      const presetId = customization.heroSloganPreset
      if (presetId && presetId !== 'custom') {
        const preset = HERO_SLOGAN_PRESETS.find((p) => p.id === presetId)
        if (preset) return preset.text
      }
      return customization.heroDescription || seed.heroDescription || template.heroDescription
    })(),
    primaryCtaLabel: customization.primaryCtaLabel || seed.primaryCtaLabel || 'Ver cardápio',
    secondaryCtaLabel: customization.secondaryCtaLabel || seed.secondaryCtaLabel || 'Chamar no WhatsApp',
    sectionTitle: customization.sectionTitle || seed.sectionTitle || template.sectionTitle,
    sectionDescription,
    emptyStateTitle: customization.emptyStateTitle || seed.emptyStateTitle || template.emptyStateTitle,
    emptyStateDescription: customization.emptyStateDescription || seed.emptyStateDescription || template.emptyStateDescription,
    aboutTitle: customization.aboutTitle || seed.aboutTitle || template.aboutTitle,
    aboutDescription: customization.aboutDescription || seed.aboutDescription || template.aboutDescription,
    deliveryLabel: customization.deliveryLabel || seed.deliveryLabel || 'Entrega',
    pickupLabel: customization.pickupLabel || seed.pickupLabel || 'Retirada',
    dineInLabel: customization.dineInLabel || seed.dineInLabel || 'Consumir no local',
  }
}
