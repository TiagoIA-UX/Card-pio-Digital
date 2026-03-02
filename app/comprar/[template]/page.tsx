"use client"

import { useState, Suspense } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Check, 
  ArrowLeft, 
  Store, 
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
  Fish
} from "lucide-react"

const TEMPLATES = {
  restaurante: {
    nome: "Restaurante",
    descricao: "Marmitaria, self-service, pratos executivos",
    icon: Store,
    cor: "bg-orange-500",
    imagem: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop&q=80"
  },
  pizzaria: {
    nome: "Pizzaria",
    descricao: "Pizzas, bordas recheadas, combos",
    icon: Pizza,
    cor: "bg-red-500",
    imagem: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80"
  },
  lanchonete: {
    nome: "Hamburgueria / Lanchonete",
    descricao: "Burgers, hot dogs, lanches artesanais",
    icon: UtensilsCrossed,
    cor: "bg-yellow-500",
    imagem: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&auto=format&fit=crop&q=80"
  },
  bar: {
    nome: "Bar / Pub",
    descricao: "Drinks, cervejas, petiscos",
    icon: Beer,
    cor: "bg-amber-600",
    imagem: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&auto=format&fit=crop&q=80"
  },
  cafeteria: {
    nome: "Cafeteria",
    descricao: "Cafés, doces, salgados",
    icon: Coffee,
    cor: "bg-amber-800",
    imagem: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&auto=format&fit=crop&q=80"
  },
  acai: {
    nome: "Açaíteria",
    descricao: "Açaí, tigelas, smoothies",
    icon: IceCream,
    cor: "bg-purple-600",
    imagem: "https://images.unsplash.com/photo-1590080874088-eec64895b423?w=400&auto=format&fit=crop&q=80"
  },
  sushi: {
    nome: "Japonês / Sushi",
    descricao: "Sushis, sashimis, temakis",
    icon: Fish,
    cor: "bg-rose-600",
    imagem: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&auto=format&fit=crop&q=80"
  }
}

const PLANS = {
  'self-service': {
    nome: "Faça Você Mesmo",
    descricao: "Você configura o cardápio",
    precoCartao: 297,
    precoPix: 247,
    parcelas: 3,
    parcelaValor: 99,
    icon: Wrench,
    cor: "border-blue-500 bg-blue-500/5",
    corIcone: "text-blue-500 bg-blue-500/10",
    beneficios: [
      "Template completo pronto para usar",
      "Painel fácil de editar (low-code)",
      "Você adiciona seus produtos",
      "Você coloca as fotos e preços",
      "Suporte por WhatsApp",
      "Hospedagem inclusa"
    ]
  },
  'feito-pra-voce': {
    nome: "Feito Pra Você",
    descricao: "A gente configura tudo",
    precoCartao: 597,
    precoPix: 497,
    parcelas: 3,
    parcelaValor: 199,
    icon: Sparkles,
    cor: "border-primary bg-primary/5",
    corIcone: "text-primary bg-primary/10",
    recomendado: true,
    beneficios: [
      "Tudo do plano Faça Você Mesmo",
      "Configuramos todo o cardápio",
      "Adicionamos seus produtos",
      "Editamos fotos profissionalmente",
      "Pronto em até 48 horas",
      "Suporte prioritário"
    ]
  }
}

