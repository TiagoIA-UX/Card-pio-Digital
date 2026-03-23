'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, Copy, Check, ExternalLink } from 'lucide-react'

type Sentimento = 'positivo' | 'neutro' | 'negativo'

interface FeedbackResult {
  success: boolean
  sentimento: Sentimento
  cupom?: string
  mensagem: string
}

const EMOJIS = [
  { value: 1, emoji: '😡', label: 'Péssimo' },
  { value: 2, emoji: '😕', label: 'Ruim' },
  { value: 3, emoji: '😊', label: 'Bom' },
  { value: 4, emoji: '🤩', label: 'Excelente' },
]

export default function FeedbackPage() {
  const params = useParams()
  const orderId = params.orderId as string

  const [step, setStep] = useState<'loading' | 'rate' | 'comment' | 'done' | 'already' | 'error'>(
    'loading'
  )
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<FeedbackResult | null>(null)
  const [clienteName, setClienteName] = useState('')
  const [copied, setCopied] = useState(false)

  // Verificar se pedido existe e se já tem feedback
  const checkOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/feedback?order_id=${encodeURIComponent(orderId)}`)
      if (!res.ok) {
        setStep('error')
        return
      }
      const data = await res.json()
      if (data.exists) {
        setStep('already')
      } else {
        setClienteName(data.order?.cliente_nome || '')
        setStep('rate')
      }
    } catch {
      setStep('error')
    }
  }, [orderId])

  useEffect(() => {
    void checkOrder()
  }, [checkOrder])

  const handleRating = (value: number) => {
    setRating(value)
    setStep('comment')
  }

  const handleSubmit = async () => {
    if (!rating) return
    setSubmitting(true)

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          rating,
          comment: comment.trim(),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        if (res.status === 409) {
          setStep('already')
          return
        }
        throw new Error(err.error || 'Erro ao enviar')
      }

      const data: FeedbackResult = await res.json()
      setResult(data)
      setStep('done')
    } catch {
      setStep('error')
    } finally {
      setSubmitting(false)
    }
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const handleCopyCoupon = () => {
    if (result?.cupom) {
      navigator.clipboard.writeText(result.cupom)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // ── Loading ────────────────────────────────────────
  if (step === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-orange-50 to-amber-50 dark:from-zinc-950 dark:to-zinc-900">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </main>
    )
  }

  // ── Erro ───────────────────────────────────────────
  if (step === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-orange-50 to-amber-50 p-4 dark:from-zinc-950 dark:to-zinc-900">
        <div className="max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-zinc-900">
          <div className="mb-4 text-5xl">😔</div>
          <h1 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">Link inválido</h1>
          <p className="text-sm text-zinc-500">
            Este link de feedback não é válido ou o pedido não foi encontrado.
          </p>
        </div>
      </main>
    )
  }

  // ── Já avaliou ──────────────────────────────────────
  if (step === 'already') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-orange-50 to-amber-50 p-4 dark:from-zinc-950 dark:to-zinc-900">
        <div className="max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-zinc-900">
          <div className="mb-4 text-5xl">✅</div>
          <h1 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">Já avaliado!</h1>
          <p className="text-sm text-zinc-500">
            Você já enviou seu feedback para este pedido. Obrigado!
          </p>
        </div>
      </main>
    )
  }

  // ── Tela de avaliação (1 clique) ───────────────────
  if (step === 'rate') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-orange-50 to-amber-50 p-4 dark:from-zinc-950 dark:to-zinc-900">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-zinc-900">
          <div className="mb-2 text-4xl">🍕</div>
          <h1 className="mb-1 text-xl font-bold text-zinc-900 dark:text-white">
            {clienteName ? `Olá, ${clienteName}!` : 'Como foi seu pedido?'}
          </h1>
          <p className="mb-8 text-sm text-zinc-500">
            {clienteName ? 'Como foi seu pedido?' : 'Toque no emoji que representa sua experiência'}
          </p>

          <div className="flex justify-center gap-4">
            {EMOJIS.map((e) => (
              <button
                key={e.value}
                onClick={() => handleRating(e.value)}
                className="group flex flex-col items-center gap-1 rounded-xl p-3 transition-all hover:scale-110 hover:bg-orange-50 active:scale-95 dark:hover:bg-zinc-800"
              >
                <span className="text-4xl transition-transform group-hover:scale-110">
                  {e.emoji}
                </span>
                <span className="text-xs text-zinc-400">{e.label}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    )
  }

  // ── Tela de comentário (opcional) ──────────────────
  if (step === 'comment') {
    const selectedEmoji = EMOJIS.find((e) => e.value === rating)

    return (
      <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-orange-50 to-amber-50 p-4 dark:from-zinc-950 dark:to-zinc-900">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-zinc-900">
          <div className="mb-4 text-5xl">{selectedEmoji?.emoji}</div>
          <h2 className="mb-1 text-lg font-bold text-zinc-900 dark:text-white">
            {selectedEmoji?.label}!
          </h2>
          <p className="mb-6 text-sm text-zinc-500">Quer contar mais? (opcional)</p>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ex: A pizza estava incrível! / Demorou um pouco..."
            maxLength={2000}
            rows={3}
            className="mb-4 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />

          <div className="flex gap-3">
            <button
              onClick={() => setStep('rate')}
              className="flex-1 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Voltar
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar'
              )}
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── Tela de resultado / fidelização ────────────────
  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-orange-50 to-amber-50 p-4 dark:from-zinc-950 dark:to-zinc-900">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-zinc-900">
        {result?.sentimento === 'negativo' ? (
          <>
            <div className="mb-4 text-5xl">💝</div>
            <h2 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">
              Obrigado pelo feedback!
            </h2>
            <p className="mb-6 text-sm text-zinc-500">{result.mensagem}</p>

            {result.cupom && (
              <div className="mb-4 rounded-xl bg-green-50 p-4 dark:bg-green-900/20">
                <p className="mb-2 text-xs font-medium text-green-700 dark:text-green-400">
                  🎁 Seu cupom de desconto:
                </p>
                <div className="flex items-center justify-center gap-2">
                  <code className="rounded-lg bg-green-100 px-4 py-2 text-lg font-bold text-green-800 dark:bg-green-900/40 dark:text-green-300">
                    {result.cupom}
                  </code>
                  <button
                    onClick={handleCopyCoupon}
                    className="rounded-lg p-2 text-green-600 transition-colors hover:bg-green-100 dark:hover:bg-green-900/30"
                    title="Copiar cupom"
                  >
                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                  10% de desconto no próximo pedido
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-4 text-5xl">🎉</div>
            <h2 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">Valeu demais!</h2>
            <p className="mb-6 text-sm text-zinc-500">
              {result?.mensagem || 'Obrigado pelo feedback!'}
            </p>

            <div className="space-y-3">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Acabei de pedir e foi incrível! 🍕 Confere: ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-600"
              >
                <ExternalLink className="h-4 w-4" />
                Compartilhar no WhatsApp
              </a>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
