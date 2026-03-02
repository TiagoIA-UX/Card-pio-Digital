"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { 
  Loader2, 
  Store,
  Crown,
  Infinity,
  Shield,
  Check
} from "lucide-react"

const PACOTES = {
  'pacote': {
    id: 'pacote',
    nome: "Pacote 3 Templates",
    descricao: "3 templates à sua escolha",
    precoCartao: 597,
    precoPix: 497,
    parcelas: 6,
    icon: Crown,
    templates: 3
  },
  'ilimitado': {
    id: 'ilimitado',
    nome: "Acesso Ilimitado",
    descricao: "Todos os templates, para sempre",
    precoCartao: 997,
    precoPix: 797,
    parcelas: 12,
    icon: Infinity,
    templates: -1
  }
}

function FinalizarCompraPacoteContent() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [pacoteId, setPacoteId] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('card')

  useEffect(() => {
    const loadData = async () => {
      // Verificar autenticação
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login?redirect=/finalizar-compra-pacote')
        return
      }
      setUser(session.user)

      // Recuperar escolhas do localStorage
      const savedPacote = localStorage.getItem('checkout_pacote')
      const savedPayment = localStorage.getItem('checkout_payment') as 'pix' | 'card'

      if (!savedPacote || !PACOTES[savedPacote as keyof typeof PACOTES]) {
        router.push('/ofertas')
        return
      }

      setPacoteId(savedPacote)
      if (savedPayment) setPaymentMethod(savedPayment)
      setLoading(false)
    }

    loadData()
  }, [router, supabase])

  const handlePayment = async () => {
    if (!user || !pacoteId) return
    
    setProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/pagamento/criar-pacote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pacote: pacoteId,
          metodo: paymentMethod,
          userId: user.id,
          email: user.email
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar pagamento')
      }

      // Redirecionar para o Mercado Pago
      if (data.init_point) {
        window.location.href = data.init_point
      } else if (data.sandbox_init_point) {
        window.location.href = data.sandbox_init_point
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const pacote = PACOTES[pacoteId as keyof typeof PACOTES]
  if (!pacote) return null

  const preco = paymentMethod === 'pix' ? pacote.precoPix : pacote.precoCartao
  const parcela = Math.round(pacote.precoCartao / pacote.parcelas)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">Finalizar Compra</span>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-12">
        {/* Resumo do pacote */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-xl bg-primary/10">
              <pacote.icon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{pacote.nome}</h2>
              <p className="text-muted-foreground">{pacote.descricao}</p>
            </div>
          </div>

          <div className="space-y-3 text-sm mb-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="h-4 w-4 text-green-500" />
              {pacote.templates === -1 ? 'Todos os templates inclusos' : `${pacote.templates} templates inclusos`}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="h-4 w-4 text-green-500" />
              Hospedagem inclusa
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="h-4 w-4 text-green-500" />
              Suporte por WhatsApp
            </div>
          </div>

          {/* Método de pagamento */}
          <div className="border-t border-border pt-6">
            <p className="text-sm font-medium text-foreground mb-3">Forma de pagamento</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('pix')}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  paymentMethod === 'pix'
                    ? 'border-green-500 bg-green-500/5'
                    : 'border-border hover:border-green-500/50'
                }`}
              >
                <p className="font-bold text-foreground">PIX</p>
                <p className="text-lg font-bold text-green-600">R$ {pacote.precoPix}</p>
                <p className="text-xs text-green-600">
                  Economia de R$ {pacote.precoCartao - pacote.precoPix}
                </p>
              </button>

              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  paymentMethod === 'card'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="font-bold text-foreground">Cartão</p>
                <p className="text-lg font-bold text-foreground">{pacote.parcelas}x R$ {parcela}</p>
                <p className="text-xs text-muted-foreground">
                  Total: R$ {pacote.precoCartao}
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Botão de pagamento */}
        <button
          onClick={handlePayment}
          disabled={processing}
          className="w-full py-4 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-lg transition-all hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processando...
            </>
          ) : (
            <>Pagar com Mercado Pago</>
          )}
        </button>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-4 w-4" />
          Pagamento 100% seguro via Mercado Pago
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ao continuar, você concorda com nossos{' '}
          <a href="/termos" className="text-primary hover:underline">Termos de Uso</a>
        </p>
      </main>
    </div>
  )
}

export default function FinalizarCompraPacotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <FinalizarCompraPacoteContent />
    </Suspense>
  )
}
