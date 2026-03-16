'use client'

import Link from 'next/link'
import { Menu, Store, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  { href: '/templates', label: 'Templates' },
  { href: '#beneficios', label: 'Benefícios' },
  { href: '#como-funciona', label: 'Como funciona' },
] as const

export function HomeHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
  }, [])

  const closeMenu = () => setIsMobileMenuOpen(false)

  return (
    <header className="border-border/80 bg-background/95 sticky top-0 z-50 border-b">
      <div className="container-premium flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3" onClick={closeMenu}>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <span className="text-foreground/75 block text-sm font-semibold tracking-[0.18em] uppercase">
              Cardápio Digital
            </span>
            <span className="block text-base font-semibold">Edite rápido e venda no seu canal</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-foreground/75 hover:text-foreground text-sm font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isLoggedIn ? (
            <Link
              href="/painel"
              className="text-foreground/80 hover:text-foreground inline-flex items-center rounded-full px-3 py-2 text-sm font-medium transition-colors"
            >
              Painel
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-foreground/80 hover:text-foreground inline-flex items-center rounded-full px-3 py-2 text-sm font-medium transition-colors"
            >
              Entrar
            </Link>
          )}
          <Link
            href="/ofertas"
            className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            Ver planos
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/ofertas"
            className="bg-foreground text-background inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold"
          >
            Planos
          </Link>
          <button
            type="button"
            aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-controls="home-mobile-menu"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            className="border-border bg-card inline-flex h-10 w-10 items-center justify-center rounded-full border"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div id="home-mobile-menu" className="border-border border-t lg:hidden">
          <div className="container-premium flex flex-col gap-3 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="text-foreground/80 hover:text-foreground rounded-2xl px-1 py-2 text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {isLoggedIn ? (
                <Link
                  href="/painel"
                  onClick={closeMenu}
                  className="border-border bg-card text-foreground inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-medium"
                >
                  Painel
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="border-border bg-card text-foreground inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-medium"
                >
                  Entrar
                </Link>
              )}
              <Link
                href="/ofertas"
                onClick={closeMenu}
                className="bg-foreground text-background inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold"
              >
                Ver planos
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
