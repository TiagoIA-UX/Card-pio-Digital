'use client'

import { useState, useEffect } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

export function AnalyticsConsent() {
  const [consent, setConsent] = useState(false)

  useEffect(() => {
    const check = () => {
      setConsent(localStorage.getItem('cookie-consent') === 'accepted')
    }
    check()
    // Re-check quando o banner é clicado (storage event vem de outras tabs;
    // para mesma tab escutamos um custom event disparado pelo banner ou polling simples)
    window.addEventListener('storage', check)
    const interval = setInterval(check, 2000)
    return () => {
      window.removeEventListener('storage', check)
      clearInterval(interval)
    }
  }, [])

  if (!consent) return null

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
