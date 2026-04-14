import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/shared/supabase/server'
import { getTemplateCatalog } from '@/lib/domains/marketing/templates-config'

// Garante que o canal público sempre busque dados frescos do Supabase.
// Sem cache: edição no painel → canal atualizado na hora.
export const dynamic = 'force-dynamic'
import {
  buildCardapioViewModel,
  type CardapioProduct,
  type CardapioRestaurant,
} from '@/lib/domains/core/cardapio-renderer'
import CardapioClient from './cardapio-client'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ mesa?: string }>
}

const TEMPLATE_SLUGS = getTemplateCatalog().map((template) => template.slug)

const TEMPLATE_ALIAS_TO_SLUG: Record<string, string> = {
  restaurante: 'restaurante',
  marmita: 'restaurante',
  comida: 'restaurante',
  pizzaria: 'pizzaria',
  pizza: 'pizzaria',
  lanchonete: 'lanchonete',
  lanche: 'lanchonete',
  lanches: 'lanchonete',
  hamburgueria: 'lanchonete',
  burger: 'lanchonete',
  bar: 'bar',
  petisco: 'bar',
  petiscos: 'bar',
  cafeteria: 'cafeteria',
  cafe: 'cafeteria',
  brunch: 'cafeteria',
  acai: 'acai',
  sushi: 'sushi',
  japones: 'sushi',
  japa: 'sushi',
  adega: 'adega',
  bebida: 'adega',
  bebidas: 'adega',
  mercadinho: 'mercadinho',
  minimercado: 'minimercado',
  mercado: 'minimercado',
  conveniencia: 'mercadinho',
  padaria: 'padaria',
  sorveteria: 'sorveteria',
  sorvete: 'sorveteria',
  acougue: 'acougue',
  carnes: 'acougue',
  hortifruti: 'hortifruti',
  horta: 'hortifruti',
  petshop: 'petshop',
  pet: 'petshop',
  doceria: 'doceria',
  doces: 'doceria',
  confeitaria: 'doceria',
}

function normalizeSlugToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function resolveTemplateFallbackSlug(slug: string): string | null {
  const normalizedSlug = normalizeSlugToken(slug)

  for (const templateSlug of TEMPLATE_SLUGS) {
    if (normalizedSlug === templateSlug || normalizedSlug.startsWith(`${templateSlug}-`)) {
      return templateSlug
    }
  }

  const parts = normalizedSlug.split('-').filter(Boolean)

  for (const part of parts) {
    const mapped = TEMPLATE_ALIAS_TO_SLUG[part]
    if (mapped && TEMPLATE_SLUGS.includes(mapped)) {
      return mapped
    }
  }

  return null
}

// Buscar dados do restaurante para SEO
async function getRestaurant(slug: string) {
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  return restaurant as CardapioRestaurant | null
}

// Buscar canal digital (produtos agrupados por categoria)
async function getCardapio(restaurantId: string) {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('ativo', true)
    .order('ordem')
    .order('nome')

  return (products || []) as CardapioProduct[]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const restaurant = await getRestaurant(slug)

  if (!restaurant) {
    const fallbackTemplateSlug = resolveTemplateFallbackSlug(slug)

    if (fallbackTemplateSlug) {
      const templateTitle =
        fallbackTemplateSlug.charAt(0).toUpperCase() + fallbackTemplateSlug.slice(1)

      return {
        title: `Prévia ${templateTitle} | Zairyx Canais Digitais`,
        description: `Este link abre uma prévia do template ${templateTitle}.`,
      }
    }

    return {
      title: 'Delivery não encontrado',
      description: 'Este delivery não existe ou está inativo.',
    }
  }

  const viewModel = buildCardapioViewModel(restaurant, [])

  const title = `${restaurant.nome} | Zairyx Canais Digitais`
  const description =
    restaurant.slogan ||
    viewModel.presentation.heroDescription ||
    `Veja o canal digital completo de ${restaurant.nome}. Faça seu pedido pelo WhatsApp!`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: restaurant.banner_url ? [{ url: restaurant.banner_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function CardapioPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined

  // Buscar dados do restaurante
  const restaurant = await getRestaurant(slug)

  if (!restaurant) {
    const fallbackTemplateSlug = resolveTemplateFallbackSlug(slug)
    if (fallbackTemplateSlug) {
      const mesa = resolvedSearchParams?.mesa?.trim()
      const redirectUrl = mesa
        ? `/templates/${fallbackTemplateSlug}?mesa=${encodeURIComponent(mesa)}`
        : `/templates/${fallbackTemplateSlug}`
      redirect(redirectUrl)
    }
    notFound()
  }

  // Buscar produtos do canal digital
  const products = await getCardapio(restaurant.id)

  return <CardapioClient restaurant={restaurant} products={products} />
}
