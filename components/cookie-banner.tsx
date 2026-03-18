'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

export function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Mostrar após 1 segundo
      const timer = setTimeout(() => setShow(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const setCookieConsent = (value: 'accepted' | 'rejected') => {
    localStorage.setItem('cookie-consent', value)
    // HTTP cookie para leitura no middleware (server-side)
    document.cookie = `cookie-consent=${value}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
  }

  const handleAccept = () => {
    setCookieConsent('accepted')
    setShow(false)
  }

  const handleReject = () => {
    setCookieConsent('rejected')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="bg-background border-border animate-in slide-in-from-bottom fixed right-0 bottom-0 left-0 z-50 border-t p-4 shadow-lg duration-300">
      <div className="container mx-auto flex max-w-4xl flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="text-foreground text-sm">
            Usamos cookies para melhorar sua experiência. Ao continuar navegando, você concorda com
            nossa{' '}
            <Link href="/privacidade" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
            ,{' '}
            <Link href="/cookies" className="text-primary hover:underline">
              Política de Cookies
            </Link>{' '}
            e{' '}
            <Link href="/termos" className="text-primary hover:underline">
              Termos de Uso
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReject}
            className="text-muted-foreground hover:text-foreground px-4 py-2 text-sm font-medium transition-colors"
          >
            Rejeitar
          </button>
          <button
            onClick={handleAccept}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Aceitar cookies
          </button>
          <button
            onClick={handleReject}
            className="text-muted-foreground hover:text-foreground p-2 sm:hidden"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
