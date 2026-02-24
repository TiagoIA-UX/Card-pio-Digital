import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import CardapioClient from "./cardapio-client"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('nome, slogan')
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  if (!restaurant) {
    return { title: 'Restaurante não encontrado' }
  }

  return {
    title: `${restaurant.nome} - Cardápio Digital`,
    description: restaurant.slogan || `Faça seu pedido no ${restaurant.nome}`,
  }
}

export default async function CardapioPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Buscar restaurante
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  if (restaurantError || !restaurant) {
    notFound()
  }

  // Buscar produtos ativos
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('ativo', true)
    .order('categoria')
    .order('ordem')

  return <CardapioClient restaurant={restaurant} products={products || []} />
}
