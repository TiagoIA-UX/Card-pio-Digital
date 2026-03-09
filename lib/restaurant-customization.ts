export type RestaurantTemplateSlug =
  | 'restaurante'
  | 'pizzaria'
  | 'lanchonete'
  | 'bar'
  | 'cafeteria'
  | 'acai'
  | 'sushi'

export interface RestaurantCustomization {
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
    heroTitle: 'Seu cardápio digital pronto para vender almoço, marmita e combo sem complicação.',
    heroDescription:
      'Organize categorias, destaque pratos do dia e receba pedidos de forma rápida no delivery, retirada ou atendimento local.',
    sectionTitle: 'Categorias organizadas para uma operação rápida',
    sectionDescription:
      'Facilite a escolha do cliente com fotos, descrições e preços bem distribuídos no celular.',
    aboutTitle: 'Venda com mais clareza no digital',
    aboutDescription:
      'Use banner, logo, textos e categorias para transformar o cardápio em uma vitrine profissional e fácil de atualizar.',
    emptyStateTitle: 'Seu cardápio está quase pronto',
    emptyStateDescription:
      'Cadastre seus produtos para publicar o menu e começar a receber pedidos.',
    accentClassName: 'from-amber-500 to-orange-500',
  },
  pizzaria: {
    slug: 'pizzaria',
    label: 'Pizzaria',
    badge: 'Sabores, bordas e combos com ticket alto',
    heroTitle: 'Sua pizzaria online com visual forte, leitura rápida e pedido direto.',
    heroDescription:
      'Destaque sabores, tamanhos, bebidas e combos para vender mais no delivery, retirada e nas mesas.',
    sectionTitle: 'Monte categorias que fazem sentido para a fome da noite',
    sectionDescription:
      'Organize pizzas, bordas, promoções e bebidas em uma estrutura fácil de percorrer.',
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
    heroTitle: 'Um cardápio pensado para vender lanche, combo e adicional sem ruído.',
    heroDescription:
      'Mostre hambúrgueres, acompanhamentos e bebidas com imagens fortes e uma navegação rápida.',
    sectionTitle: 'Estruture o menu para vender mais por impulso',
    sectionDescription:
      'Categorias claras ajudam o cliente a encontrar lanche, adicional e sobremesa em segundos.',
    aboutTitle: 'Velocidade para quem pede e para quem atende',
    aboutDescription:
      'O layout reduz dúvida na escolha e deixa o pedido mais objetivo para a operação.',
    emptyStateTitle: 'Seu cardápio ainda está sem os lanches cadastrados',
    emptyStateDescription: 'Adicione seus combos e adicionais para começar a vender online.',
    accentClassName: 'from-yellow-500 to-orange-500',
  },
  bar: {
    slug: 'bar',
    label: 'Bar / Pub',
    badge: 'Petiscos, drinks e consumo local',
    heroTitle: 'Seu bar com cardápio digital pronto para delivery, retirada e mesa.',
    heroDescription:
      'Organize drinks, cervejas e petiscos com um visual mais noturno e direto ao ponto.',
    sectionTitle: 'Categorias que acompanham o ritmo do salão',
    sectionDescription: 'O cliente encontra rápido o que beber e o que pedir para compartilhar.',
    aboutTitle: 'Digital sem perder o clima da casa',
    aboutDescription:
      'Personalize texto, banner, fotos e cores para manter a identidade do seu bar.',
    emptyStateTitle: 'Seu bar digital precisa dos produtos para começar',
    emptyStateDescription: 'Cadastre os drinks, petiscos e promoções para publicar o menu.',
    accentClassName: 'from-zinc-700 to-amber-500',
  },
  cafeteria: {
    slug: 'cafeteria',
    label: 'Cafeteria',
    badge: 'Atmosfera premium e pedido leve',
    heroTitle: 'Uma cafeteria digital com apresentação elegante e edição simples.',
    heroDescription: 'Destaque cafés, doces, brunch e sazonais com uma vitrine bonita e funcional.',
    sectionTitle: 'Categorias organizadas para quem escolhe com calma',
    sectionDescription:
      'Ajude o cliente a comparar bebidas e acompanhar o pedido com mais confiança.',
    aboutTitle: 'Experiência visual alinhada com a marca',
    aboutDescription: 'Fotos, texto, banner e logo ficam centralizados para acelerar a publicação.',
    emptyStateTitle: 'Sua cafeteria ainda não publicou os produtos',
    emptyStateDescription: 'Cadastre os itens para deixar o cardápio pronto para compartilhar.',
    accentClassName: 'from-stone-500 to-orange-500',
  },
  acai: {
    slug: 'acai',
    label: 'Açaíteria',
    badge: 'Combinações, adicionais e venda rápida',
    heroTitle: 'Seu cardápio de açaí no ar com destaque para tigelas, copos e complementos.',
    heroDescription: 'Use um layout vibrante para vender por delivery, retirada ou consumo local.',
    sectionTitle: 'Categorias simples para um pedido rápido',
    sectionDescription:
      'Clientes encontram tamanho, complemento e bebidas sem se perder na jornada.',
    aboutTitle: 'Atualize o menu com facilidade',
    aboutDescription:
      'Altere fotos, títulos, descrições e banner sem precisar mexer na estrutura do layout.',
    emptyStateTitle: 'Seu cardápio de açaí ainda está vazio',
    emptyStateDescription: 'Cadastre tigelas, complementos e bebidas para publicar seu menu.',
    accentClassName: 'from-fuchsia-500 to-violet-500',
  },
  sushi: {
    slug: 'sushi',
    label: 'Japonês / Sushi',
    badge: 'Percepção premium e leitura refinada',
    heroTitle: 'Seu cardápio japonês com apresentação premium e pedido direto.',
    heroDescription:
      'Valorize combinados, sashimis e temakis com uma vitrine elegante e fácil de atualizar.',
    sectionTitle: 'Categorias que ajudam o cliente a decidir sem atrito',
    sectionDescription:
      'Mostre menus premium, porções e bebidas com uma leitura fluida no celular.',
    aboutTitle: 'Mais valor percebido para o seu menu',
    aboutDescription:
      'A personalização do layout ajuda a alinhar o cardápio à experiência da sua marca.',
    emptyStateTitle: 'Seu menu japonês ainda não tem itens cadastrados',
    emptyStateDescription: 'Cadastre os produtos para ativar a vitrine e começar a vender.',
    accentClassName: 'from-emerald-500 to-cyan-500',
  },
}

