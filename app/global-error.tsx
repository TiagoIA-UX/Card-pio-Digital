'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body className="bg-white text-slate-950">
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
            Erro inesperado
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Ocorreu uma falha e o evento foi registrado.
          </h1>
          <p className="max-w-xl text-sm text-slate-600">
            Tente novamente. Se o problema continuar, nossa equipe consegue investigar com os dados do erro.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  )
}
