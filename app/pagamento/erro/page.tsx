'use client'

import Link from 'next/link'
import { XCircle, ArrowLeft, RefreshCw, MessageCircle } from 'lucide-react'

const WHATSAPP_NUMBER = '5512996887993'
const WHATSAPP_MESSAGE = encodeURIComponent(
  'Olá! Tive um problema no pagamento do Cardápio Digital. Pode me ajudar?'
)
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`

export default function PagamentoErroPage() {
  return (
    <div className="to-background flex min-h-screen items-center justify-center bg-linear-to-b from-red-50 p-4 dark:from-red-950/20">
      <div className="w-full max-w-md text-center">
        {/* Ícone de erro */}
        <div className="mb-6">
          <div className="mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-foreground mb-2 text-3xl font-bold">Pagamento não aprovado</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          Não se preocupe, você pode tentar novamente
        </p>

        {/* Card de motivos */}
        <div className="bg-card border-border mb-6 rounded-2xl border p-6 text-left">
          <h2 className="text-foreground mb-4 font-semibold">Possíveis motivos:</h2>
          <ul className="text-muted-foreground space-y-2 text-sm">
            <li>• Cartão sem limite disponível</li>
            <li>• Dados do cartão incorretos</li>
            <li>• Transação não autorizada pelo banco</li>
            <li>• PIX expirado (válido por 30 minutos)</li>
          </ul>
        </div>

        {/* Botões */}
        <div className="space-y-3">
          <Link
            href="/checkout"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-semibold transition-all"
          >
            <RefreshCw className="h-5 w-5" />
            Tentar novamente
          </Link>

          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="border-border bg-card text-foreground hover:bg-secondary inline-flex w-full items-center justify-center gap-2 rounded-xl border px-6 py-4 font-semibold transition-all"
          >
            <MessageCircle className="h-5 w-5" />
            Falar com suporte
          </a>

          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground inline-flex w-full items-center justify-center gap-2 py-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  )
}
