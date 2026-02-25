"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle, PartyPopper, ArrowRight, Store } from "lucide-react"

export default function PagamentoSucessoPage() {
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    // Esconder confetti depois de 5 segundos
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background dark:from-green-950/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Ícone de sucesso */}
        <div className="mb-6 relative">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          {showConfetti && (
            <PartyPopper className="absolute top-0 right-1/4 h-8 w-8 text-yellow-500 animate-bounce" />
          )}
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Pagamento Aprovado!
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Seu cardápio digital está pronto para usar
        </p>

        {/* Card de próximos passos */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6 text-left">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Próximos passos
          </h2>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
              <span>Acesse o painel e adicione seus produtos</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
              <span>Personalize as cores e logo do seu negócio</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
              <span>Compartilhe o link e QR Code com seus clientes</span>
            </li>
          </ol>
        </div>

        {/* Botão */}
        <Link
          href="/painel"
          className="inline-flex items-center justify-center gap-2 w-full py-4 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-lg transition-all hover:bg-primary/90"
        >
          Acessar meu Painel
          <ArrowRight className="h-5 w-5" />
        </Link>

        <p className="mt-4 text-sm text-muted-foreground">
          Um email de confirmação foi enviado para você
        </p>
      </div>
    </div>
  )
}
