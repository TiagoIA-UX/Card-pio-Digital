"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

interface Metrics {
  totalRestaurants: number
  activeSubscriptions: number
  mrr: number
  activationRate: number
}

export default function AdminMetricsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<Metrics | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      // Opcional: simples proteção por email (ajuste para o seu)
      // if (session.user.email !== "seu-email-aqui") { setLoading(false); return }

      const { data: restaurantsRes, count: restCount } = await supabase
        .from("restaurants")
        .select("id", { count: "exact", head: true })

      const { data: subs } = await supabase
        .from("subscriptions")
        .select("status, plan_id")

      const { data: plans } = await supabase
        .from("plans")
        .select("id, price_month")

      const { data: activatedRes } = await supabase
        .from("activation_events")
        .select("restaurant_id")
        .eq("event_type", "received_first_order")

      const totalRestaurants = restCount || 0
      const activeSubscriptions = (subs || []).filter(s => s.status === "active").length

      const planPriceMap = new Map<string, number>()
      ;(plans || []).forEach(p => planPriceMap.set(p.id, Number(p.price_month)))

      let mrr = 0
      ;(subs || []).forEach(s => {
        if (s.status === "active" && s.plan_id && planPriceMap.has(s.plan_id)) {
          mrr += planPriceMap.get(s.plan_id) || 0
        }
      })

      const activatedRestaurants = new Set((activatedRes || []).map(e => e.restaurant_id)).size
      const activationRate =
        totalRestaurants > 0 ? (activatedRestaurants / totalRestaurants) * 100 : 0

      setMetrics({
        totalRestaurants,
        activeSubscriptions,
        mrr,
        activationRate,
      })
      setLoading(false)
    }

    void load()
  }, [supabase])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    )
  }

  if (!metrics) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">
          Não foi possível carregar as métricas. Verifique se você está autenticado.
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">Métricas do SaaS</h1>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground mb-1">Total de restaurantes</p>
            <p className="text-2xl font-bold text-foreground">{metrics.totalRestaurants}</p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground mb-1">Assinaturas ativas</p>
            <p className="text-2xl font-bold text-foreground">{metrics.activeSubscriptions}</p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground mb-1">MRR estimado</p>
            <p className="text-2xl font-bold text-foreground">
              R$ {metrics.mrr.toFixed(2).replace(".", ",")}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground mb-1">Taxa de ativação</p>
            <p className="text-2xl font-bold text-foreground">
              {metrics.activationRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

