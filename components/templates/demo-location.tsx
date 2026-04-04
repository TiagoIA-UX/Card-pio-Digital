'use client'

import { ExternalLink, Globe, MapPin } from 'lucide-react'
import { DEMO_ADDRESS } from '@/lib/template-demo'

export function DemoLocation() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-6">
      <div
        className="overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/20"
        style={{ background: '#111827' }}
      >
        {/* Cabeçalho escuro */}
        <div
          className="flex items-center justify-between border-b border-white/10 px-4 py-3"
          style={{ background: '#0f172a' }}
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">Localização</span>
          </div>
          <a
            href={DEMO_ADDRESS.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Abrir no Maps
          </a>
        </div>

        {/* Card animado escuro */}
        <a
          href={DEMO_ADDRESS.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex h-48 w-full flex-col items-center justify-center gap-3 overflow-hidden transition-all hover:brightness-110"
          aria-label="Ver localização no Google Maps"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, #1a2230 0%, #1e2d3d 35%, #162130 65%, #1a2840 100%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                'linear-gradient(rgba(99,179,237,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.4) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/3 right-0 left-0 h-0.5 bg-blue-300/50" />
            <div className="absolute top-2/3 right-0 left-0 h-px bg-blue-300/30" />
            <div className="absolute top-0 bottom-0 left-1/3 w-0.5 bg-blue-300/50" />
            <div className="absolute top-0 bottom-0 left-2/3 w-px bg-blue-300/30" />
          </div>
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-red-500/40" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 shadow-lg ring-4 ring-slate-700/60">
                <Globe className="h-7 w-7 text-blue-400" />
              </div>
            </div>
            <div className="-mt-4 translate-x-5 -translate-y-2">
              <MapPin className="h-5 w-5 fill-red-500 text-red-400 drop-shadow" />
            </div>
            <div className="mt-1 flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 shadow-md ring-1 ring-white/10 transition-shadow group-hover:shadow-lg">
              <ExternalLink className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">
                Ver localização no Google Maps
              </span>
            </div>
            <p className="text-xs font-medium text-slate-400">Clique para abrir no mapa</p>
          </div>
        </a>

        {/* Rodapé */}
        <div
          className="flex items-center gap-2 border-t border-white/10 px-4 py-3"
          style={{ background: '#0f172a' }}
        >
          <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
          <p className="text-sm text-slate-300">{DEMO_ADDRESS.full}</p>
        </div>
      </div>
    </section>
  )
}
