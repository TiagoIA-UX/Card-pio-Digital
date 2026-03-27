'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient, type Restaurant } from '@/lib/supabase/client'
import { CheckCircle2, ArrowLeft, Loader2, GitBranchPlus, MessageCircle } from 'lucide-react'
import Link from 'next/link'

import {
  PUBLIC_SUBSCRIPTION_PRICES,
  PLAN_LIMITS,
  NETWORK_EXPANSION_UNIT_OPTIONS,
  formatNetworkExpansionLabel,
} from '@/lib/pricing'
import { getActiveRestaurantForUser, getRestaurantScopedHref } from '@/lib/active-restaurant'
import {
  calculateNetworkPrice,
  getDiscountTierLabel,
  getVolumeDiscountTiers,
} from '@/lib/network-expansion'

type PlanSlug = 'basico' | 'pro' | 'premium'

interface UiPlan {
  slug: PlanSlug
  name: string
  price: string
  description: string
  highlights: string[]
}

type NetworkPaymentMethod = 'pix' | 'card'

const WHATSAPP_SUPPORT_LINK = 'https://api.whatsapp.com/send?phone=5512996887993'

const PLANS: UiPlan[] = [
  {
    slug: 'basico',
    name: PLAN_LIMITS.basico.label,
    price: `R$ ${PUBLIC_SUBSCRIPTION_PRICES.basico.monthly}/mês`,
    description: 'Para começar com canal digital sem dor de cabeça.',
    highlights: [
      `Até ${PLAN_LIMITS.basico.maxProducts} produtos`,
      'Pedidos ilimitados',
      'Canal digital com WhatsApp',
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
  const [extraUnits, setExtraUnits] = useState<number>(NETWORK_EXPANSION_UNIT_OPTIONS[0])
  const [branchEmailsInput, setBranchEmailsInput] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<NetworkPaymentMethod>('pix')
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      const data = await getActiveRestaurantForUser<Restaurant>(supabase, session.user.id)

      if (data) {
        setRestaurant(data as any)
      }
      setLoading(false)
    }

    void load()
  }, [supabase])

  const currentPlanSlug: PlanSlug = (restaurant?.plan_slug as PlanSlug) || 'basico'
  const networkRequestMessage = useMemo(() => {
    const unitLabel = formatNetworkExpansionLabel(extraUnits)
    const restaurantName = restaurant?.nome || 'meu delivery'
    return `${WHATSAPP_SUPPORT_LINK}&text=${encodeURIComponent(
      `Olá, quero avaliar o plano de rede para ${restaurantName}. Preciso de matriz + ${unitLabel}.`
    )}`
  }, [extraUnits, restaurant?.nome])

  const networkPricing = useMemo(() => calculateNetworkPrice(extraUnits), [extraUnits])

  const handleNetworkCheckout = async () => {
    if (!restaurant?.id || checkoutLoading) return

    const branchEmails = branchEmailsInput
      .split(/[,\n;]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)

    if (branchEmails.length !== extraUnits) {
      setMessage(`Informe exatamente ${extraUnits} e-mail(s) para as filiais.`)
      return
    }

    setCheckoutLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/pagamento/network-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentRestaurantId: restaurant.id,
          branchEmails,
          paymentMethod,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        setMessage(payload?.error || 'Não foi possível iniciar o checkout da expansão de rede.')
        return
      }

      const initPoint = payload?.data?.initPoint || payload?.data?.sandboxInitPoint
      if (initPoint) {
        window.location.href = initPoint
        return
      }

      setMessage('Checkout criado, mas não foi retornado link de pagamento.')
    } catch {
      setMessage('Falha ao iniciar checkout. Tente novamente em instantes.')
    } finally {
      setCheckoutLoading(false)
    }
  }

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
          <Link
            href={getRestaurantScopedHref('/painel', restaurant?.id)}
            className="text-muted-foreground hover:bg-secondary rounded-lg p-2"
          >
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
        A contratação pública começa pela implantação do template. Depois da ativação, o canal
        digital segue no plano mensal correspondente; upgrades self-service nesta tela ainda
        permanecem indisponíveis.
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

      <div className="bg-card border-border mt-8 rounded-2xl border p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2">
              <div className="bg-primary/10 text-primary rounded-full p-2">
                <GitBranchPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-foreground text-lg font-semibold">Plano de Rede</h2>
                <p className="text-muted-foreground text-sm">
                  Para operação com matriz e filiais, o cliente escolhe quantas unidades extras
                  precisa além da matriz principal.
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-4">
              {NETWORK_EXPANSION_UNIT_OPTIONS.map((units) => {
                const selected = units === extraUnits
                return (
                  <button
                    key={units}
                    type="button"
                    onClick={() => setExtraUnits(units)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:border-primary/40 hover:bg-secondary'
                    }`}
                  >
                    <p className="font-semibold">+{units}</p>
                    <p
                      className={selected ? 'text-primary-foreground/80' : 'text-muted-foreground'}
                    >
                      {formatNetworkExpansionLabel(units)}
                    </p>
                  </button>
                )
              })}
            </div>

            <div className="border-border mt-4 rounded-xl border bg-zinc-50 p-4 text-sm text-zinc-700">
              <p className="font-medium">Resumo da configuração</p>
              <p className="mt-1">
                Estrutura estimada: 1 matriz + {formatNetworkExpansionLabel(extraUnits)}.
              </p>
              <p className="text-xs text-zinc-500">
                Faixa: {getDiscountTierLabel(extraUnits)}
                {networkPricing.discountRate > 0 && (
                  <span className="ml-1 font-semibold text-green-600">
                    ({Math.round(networkPricing.discountRate * 100)}% de desconto)
                  </span>
                )}
              </p>
              <p className="mt-1 text-zinc-700">
                Valor unitário: {paymentMethod === 'pix' ? 'PIX' : 'Cartão'}{' '}
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(
                  paymentMethod === 'pix' ? networkPricing.pixPrice : networkPricing.cardPrice
                )}
              </p>
              <p className="mt-1 font-medium text-zinc-900">
                Total estimado:{' '}
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(
                  paymentMethod === 'pix' ? networkPricing.totalPix : networkPricing.totalCard
                )}
              </p>
              <p className="mt-1 text-zinc-600">
                A expansão de rede precisa liberar quantidade de unidades e governança da matriz no
                cadastro. Por isso, a contratação segue atendimento comercial guiado.
              </p>
            </div>

            {/* Volume Discount Reference */}
            <div className="border-border mt-3 rounded-xl border p-3">
              <p className="text-foreground mb-2 text-xs font-semibold">
                Faixas de desconto por volume
              </p>
              <div className="grid grid-cols-4 gap-1 text-[11px]">
                {getVolumeDiscountTiers().map((tier) => (
                  <div
                    key={tier.minBranches}
                    className={`rounded-lg p-2 text-center ${
                      extraUnits >= tier.minBranches
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    <p className="font-semibold">{tier.discountPercent}</p>
                    <p>{tier.minBranches}+ filiais</p>
                    <p className="text-[10px] opacity-70">{tier.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-foreground text-sm font-medium">E-mails das filiais</p>
                <p className="text-muted-foreground text-xs">
                  Informe um e-mail por linha ou separado por vírgula.
                </p>
              </div>
              <textarea
                value={branchEmailsInput}
                onChange={(event) => setBranchEmailsInput(event.target.value)}
                rows={4}
                placeholder="filial1@empresa.com\nfilial2@empresa.com"
                className="border-border bg-background text-foreground w-full rounded-xl border px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-100 focus:outline-none"
              />

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    paymentMethod === 'pix'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground'
                  }`}
                >
                  Pagar com PIX
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    paymentMethod === 'card'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground'
                  }`}
                >
                  Pagar com Cartão
                </button>
              </div>
            </div>
          </div>

          <div className="w-full max-w-sm rounded-2xl border border-orange-200 bg-orange-50 p-5">
            <p className="text-foreground text-sm font-semibold">Próximo passo</p>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Quando o cliente quiser plano de rede, ele já pode escolher quantas unidades extras
              precisa e enviar a solicitação para implantação comercial.
            </p>
            <button
              type="button"
              onClick={() => void handleNetworkCheckout()}
              disabled={checkoutLoading || !restaurant}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkoutLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
              {checkoutLoading ? 'Criando checkout...' : 'Ir para pagamento da rede'}
            </button>
            <a
              href={networkRequestMessage}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-orange-300 bg-white px-4 py-2 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-100"
            >
              Falar com consultor no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
