'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="border-border bg-background/80 fixed top-0 right-0 left-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-accent flex h-8 w-8 items-center justify-center rounded-lg">
            <span className="text-accent-foreground text-sm font-bold">T</span>
          </div>
          <span className="text-foreground text-lg font-semibold">TemplateHub</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/templates"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Templates
          </Link>
          <Link
            href="/ofertas"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Planos
          </Link>
          <Link
            href="#precos"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Preços
          </Link>
          <Link
            href="#faq"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            FAQ
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Entrar
            </Button>
          </Link>
          <Link href="/templates">
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              Começar Agora
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-border bg-background border-t md:hidden">
          <nav className="flex flex-col gap-4 p-4">
            <Link
              href="/templates"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Templates
            </Link>
            <Link
              href="/ofertas"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Planos
            </Link>
            <Link
              href="#precos"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Preços
            </Link>
            <Link
              href="#faq"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              FAQ
            </Link>
            <div className="flex flex-col gap-2 pt-4">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  Entrar
                </Button>
              </Link>
              <Link href="/templates">
                <Button
                  size="sm"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 w-full"
                >
                  Começar Agora
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
