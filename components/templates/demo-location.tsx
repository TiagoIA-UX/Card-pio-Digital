"use client"

import Link from "next/link"
import { MapPin } from "lucide-react"
import { DEMO_ADDRESS } from "@/lib/template-demo"

export function DemoLocation() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Onde estamos</p>
            <p className="text-sm text-muted-foreground mt-0.5">{DEMO_ADDRESS.full}</p>
          </div>
        </div>
        <Link
          href={DEMO_ADDRESS.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
        >
          <MapPin className="h-4 w-4" />
          Ver no Google Maps
        </Link>
      </div>
    </section>
  )
}
