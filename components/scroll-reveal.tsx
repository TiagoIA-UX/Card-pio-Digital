'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

export function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const { ref, isVisible } = useScrollReveal()

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${isVisible ? 'scroll-reveal-visible' : ''} ${className}`}
    >
      <style jsx>{`
        .scroll-reveal {
          opacity: 0;
          transform: translateY(32px);
          transition:
            opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s,
            transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s;
        }
        .scroll-reveal-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
      {children}
    </div>
  )
}
