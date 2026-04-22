'use client'

import { FormEvent, useState } from 'react'
import { Loader2, LockKeyhole, ShoppingCart } from 'lucide-react'

export function EbookGmbCheckoutCard() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/ebook-gmb/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })

      const payload = await response.json()

      if (!response.ok) {
        setError(payload?.error || 'Não foi possível iniciar o checkout.')
        return
      }

      const initPoint = payload?.data?.initPoint || payload?.data?.sandboxInitPoint
      if (!initPoint) {
        setError('Checkout criado sem link de pagamento. Tente novamente.')
        return
      }

      window.location.href = initPoint
    } catch {
      setError('Falha ao criar checkout. Tente novamente em instantes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-4xl border border-zinc-200 bg-white p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.35)] md:p-7">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white">
          <ShoppingCart className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-900">Compra avulsa segura</p>
          <p className="text-sm text-zinc-500">Checkout próprio com Mercado Pago</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="ebook-name" className="mb-1 block text-sm font-medium text-zinc-800">
            Seu nome
          </label>
          <input
            id="ebook-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm transition outline-none focus:border-zinc-400"
            placeholder="Ex.: Tiago Rocha"
          />
        </div>

        <div>
          <label htmlFor="ebook-email" className="mb-1 block text-sm font-medium text-zinc-800">
            Seu melhor e-mail
          </label>
          <input
            id="ebook-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm transition outline-none focus:border-zinc-400"
            placeholder="voce@empresa.com"
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-4 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LockKeyhole className="h-4 w-4" />
          )}
          {loading ? 'Criando checkout...' : 'Comprar agora por R$ 197'}
        </button>
      </form>

      <p className="mt-4 text-xs leading-relaxed text-zinc-500">
        Após a aprovação do pagamento, o PDF é enviado para o seu e-mail e o download é liberado
        imediatamente na página de confirmação.
      </p>
    </div>
  )
}
