'use client'

import Link from 'next/link'
import {
  ChevronDown,
  Menu,
  Store,
  X,
  LayoutTemplate,
  Sparkles,
  Eye,
  Activity,
  CreditCard,
  HelpCircle,
  FileText,
  Users,
} from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  { href: '#beneficios', label: 'Benefícios' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '/precos', label: 'Preços' },
] as const

interface MegaMenuCategory {
  title: string
  items: { href: string; label: string; desc: string; icon: typeof Store }[]
}

const MEGA_MENU: Record<string, MegaMenuCategory> = {
  produto: {
    title: 'Produto',
    items: [
      {
        href: '/templates',
        label: 'Templates',
        desc: 'Modelos prontos para usar',
        icon: LayoutTemplate,
      },
      { href: '/demo', label: 'Demonstração', desc: 'Teste o cardápio ao vivo', icon: Eye },
      {
        href: '/precos',
        label: 'Preços & Planos',
        desc: 'Encontre o plano ideal',
        icon: CreditCard,
      },
      {
        href: '/funcionalidades',
        label: 'Funcionalidades',
        desc: 'Pagamento digital e recursos',
        icon: Sparkles,
      },
      { href: '/status', label: 'Status', desc: 'Uptime e monitoramento', icon: Activity },
    ],
  },
  recursos: {
    title: 'Recursos',
    items: [
      {
        href: '/afiliados',
        label: 'Programa de Afiliados',
        desc: 'Ganhe indicando parceiros',
        icon: Users,
      },
      {
        href: '/termos',
        label: 'Termos de Uso',
        desc: 'Nossas políticas e regras',
        icon: FileText,
      },
      {
        href: '/privacidade',
        label: 'Privacidade',
        desc: 'Como tratamos seus dados',
        icon: HelpCircle,
      },
    ],
  },
} as const

type MegaMenuKey = keyof typeof MEGA_MENU

export function HomeHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [openMenu, setOpenMenu] = useState<MegaMenuKey | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const hasAffiliateRef = !!searchParams.get('ref')
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth
      .getSession()
      .then(
        ({
          data: { session },
        }: {
          data: { session: import('@supabase/supabase-js').Session | null }
        }) => {
          setIsLoggedIn(!!session)
        }
      )
  }, [])

  // Scroll spy para seções âncora
  useEffect(() => {
    const sectionIds = ['beneficios', 'como-funciona']
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    )

    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [])

  const closeMenu = useCallback(() => setIsMobileMenuOpen(false), [])

  const handleMenuEnter = useCallback((key: MegaMenuKey) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    setOpenMenu(key)
  }, [])

  const handleMenuLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => setOpenMenu(null), 150)
  }, [])

  return (
    <header className="border-border/80 bg-background/95 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="container-premium flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3" onClick={closeMenu}>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <span className="text-foreground block text-sm font-semibold tracking-[0.18em] uppercase">
              Zairyx
            </span>
            <span className="block text-base font-semibold">Canais Digitais</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => {
            const anchor = link.href.startsWith('#') ? link.href.slice(1) : null
            const isActive = anchor ? activeSection === anchor : false
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-foreground border-b-2 border-orange-500 pb-0.5'
                    : 'text-foreground/90 hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            )
          })}

          {/* Mega Menu Dropdowns */}
          {(Object.keys(MEGA_MENU) as MegaMenuKey[]).map((key) => {
            const category = MEGA_MENU[key]
            const isOpen = openMenu === key
            return (
              <div
                key={key}
                className="relative"
                onMouseEnter={() => handleMenuEnter(key)}
                onMouseLeave={handleMenuLeave}
              >
                <button
                  type="button"
                  className="text-foreground/90 hover:text-foreground flex items-center gap-1 text-sm font-medium transition-colors"
                >
                  {category.title}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="border-border bg-card animate-in fade-in slide-in-from-top-1 absolute top-full left-1/2 z-50 mt-2 w-72 -translate-x-1/2 rounded-xl border p-2 shadow-xl duration-150">
                    {category.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="hover:bg-secondary flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors"
                        onClick={() => setOpenMenu(null)}
                      >
                        <div className="bg-primary/10 mt-0.5 rounded-lg p-1.5">
                          <item.icon className="text-primary h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-foreground block text-sm font-medium">
                            {item.label}
                          </span>
                          <span className="text-muted-foreground block text-xs">{item.desc}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isLoggedIn ? (
            <Link
              href="/painel"
              className="text-foreground hover:text-foreground inline-flex items-center rounded-full px-3 py-2 text-sm font-medium transition-colors"
            >
              Painel
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-foreground hover:text-foreground inline-flex items-center rounded-full px-3 py-2 text-sm font-medium transition-colors"
            >
              Entrar
            </Link>
          )}
          <Link
            href="/templates"
            className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            Ver modelos
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {isLoggedIn ? (
            <Link
              href="/painel"
              className="border-border bg-card text-foreground inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold"
            >
              Painel
            </Link>
          ) : (
            <Link
              href="/login"
              className="border-border bg-card text-foreground inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold"
            >
              Entrar
            </Link>
          )}
          <Link
            href="/templates"
            className="bg-foreground text-background inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold"
          >
            Modelos
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

      {hasAffiliateRef && (
        <div className="border-border/80 border-t bg-amber-50/90">
          <div className="container-premium py-3 text-sm text-amber-900">
            {isLoggedIn
              ? 'Este link de afiliado apenas registra a indicação. Você já está logado nesta sessão. Para testar com outra conta, saia primeiro ou use uma janela anônima.'
              : 'Indicação registrada neste navegador. Para continuar o cadastro, clique em Entrar e faça login com a conta que vai usar no software.'}
          </div>
        </div>
      )}

      {isMobileMenuOpen && (
        <div id="home-mobile-menu" className="border-border border-t lg:hidden">
          <div className="container-premium flex flex-col gap-3 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="text-foreground hover:text-foreground rounded-2xl px-1 py-2 text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile Mega Menu sections */}
            {(Object.keys(MEGA_MENU) as MegaMenuKey[]).map((key) => {
              const category = MEGA_MENU[key]
              return (
                <div key={key}>
                  <p className="text-muted-foreground px-1 text-xs font-semibold tracking-wider uppercase">
                    {category.title}
                  </p>
                  <div className="mt-1 space-y-1">
                    {category.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        className="hover:bg-secondary flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors"
                      >
                        <item.icon className="text-muted-foreground h-4 w-4" />
                        <span className="text-foreground text-sm">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}

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
                href="/templates"
                onClick={closeMenu}
                className="bg-foreground text-background inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold"
              >
                Ver modelos
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
