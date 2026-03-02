"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Check, 
  ArrowRight, 
  Store, 
  Crown,
  Infinity,
  Shield,
  Zap,
  Star,
  Gift,
  LucideIcon
} from "lucide-react"

// Tipo do Pacote
interface Pacote {
  id: string
  nome: string
  subtitulo: string
  descricao: string
  precoCartao: number
  precoPix: number
  parcelas: number
  icon: LucideIcon
  cor: string
  corBg: string
  corIcone: string
  beneficios: string[]
  templates: number
  recomendado?: boolean
  destaque?: boolean
  economia?: string
}

// Pacotes de templates
const PACOTES: Record<string, Pacote> = {
  'unico': {
    id: 'unico',
    nome: "1 Template",
    subtitulo: "Ideal para começar",
    descricao: "Escolha 1 template e configure seu cardápio",
    precoCartao: 297,
    precoPix: 247,
    parcelas: 3,
    icon: Store,
    cor: "border-blue-500",
    corBg: "bg-blue-500/5",
    corIcone: "text-blue-500 bg-blue-500/10",
    beneficios: [
      "1 template à sua escolha",
      "Painel de edição completo",
      "Hospedagem inclusa",
      "Suporte por WhatsApp",
      "Atualizações gratuitas",
      "Link personalizado"
    ],
    templates: 1
  },
  'pacote': {
    id: 'pacote',
    nome: "Pacote 3 Templates",
    subtitulo: "Para quem tem mais de um negócio",
    descricao: "3 templates diferentes para seus estabelecimentos",
    precoCartao: 597,
    precoPix: 497,
    parcelas: 6,
    icon: Crown,
    cor: "border-primary",
    corBg: "bg-primary/5",
    corIcone: "text-primary bg-primary/10",
    recomendado: true,
    economia: "Economia de R$ 394",
    beneficios: [
      "3 templates à sua escolha",
      "Painel unificado para todos",
      "Hospedagem inclusa",
      "Suporte prioritário",
      "Atualizações gratuitas",
      "3 links personalizados"
    ],
    templates: 3
  },
  'ilimitado': {
    id: 'ilimitado',
    nome: "Acesso Ilimitado",
    subtitulo: "Todos os templates, para sempre",
    descricao: "Acesso a todos os templates atuais e futuros",
    precoCartao: 997,
    precoPix: 797,
    parcelas: 12,
    icon: Infinity,
    cor: "border-amber-500",
    corBg: "bg-amber-500/5",
    corIcone: "text-amber-500 bg-amber-500/10",
    destaque: true,
    economia: "Melhor custo-benefício",
    beneficios: [
      "Todos os 7 templates inclusos",
      "Novos templates gratuitos",
      "Painel unificado premium",
      "Suporte VIP prioritário",
      "Consultoria de lançamento",
      "Links ilimitados"
    ],
    templates: -1 // -1 = ilimitado
  }
}

