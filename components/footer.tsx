import Link from 'next/link'
import { ArrowRight, Circle, Instagram, MapPin, MessageCircle, Shield, Users } from 'lucide-react'
import { COMPANY_NAME, PRODUCT_ENDORSEMENT } from '@/lib/brand'

const NAV = {
  produto: [
    { label: 'Templates', href: '/templates' },
    { label: 'Planos e preços', href: '/ofertas' },
    { label: 'Ver demonstração', href: '/demo' },
    { label: 'Status da plataforma', href: '/status' },
  ],
  parceiros: [
    { label: 'Programa de afiliados', href: '/afiliados' },
    { label: 'Ranking de afiliados', href: '/afiliados/ranking' },
    { label: 'Meu painel', href: '/painel' },
  ],
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
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      {/* ── CTA "Trabalhe Conosco" ────────────────────────────────────── */}
      <div className="border-b border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="from-primary/10 to-primary/5 border-primary/25 flex flex-col items-center gap-6 rounded-2xl border bg-linear-to-br px-6 py-8 text-center md:flex-row md:justify-between md:text-left">
            <div className="flex items-start gap-4">
              <div className="bg-primary/15 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                <Users className="text-primary h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">
                  Trabalhe conosco — ganhe 30% Todo Mês
                </p>
                <p className="mt-0.5 text-sm text-zinc-300">
                  Venda cardápios digitais como afiliado e construa uma renda que cai Todo Mês.
                  Recrute outros vendedores e ganhe +10% da produção da sua rede.
                </p>
              </div>
            </div>
            <Link
              href="/afiliados"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex shrink-0 items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors"
            >
              Quero ser afiliado
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
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
              <span className="text-lg font-semibold text-white">Cardápio Digital</span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-6 text-zinc-300">
              Cardápio digital profissional para restaurantes, pizzarias, hamburguerias e bares.
              Pedidos direto no WhatsApp. Zero comissão por pedido.
            </p>

            <p className="mt-3 max-w-xs text-xs leading-5 text-zinc-400">{PRODUCT_ENDORSEMENT}</p>

            {/* Selos */}
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
                <Shield className="h-3 w-3 text-green-400" />
                Garantia 30 dias
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
                <MapPin className="text-primary h-3 w-3" />
                Feito no Brasil
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
                <Circle className="h-3 w-3 fill-green-400 text-green-400" />
                0% comissão por pedido
              </span>
            </div>

            {/* Social */}
            <div className="mt-6 flex items-center gap-4">
              <Link
                href="https://instagram.com/cardapiodigital.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 transition-colors hover:text-white"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="https://wa.me/5512996887993"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 transition-colors hover:text-white"
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
                    className="text-sm text-zinc-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Parceiros / Afiliados */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              Parceiros
              <span className="bg-primary/15 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                30% Todo Mês
              </span>
            </h3>
            <ul className="space-y-3">
              {NAV.parceiros.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <Link
                href="https://wa.me/5512996887993?text=Ol%C3%A1%2C+quero+ser+afiliado+do+Card%C3%A1pio+Digital"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-sm font-medium transition-colors"
              >
                Falar no WhatsApp
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Legal</h3>
            <ul className="space-y-3">
              {NAV.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-400 transition-colors hover:text-white"
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
                    className="text-sm break-all text-zinc-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Barra inferior ───────────────────────────────────────────── */}
      <div className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} Cardápio Digital, operado por {COMPANY_NAME}. Todos os
            direitos reservados.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-zinc-500">
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
