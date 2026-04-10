import { ShieldCheck } from 'lucide-react'
import { COMMERCIAL_COPY } from '@/lib/domains/marketing/commercial-copy'

type Variant = 'dark' | 'light' | 'orange'

const styles: Record<Variant, { wrapper: string; icon: string; label: string; sub: string }> = {
  dark: {
    wrapper:
      'inline-flex items-center gap-2.5 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 backdrop-blur-sm',
    icon: 'h-5 w-5 text-green-400',
    label: 'text-sm font-bold text-green-300',
    sub: 'text-[11px] text-green-300/70',
  },
  light: {
    wrapper:
      'inline-flex items-center gap-2.5 rounded-full border border-green-600/20 bg-green-50 px-4 py-2',
    icon: 'h-5 w-5 text-green-600',
    label: 'text-sm font-bold text-green-700',
    sub: 'text-[11px] text-green-600/70',
  },
  orange: {
    wrapper:
      'inline-flex items-center gap-2.5 rounded-full border border-white/30 bg-white/15 px-4 py-2 backdrop-blur-sm',
    icon: 'h-5 w-5 text-white',
    label: 'text-sm font-bold text-white',
    sub: 'text-[11px] text-white/70',
  },
}

export function GuaranteeBadge({
  variant = 'dark',
  className,
}: {
  variant?: Variant
  className?: string
}) {
  const s = styles[variant]
  return (
    <div className={`${s.wrapper} ${className ?? ''}`} data-testid="guarantee-badge">
      <ShieldCheck className={s.icon} />
      <div className="flex flex-col leading-tight">
        <span className={s.label}>{COMMERCIAL_COPY.withdrawalShort}</span>
        <span className={s.sub}>Conforme CDC — sem fidelidade</span>
      </div>
    </div>
  )
}
