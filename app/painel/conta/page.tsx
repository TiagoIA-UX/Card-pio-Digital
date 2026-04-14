'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  CreditCard,
  ExternalLink,
  Mail,
  Settings,
  ShieldCheck,
  Store,
  User,
} from 'lucide-react'
import { SubscriptionStatusCard } from '@/components/subscription-status-card'
import {
  getPaymentStatusLabel,
  getPlanLabel,
  getProviderLabel,
} from '@/lib/domains/core/subscription/account-subscription'
import { createClient, type Restaurant } from '@/lib/shared/supabase/client'
import {
  getActiveRestaurantContextForUser,
  getRestaurantDisplayName,
  getRestaurantScopedHref,
  getRestaurantUnitBadgeLabel,
} from '@/lib/domains/core/active-restaurant'

interface AccountProfile {
  name: string
  email: string
  providers: string[]
}

interface AccountRestaurantContext {
  restaurant: Restaurant | null
  isNetwork: boolean
  headquartersRestaurant: Restaurant | null
  totalUnits: number
}

export default function PainelContaPage() {
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [restaurantContext, setRestaurantContext] = useState<AccountRestaurantContext>({
    restaurant: null,
    isNetwork: false,
    headquartersRestaurant: null,
    totalUnits: 0,
  })

  useEffect(() => {
    const loadAccount = async () => {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const context = await getActiveRestaurantContextForUser<Restaurant>(supabase, user.id)

      const metadataName =
        (typeof user.user_metadata?.full_name === 'string' &&
          user.user_metadata.full_name.trim()) ||
        (typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim()) ||
        user.email?.split('@')[0] ||
        'Conta autenticada'

      const providers = Array.isArray(user.app_metadata?.providers)
        ? user.app_metadata.providers.filter(
            (item: unknown): item is string => typeof item === 'string'
          )
        : []

      setProfile({
        name: metadataName,
        email: user.email || 'E-mail indisponível',
        providers,
      })

      setRestaurantContext({
        restaurant: context.activeRestaurant,
        isNetwork: context.isNetwork,
        headquartersRestaurant: context.headquartersRestaurant,
        totalUnits: context.organizationRestaurants.length,
      })

      setLoading(false)
    }

    void loadAccount()
  }, [supabase])

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="bg-card border-border rounded-2xl border p-6">
          <p className="text-muted-foreground text-sm">Carregando dados da sua conta...</p>
        </div>
      </div>
    )
  }

  const restaurant = restaurantContext.restaurant
  const headquartersLabel = getRestaurantDisplayName(restaurantContext.headquartersRestaurant)
  const activeUnitLabel = getRestaurantDisplayName(restaurant)
  const activeUnitBadge = getRestaurantUnitBadgeLabel(restaurant)

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Minha Conta</h1>
          <p className="text-muted-foreground text-sm">
            Perfil de acesso, delivery vinculado e controle da assinatura em um só lugar.
          </p>
        </div>
        {restaurant ? (
          <Link
            href={getRestaurantScopedHref('/painel', restaurant.id)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          >
            <Store className="h-4 w-4" />
            Voltar ao dashboard
          </Link>
        ) : null}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <section className="bg-card border-border rounded-2xl border p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-foreground font-semibold">Perfil de acesso</h2>
              <p className="text-muted-foreground text-sm">
                Dados da conta usada para entrar no painel.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-muted-foreground text-xs uppercase">Nome</p>
              <p className="text-foreground mt-1 font-medium">{profile?.name || 'Não informado'}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-muted-foreground text-xs uppercase">E-mail</p>
              <p className="text-foreground mt-1 flex items-center gap-2 font-medium">
                <Mail className="h-4 w-4 text-zinc-500" />
                {profile?.email || 'Não informado'}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-muted-foreground text-xs uppercase">Método de acesso</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(profile?.providers.length ? profile.providers : ['email']).map((provider) => (
                  <span
                    key={provider}
                    className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700"
                  >
                    {getProviderLabel(provider)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card border-border rounded-2xl border p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-foreground font-semibold">Delivery vinculado</h2>
              <p className="text-muted-foreground text-sm">
                Unidade ativa e contexto atual do painel.
              </p>
            </div>
          </div>

          {restaurant ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-muted-foreground text-xs uppercase">Unidade ativa</p>
                <p className="text-foreground mt-1 font-medium">
                  {activeUnitLabel} • {activeUnitBadge}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Slug público: /r/{restaurant.slug}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-muted-foreground text-xs uppercase">Plano atual</p>
                  <p className="text-foreground mt-1 font-medium">
                    {getPlanLabel(restaurant.plan_slug)}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-muted-foreground text-xs uppercase">Cobrança</p>
                  <p className="text-foreground mt-1 font-medium">
                    {getPaymentStatusLabel(restaurant.status_pagamento)}
                  </p>
                </div>
              </div>

              {restaurantContext.isNetwork ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-muted-foreground text-xs uppercase">Rede</p>
                  <p className="text-foreground mt-1 font-medium">
                    {headquartersLabel || 'Matriz principal'} • {restaurantContext.totalUnits}{' '}
                    unidade(s)
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href={getRestaurantScopedHref('/painel/configuracoes', restaurant.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  <Settings className="h-4 w-4" />
                  Ajustar canal
                </Link>
                <Link
                  href={getRestaurantScopedHref('/painel/meu-link', restaurant.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver meu link
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
              Nenhum delivery ativo encontrado para esta conta.
            </div>
          )}
        </section>
      </div>

      <section className="bg-card border-border mb-6 rounded-2xl border p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-orange-500/10 p-3 text-orange-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-foreground font-semibold">Assinatura e renovação</h2>
            <p className="text-muted-foreground text-sm">
              Acompanhe o ciclo atual e cancele a renovação automática sem precisar falar com
              suporte.
            </p>
          </div>
        </div>

        {restaurant ? <SubscriptionStatusCard restaurantId={restaurant.id} /> : null}
      </section>

      <section className="bg-card border-border rounded-2xl border p-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="rounded-xl bg-zinc-900/5 p-3 text-zinc-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-foreground font-semibold">Como o cancelamento funciona</h2>
            <p className="text-muted-foreground text-sm">
              Padrão recomendado para SaaS com recorrência.
            </p>
          </div>
        </div>

        <div className="grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-zinc-700">
            <p className="font-semibold text-zinc-950">1. Você cancela a renovação</p>
            <p className="mt-1 text-xs leading-5">
              O sistema encerra a recorrência no próximo fechamento, sem renovar sozinho depois do
              prazo.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-zinc-700">
            <p className="font-semibold text-zinc-950">2. O acesso continua até o fim do ciclo</p>
            <p className="mt-1 text-xs leading-5">
              Você não perde o painel na hora se ainda estiver dentro do período já liberado.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-zinc-700">
            <p className="font-semibold text-zinc-950">3. Depois, o canal é encerrado</p>
            <p className="mt-1 text-xs leading-5">
              Quando o ciclo acabar, a assinatura deixa de renovar e o acesso segue as regras do
              plano.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
