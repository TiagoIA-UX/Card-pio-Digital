import type { RestaurantTemplateSlug } from '@/lib/domains/core/restaurant-customization'

export type TemplateFamilyId =
  | 'alimentacao-pronta'
  | 'doces-gelados'
  | 'mercado-conveniencia'
  | 'varejo-especializado'

export interface TemplateFamilyMeta {
  id: TemplateFamilyId
  label: string
  description: string
}

export interface PublicTemplateMeta {
  slug: RestaurantTemplateSlug
  publicName: string
  shortName: string
  family: TemplateFamilyId
  categoryLabel: string
  productProfile: string
  summary: string
  cardDescription: string
}

export const TEMPLATE_FAMILY_ORDER: TemplateFamilyId[] = [
  'alimentacao-pronta',
  'doces-gelados',
  'mercado-conveniencia',
  'varejo-especializado',
]

export const TEMPLATE_FAMILIES: Record<TemplateFamilyId, TemplateFamilyMeta> = {
  'alimentacao-pronta': {
    id: 'alimentacao-pronta',
    label: 'Refeições e lanches',
    description: 'Operações que vendem refeições prontas, combos, porções e consumo imediato.',
  },
  'doces-gelados': {
    id: 'doces-gelados',
    label: 'Doces e gelados',
    description: 'Catálogos visuais, toppings, variações e impulso de ticket com combinações.',
  },
  'mercado-conveniencia': {
    id: 'mercado-conveniencia',
    label: 'Mercado e conveniência',
    description: 'Mix rápido, recompra frequente e operação por volume de itens.',
  },
  'varejo-especializado': {
    id: 'varejo-especializado',
    label: 'Varejo especializado',
    description: 'Operações de nicho com recorrência, sortimento técnico e compra orientada.',
  },
}

export const TEMPLATE_PUBLIC_ORDER: RestaurantTemplateSlug[] = [
  'lanchonete',
  'restaurante',
  'pizzaria',
  'bar',
  'cafeteria',
  'sushi',
  'acai',
  'sorveteria',
  'doceria',
  'mercadinho',
  'minimercado',
  'padaria',
  'adega',
  'acougue',
  'hortifruti',
  'petshop',
]

