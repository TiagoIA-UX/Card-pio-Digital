'use client'

/**
 * Watermark / badge "Feito com Zairyx" exibido no rodapé do cardápio público
 * para deliverys no plano de entrada simbólica.
 *
 * Funciona como:
 *  1. Marketing orgânico — cada delivery de entrada é um "outdoor digital" da Zairyx
 *  2. Incentivo de upgrade — "remova a marca Zairyx no Plano Básico"
 *
 * Props:
 *  - show: boolean — controla visibilidade (true para plan_slug === 'semente')
 */

import { Sparkles } from 'lucide-react'

interface WatermarkBadgeProps {
  show: boolean
}

export function WatermarkBadge({ show }: WatermarkBadgeProps) {
  if (!show) return null

  return (
    <div className="w-full border-t border-zinc-200 bg-zinc-50 py-3 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <a
        href="https://zairyx.com.br?ref=semente"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400"
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>
          Feito com{' '}
          <strong className="font-semibold text-zinc-700 dark:text-zinc-200">Zairyx</strong>
        </span>
        <span className="text-zinc-400 dark:text-zinc-500">·</span>
        <span className="underline underline-offset-2">Comece seu canal digital</span>
      </a>
    </div>
  )
}