export default function OfertasPage() {
  const router = useRouter()
  const [selectedPacote, setSelectedPacote] = useState<string>('pacote')
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('card')

  const handleSelectPacote = (pacoteId: string) => {
    if (pacoteId === 'unico') {
      // Para 1 template, vai para a página de seleção de templates
      router.push('/templates')
    } else {
      // Para pacotes, salva a escolha e vai para login
      localStorage.setItem('checkout_pacote', pacoteId)
      localStorage.setItem('checkout_payment', paymentMethod)
      router.push('/login?redirect=/finalizar-compra-pacote')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl text-foreground">Cardápio Digital</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Gift className="h-4 w-4" />
            Ofertas especiais por tempo limitado
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Escolha seu plano ideal
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Cardápios digitais profissionais para restaurantes, pizzarias, lanchonetes e muito mais
          </p>
        </div>

        {/* Toggle de pagamento */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-full border border-border p-1 bg-muted/50">
            <button
              onClick={() => setPaymentMethod('card')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                paymentMethod === 'card'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Cartão (parcelado)
            </button>
            <button
              onClick={() => setPaymentMethod('pix')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                paymentMethod === 'pix'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              PIX (desconto)
            </button>
          </div>
        </div>

        {/* Cards de Ofertas */}
        <div className="grid gap-6 md:grid-cols-3">
          {Object.values(PACOTES).map((pacote) => {
            const preco = paymentMethod === 'pix' ? pacote.precoPix : pacote.precoCartao
            const parcela = Math.round(pacote.precoCartao / pacote.parcelas)
            
            return (
              <div 
                key={pacote.id}
                className={`relative rounded-2xl border-2 p-6 transition-all ${
                  pacote.recomendado 
                    ? `${pacote.cor} ${pacote.corBg} scale-105 shadow-xl` 
                    : `border-border hover:${pacote.cor} hover:${pacote.corBg}`
                }`}
              >
                {/* Badge */}
                {pacote.recomendado && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1">
                      <Star className="h-3 w-3" /> MAIS POPULAR
                    </span>
                  </div>
                )}
                {pacote.destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center gap-1">
                      <Zap className="h-3 w-3" /> MELHOR VALOR
                    </span>
                  </div>
                )}

                {/* Ícone */}
                <div className={`inline-flex p-3 rounded-xl ${pacote.corIcone} mb-4`}>
                  <pacote.icon className="h-6 w-6" />
                </div>

                {/* Nome e descrição */}
                <h3 className="text-xl font-bold text-foreground mb-1">{pacote.nome}</h3>
                <p className="text-sm text-muted-foreground mb-4">{pacote.subtitulo}</p>

                {/* Preço */}
                <div className="mb-6">
                  {paymentMethod === 'card' ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-foreground">{pacote.parcelas}x</span>
                        <span className="text-3xl font-bold text-foreground">R$ {parcela}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">ou R$ {pacote.precoPix} no PIX</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-foreground">R$ {preco}</span>
                      </div>
                      <p className="text-sm text-green-600 font-medium">
                        Economia de R$ {pacote.precoCartao - pacote.precoPix}
                      </p>
                    </>
                  )}
                </div>

                {/* Economia badge */}
                {pacote.economia && (
                  <div className="mb-4 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-xs font-semibold inline-block">
                    {pacote.economia}
                  </div>
                )}

                {/* Benefícios */}
                <ul className="space-y-3 mb-6">
                  {pacote.beneficios.map((beneficio, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{beneficio}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleSelectPacote(pacote.id)}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    pacote.recomendado || pacote.destaque
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
                >
                  {pacote.id === 'unico' ? 'Escolher template' : 'Começar agora'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>

        {/* Garantia */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-card border border-border">
            <Shield className="h-5 w-5 text-green-500" />
            <span className="text-sm text-muted-foreground">
              <strong className="text-foreground">Garantia de 7 dias</strong> — Não gostou? Devolvemos seu dinheiro
            </span>
          </div>
        </div>

        {/* FAQ rápido */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">Perguntas frequentes</h2>
          
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-2">Onde meu cardápio fica hospedado?</h3>
              <p className="text-sm text-muted-foreground">
                Seu cardápio fica hospedado em nossa infraestrutura profissional. Você recebe um link personalizado 
                (ex: cardapio.digital/seu-restaurante) para compartilhar com seus clientes. Sem necessidade de configurar 
                servidores ou pagar hospedagem separada.
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-2">Como acesso o painel para editar?</h3>
              <p className="text-sm text-muted-foreground">
                Após a compra, você acessa o painel com o mesmo login usado na compra (Google ou email). 
                Lá você edita produtos, preços, fotos e configurações do seu cardápio.
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-2">Posso ter mais de um cardápio?</h3>
              <p className="text-sm text-muted-foreground">
                Sim! Com os pacotes de 3 templates ou Ilimitado, você pode criar múltiplos cardápios 
                para diferentes estabelecimentos, todos gerenciados no mesmo painel.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
