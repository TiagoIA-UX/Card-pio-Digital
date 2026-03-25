'use client'

import Link from 'next/link'
import { Store, ArrowLeft } from 'lucide-react'

export default function CookiesPage() {
  return (
    <main className="bg-background min-h-screen">
      <header className="border-border bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="from-primary to-primary/80 flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-foreground text-xl font-bold">Zairyx — Canal Digital</span>
          </Link>
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">Política de Cookies</h1>

        <p className="text-muted-foreground mb-8">Última atualização: 18 de março de 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">1. O que são cookies</h2>
            <p>
              Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você
              visita nosso site. Eles nos ajudam a melhorar sua experiência, lembrar suas
              preferências e entender como o serviço é utilizado.
            </p>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">2. Tipos de cookies que utilizamos</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Cookies essenciais:</strong> necessários para o funcionamento do site, como
                autenticação e segurança. Não podem ser desativados.
              </li>
              <li>
                <strong>Cookies de preferências:</strong> lembrar suas configurações, como idioma e
                preferências de exibição.
              </li>
              <li>
                <strong>Cookies de análise:</strong> nos ajudam a entender como os visitantes
                utilizam o site (ex.: Vercel Analytics). Os dados são agregados. O endereço IP pode
                ser temporariamente processado para geolocalização, mas não é armazenado de forma
                identificável.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">3. Seu consentimento</h2>
            <p>
              Ao utilizar nosso site, você pode aceitar ou rejeitar cookies não essenciais através
              do banner exibido na primeira visita. O consentimento é registrado e armazenado
              localmente no seu dispositivo.
            </p>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">4. Como gerenciar cookies</h2>
            <p>
              Você pode configurar seu navegador para bloquear ou excluir cookies. A maioria dos
              navegadores permite essa configuração em: Configurações → Privacidade e segurança.
              Observe que ao desativar cookies essenciais, algumas funcionalidades do site podem
              deixar de funcionar corretamente.
            </p>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">5. Cookies utilizados</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-border border-b">
                    <th className="py-2 pr-4 text-left font-semibold">Cookie</th>
                    <th className="py-2 pr-4 text-left font-semibold">Finalidade</th>
                    <th className="py-2 pr-4 text-left font-semibold">Duração</th>
                    <th className="py-2 text-left font-semibold">Provedor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-border/50 border-b">
                    <td className="py-2 pr-4">
                      <code className="bg-muted rounded px-1.5 py-0.5 text-xs">cookie-consent</code>
                    </td>
                    <td className="py-2 pr-4">Registro de consentimento</td>
                    <td className="py-2 pr-4">1 ano</td>
                    <td className="py-2">Próprio</td>
                  </tr>
                  <tr className="border-border/50 border-b">
                    <td className="py-2 pr-4">
                      <code className="bg-muted rounded px-1.5 py-0.5 text-xs">sb-*</code>
                    </td>
                    <td className="py-2 pr-4">Autenticação Supabase</td>
                    <td className="py-2 pr-4">Sessão</td>
                    <td className="py-2">Supabase</td>
                  </tr>
                  <tr className="border-border/50 border-b">
                    <td className="py-2 pr-4">
                      <code className="bg-muted rounded px-1.5 py-0.5 text-xs">aff_ref</code>
                    </td>
                    <td className="py-2 pr-4">Rastreamento de afiliado</td>
                    <td className="py-2 pr-4">30 dias</td>
                    <td className="py-2">Próprio</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
                        va_* / _vercel_*
                      </code>
                    </td>
                    <td className="py-2 pr-4">Analytics (páginas visitadas, performance)</td>
                    <td className="py-2 pr-4">Sessão</td>
                    <td className="py-2">Vercel</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">6. Como revogar o consentimento</h2>
            <p>
              Você pode revogar o consentimento a qualquer momento limpando os cookies do navegador
              ou clicando em &quot;Gerenciar cookies&quot; no rodapé do site. A revogação não afeta
              tratamentos realizados anteriormente com base no consentimento.
            </p>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">7. Contato</h2>
            <p>
              Para dúvidas sobre o uso de cookies, entre em contato:{' '}
              <strong>zairyx.ai@gmail.com</strong>
            </p>
          </section>

          <section className="border-border bg-muted/30 rounded-xl border p-4">
            <p className="text-muted-foreground text-sm">
              Para mais informações sobre como tratamos seus dados pessoais, consulte nossa{' '}
              <Link href="/privacidade" className="text-primary hover:underline">
                Política de Privacidade
              </Link>{' '}
              e nossos{' '}
              <Link href="/termos" className="text-primary hover:underline">
                Termos de Uso
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