const DEFAULT_TEMPLATE: RestaurantTemplateSlug = 'restaurante'

export function normalizeTemplateSlug(value?: string | null): RestaurantTemplateSlug {
  if (!value) return DEFAULT_TEMPLATE

  return value in TEMPLATE_PRESETS ? (value as RestaurantTemplateSlug) : DEFAULT_TEMPLATE
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

export function getRestaurantPresentation(restaurant: RestaurantWithCustomization) {
  const template = TEMPLATE_PRESETS[normalizeTemplateSlug(restaurant.template_slug)]
  const customization = parseRestaurantCustomization(restaurant.customizacao)

  return {
    template,
    customization,
    badge: customization.badge || template.badge,
    heroTitle:
      customization.heroTitle || `${restaurant.nome} com cardápio digital pronto para vender mais.`,
    heroDescription: customization.heroDescription || template.heroDescription,
    primaryCtaLabel: customization.primaryCtaLabel || 'Fazer pedido',
    secondaryCtaLabel: customization.secondaryCtaLabel || 'Abrir WhatsApp',
    sectionTitle: customization.sectionTitle || template.sectionTitle,
    sectionDescription: customization.sectionDescription || template.sectionDescription,
    emptyStateTitle: customization.emptyStateTitle || template.emptyStateTitle,
    emptyStateDescription: customization.emptyStateDescription || template.emptyStateDescription,
    aboutTitle: customization.aboutTitle || template.aboutTitle,
    aboutDescription: customization.aboutDescription || template.aboutDescription,
    deliveryLabel: customization.deliveryLabel || 'Entrega',
    pickupLabel: customization.pickupLabel || 'Retirada',
    dineInLabel: customization.dineInLabel || 'Consumir no local',
  }
}
