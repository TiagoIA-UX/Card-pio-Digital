"use client"

import { useEffect, useState } from "react"
import { createClient, type Restaurant } from "@/lib/supabase/client"
import { CheckCircle2, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

type PlanSlug = "basico" | "pro" | "premium"

interface UiPlan {
  slug: PlanSlug
  name: string
  price: string
  description: string
  highlights: string[]
}

const PLANS: UiPlan[] = [
  {
    slug: "basico",
    name: "Básico",
    price: "R$ 49/mês",
    description: "Para começar com cardápio digital sem dor de cabeça.",
    highlights: [
      "Até 60 produtos",
      "Pedidos ilimitados",
      "Cardápio digital com WhatsApp",
      "Google Maps integrado",
    ],
  },
  {
    slug: "pro",
    name: "Profissional",
    price: "R$ 99/mês",
    description: "Para quem quer organizar pedidos e crescer.",
    highlights: [
      "Até 200 produtos",
      "Pedidos ilimitados",
      "Todos os templates",
      "Relatórios de vendas",
      "Histórico de clientes",
    ],
  },
  {
    slug: "premium",
    name: "Premium",
    price: "R$ 199/mês",
    description: "Para restaurantes que querem escalar e ter marca forte.",
    highlights: [
      "Produtos ilimitados",
      "Templates premium",
      "Domínio personalizado",
      "Remoção de marca",
      "Suporte prioritário",
    ],
  },
]

export default function PlanosPage() {
  const supabase = createClient()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<PlanSlug | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from("restaurants")
        .select("*")
        .eq("user_id", session.user.id)
        .single()

      if (data) {
        setRestaurant(data as any)
      }
      setLoading(false)
    }

    void load()
  }, [supabase])

  const currentPlanSlug: PlanSlug = (restaurant?.plan_slug as PlanSlug) || "basico"

  const handleUpgrade = async (target: PlanSlug) => {
    if (!restaurant) return
    setMessage(null)
    setUpgrading(target)
    try {
      // Chamada placeholder: a rota real de assinatura será implementada depois
      const res = await fetch("/api/pagamento/criar-assinatura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_slug: target, restaurant_id: restaurant.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage(data.error || "Não foi possível iniciar o upgrade. Tente novamente.")
      } else if (data.redirect_url) {
        window.location.href = data.redirect_url
      } else {
        setMessage("Assinatura criada ou atualizada. Atualize a página em alguns instantes.")
      }
    } catch (e) {
      setMessage("Erro inesperado ao tentar fazer upgrade.")
    } finally {
      setUpgrading(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/painel"
            className="p-2 rounded-lg text-muted-foreground hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Planos</h1>
            <p className="text-muted-foreground text-sm">
              Escolha o plano ideal para o seu restaurante.
            </p>
          </div>
        </div>
        {restaurant && (
          <div className="text-sm text-muted-foreground">
            Plano atual:{" "}
            <span className="font-semibold text-foreground uppercase">
              {currentPlanSlug}
            </span>
          </div>
        )}
      </div>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/40 text-sm text-amber-800">
          {message}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = currentPlanSlug === plan.slug
          return (
            <div
              key={plan.slug}
              className={`rounded-2xl border p-5 bg-card flex flex-col ${
                isCurrent ? "border-primary shadow-md" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                    <CheckCircle2 className="h-3 w-3" />
                    Atual
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-foreground mb-1">{plan.price}</p>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
              <ul className="space-y-1 text-sm text-muted-foreground mb-4 flex-1">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={isCurrent || upgrading === plan.slug || !restaurant}
                onClick={() => handleUpgrade(plan.slug)}
                className={`mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  isCurrent
                    ? "bg-secondary text-muted-foreground cursor-default"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                }`}
              >
                {upgrading === plan.slug ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : isCurrent ? (
                  "Plano atual"
                ) : (
                  "Fazer upgrade"
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

