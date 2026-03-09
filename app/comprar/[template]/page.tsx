'use client'

import { useState, Suspense } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Check,
  ArrowLeft,
  Loader2,
  CreditCard,
  QrCode,
  Shield,
  Wrench,
  Sparkles,
  Pizza,
  UtensilsCrossed,
  Beer,
  Coffee,
  IceCream,
  Fish,
  Store,
} from 'lucide-react'
import { getRestaurantTemplateConfig } from '@/lib/templates-config'

const TEMPLATE_ICONS = {
  store: Store,
  pizza: Pizza,
  burger: UtensilsCrossed,
  beer: Beer,
  coffee: Coffee,
  'ice-cream': IceCream,
  fish: Fish,
}

const PLANS = {
  'self-service': {
    nome: 'Faça Você Mesmo',
    descricao: 'Você configura o cardápio',
    precoCartao: 297,
    precoPix: 247,
    parcelas: 3,
    parcelaValor: 99,
    icon: Wrench,
    cor: 'border-blue-500 bg-blue-500/5',
    corIcone: 'text-blue-500 bg-blue-500/10',
    beneficios: [
      'Template completo pronto para usar',
      'Painel fácil de editar (low-code)',
      'Você adiciona seus produtos',
      'Você coloca as fotos e preços',
      'Suporte por WhatsApp',
      'Hospedagem inclusa',
    ],
  },
  'feito-pra-voce': {
    nome: 'Feito Pra Você',
    descricao: 'A gente configura tudo',
    precoCartao: 597,
    precoPix: 497,
    parcelas: 3,
    parcelaValor: 199,
    icon: Sparkles,
    cor: 'border-primary bg-primary/5',
    corIcone: 'text-primary bg-primary/10',
    recomendado: true,
    beneficios: [
      'Tudo do plano Faça Você Mesmo',
      'Configuramos todo o cardápio',
      'Adicionamos seus produtos',
      'Editamos fotos profissionalmente',
      'Pronto em até 48 horas',
      'Suporte prioritário',
    ],
  },
}

