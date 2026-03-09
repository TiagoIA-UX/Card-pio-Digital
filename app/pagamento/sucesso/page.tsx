'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, PartyPopper, ArrowRight, Store, Sparkles, MessageCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

const WHATSAPP_NUMBER = '5512996887993'
const WHATSAPP_MESSAGE = encodeURIComponent(
  'Acabei de concluir meu pagamento e quero ativar a Oferta de Aceleração de Vendas (implantação guiada + revisão estratégica).'
)
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`

function PagamentoSucessoContent() {
  const [showConfetti, setShowConfetti] = useState(true)
  const [checkingProvision, setCheckingProvision] = useState(false)
  const [activationUrl, setActivationUrl] = useState<string | null>(null)
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const checkout = searchParams.get('checkout')

  useEffect(() => {
    // Esconder confetti depois de 5 segundos
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!checkout) return

    let cancelled = false

    const pollProvision = async () => {
      setCheckingProvision(true)

      for (let attempt = 0; attempt < 8; attempt += 1) {
        const response = await fetch(`/api/pagamento/status?checkout=${checkout}`, {
          cache: 'no-store',
        })

        if (!response.ok) {
          break
        }

        const data = await response.json()
        if (cancelled) return

        if (data.payment_status === 'approved' && data.onboarding_status === 'ready') {
          setActivationUrl(data.activation_url || null)
          setRestaurantSlug(data.restaurant_slug || null)
          setCheckingProvision(false)
          return
        }

        await new Promise((resolve) => setTimeout(resolve, 2500))
      }

      if (!cancelled) {
        setCheckingProvision(false)
      }
    }

    pollProvision()

    return () => {
      cancelled = true
    }
  }, [checkout])

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
            : 'Seu cardápio digital está pronto para usar'}
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
        {activationUrl ? (
          <a
            href={activationUrl}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-lg font-semibold transition-all"
          >
            Entrar no meu Painel
            <ArrowRight className="h-5 w-5" />
          </a>
        ) : (
          <Link
            href="/painel"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-lg font-semibold transition-all"
          >
            Acessar meu Painel
            <ArrowRight className="h-5 w-5" />
          </Link>
        )}

        <p className="text-muted-foreground mt-4 text-sm">
          {restaurantSlug
            ? `Seu cardápio foi publicado em /r/${restaurantSlug}`
            : 'Se o painel não abrir automaticamente em alguns segundos, você ainda pode acessar pelo botão acima.'}
        </p>

        <div className="border-primary/30 bg-primary/5 mt-6 rounded-2xl border p-5 text-left">
          <div className="bg-primary/10 text-primary mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            Oferta exclusiva de boas-vindas
          </div>
          <h3 className="text-foreground mb-1 text-base font-bold">
            Aceleração de Vendas em 7 dias
          </h3>
          <p className="text-muted-foreground mb-3 text-sm">
            Receba implantação guiada + revisão estratégica do seu cardápio para aumentar conversão
            logo na primeira semana.
          </p>
          <ul className="text-foreground mb-4 space-y-1.5 text-sm">
            <li>• Ajuste de estrutura e categorias com foco em ticket médio</li>
            <li>• Revisão dos principais gatilhos de compra no cardápio</li>
            <li>• Roteiro de divulgação local para WhatsApp e Instagram</li>
          </ul>
          <div className="mb-4 flex items-center justify-between gap-2">
            <p className="text-muted-foreground text-sm">
              De <span className="line-through">R$ 397</span>
            </p>
            <p className="text-primary text-lg font-extrabold">R$ 197</p>
          </div>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
          >
            Quero ativar esta oferta agora
            <MessageCircle className="h-4 w-4" />
          </a>
        </div>
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
