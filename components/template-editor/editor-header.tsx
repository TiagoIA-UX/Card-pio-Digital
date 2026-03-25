'use client'

import Link from 'next/link'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Package,
  Rocket,
  Store,
} from 'lucide-react'
import { getRestaurantScopedHref } from '@/lib/active-restaurant'

interface EditorHeaderProps {
  panelHidden: boolean
  onTogglePanel: () => void
  restaurantId: string | undefined
  cardapioUrl: string
  copied: boolean
  onCopyAndPublish: () => void
}

export function EditorHeader({
  panelHidden,
  onTogglePanel,
  restaurantId,
  cardapioUrl,
  copied,
  onCopyAndPublish,
}: EditorHeaderProps) {
  return (
    <header className="border-border bg-background flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2 sm:px-4 sm:py-3">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onTogglePanel}
          className="text-muted-foreground hover:text-foreground shrink-0 rounded-lg p-2 transition-colors"
          title={
            panelHidden
              ? 'Mostrar formulário lateral'
              : 'Esconder formulário (editar direto no template)'
          }
        >
          {panelHidden ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
        <Store className="text-primary h-5 w-5 shrink-0" />
        <div>
          <h1 className="text-foreground truncate text-base font-semibold sm:text-lg">
            Editor Visual
          </h1>
          <p className="text-muted-foreground text-xs">
            {panelHidden
              ? 'Clique nos textos do template para editar'
              : 'Ou use o formulário à esquerda'}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <Link
          href={getRestaurantScopedHref('/painel/produtos', restaurantId)}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm transition-colors sm:gap-2 sm:px-3"
        >
          <Package className="h-4 w-4" />
          <span className="hidden sm:inline">Produtos</span>
        </Link>
        <button
          onClick={onCopyAndPublish}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 rounded-xl px-3 py-2 font-semibold transition-colors sm:gap-2 sm:px-5 sm:py-2.5"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              <span className="sm:inline">Link copiado!</span>
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              <span className="sm:inline">Publicar</span>
              <span className="hidden sm:inline"> meu canal agora</span>
            </>
          )}
        </button>
        <a
          href={cardapioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors"
          title="Abrir canal"
        >
          <ExternalLink className="h-5 w-5" />
        </a>
      </div>
    </header>
  )
}