function ComprarContent() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.template as string
  const template = TEMPLATES[templateId as keyof typeof TEMPLATES]
  
  const [selectedPlan, setSelectedPlan] = useState<'self-service' | 'feito-pra-voce'>('feito-pra-voce')
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('card')
  const [processing, setProcessing] = useState(false)

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Template não encontrado</p>
      </div>
    )
  }

  const plan = PLANS[selectedPlan]
  const totalPix = plan.precoPix
  const totalCartao = plan.precoCartao
  const parcelaTotal = paymentMethod === 'card' ? Math.round(totalCartao / plan.parcelas) : 0

  const handleCheckout = () => {
    setProcessing(true)
    // Salvar escolhas no localStorage para usar após login
    localStorage.setItem('checkout_template', templateId)
    localStorage.setItem('checkout_plan', selectedPlan)
    localStorage.setItem('checkout_payment', paymentMethod)
    // Redirecionar para login
    router.push('/login?redirect=/finalizar-compra')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Cardápio Digital</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        {/* Template Escolhido */}
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground mb-2">Template escolhido</p>
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-card border border-border">
            <div className={`p-1.5 rounded-lg ${template.cor}`}>
              <template.icon className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">{template.nome}</span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Coluna Esquerda - Escolha do Plano */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Escolha seu plano</h2>
            
            {/* Plano Self-Service */}
            <button
              onClick={() => setSelectedPlan('self-service')}
              className={`w-full p-5 rounded-2xl border-2 transition-all text-left ${
                selectedPlan === 'self-service' 
                  ? PLANS['self-service'].cor + ' border-blue-500' 
                  : 'border-border hover:border-blue-500/50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${PLANS['self-service'].corIcone}`}>
                  <Wrench className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-foreground text-lg">{PLANS['self-service'].nome}</span>
                    {selectedPlan === 'self-service' && (
                      <Check className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">{PLANS['self-service'].descricao}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-foreground">3x R$ 99</span>
                    <span className="text-sm text-muted-foreground">ou R$ 247 no PIX</span>
                  </div>
                </div>
              </div>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {PLANS['self-service'].beneficios.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-blue-500 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </button>

            {/* Plano Feito Pra Você */}
            <button
              onClick={() => setSelectedPlan('feito-pra-voce')}
              className={`w-full p-5 rounded-2xl border-2 transition-all text-left relative ${
                selectedPlan === 'feito-pra-voce' 
                  ? PLANS['feito-pra-voce'].cor + ' border-primary' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="absolute -top-3 left-4">
                <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  RECOMENDADO
                </span>
              </div>
              <div className="flex items-start gap-4 mt-2">
                <div className={`p-3 rounded-xl ${PLANS['feito-pra-voce'].corIcone}`}>
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-foreground text-lg">{PLANS['feito-pra-voce'].nome}</span>
                    {selectedPlan === 'feito-pra-voce' && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">{PLANS['feito-pra-voce'].descricao}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-foreground">3x R$ 199</span>
                    <span className="text-sm text-muted-foreground">ou R$ 497 no PIX</span>
                  </div>
                </div>
              </div>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {PLANS['feito-pra-voce'].beneficios.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </button>

            {/* Forma de Pagamento */}
            <div className="mt-6">
              <h3 className="font-semibold text-foreground mb-3">Forma de pagamento</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    paymentMethod === 'card' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className={`h-5 w-5 ${paymentMethod === 'card' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-medium text-foreground">Cartão de Crédito</p>
                      <p className="text-sm text-muted-foreground">3x sem juros</p>
                    </div>
                    {paymentMethod === 'card' && <Check className="h-4 w-4 text-primary ml-auto" />}
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    paymentMethod === 'pix' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <QrCode className={`h-5 w-5 ${paymentMethod === 'pix' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-medium text-foreground">PIX</p>
                      <p className="text-sm text-green-600">Economize R$ 50</p>
                    </div>
                    {paymentMethod === 'pix' && <Check className="h-4 w-4 text-primary ml-auto" />}
                  </div>
                </button>
              </div>
            </div>

          </div>

          {/* Coluna Direita - Resumo */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold text-foreground mb-4">Resumo do pedido</h3>
              
              {/* Preview do Template */}
              <div className="rounded-xl overflow-hidden mb-4">
                <img 
                  src={template.imagem} 
                  alt={template.nome}
                  className="w-full h-32 object-cover"
                />
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Template</span>
                  <span className="font-medium text-foreground">{template.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plano</span>
                  <span className="font-medium text-foreground">{plan.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pagamento</span>
                  <span className="font-medium text-foreground">
                    {paymentMethod === 'pix' ? 'PIX' : `${plan.parcelas}x Cartão`}
                  </span>
                </div>
                
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-muted-foreground">Total</span>
                    <div className="text-right">
                      {paymentMethod === 'card' ? (
                        <>
                          <span className="text-2xl font-bold text-foreground">
                            {plan.parcelas}x R$ {parcelaTotal}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            ou R$ {totalPix} no PIX
                          </p>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl font-bold text-foreground">
                            R$ {totalPix}
                          </span>
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
                className="w-full mt-6 py-4 px-6 rounded-xl bg-primary text-primary-foreground font-semibold transition-all hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
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

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
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
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ComprarContent />
    </Suspense>
  )
}
