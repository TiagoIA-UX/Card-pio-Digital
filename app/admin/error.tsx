'use client'

import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-semibold">Algo deu errado no painel de administração</h2>
      <p className="text-muted-foreground max-w-md text-sm">
        Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte se o problema
        persistir.
      </p>
      <button
        onClick={reset}
        className="bg-primary text-primary-foreground rounded-full px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
      >
        Tentar novamente
      </button>
    </div>
  )
}
