'use client'

import { AlertCircle } from 'lucide-react'

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
      <AlertCircle className="text-destructive mb-4 h-12 w-12" />
      <h2 className="text-foreground mb-2 text-lg font-semibold">
        Erro ao carregar analytics
      </h2>
      <p className="text-muted-foreground mb-6 text-sm">{error.message}</p>
      <button
        onClick={reset}
        className="bg-primary hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  )
}
