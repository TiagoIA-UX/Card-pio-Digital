import { redirect } from 'next/navigation'

interface AfiliadosConfiguracoesPageProps {
  searchParams?: Promise<{
    restaurant?: string
  }>
}

export default async function AfiliadosConfiguracoesPage({
  searchParams,
}: AfiliadosConfiguracoesPageProps) {
  const params = searchParams ? await searchParams : undefined
  const restaurantId = params?.restaurant

  redirect(restaurantId ? `/painel?restaurant=${restaurantId}` : '/painel')
}
