import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

// Garante que o canal público sempre busque dados frescos do Supabase.
// Sem cache: edição no painel → canal atualizado na hora.
export const dynamic = 'force-dynamic'
import {
  buildCardapioViewModel,
  type CardapioProduct,
  type CardapioRestaurant,
} from '@/lib/cardapio-renderer'
import CardapioClient from './cardapio-client'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ mesa?: string }>
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

export default async function CardapioPage({ params }: PageProps) {
  const { slug } = await params

  // Buscar dados do restaurante
  const restaurant = await getRestaurant(slug)

  if (!restaurant) {
    notFound()
  }

  // Buscar produtos do canal digital
  const products = await getCardapio(restaurant.id)

  return <CardapioClient restaurant={restaurant} products={products} />
}
