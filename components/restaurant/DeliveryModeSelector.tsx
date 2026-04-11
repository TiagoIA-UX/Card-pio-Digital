'use client'

import { useEffect, useRef, useState } from 'react'

type DeliveryMode = 'whatsapp_only' | 'terminal_only' | 'hybrid'

const MODES: {
  value: DeliveryMode
  label: string
  description: string
  badge?: string
}[] = [
  {
    value: 'whatsapp_only',
    label: 'WhatsApp',
    description: 'Pedidos e atendimento pelo WhatsApp. Fluxo padrão.',
  },
  {
    value: 'hybrid',
    label: 'Híbrido',
    description: 'IA atende no cardápio digital. WhatsApp fica como canal de suporte.',
    badge: 'Recomendado para alto volume',
  },
  {
    value: 'terminal_only',
    label: 'Canal próprio com IA',
    description: 'Atendimento 100% pelo cardápio digital. Reduz dependência do WhatsApp.',
    badge: 'Reduz risco de ban',
  },
]

interface Props {
  currentMode: DeliveryMode
}

export function DeliveryModeSelector({ currentMode }: Props) {
  const [selected, setSelected] = useState<DeliveryMode>(currentMode)
  const [committed, setCommitted] = useState<DeliveryMode>(currentMode)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  async function handleSave() {
    if (selected === committed) return
    setLoading(true)
    setError(null)
    setSaved(false)

    try {
      const res = await fetch('/api/restaurant/settings/delivery-mode', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery_mode: selected }),
      })

      let data: Record<string, unknown> = {}
      try {
        data = await res.json()
      } catch {
        setError('Resposta inválida do servidor.')
        return
      }

      if (!res.ok) {
        setError((data.error as string) || 'Erro ao salvar.')
        return
      }

      setCommitted(selected)
      setSaved(true)
      timerRef.current = setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Falha na conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-foreground text-sm font-semibold">Modo de atendimento</h2>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Escolha como seus clientes vão interagir com seu cardápio.
        </p>
      </div>

      <div className="space-y-2">
        {MODES.map((mode) => {
          const isSelected = selected === mode.value

          return (
            <button
              key={mode.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelected(mode.value)}
              className={[
                'w-full rounded-lg border px-4 py-3 text-left transition-colors',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-muted-foreground',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{mode.label}</span>
                <div className="flex items-center gap-2">
                  {mode.badge ? (
                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                      {mode.badge}
                    </span>
                  ) : null}
                  <div
                    className={[
                      'flex h-4 w-4 items-center justify-center rounded-full border-2',
                      isSelected ? 'border-primary' : 'border-muted-foreground',
                    ].join(' ')}
                  >
                    {isSelected ? <div className="bg-primary h-2 w-2 rounded-full" /> : null}
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">{mode.description}</p>
            </button>
          )
        })}
      </div>

      {error ? <p className="text-destructive text-xs">{error}</p> : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={loading || selected === committed}
        className="bg-primary text-primary-foreground w-full rounded-lg py-2 text-sm font-medium transition-opacity disabled:opacity-40"
      >
        {loading ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar alteração'}
      </button>
    </div>
  )
}
