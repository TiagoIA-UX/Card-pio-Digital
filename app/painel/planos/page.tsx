'use client'

import { useEffect, useState } from 'react'
import { createClient, type Restaurant } from '@/lib/supabase/client'
import { CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { PUBLIC_SUBSCRIPTION_PRICES, PLAN_LIMITS } from '@/lib/pricing'

type PlanSlug = 'basico' | 'pro' | 'premium'

interface UiPlan {
  slug: PlanSlug
  name: string
  price: string
  description: string
  highlights: string[]
}

const PLANS: UiPlan[] = [
  {
    slug: 'basico',
    name: PLAN_LIMITS.basico.label,
    price: `R$ ${PUBLIC_SUBSCRIPTION_PRICES.basico.monthly}/mês`,
    description: 'Para começar com cardápio digital sem dor de cabeça.',
    highlights: [
      `Até ${PLAN_LIMITS.basico.maxProducts} produtos`,
      'Pedidos ilimitados',
      'Cardápio digital com WhatsApp',
      'Google Maps integrado',
    ],
  },
  {
    slug: 'pro',
    name: PLAN_LIMITS.pro.label,
    price: `R$ ${PUBLIC_SUBSCRIPTION_PRICES.pro.monthly}/mês`,
    description: 'Para quem quer organizar pedidos e crescer.',
    highlights: [
      `Até ${PLAN_LIMITS.pro.maxProducts} produtos`,
      'Pedidos ilimitados',
      'Todos os templates',
      'Relatórios de vendas',
      'Histórico de clientes',
    ],
  },
  {
    slug: 'premium',
    name: PLAN_LIMITS.premium.label,
    price: 'R$ 199/mês',
    description: 'Para negócios que querem escalar e ter marca forte.',
    highlights: [
      'Produtos ilimitados',
      'Templates premium',
      'Domínio personalizado',
      'Remoção de marca',
      'Suporte prioritário',
    ],
  },
]

export default function PlanosPage() {
  const supabase = createClient()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (data) {
        setRestaurant(data as any)
      }
      setLoading(false)
    }

    void load()
  }, [supabase])

  const currentPlanSlug: PlanSlug = (restaurant?.plan_slug as PlanSlug) || 'basico'

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/painel" className="text-muted-foreground hover:bg-secondary rounded-lg p-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-foreground text-2xl font-bold">Planos</h1>
            <p className="text-muted-foreground text-sm">
              Esta área reúne as referências de plano mensal do produto. A entrada pública continua
              começando pela implantação do template.
            </p>
          </div>
        </div>
        {restaurant && (
          <div className="text-muted-foreground text-sm">
            Plano atual:{' '}
            <span className="text-foreground font-semibold uppercase">{currentPlanSlug}</span>
          </div>
        )}
      </div>

      <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800">
        A contratação pública começa pela implantação do template. Depois da ativação, o cardápio
        segue no plano mensal correspondente; upgrades self-service nesta tela ainda permanecem
        indisponíveis.
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800">
          {message}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = currentPlanSlug === plan.slug
          return (
            <div
              key={plan.slug}
              className={`bg-card flex flex-col rounded-2xl border p-5 ${
                isCurrent ? 'border-primary shadow-md' : 'border-border'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-foreground text-lg font-semibold">{plan.name}</h2>
                {isCurrent && (
                  <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs">
                    <CheckCircle2 className="h-3 w-3" />
                    Atual
                  </span>
                )}
              </div>
              <p className="text-foreground mb-1 text-xl font-bold">{plan.price}</p>
              <p className="text-muted-foreground mb-4 text-sm">{plan.description}</p>
              <ul className="text-muted-foreground mb-4 flex-1 space-y-1 text-sm">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2">
                    <CheckCircle2 className="text-primary h-3 w-3" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled
                className={`mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${'bg-secondary text-muted-foreground cursor-not-allowed'}`}
              >
                {isCurrent ? 'Plano atual' : 'Indisponível no modelo atual'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
