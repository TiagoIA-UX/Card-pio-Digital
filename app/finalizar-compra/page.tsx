"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Store, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

function FinalizarCompraContent() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'processing' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    const processPayment = async () => {
      const supabase = createClient()
      
      // Verificar se usuário está logado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/finalizar-compra')
        return
      }

      // Recuperar dados do localStorage
      const template = localStorage.getItem('checkout_template')
      const plan = localStorage.getItem('checkout_plan')
      const paymentMethod = localStorage.getItem('checkout_payment')

      if (!template || !plan || !paymentMethod) {
        setError('Dados da compra não encontrados. Por favor, escolha um template novamente.')
        setStatus('error')
        return
      }

      setStatus('processing')

      try {
        // Chamar API para criar preferência de pagamento
        const response = await fetch('/api/pagamento/criar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template,
            plano: plan,
            metodo: paymentMethod,
            userId: user.id,
            email: user.email
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao processar pagamento')
        }

        // Limpar localStorage
        localStorage.removeItem('checkout_template')
        localStorage.removeItem('checkout_plan')
        localStorage.removeItem('checkout_payment')

        // Redirecionar para página de pagamento do Mercado Pago
        if (data.init_point) {
          window.location.href = data.init_point
        } else {
          throw new Error('Link de pagamento não gerado')
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao processar pagamento')
        setStatus('error')
      }
    }

    processPayment()
  }, [router])

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Ops! Algo deu errado</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium"
          >
            Escolher template
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Store className="h-8 w-8 text-primary" />
        </div>
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">
          {status === 'loading' ? 'Verificando dados...' : 'Preparando pagamento...'}
        </h1>
        <p className="text-muted-foreground">Aguarde, você será redirecionado</p>
      </div>
    </div>
  )
}

export default function FinalizarCompraPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <FinalizarCompraContent />
    </Suspense>
  )
}
