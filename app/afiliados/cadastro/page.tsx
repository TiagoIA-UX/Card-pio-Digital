'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp } from 'lucide-react'

export default function AfiliadosCadastro() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/painel/afiliados')
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-2xl">
        <TrendingUp className="text-primary h-8 w-8 animate-pulse" />
      </div>
      <p className="text-foreground font-semibold">Redirecionando para o painel de afiliados…</p>
      <p className="text-foreground/50 text-sm">Você será levado ao painel em instantes.</p>
    </div>
  )
}
