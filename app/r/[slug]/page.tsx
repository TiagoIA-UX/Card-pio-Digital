import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import CardapioClient from './cardapio-client'
import { getRestaurantPresentation } from '@/lib/restaurant-customization'

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

  return restaurant
}

// Buscar cardápio (produtos agrupados por categoria)
async function getCardapio(restaurantId: string) {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('ativo', true)
    .order('ordem')
    .order('nome')

  return products || []
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const restaurant = await getRestaurant(slug)

  if (!restaurant) {
    return {
      title: 'Restaurante não encontrado',
      description: 'Este restaurante não existe ou está inativo.',
    }
  }

  const presentation = getRestaurantPresentation({
    nome: restaurant.nome,
    template_slug: restaurant.template_slug,
    customizacao: restaurant.customizacao,
  })

  const title = `${restaurant.nome} | Cardápio Digital`
  const description =
    restaurant.slogan ||
    presentation.heroDescription ||
    `Veja o cardápio completo de ${restaurant.nome}. Faça seu pedido pelo WhatsApp!`

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

  // Buscar produtos do cardápio
  const products = await getCardapio(restaurant.id)

  return <CardapioClient restaurant={restaurant} products={products} />
}