export const TEMPLATE_PUBLIC_META: Record<RestaurantTemplateSlug, PublicTemplateMeta> = {
  restaurante: {
    slug: 'restaurante',
    publicName: 'Restaurante e marmita',
    shortName: 'Restaurante',
    family: 'alimentacao-pronta',
    categoryLabel: 'Refeições prontas',
    productProfile: 'Pratos do dia, executivos e combos',
    summary: 'Para operações com almoço, jantar, marmitas e cardápio recorrente.',
    cardDescription:
      'Organiza pratos, executivos, adicionais e combos sem deixar o catálogo confuso.',
  },
  pizzaria: {
    slug: 'pizzaria',
    publicName: 'Pizzaria',
    shortName: 'Pizzaria',
    family: 'alimentacao-pronta',
    categoryLabel: 'Delivery de pizza',
    productProfile: 'Sabores, tamanhos e bordas',
    summary: 'Para sabores, combos família, bordas e linhas salgadas ou doces.',
    cardDescription: 'Destaca sabores, tamanhos, combos e extras para vender melhor no delivery.',
  },
  lanchonete: {
    slug: 'lanchonete',
    publicName: 'Lanches e burgers',
    shortName: 'Lanches e burgers',
    family: 'alimentacao-pronta',
    categoryLabel: 'Lanches rápidos',
    productProfile: 'Burgers, combos e porções',
    summary: 'Para hamburguerias e lanchonetes com foco em combos e giro rápido.',
    cardDescription: 'Facilita a leitura de lanches, adicionais, molhos, combos e porções.',
  },
  bar: {
    slug: 'bar',
    publicName: 'Bar e petiscos',
    shortName: 'Bar e petiscos',
    family: 'alimentacao-pronta',
    categoryLabel: 'Bebida e petisco',
    productProfile: 'Porções, drinks e combos',
    summary: 'Para bares que precisam destacar porções, drinks, cervejas e promoções.',
    cardDescription: 'Separa petiscos, bebidas e combos de forma clara para não travar o pedido.',
  },
  cafeteria: {
    slug: 'cafeteria',
    publicName: 'Cafeteria e brunch',
    shortName: 'Cafeteria',
    family: 'alimentacao-pronta',
    categoryLabel: 'Café e consumo leve',
    productProfile: 'Cafés, salgados e brunch',
    summary: 'Para cafés especiais, acompanhamentos, brunch e venda por impulso.',
    cardDescription: 'Valoriza bebidas, doces, salgados e combos leves com leitura elegante.',
  },
  sushi: {
    slug: 'sushi',
    publicName: 'Sushi e japonês',
    shortName: 'Sushi e japonês',
    family: 'alimentacao-pronta',
    categoryLabel: 'Culinária japonesa',
    productProfile: 'Combinados, temakis e peças',
    summary: 'Para combinados, peças, temakis e linhas premium do cardápio japonês.',
    cardDescription: 'Ajuda a organizar peças, combinados e linhas especiais sem cansar o cliente.',
  },
  acai: {
    slug: 'acai',
    publicName: 'Açaí e cremes',
    shortName: 'Açaí e cremes',
    family: 'doces-gelados',
    categoryLabel: 'Gelado personalizável',
    productProfile: 'Copos, tigelas e toppings',
    summary: 'Para açaí, creme, frutas e adicionais que precisam de navegação rápida.',
    cardDescription: 'Ordena tamanhos, toppings e combos de açaí sem virar uma lista caótica.',
  },
  sorveteria: {
    slug: 'sorveteria',
    publicName: 'Sorvetes e gelados',
    shortName: 'Sorvetes e gelados',
    family: 'doces-gelados',
    categoryLabel: 'Gelados e sobremesas',
    productProfile: 'Potes, casquinhas e sundaes',
    summary: 'Para sorveterias com sabores, complementos e opções de consumo imediato.',
    cardDescription: 'Mostra sabores, toppings e formatos de venda com apelo visual forte.',
  },
  doceria: {
    slug: 'doceria',
    publicName: 'Doces e sobremesas',
    shortName: 'Doces e sobremesas',
    family: 'doces-gelados',
    categoryLabel: 'Doces por impulso',
    productProfile: 'Bolos, brownies e kits',
    summary: 'Para bolos, doces finos, brownies, kits e sobremesas com forte apelo visual.',
    cardDescription: 'Organiza doces, kits e presentes com foco em conversão e recorrência.',
  },
  adega: {
    slug: 'adega',
    publicName: 'Adega e bebidas',
    shortName: 'Adega e bebidas',
    family: 'mercado-conveniencia',
    categoryLabel: 'Bebidas e conveniência',
    productProfile: 'Destilados, cervejas e combos',
    summary: 'Para adegas com mix de bebidas, conveniência e pedidos por ocasião.',
    cardDescription: 'Facilita a busca por bebidas, gelados, kits e combos de ocasião.',
  },
  mercadinho: {
    slug: 'mercadinho',
    publicName: 'Conveniência',
    shortName: 'Conveniência',
    family: 'mercado-conveniencia',
    categoryLabel: 'Compra rápida',
    productProfile: 'Itens de giro rápido',
    summary: 'Para operações enxutas com itens básicos, conveniência e reposição frequente.',
    cardDescription: 'Ideal para mix essencial com navegação rápida e pouca fricção no pedido.',
  },
  minimercado: {
    slug: 'minimercado',
    publicName: 'Mercado de bairro',
    shortName: 'Mercado de bairro',
    family: 'mercado-conveniencia',
    categoryLabel: 'Mix amplo e recorrente',
    productProfile: 'Mercearia, limpeza e perecíveis',
    summary: 'Para operações com mix maior, reposição recorrente e muita busca por categoria.',
    cardDescription: 'Suporta catálogo mais amplo com categorias extensas e recompra recorrente.',
  },
  padaria: {
    slug: 'padaria',
    publicName: 'Padaria e café',
    shortName: 'Padaria e café',
    family: 'mercado-conveniencia',
    categoryLabel: 'Frescos e balcão',
    productProfile: 'Pães, cafés e salgados',
    summary: 'Para padarias com vitrine fresca, café, combos e pedidos de conveniência.',
    cardDescription: 'Agrupa itens frescos, balcão, café e combos com leitura rápida no celular.',
  },
  acougue: {
    slug: 'acougue',
    publicName: 'Açougue e cortes',
    shortName: 'Açougue e cortes',
    family: 'varejo-especializado',
    categoryLabel: 'Proteína e conveniência',
    productProfile: 'Cortes, kits e especiais',
    summary: 'Para açougues com cortes, kits, promoções de fim de semana e venda consultiva.',
    cardDescription:
      'Destaca cortes, kits e especiais sem misturar linhas do dia a dia com premium.',
  },
  hortifruti: {
    slug: 'hortifruti',
    publicName: 'Hortifruti e frescos',
    shortName: 'Hortifruti e frescos',
    family: 'varejo-especializado',
    categoryLabel: 'Frescos por categoria',
    productProfile: 'Frutas, legumes e kits',
    summary: 'Para hortifruti com mix fresco, kits e compra recorrente por categoria.',
    cardDescription: 'Separa frutas, legumes, verduras e kits sem confundir o cliente.',
  },
  petshop: {
    slug: 'petshop',
    publicName: 'Petshop e conveniência pet',
    shortName: 'Petshop',
    family: 'varejo-especializado',
    categoryLabel: 'Recorrência e ticket médio',
    productProfile: 'Ração, higiene e acessórios',
    summary: 'Para petshops com recompra, kits, acessórios e conveniência do dia a dia.',
    cardDescription: 'Organiza ração, higiene e acessórios para compra recorrente sem atrito.',
  },
}

export function getPublicTemplateMeta(slug: RestaurantTemplateSlug): PublicTemplateMeta {
  return TEMPLATE_PUBLIC_META[slug]
}

export function getPublicTemplateName(slug: RestaurantTemplateSlug): string {
  return getPublicTemplateMeta(slug).publicName
}

type CatalogTemplateShape = {
  slug: string
  name: string
  category: string
  description?: string
  shortDescription?: string
}

export function decorateTemplateCatalog<T extends CatalogTemplateShape>(templates: T[]) {
  return templates.map((template) => {
    const meta = TEMPLATE_PUBLIC_META[template.slug as RestaurantTemplateSlug]
    if (!meta) return template

    return {
      ...template,
      name: meta.publicName,
      category: TEMPLATE_FAMILIES[meta.family].label,
      description: meta.cardDescription,
      shortDescription: meta.summary,
      publicFamily: meta.family,
      publicSummary: meta.summary,
      publicProductProfile: meta.productProfile,
    }
  })
}

