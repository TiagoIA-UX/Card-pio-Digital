'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Loader2,
  MessageCircle,
  PartyPopper,
  Sparkles,
  Store,
  XCircle,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { COMPANY_NAME, PAYMENT_DESCRIPTOR_NOTE } from '@/lib/brand'
import { POST_PURCHASE_OFFERS } from '@/lib/pricing'
import { getRestaurantScopedHref, setStoredActiveRestaurantId } from '@/lib/active-restaurant'

const WHATSAPP_NUMBER = '5512996887993'
const WHATSAPP_MESSAGE = encodeURIComponent(
  'Acabei de concluir meu pagamento e quero ativar a Oferta de Aceleração de Vendas (implantação guiada + revisão estratégica).'
)
const WHATSAPP_LINK = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${WHATSAPP_MESSAGE}`
const ACELERACAO_VENDAS_OFFER = POST_PURCHASE_OFFERS.aceleracaoVendas7Dias
// Oferta pós-compra desativada por padrão para evitar exposição não planejada.
// Reativar somente com alinhamento comercial/operacional explícito.
const SHOW_POST_PURCHASE_OFFER = false

function PagamentoSucessoContent() {
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(true)
  const [validated, setValidated] = useState<'loading' | 'approved' | 'pending' | 'rejected'>(
    'loading'
  )
  const [checkingProvision, setCheckingProvision] = useState(false)
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const checkout = searchParams.get('checkout')
  const painelHref = getRestaurantScopedHref('/painel', restaurantId)

  useEffect(() => {
    // Esconder confetti depois de 5 segundos
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const collectionStatus = searchParams.get('collection_status')
    const status = searchParams.get('status')

    if (collectionStatus === 'approved' || status === 'approved' || status === 'accredited') {
      const timer = setTimeout(() => setValidated('approved'), 3000)
      return () => clearTimeout(timer)
    }

    if (collectionStatus === 'pending') {
      queueMicrotask(() => setValidated('pending'))
      return
    }

    if (collectionStatus === 'rejected') {
      queueMicrotask(() => setValidated('rejected'))
      return
    }

    queueMicrotask(() => setValidated('pending'))
  }, [searchParams])

  useEffect(() => {
    if (validated !== 'approved' || !checkout) return

    let cancelled = false
    const isSandbox = process.env.NEXT_PUBLIC_MERCADO_PAGO_ENV === 'sandbox'

    const provisionSandboxCheckout = async (planSlug: string | null) => {
      try {
        const provRes = await fetch('/api/pagamento/provisionar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkout }),
        })

        if (!provRes.ok) {
          return false
        }

        const provData = await provRes.json()
        if (cancelled) return true

        if (provData.restaurant_slug || provData.provisioned || provData.already) {
          if (provData.restaurant_id) {
            setRestaurantId(provData.restaurant_id)
            setStoredActiveRestaurantId(provData.restaurant_id)
          }
          if (planSlug === 'feito-pra-voce') {
            router.replace(`/onboarding?checkout=${checkout}`)
          } else {
            setRestaurantSlug(provData.restaurant_slug || null)
            setCheckingProvision(false)
          }

          return true
        }
      } catch {
        return false
      }

      return false
    }

    const pollProvision = async () => {
      setCheckingProvision(true)

      for (let attempt = 0; attempt < 8; attempt += 1) {
        let response: Response
        try {
          response = await fetch(`/api/pagamento/status?checkout=${checkout}`, {
            cache: 'no-store',
          })
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 2500))
          continue
        }

        if (response.status === 401) {
          router.replace(
            `/login?redirect=${encodeURIComponent(`/pagamento/sucesso?checkout=${checkout}`)}`
          )
          return
        }

        if (!response.ok) {
          await new Promise((resolve) => setTimeout(resolve, 2500))
          continue
        }

        const data = await response.json()
        if (cancelled) return

        const planFeitoPraVoce = data.plan_slug === 'feito-pra-voce'

        if (
          data.payment_status === 'approved' &&
          planFeitoPraVoce &&
          data.onboarding_status === 'ready'
        ) {
          router.replace(`/onboarding?checkout=${checkout}`)
          return
        }

        if (data.payment_status === 'approved' && data.onboarding_status === 'ready') {
          if (data.restaurant_id) {
            setRestaurantId(data.restaurant_id)
            setStoredActiveRestaurantId(data.restaurant_id)
          }
          setRestaurantSlug(data.restaurant_slug || null)
          setCheckingProvision(false)
          return
        }

        if (
          isSandbox &&
          (data.payment_status !== 'approved' || data.onboarding_status !== 'ready')
        ) {
          const provisioned = await provisionSandboxCheckout(data.plan_slug ?? null)
          if (provisioned) {
            return
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 2500))
      }

      // Em sandbox, webhook não chega em localhost — provisionar manualmente
      if (!cancelled && isSandbox) {
        const provisioned = await provisionSandboxCheckout(null)
        if (provisioned) {
          return
        }
      }

      if (!cancelled) {
        setCheckingProvision(false)
      }
    }

    void pollProvision()

    return () => {
      cancelled = true
    }
  }, [checkout, router, validated])

  if (validated === 'loading') {
    return (
      <div className="to-background flex min-h-screen items-center justify-center bg-linear-to-b from-green-50 p-4 dark:from-green-950/20">
        <div className="border-border bg-card w-full max-w-md rounded-2xl border p-8 text-center shadow-sm">
          <Loader2 className="text-primary mx-auto mb-4 h-10 w-10 animate-spin" />
          <h1 className="text-foreground mb-2 text-2xl font-bold">Confirmando seu pagamento...</h1>
          <p className="text-muted-foreground text-sm">
            Estamos aguardando a confirmação final do Mercado Pago antes de liberar seu acesso.
          </p>
          <p className="text-muted-foreground mt-3 text-xs">{PAYMENT_DESCRIPTOR_NOTE}</p>
        </div>
      </div>
    )
  }

  if (validated === 'pending') {
    return (
      <div className="to-background flex min-h-screen items-center justify-center bg-linear-to-b from-yellow-50 p-4 dark:from-yellow-950/20">
        <div className="bg-card w-full max-w-md rounded-2xl border border-yellow-500/20 p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
          <h1 className="text-foreground mb-2 text-2xl font-bold">Pagamento em processamento</h1>
          <p className="text-muted-foreground mb-6 text-sm">
            Seu acesso será liberado automaticamente assim que o Mercado Pago aprovar o pagamento.
          </p>
          <p className="text-muted-foreground mb-6 text-xs">{PAYMENT_DESCRIPTOR_NOTE}</p>
          <Link
            href="/"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold transition-colors"
          >
            Voltar para o início
          </Link>
        </div>
      </div>
    )
  }

  if (validated === 'rejected') {
    return (
      <div className="to-background flex min-h-screen items-center justify-center bg-linear-to-b from-red-50 p-4 dark:from-red-950/20">
        <div className="bg-card w-full max-w-md rounded-2xl border border-red-500/20 p-8 text-center shadow-sm">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="text-foreground mb-2 text-2xl font-bold">Pagamento não aprovado</h1>
          <p className="text-muted-foreground mb-6 text-sm">
            O Mercado Pago informou que a cobrança não foi concluída. Você pode tentar novamente.
          </p>
          <Link
            href="/comprar/restaurante"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold transition-colors"
          >
            Tentar novamente
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="to-background flex min-h-screen items-center justify-center bg-linear-to-b from-green-50 p-4 dark:from-green-950/20">
      <div className="w-full max-w-md text-center">
        {/* Ícone de sucesso */}
        <div className="relative mb-6">
          <div className="mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          {showConfetti && (
            <PartyPopper className="absolute top-0 right-1/4 h-8 w-8 animate-bounce text-yellow-500" />
          )}
        </div>

        {/* Título */}
        <h1 className="text-foreground mb-2 text-3xl font-bold">Pagamento Aprovado!</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          {checkingProvision
            ? 'Pagamento confirmado. Finalizando a criação do seu painel...'
            : 'Seu canal digital está pronto para usar'}
        </p>
        <p className="text-muted-foreground mb-6 text-sm">
          Sua contratação do Canal Digital foi processada por {COMPANY_NAME}.
        </p>

        {/* Card de próximos passos */}
        <div className="bg-card border-border mb-6 rounded-2xl border p-6 text-left">
          <h2 className="text-foreground mb-4 flex items-center gap-2 font-semibold">
            <Store className="text-primary h-5 w-5" />
            Próximos passos
          </h2>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>Acesse o painel e adicione seus produtos</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>Personalize as cores e logo do seu negócio</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>Compartilhe o link e QR Code com seus clientes</span>
            </li>
          </ol>
        </div>

        {/* Botão */}
        <Link
          href={painelHref}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-lg font-semibold transition-all"
        >
          Acessar meu Painel
          <ArrowRight className="h-5 w-5" />
        </Link>

        <p className="text-muted-foreground mt-4 text-sm">
          {restaurantSlug
            ? `Seu canal digital foi publicado em /r/${restaurantSlug}`
            : 'Se o painel não aparecer imediatamente, aguarde alguns minutos e use o botão "Acessar meu Painel" logo acima.'}
        </p>

        {SHOW_POST_PURCHASE_OFFER ? (
          <div className="border-primary/30 bg-primary/5 mt-6 rounded-2xl border p-5 text-left">
            <div className="bg-primary/10 text-primary mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              Oferta exclusiva de boas-vindas
            </div>
            <h3 className="text-foreground mb-1 text-base font-bold">
              Aceleração de Vendas em 7 dias
            </h3>
            <p className="text-muted-foreground mb-3 text-sm">
              Receba implantação guiada + revisão estratégica do seu canal digital para aumentar
              conversão logo na primeira semana.
            </p>
            <ul className="text-foreground mb-4 space-y-1.5 text-sm">
              <li>• Ajuste de estrutura e categorias com foco em ticket médio</li>
              <li>• Revisão dos principais gatilhos de compra no canal digital</li>
              <li>• Roteiro de divulgação local para WhatsApp e Instagram</li>
            </ul>
            <div className="mb-4 flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-sm">
                De <span className="line-through">R$ {ACELERACAO_VENDAS_OFFER.original}</span>
              </p>
              <p className="text-primary text-lg font-extrabold">
                R$ {ACELERACAO_VENDAS_OFFER.current}
              </p>
            </div>
            <p className="mb-4 text-xs font-medium text-amber-600">
              Disponível apenas nos primeiros 7 dias após a compra
            </p>
            <p className="text-muted-foreground mb-3 text-xs">
              Ao clicar, você será redirecionado para o WhatsApp da equipe para confirmar os
              detalhes. Não existe cobrança automática nesta etapa.
            </p>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
            >
              Falar no WhatsApp para ativar a oferta
              <MessageCircle className="h-4 w-4" />
            </a>
            <p className="text-muted-foreground mt-2 text-[11px]">
              A ativação da oferta acontece somente após sua confirmação no atendimento.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function PagamentoSucessoPage() {
  return (
    <Suspense
      fallback={
        <div className="to-background flex min-h-screen items-center justify-center bg-linear-to-b from-green-50 p-4 dark:from-green-950/20">
          <div className="text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
            <p className="text-muted-foreground">Carregando confirmação do pagamento...</p>
          </div>
        </div>
      }
    >
      <PagamentoSucessoContent />
    </Suspense>
  )
}
