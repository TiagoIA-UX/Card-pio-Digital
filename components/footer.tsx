'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Circle,
  Instagram,
  MapPin,
  MessageCircle,
  Shield,
  Sparkles,
  Youtube,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

const NAV = {
  produto: [
    { label: 'Ver modelos', href: '/templates' },
    { label: 'Preços', href: '/precos' },
    { label: 'Funcionalidades', href: '/funcionalidades' },
    { label: 'Ver demonstração', href: '/demo' },
    { label: 'Status da plataforma', href: '/status' },
  ],
  parceiros: [{ label: 'Meu painel', href: '/painel' }],
  contato: [
    { label: 'zairyx.ai@gmail.com', href: 'mailto:zairyx.ai@gmail.com' },
    { label: 'WhatsApp', href: 'https://wa.me/5512996887993' },
  ],
  legal: [
    { label: 'Termos de uso', href: '/termos' },
    { label: 'Política de privacidade', href: '/privacidade' },
    { label: 'Política de transparência', href: '/politica' },
    { label: 'Cookies', href: '/cookies' },
  ],
}

export function Footer() {
  const [email, setEmail] = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')

  const handleNewsletterSubmit = async () => {
    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return

    setNewsletterStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      if (res.ok) {
        setNewsletterStatus('success')
        setEmail('')
      } else {
        setNewsletterStatus('error')
      }
    } catch {
      setNewsletterStatus('error')
    }
  }

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      {/* ── CTA com IA ──────────────────────────────────────────────── */}
      <div className="bg-linear-to-b from-zinc-900 to-zinc-950">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-14 text-center sm:px-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10">
            <Sparkles className="h-6 w-6 text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Pronto para transformar seu delivery?
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-zinc-300">
            Monte seu cardápio digital em minutos com ajuda da nossa IA. Sem taxa por pedido, sem
            mensalidade surpresa.
          </p>
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
          >
            Começar agora
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      {/* ── Corpo do rodapé ──────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          {/* Marca */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <span className="text-primary-foreground text-sm font-bold">CD</span>
              </div>
              <span className="text-lg font-semibold text-white">Zairyx Canais Digitais</span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-6 text-zinc-200">
              Zairyx Canais Digitais — A plataforma que transforma qualquer operação de delivery em
              máquina de vendas. Pedidos direto no WhatsApp. Zero taxa por pedido.
            </p>

            {/* Selos */}
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-200">
                <Shield className="h-3 w-3 text-green-400" />
                Garantia 30 dias
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-200">
                <MapPin className="text-primary h-3 w-3" />
                Feito no Brasil
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-200">
                <Circle className="h-3 w-3 fill-green-400 text-green-400" />
                0% taxa por pedido
              </span>
            </div>

            {/* Social */}
            <div className="mt-6 flex items-center gap-4">
              <Link
                href="https://instagram.com/cardapiodigital.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-300 transition-colors hover:text-white"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="https://youtube.com/@zairyx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-300 transition-colors hover:text-white"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </Link>
              <Link
                href="https://wa.me/5512996887993"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-300 transition-colors hover:text-white"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Produto */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Produto</h3>
            <ul className="space-y-3">
              {NAV.produto.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Parceiros */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              Parceiros
            </h3>
            <ul className="space-y-3">
              {NAV.parceiros.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Legal</h3>
            <ul className="space-y-3">
              {NAV.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Contato</h3>
            <ul className="space-y-3">
              {NAV.contato.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm break-all text-zinc-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Newsletter ─────────────────────────────────────────────── */}
      <div className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-10 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <div>
            <h3 className="text-sm font-semibold text-white">Receba dicas de delivery</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Templates novos, estratégias de vendas e novidades da plataforma.
            </p>
          </div>
          {newsletterStatus === 'success' ? (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Inscrito com sucesso!
            </div>
          ) : (
            <form
              className="flex w-full max-w-sm gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                void handleNewsletterSubmit()
              }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu melhor e-mail"
                className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={newsletterStatus === 'loading'}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
              >
                {newsletterStatus === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Inscrever'
                )}
              </button>
            </form>
          )}
          {newsletterStatus === 'error' && (
            <p className="mt-1 text-xs text-red-400">Erro ao inscrever. Tente novamente.</p>
          )}
        </div>
      </div>

      {/* ── Barra inferior ───────────────────────────────────────────── */}
      <div className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-sm text-zinc-400">
            © {new Date().getFullYear()} Zairyx Soluções Tecnológicas. Todos os direitos reservados.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Circle className="h-2 w-2 fill-green-400 text-green-400" />
            Todos os sistemas operacionais
            <span className="mx-1 text-zinc-700">·</span>
            <Link
              href="/status"
              className="underline underline-offset-2 transition-colors hover:text-zinc-300"
            >
              ver status
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
