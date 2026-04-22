import Link from 'next/link'
import { CheckCircle2, Download, Home, Sparkles } from 'lucide-react'
import { createMercadoPagoPaymentClient } from '@/lib/domains/core/mercadopago'

interface SuccessPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || null
  return value || null
}

export default async function EbookPagamentoSucessoPage({ searchParams }: SuccessPageProps) {
  const resolvedSearchParams = (await searchParams) || {}
  const paymentId =
    getParam(resolvedSearchParams.payment_id) || getParam(resolvedSearchParams.collection_id)
  let isApproved = false

  if (paymentId) {
    try {
      const paymentClient = createMercadoPagoPaymentClient(10_000)
      const payment = await paymentClient.get({ id: paymentId })
      const status = String(payment.status || '').toLowerCase()
      const externalReference = String(payment.external_reference || '')
      isApproved =
        ['approved', 'accredited'].includes(status) && externalReference.startsWith('ebook_gmb:')
    } catch {
      isApproved = false
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-16">
      <div className="mx-auto max-w-3xl rounded-4xl border border-zinc-200 bg-white p-8 text-center shadow-sm md:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <p className="mt-5 text-xs font-bold tracking-[0.18em] text-zinc-500 uppercase">
          Litoral Conecta
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">
          Pagamento confirmado
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600">
          {isApproved
            ? 'Seu guia foi liberado! O PDF também foi enviado para o seu e-mail — confira a caixa de entrada.'
            : 'Recebemos seu retorno do checkout, mas ainda não conseguimos validar a aprovação automaticamente. Se o pagamento já caiu, tente novamente em instantes.'}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {isApproved && paymentId ? (
            <a
              href={`/api/ebook-gmb/download?payment_id=${encodeURIComponent(paymentId)}`}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-4 text-sm font-bold text-white transition hover:bg-zinc-800"
            >
              <Download className="h-4 w-4" />
              Baixar meu e-book
            </a>
          ) : null}
          <Link
            href="/ebook-google-meu-negocio"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-6 py-4 text-sm font-bold text-zinc-800 transition hover:bg-zinc-50"
          >
            <Sparkles className="h-4 w-4" />
            Voltar para a oferta
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-6 py-4 text-sm font-bold text-zinc-800 transition hover:bg-zinc-50"
          >
            <Home className="h-4 w-4" />
            Ir para a página inicial
          </Link>
        </div>
      </div>
    </div>
  )
}