function ComprarContent() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.template as string
  const template = getRestaurantTemplateConfig(templateId)
  const TemplateIcon = TEMPLATE_ICONS[template.iconKey]

  const [selectedPlan, setSelectedPlan] = useState<'self-service' | 'feito-pra-voce'>(
    'feito-pra-voce'
  )
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('card')
  const [processing, setProcessing] = useState(false)

  const plan = PLANS[selectedPlan]
  const totalPix = plan.precoPix
  const totalCartao = plan.precoCartao
  const parcelaTotal = paymentMethod === 'card' ? Math.round(totalCartao / plan.parcelas) : 0

  const handleCheckout = () => {
    setProcessing(true)
    // Salvar escolhas no localStorage para concluir o checkout público
    localStorage.setItem('checkout_template', templateId)
    localStorage.setItem('checkout_plan', selectedPlan)
    localStorage.setItem('checkout_payment', paymentMethod)
    router.push('/finalizar-compra')
  }

  return (
    <div className="from-background to-secondary/20 min-h-screen bg-linear-to-b">
      {/* Header */}
      <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="flex items-center gap-2">
            <Store className="text-primary h-5 w-5" />
            <span className="text-foreground font-semibold">Cardápio Digital</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        {/* Template Escolhido */}
        <div className="mb-8 text-center">
          <p className="text-muted-foreground mb-2 text-sm">Template escolhido</p>
          <div className="bg-card border-border inline-flex items-center gap-3 rounded-full border px-4 py-2">
            <div className="bg-primary rounded-lg p-1.5">
              <TemplateIcon className="h-4 w-4 text-white" />
            </div>
            <span className="text-foreground font-semibold">{template.name}</span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Coluna Esquerda - Escolha do Plano */}
          <div className="space-y-4 lg:col-span-2">
            <h2 className="text-foreground mb-4 text-xl font-bold">Escolha seu plano</h2>

            {/* Plano Self-Service */}
            <button
              onClick={() => setSelectedPlan('self-service')}
              className={`w-full rounded-2xl border-2 p-5 text-left transition-all ${
                selectedPlan === 'self-service'
                  ? PLANS['self-service'].cor + ' border-blue-500'
                  : 'border-border hover:border-blue-500/50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-xl p-3 ${PLANS['self-service'].corIcone}`}>
                  <Wrench className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-foreground text-lg font-bold">
                      {PLANS['self-service'].nome}
                    </span>
                    {selectedPlan === 'self-service' && <Check className="h-5 w-5 text-blue-500" />}
                  </div>
                  <p className="text-muted-foreground mb-3 text-sm">
                    {PLANS['self-service'].descricao}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-foreground text-2xl font-bold">3x R$ 99</span>
                    <span className="text-muted-foreground text-sm">ou R$ 247 no PIX</span>
                  </div>
                </div>
              </div>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {PLANS['self-service'].beneficios.map((b, i) => (
                  <li key={i} className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 shrink-0 text-blue-500" />
                    {b}
                  </li>
                ))}
              </ul>
            </button>

            {/* Plano Feito Pra Você */}
            <button
              onClick={() => setSelectedPlan('feito-pra-voce')}
              className={`relative w-full rounded-2xl border-2 p-5 text-left transition-all ${
                selectedPlan === 'feito-pra-voce'
                  ? PLANS['feito-pra-voce'].cor + ' border-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="absolute -top-3 left-4">
                <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-bold">
                  RECOMENDADO
                </span>
              </div>
              <div className="mt-2 flex items-start gap-4">
                <div className={`rounded-xl p-3 ${PLANS['feito-pra-voce'].corIcone}`}>
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-foreground text-lg font-bold">
                      {PLANS['feito-pra-voce'].nome}
                    </span>
                    {selectedPlan === 'feito-pra-voce' && (
                      <Check className="text-primary h-5 w-5" />
                    )}
                  </div>
                  <p className="text-muted-foreground mb-3 text-sm">
                    {PLANS['feito-pra-voce'].descricao}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-foreground text-2xl font-bold">3x R$ 199</span>
                    <span className="text-muted-foreground text-sm">ou R$ 497 no PIX</span>
                  </div>
                </div>
              </div>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {PLANS['feito-pra-voce'].beneficios.map((b, i) => (
                  <li key={i} className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Check className="text-primary h-4 w-4 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </button>

            {/* Forma de Pagamento */}
            <div className="mt-6">
              <h3 className="text-foreground mb-3 font-semibold">Forma de pagamento</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    paymentMethod === 'card'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard
                      className={`h-5 w-5 ${paymentMethod === 'card' ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                    <div>
                      <p className="text-foreground font-medium">Cartão de Crédito</p>
                      <p className="text-muted-foreground text-sm">3x sem juros</p>
                    </div>
                    {paymentMethod === 'card' && <Check className="text-primary ml-auto h-4 w-4" />}
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    paymentMethod === 'pix'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <QrCode
                      className={`h-5 w-5 ${paymentMethod === 'pix' ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                    <div>
                      <p className="text-foreground font-medium">PIX</p>
                      <p className="text-sm text-green-600">Economize R$ 50</p>
                    </div>
                    {paymentMethod === 'pix' && <Check className="text-primary ml-auto h-4 w-4" />}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Resumo */}
          <div className="lg:col-span-1">
            <div className="bg-card border-border sticky top-24 rounded-2xl border p-6">
              <h3 className="text-foreground mb-4 font-bold">Resumo do pedido</h3>

              {/* Preview do Template */}
              <div className="mb-4 overflow-hidden rounded-xl">
                <Image
                  src={template.imageUrl}
                  alt={template.name}
                  width={640}
                  height={256}
                  className="h-32 w-full object-cover"
                />
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Template</span>
                  <span className="text-foreground font-medium">{template.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plano</span>
                  <span className="text-foreground font-medium">{plan.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pagamento</span>
                  <span className="text-foreground font-medium">
                    {paymentMethod === 'pix' ? 'PIX' : `${plan.parcelas}x Cartão`}
                  </span>
                </div>

                <div className="border-border mt-3 border-t pt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <div className="text-right">
                      {paymentMethod === 'card' ? (
                        <>
                          <span className="text-foreground text-2xl font-bold">
                            {plan.parcelas}x R$ {parcelaTotal}
                          </span>
                          <p className="text-muted-foreground text-xs">ou R$ {totalPix} no PIX</p>
                        </>
                      ) : (
                        <>
                          <span className="text-foreground text-2xl font-bold">R$ {totalPix}</span>
                          <p className="text-xs text-green-600">
                            Economia de R$ {totalCartao - totalPix}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={processing}
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-semibold transition-all disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>Continuar para pagamento</>
                )}
              </button>

              <div className="text-muted-foreground mt-4 flex items-center justify-center gap-2 text-xs">
                <Shield className="h-4 w-4" />
                Pagamento 100% seguro
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ComprarPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ComprarContent />
    </Suspense>
  )
}
