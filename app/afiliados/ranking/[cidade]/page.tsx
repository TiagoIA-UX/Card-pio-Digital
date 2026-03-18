/**
 * /afiliados/ranking/[cidade] — Redireciona para o mapa de afiliados.
 * A visualização por cidade está disponível em /afiliados/mapa.
 */
import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ cidade: string }>
}

export default async function RankingCidadePage({ params }: Props) {
  const { cidade } = await params
  // Redireciona para o mapa com âncora da cidade, se houver
  redirect(`/afiliados/mapa${cidade ? `#${cidade}` : ''}`)
}
