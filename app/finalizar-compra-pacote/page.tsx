import Link from 'next/link'
import { AlertTriangle, ArrowRight, Store } from 'lucide-react'

export default function FinalizarCompraPacotePage() {
  return (
    <main className="from-background to-secondary/20 min-h-screen bg-gradient-to-b">
      <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-4">
          <Store className="text-primary h-5 w-5" />
          <span className="text-foreground font-semibold">Fluxo legado desativado</span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="border-border bg-card rounded-3xl border p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
            <AlertTriangle className="h-7 w-7 text-amber-600" />
          </div>
          <h1 className="text-foreground text-2xl font-bold">Checkout de pacotes removido</h1>
          <p className="text-muted-foreground mt-4">
            O produto agora usa apenas onboarding pago com assinatura SaaS recorrente. Pacotes de
            múltiplos templates e acesso vitalício não fazem mais parte da jornada comercial.
          </p>
          <Link
            href="/templates"
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold transition-colors"
          >
            Escolher template e continuar
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  )
}
