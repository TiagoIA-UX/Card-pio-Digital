export type RestaurantTemplateSlug =
  | 'restaurante'
  | 'pizzaria'
  | 'lanchonete'
  | 'bar'
  | 'cafeteria'
  | 'acai'
  | 'sushi'
  | 'adega'
  | 'mercadinho'
  | 'padaria'
  | 'sorveteria'
  | 'acougue'
  | 'hortifruti'
  | 'petshop'
  | 'doceria'

/** Frases prontas para o banner - reduz fricção de criação */
export const HERO_SLOGAN_PRESETS = [
  { id: 'pedir_agora', label: 'Peça agora pelo WhatsApp', text: 'Peça agora pelo WhatsApp' },
  { id: 'entrega_rapida', label: 'Entrega rápida na sua casa', text: 'Entrega rápida na sua casa' },
  { id: 'cardapio_oficial', label: 'Canal oficial da casa', text: 'Canal oficial da casa' },
  {
    id: 'pedidos_rapidos',
    label: 'Pedidos rápidos e sem taxa',
    text: 'Pedidos rápidos e sem taxa',
  },
  {
    id: 'promocoes',
    label: 'Promoções do dia - Peça agora',
    text: 'Promoções do dia - Peça agora',
  },
  { id: 'delivery_retirada', label: 'Delivery e retirada', text: 'Delivery e retirada' },
] as const

export type HeroSloganPresetId = (typeof HERO_SLOGAN_PRESETS)[number]['id'] | 'custom'

export interface RestaurantAiAssistantSettings {
  enabled: boolean
  consentedAt?: string | null
  consentVersion?: string | null
  provider?: 'groq'
  scope?: 'sales' | 'support'
  dailyMessageLimit?: number
}

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
  aiAssistant?: RestaurantAiAssistantSettings
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
  /** Nome do canal digital adequado ao nicho (canal, catálogo, loja, vitrine) */
  nomeCanal: string
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
    heroTitle: `${restaurantName || 'Seu negócio'} com ${template.nomeCanal.toLowerCase()} — veja os produtos e peça agora.`,
    heroDescription: template.heroDescription,
    sectionTitle: template.sectionTitle,
    sectionDescription: template.sectionDescription,
    aboutTitle: template.aboutTitle,
    aboutDescription: template.aboutDescription,
    emptyStateTitle: template.emptyStateTitle,
    emptyStateDescription: template.emptyStateDescription,
    primaryCtaLabel: '',
    secondaryCtaLabel: '',
    deliveryLabel: 'Entrega',
    pickupLabel: 'Retirada',
    dineInLabel: 'Consumir no local',
    aiAssistant: {
      enabled: false,
      consentedAt: null,
      consentVersion: 'v1',
      provider: 'groq',
      scope: 'sales',
      dailyMessageLimit: 20,
    },
  }
}

const TEMPLATE_CHANNEL_NAMES: Record<RestaurantTemplateSlug, string> = {
  restaurante: 'Canal digital',
  pizzaria: 'Canal digital',
  lanchonete: 'Canal digital',
  bar: 'Canal digital',
  cafeteria: 'Canal digital',
  acai: 'Canal digital',
  sushi: 'Canal digital',
  adega: 'Catálogo digital',
  mercadinho: 'Catálogo digital',
  padaria: 'Catálogo digital',
  sorveteria: 'Catálogo digital',
  acougue: 'Catálogo digital',
  hortifruti: 'Catálogo digital',
  petshop: 'Catálogo digital',
  doceria: 'Catálogo digital',
}

