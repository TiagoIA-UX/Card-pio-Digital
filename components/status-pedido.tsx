'use client'

import { Check, Circle, Loader2, Package, Send, Sparkles } from 'lucide-react'

export interface StatusStep {
  key: string
  label: string
  done: boolean
  current: boolean
}

const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pedido_recebido: Package,
  aguardando_informacoes: Send,
  em_producao: Loader2,
  revisao: Sparkles,
  publicado: Check,
}

interface StatusPedidoProps {
  steps: StatusStep[]
  className?: string
}

export function StatusPedido({ steps, className = '' }: StatusPedidoProps) {
  return (
    <div className={`border-border bg-card rounded-2xl border p-6 ${className}`}>
      <h3 className="text-foreground mb-4 font-semibold">Status do seu pedido</h3>
      <ol className="space-y-4">
        {steps.map((step, idx) => {
          const Icon = STEP_ICONS[step.key] ?? Circle
          return (
            <li key={step.key} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                    step.done
                      ? 'bg-green-500/10 text-green-600'
                      : step.current
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.done ? (
                    <Check className="h-5 w-5" />
                  ) : step.current && step.key === 'em_producao' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`mt-2 h-6 w-0.5 shrink-0 ${
                      step.done ? 'bg-green-500/30' : 'bg-border'
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 pb-2">
                <p
                  className={`font-medium ${
                    step.done
                      ? 'text-foreground'
                      : step.current
                        ? 'text-primary'
                        : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </p>
                {step.current && step.key === 'aguardando_informacoes' && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    Preencha o formulário para nossa equipe começar
                  </p>
                )}
                {step.current && step.key === 'em_producao' && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    Seu canal digital está sendo preparado
                  </p>
                )}
                {step.current && step.key === 'revisao' && (
                  <p className="text-muted-foreground mt-1 text-sm">Fazendo os últimos ajustes</p>
                )}
                {step.done && step.key === 'publicado' && (
                  <p className="mt-1 text-sm text-green-600">Seu canal digital está no ar!</p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
