import { redirect } from 'next/navigation'

interface AfiliadosPageProps {
  searchParams?: Promise<{
    restaurant?: string
  }>
}

export default async function AfiliadosPage({ searchParams }: AfiliadosPageProps) {
  const params = searchParams ? await searchParams : undefined
  const restaurantId = params?.restaurant

  redirect(restaurantId ? `/painel?restaurant=${restaurantId}` : '/painel')
}