export const TEMPLATE_PRESETS: Record<RestaurantTemplateSlug, TemplatePreset> = {
  restaurante: {
    slug: 'restaurante',
    label: 'Restaurante / Marmitaria',
    badge: 'Pratos do dia, marmitas e combos',
    nomeCanal: getChannelName('restaurante'),
    heroTitle: 'Canal online de almoço, marmita e combo.',
    heroDescription:
      'Delivery, retirada ou atendimento local. Pratos do dia, categorias e preços claros.',
    sectionTitle: 'Pratos, marmitas e combos',
    sectionDescription: 'Fotos, descrições e preços para você escolher com facilidade no celular.',
    aboutTitle: 'Venda com mais clareza no digital',
    aboutDescription:
      'Use banner, logo, textos e categorias para transformar o canal digital em uma vitrine profissional e fácil de atualizar.',
    emptyStateTitle: 'Seu canal digital está quase pronto',
    emptyStateDescription:
      'Cadastre seus produtos para publicar o menu e começar a receber pedidos.',
    accentClassName: 'from-amber-500 via-orange-500 to-amber-600',
  },
  pizzaria: {
    slug: 'pizzaria',
    label: 'Pizzaria',
    nomeCanal: getChannelName('pizzaria'),
    badge: 'Sabores, bordas e combos com ticket alto',
    heroTitle: 'Canal online com visual forte, leitura rápida e pedido direto.',
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
    nomeCanal: getChannelName('lanchonete'),
    badge: 'Combos, adicionais e decisão rápida',
    heroTitle: 'Canal de lanches, combos e adicionais.',
    heroDescription: 'Hambúrgueres, acompanhamentos e bebidas com imagens e navegação rápida.',
    sectionTitle: 'Lanches, combos e adicionais',
    sectionDescription: 'Encontre lanche, adicional e sobremesa em segundos.',
    aboutTitle: 'Velocidade para quem pede e para quem atende',
    aboutDescription:
      'O layout reduz dúvida na escolha e deixa o pedido mais objetivo para a operação.',
    emptyStateTitle: 'Seu canal digital ainda está sem os lanches cadastrados',
    emptyStateDescription: 'Adicione seus combos e adicionais para começar a vender online.',
    accentClassName: 'from-amber-400 via-yellow-500 to-orange-500',
  },
  bar: {
    slug: 'bar',
    label: 'Bar / Pub',
    nomeCanal: getChannelName('bar'),
    badge: 'Petiscos, drinks e consumo local',
    heroTitle: 'Canal digital para delivery, retirada ou mesa.',
    heroDescription: 'Drinks, cervejas e petiscos com visual noturno e direto ao ponto.',
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
    nomeCanal: getChannelName('cafeteria'),
    badge: 'Atmosfera premium e pedido leve',
    heroTitle: 'Canal digital com apresentação elegante.',
    heroDescription: 'Cafés, doces, brunch e sazonais em uma vitrine bonita e funcional.',
    sectionTitle: 'Cafés, doces e brunch',
    sectionDescription: 'Compare bebidas e monte seu pedido com confiança.',
    aboutTitle: 'Experiência visual alinhada com a marca',
    aboutDescription: 'Fotos, texto, banner e logo ficam centralizados para acelerar a publicação.',
    emptyStateTitle: 'Sua cafeteria ainda não publicou os produtos',
    emptyStateDescription:
      'Cadastre os itens para deixar o canal digital pronto para compartilhar.',
    accentClassName: 'from-amber-900/90 via-stone-700 to-amber-800',
  },
  acai: {
    slug: 'acai',
    label: 'Açaíteria',
    nomeCanal: getChannelName('acai'),
    badge: 'Combinações, adicionais e venda rápida',
    heroTitle: 'Canal de açaí com tigelas, copos e complementos.',
    heroDescription: 'Delivery, retirada ou consumo local. Layout vibrante e fácil de navegar.',
    sectionTitle: 'Tigelas, copos e complementos',
    sectionDescription: 'Encontre tamanho, complemento e bebidas sem se perder.',
    aboutTitle: 'Atualize o menu com facilidade',
    aboutDescription:
      'Altere fotos, títulos, descrições e banner sem precisar mexer na estrutura do layout.',
    emptyStateTitle: 'Seu canal digital de açaí ainda está vazio',
    emptyStateDescription: 'Cadastre tigelas, complementos e bebidas para publicar seu menu.',
    accentClassName: 'from-fuchsia-600 via-purple-600 to-violet-700',
  },
  sushi: {
    slug: 'sushi',
    label: 'Japonês / Sushi',
    nomeCanal: getChannelName('sushi'),
    badge: 'Percepção premium e leitura refinada',
    heroTitle: 'Canal japonês com apresentação premium e pedido direto.',
    heroDescription: 'Combinados, sashimis e temakis em uma vitrine elegante.',
    sectionTitle: 'Combinados, sashimis e temakis',
    sectionDescription: 'Menus premium, porções e bebidas com leitura fluida no celular.',
    aboutTitle: 'Mais valor percebido para o seu menu',
    aboutDescription:
      'A personalização do layout ajuda a alinhar o canal digital à experiência da sua marca.',
    emptyStateTitle: 'Seu menu japonês ainda não tem itens cadastrados',
    emptyStateDescription: 'Cadastre os produtos para ativar a vitrine e começar a vender.',
    accentClassName: 'from-red-900/90 via-rose-900/70 to-stone-900',
  },
  adega: {
    slug: 'adega',
    label: 'Adega / Delivery de Bebidas',
    nomeCanal: getChannelName('adega'),
    badge: 'Bebidas geladas com entrega rápida',
    heroTitle: 'Catálogo de bebidas com delivery rápido e gelado.',
    heroDescription: 'Cervejas, vinhos, destilados e kits para praia, churrasco ou festa.',
    sectionTitle: 'Cervejas, vinhos, destilados e kits',
    sectionDescription: 'Encontre bebida, kit e combo em poucos cliques. Entrega com gelo.',
    aboutTitle: 'Delivery de bebidas profissional',
    aboutDescription:
      'Personalize banner, fotos e categorias para destacar promoções e kits sazonais.',
    emptyStateTitle: 'Sua adega digital ainda não tem produtos cadastrados',
    emptyStateDescription: 'Cadastre cervejas, vinhos e combos para publicar o catálogo.',
    accentClassName: 'from-purple-900/80 via-rose-900/60 to-amber-900/50',
  },
  mercadinho: {
    slug: 'mercadinho',
    label: 'Mercadinho / Minimercado',
    nomeCanal: getChannelName('mercadinho'),
    badge: 'Conveniência com entrega rápida',
    heroTitle: 'Tudo que você precisa, entregue na sua porta.',
    heroDescription:
      'Bebidas, mercearia, higiene, limpeza, frios e muito mais com delivery rápido.',
    sectionTitle: 'Produtos do dia a dia com entrega',
    sectionDescription: 'Navegue por categorias e monte seu pedido sem sair de casa.',
    aboutTitle: 'Seu mercadinho no celular do cliente',
    aboutDescription:
      'Cadastre produtos por categoria, atualize preços e promoções direto do painel.',
    emptyStateTitle: 'Seu mercadinho digital ainda está vazio',
    emptyStateDescription: 'Cadastre os produtos para começar a receber pedidos por delivery.',
    accentClassName: 'from-green-600 via-emerald-500 to-teal-600',
  },
  padaria: {
    slug: 'padaria',
    label: 'Padaria / Confeitaria',
    nomeCanal: getChannelName('padaria'),
    badge: 'Pães frescos e doces artesanais',
    heroTitle: 'Pães, bolos, salgados e café com entrega.',
    heroDescription: 'Produtos frescos da padaria direto na sua casa. Delivery e retirada.',
    sectionTitle: 'Pães, doces, salgados e bebidas',
    sectionDescription: 'Escolha seus favoritos e receba quentinho no conforto da sua casa.',
    aboutTitle: 'Padaria digital com cara de padaria de verdade',
    aboutDescription: 'Banner, logo e categorias para destacar seus produtos artesanais e do dia.',
    emptyStateTitle: 'Sua padaria digital ainda não publicou os produtos',
    emptyStateDescription: 'Cadastre pães, bolos e salgados para ativar a vitrine.',
    accentClassName: 'from-amber-700 via-yellow-700 to-orange-700',
  },
  sorveteria: {
    slug: 'sorveteria',
    label: 'Sorveteria',
    nomeCanal: getChannelName('sorveteria'),
    badge: 'Sabores refrescantes e entrega gelada',
    heroTitle: 'Sorvetes artesanais, picolés e milkshakes.',
    heroDescription: 'Entrega gelada na sua porta. Sabores tradicionais e especiais.',
    sectionTitle: 'Sorvetes, picolés e sobremesas geladas',
    sectionDescription: 'Escolha seu sabor favorito e peça com entrega rápida.',
    aboutTitle: 'Sorveteria digital para o litoral',
    aboutDescription:
      'Layout vibrante com fotos de dar água na boca. Atualize sabores sazonais facilmente.',
    emptyStateTitle: 'Sua sorveteria ainda não tem sabores cadastrados',
    emptyStateDescription: 'Cadastre sorvetes, picolés e milkshakes para publicar o menu.',
    accentClassName: 'from-pink-500 via-rose-400 to-orange-400',
  },
  acougue: {
    slug: 'acougue',
    label: 'Açougue / Casa de Carnes',
    nomeCanal: getChannelName('acougue'),
    badge: 'Carnes selecionadas e kits churrasco',
    heroTitle: 'Cortes nobres, kits churrasco e entrega no mesmo dia.',
    heroDescription: 'Bovino, suíno, frango, embutidos e tudo para o churrasco com delivery.',
    sectionTitle: 'Cortes, kits e embutidos',
    sectionDescription: 'Escolha os cortes, monte o kit e receba em casa pronto para a grelha.',
    aboutTitle: 'Açougue profissional no digital',
    aboutDescription: 'Fotos dos cortes, descrição de peso e preparo. Atualização fácil no painel.',
    emptyStateTitle: 'Seu açougue digital ainda não tem cortes cadastrados',
    emptyStateDescription: 'Cadastre cortes, kits e embutidos para publicar o catálogo.',
    accentClassName: 'from-red-800 via-red-700 to-rose-800',
  },
  hortifruti: {
    slug: 'hortifruti',
    label: 'Hortifruti',
    nomeCanal: getChannelName('hortifruti'),
    badge: 'Frutas, verduras e legumes frescos',
    heroTitle: 'Hortifruti fresco com entrega no mesmo dia.',
    heroDescription: 'Frutas, verduras, legumes e orgânicos direto do produtor para sua casa.',
    sectionTitle: 'Frutas, verduras, legumes e orgânicos',
    sectionDescription: 'Produtos frescos selecionados para você receber com qualidade.',
    aboutTitle: 'Saúde e praticidade no digital',
    aboutDescription: 'Atualize disponibilidade e preços conforme a safra direto do painel.',
    emptyStateTitle: 'Seu hortifruti digital ainda está vazio',
    emptyStateDescription: 'Cadastre frutas, verduras e legumes para começar a vender.',
    accentClassName: 'from-green-700 via-lime-600 to-emerald-600',
  },
  petshop: {
    slug: 'petshop',
    label: 'Petshop',
    nomeCanal: getChannelName('petshop'),
    badge: 'Tudo para seu pet com entrega',
    heroTitle: 'Ração, petiscos, higiene e acessórios para seu pet.',
    heroDescription: 'Produtos para cães, gatos e outros pets com delivery rápido.',
    sectionTitle: 'Ração, petiscos e acessórios',
    sectionDescription: 'Encontre tudo para o bem-estar do seu pet em um só lugar.',
    aboutTitle: 'Petshop digital completo',
    aboutDescription: 'Organize por animal e categoria. Atualize estoque e promoções pelo painel.',
    emptyStateTitle: 'Seu petshop digital ainda não tem produtos',
    emptyStateDescription: 'Cadastre rações, petiscos e acessórios para publicar a loja.',
    accentClassName: 'from-sky-600 via-blue-500 to-cyan-500',
  },
  doceria: {
    slug: 'doceria',
    label: 'Doceria / Confeitaria',
    nomeCanal: getChannelName('doceria'),
    badge: 'Doces artesanais e encomendas',
    heroTitle: 'Brigadeiros, bolos, trufas e docinhos sob encomenda.',
    heroDescription: 'Doces artesanais para festas, presentes ou para matar a vontade.',
    sectionTitle: 'Brigadeiros, bolos e docinhos',
    sectionDescription: 'Escolha seus doces favoritos e encomende com praticidade.',
    aboutTitle: 'Vitrine digital para sua doceria',
    aboutDescription: 'Fotos irresistíveis, categorias organizadas e pedidos direto pelo WhatsApp.',
    emptyStateTitle: 'Sua doceria digital ainda não tem doces cadastrados',
    emptyStateDescription: 'Cadastre brigadeiros, bolos e trufas para publicar a vitrine.',
    accentClassName: 'from-pink-600 via-fuchsia-500 to-rose-500',
  },
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
  const sectionDescription = LEGACY_TEXTS[sectionDescriptionRaw] ?? sectionDescriptionRaw

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
    primaryCtaLabel: customization.primaryCtaLabel || seed.primaryCtaLabel || '',
    secondaryCtaLabel: customization.secondaryCtaLabel || seed.secondaryCtaLabel || '',
    sectionTitle: customization.sectionTitle || seed.sectionTitle || template.sectionTitle,
    sectionDescription,
    emptyStateTitle:
      customization.emptyStateTitle || seed.emptyStateTitle || template.emptyStateTitle,
    emptyStateDescription:
      customization.emptyStateDescription ||
      seed.emptyStateDescription ||
      template.emptyStateDescription,
    aboutTitle: customization.aboutTitle || seed.aboutTitle || template.aboutTitle,
    aboutDescription:
      customization.aboutDescription || seed.aboutDescription || template.aboutDescription,
    deliveryLabel: customization.deliveryLabel || seed.deliveryLabel || 'Entrega',
    pickupLabel: customization.pickupLabel || seed.pickupLabel || 'Retirada',
    dineInLabel: customization.dineInLabel || seed.dineInLabel || 'Consumir no local',
  }
}

export function getChannelName(templateSlug: RestaurantTemplateSlug): string {
  return TEMPLATE_CHANNEL_NAMES[templateSlug] || 'Canal Digital'
}

export function getRestaurantAiAssistantSettings(
  value?: RestaurantCustomization | string | null
): Required<Pick<RestaurantAiAssistantSettings, 'enabled' | 'scope' | 'dailyMessageLimit'>> &
  RestaurantAiAssistantSettings {
  const customization = parseRestaurantCustomization(value)
  const aiAssistant = (customization.aiAssistant || {}) as RestaurantAiAssistantSettings
  const dailyMessageLimit = Number(aiAssistant.dailyMessageLimit)

  return {
    enabled: aiAssistant.enabled ?? false,
    consentedAt: aiAssistant.consentedAt ?? null,
    consentVersion: aiAssistant.consentVersion ?? 'v1',
    provider: aiAssistant.provider ?? 'groq',
    scope: aiAssistant.scope ?? 'sales',
    dailyMessageLimit:
      Number.isFinite(dailyMessageLimit) && dailyMessageLimit > 0 ? dailyMessageLimit : 20,
  }
}
