'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Download,
  RefreshCw,
  Zap,
  Check,
  Loader2,
  Info,
  ChevronRight,
  ShoppingCart,
  LogIn,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { STYLE_LABELS, CREDIT_PACKS, type ImageStyle, type CreditPack } from '@/lib/ai-image-generator'
import type { ImageGeneratorPartner } from '@/lib/ai-image-generator-partners'
import { BRAND_SHORT } from '@/lib/brand'
import { isPublicSandboxMode } from '@/lib/payment-mode'

interface Props {
  partner: ImageGeneratorPartner
}

interface CreditsData {
  authenticated: boolean
  credits_available: number
}

const STYLES = Object.entries(STYLE_LABELS) as [ImageStyle, string][]
const isSandbox = isPublicSandboxMode()

export function GeradorImagensPartnerClient({ partner }: Props) {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState<ImageStyle>('food')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [validationInfo, setValidationInfo] = useState<{
    score: number
    issues: string[]
    skipped: boolean
    attempts: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [credits, setCredits] = useState<CreditsData | null>(null)
  const [buyingPack, setBuyingPack] = useState<string | null>(null)

  const loadCredits = useCallback(async () => {
    const res = await fetch('/api/gerador-imagens/creditos').catch(() => null)
    if (res?.ok) {
      setCredits((await res.json()) as CreditsData)
    }
  }, [])

  useEffect(() => {
    void loadCredits()
  }, [loadCredits])

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError('Digite uma descrição para gerar a imagem.')
      return
    }
    setIsGenerating(true)
    setError(null)
    setGeneratedImage(null)
    setValidationInfo(null)

    const res = await fetch('/api/gerador-imagens/gerar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt.trim(),
        style,
        partnerId: partner.affiliateId,
      }),
    }).catch(() => null)

    if (!res) {
      setError('Erro de conexão. Verifique sua internet.')
      setIsGenerating(false)
      return
    }

    const data = (await res.json()) as {
      success?: boolean
      imageUrl?: string
      error?: string
      code?: string
      message?: string
      validation?: { score: number; issues: string[]; skipped: boolean; attempts: number }
    }

    if (!res.ok) {
      setError(
        data.code === 'INSUFFICIENT_CREDITS'
          ? (data.message ?? 'Créditos insuficientes.')
          : (data.error ?? 'Erro ao gerar imagem.')
      )
    } else if (data.imageUrl) {
      setGeneratedImage(data.imageUrl)
      if (data.validation) setValidationInfo(data.validation)
      void loadCredits()
    }

    setIsGenerating(false)
  }

  async function handleBuyPack(pack: CreditPack) {
    if (!credits?.authenticated) {
      window.location.href = `/login?redirect=/gerador-imagens/p/${partner.slug}`
      return
    }
    setBuyingPack(pack.slug)
    const res = await fetch('/api/gerador-imagens/comprar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packSlug: pack.slug, partnerId: partner.affiliateId }),
    }).catch(() => null)

    if (!res?.ok) {
      setError('Erro ao criar pagamento.')
      setBuyingPack(null)
      return
    }

    const data = (await res.json()) as { checkoutUrl?: string; sandboxCheckoutUrl?: string }
    const url = isSandbox ? data.sandboxCheckoutUrl : data.checkoutUrl
    if (url) window.location.href = url
    setBuyingPack(null)
  }

  const accentColor =
    partner.slug === 'blog-da-elisa'
      ? 'rose'
      : 'primary'

  return (
    <main className="bg-background min-h-screen">
      {/* Co-branded Header */}
      <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          {/* Logos co-branded: parceiro × Zairyx */}
          <div className="flex items-center gap-3">
            {/* Logo do parceiro */}
            <div
              className={`flex items-center gap-1.5 font-bold ${accentColor === 'rose' ? 'text-rose-500' : 'text-primary'}`}
            >
              <span className="text-lg">{partner.logoEmoji}</span>
              <span className="text-sm md:text-base">{partner.logoText}</span>
            </div>
            <span className="text-muted-foreground text-xs">×</span>
            {/* Logo Zairyx */}
            <Link href="/" className="text-primary flex items-center gap-1 font-bold">
              <span className="text-sm md:text-base">{BRAND_SHORT}</span>
            </Link>
            <Badge variant="secondary" className="hidden text-xs md:inline-flex">
              Gerador IA
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {isSandbox && (
              <Badge variant="outline" className="border-yellow-500 text-yellow-600 text-xs">
                SANDBOX
              </Badge>
            )}
            {credits?.authenticated ? (
              <Badge variant="secondary" className="gap-1">
                <Zap className="h-3 w-3" />
                {credits.credits_available} créditos
              </Badge>
            ) : (
              <Link
                href={`/login?redirect=/gerador-imagens/p/${partner.slug}`}
                className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
              >
                <LogIn className="h-4 w-4" />
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero co-branded */}
      <section className="px-4 py-10 md:py-14">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge do parceiro */}
          <div
            className={`mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
              accentColor === 'rose'
                ? 'bg-rose-50 text-rose-600'
                : 'bg-primary/10 text-primary'
            }`}
          >
            <span>{partner.logoEmoji}</span>
            {partner.displayName}
          </div>

          <h1 className="text-foreground mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            {partner.tagline}
          </h1>
          <p className="text-muted-foreground mx-auto mb-6 max-w-2xl text-lg">
            {partner.description}
          </p>

          {/* Casos de uso do parceiro */}
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            {partner.useCases.map((uc, i) => (
              <span key={i} className="text-muted-foreground flex items-center gap-1">
                <Check
                  className={`h-4 w-4 ${accentColor === 'rose' ? 'text-rose-500' : 'text-primary'}`}
                />
                {uc}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Generator */}
      <section className="px-4 pb-10">
        <div className="mx-auto max-w-4xl">
          <div className="bg-card border-border rounded-2xl border p-6 shadow-sm">
            {/* Style selector */}
            <div className="mb-5">
              <label className="text-foreground mb-2 block text-sm font-semibold">
                Estilo da imagem
              </label>
              <div className="flex flex-wrap gap-2">
                {STYLES.map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setStyle(key)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                      style === key
                        ? accentColor === 'rose'
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div className="mb-4">
              <label className="text-foreground mb-2 block text-sm font-semibold">
                Descreva o que você quer gerar
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={partner.useCases[0] != null ? `Ex: ${partner.useCases[0]}` : 'Descreva a imagem...'}
                className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary/30 w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
                rows={3}
                maxLength={500}
              />
              <p className="text-muted-foreground mt-1 text-right text-xs">
                {prompt.length}/500
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-destructive/10 text-destructive mb-4 flex items-start gap-2 rounded-xl p-3 text-sm">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              size="lg"
              className={`w-full gap-2 ${
                accentColor === 'rose'
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : ''
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Gerando e validando imagem...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  {partner.ctaLabel}
                </>
              )}
            </Button>

            {credits?.authenticated && (
              <p className="text-muted-foreground mt-2 text-center text-xs">
                {credits.credits_available} crédito(s) disponível(is)
              </p>
            )}
          </div>

          {/* Generated Image */}
          {generatedImage && (
            <div className="mt-6">
              <div className="bg-card border-border overflow-hidden rounded-2xl border shadow-sm">
                <div className="p-4 pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-foreground font-semibold">Imagem gerada ✨</h3>
                      <p className="text-muted-foreground text-sm">{prompt}</p>
                    </div>
                    {/* Validation badge */}
                    {validationInfo && !validationInfo.skipped && (
                      <div
                        className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                          validationInfo.score >= 70
                            ? 'bg-green-50 text-green-700'
                            : validationInfo.score >= 40
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {validationInfo.score >= 70 ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        Score {validationInfo.score}/100
                        {validationInfo.attempts > 1 && (
                          <span className="ml-1 opacity-70">
                            ({validationInfo.attempts}ª tentativa)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Validation issues */}
                  {validationInfo && validationInfo.issues.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {validationInfo.issues.map((issue, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs text-yellow-700"
                        >
                          ⚠ {issue}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mx-4 my-4 overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={generatedImage}
                    alt={prompt}
                    className="w-full rounded-xl object-contain"
                    style={{ maxHeight: '512px' }}
                  />
                </div>
                <div className="flex gap-2 p-4 pt-0">
                  <a
                    href={generatedImage}
                    download={`${partner.slug}-ia-${Date.now()}.jpg`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-border text-foreground inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4" />
                    Baixar
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Gerar outra
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Credit Packs */}
      <section className="bg-muted/30 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 text-center">
            <h2 className="text-foreground mb-2 text-xl font-bold">Pacotes de créditos</h2>
            <p className="text-muted-foreground text-sm">
              Créditos não expiram. Pagamento via PIX ou cartão.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.slug}
                className={`bg-card border-border relative rounded-2xl border p-4 shadow-sm ${
                  pack.popular
                    ? accentColor === 'rose'
                      ? 'ring-2 ring-rose-500 ring-offset-2'
                      : 'ring-primary ring-2 ring-offset-2'
                    : ''
                }`}
              >
                {pack.popular && (
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold text-white ${
                      accentColor === 'rose' ? 'bg-rose-500' : 'bg-primary'
                    }`}
                  >
                    Popular
                  </div>
                )}
                <p className="text-foreground font-bold">{pack.name}</p>
                <p
                  className={`text-2xl font-bold ${accentColor === 'rose' ? 'text-rose-500' : 'text-primary'}`}
                >
                  R$ {pack.price.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-muted-foreground mb-3 text-xs">{pack.credits} créditos</p>
                <Button
                  onClick={() => handleBuyPack(pack)}
                  variant={pack.popular ? 'default' : 'outline'}
                  size="sm"
                  className={`w-full text-xs ${
                    pack.popular && accentColor === 'rose'
                      ? 'bg-rose-500 hover:bg-rose-600 text-white border-0'
                      : ''
                  }`}
                  disabled={buyingPack === pack.slug}
                >
                  {buyingPack === pack.slug ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ChevronRight className="mr-1 h-3 w-3" />
                      Comprar
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner footer co-branded */}
      <footer className="border-border border-t px-4 py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center md:flex-row md:justify-between">
          {/* Logos */}
          <div className="flex items-center gap-3">
            <span
              className={`font-bold ${accentColor === 'rose' ? 'text-rose-500' : 'text-primary'}`}
            >
              {partner.logoEmoji} {partner.logoText}
            </span>
            <span className="text-muted-foreground text-sm">×</span>
            <span className="text-primary font-bold">{BRAND_SHORT}</span>
          </div>

          {/* Links */}
          <div className="text-muted-foreground flex items-center gap-4 text-xs">
            {partner.websiteUrl && (
              <a
                href={partner.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                {partner.displayName}
              </a>
            )}
            <Link href="/gerador-imagens" className="hover:text-foreground">
              Gerador IA Zairyx
            </Link>
            <Link href="/privacidade" className="hover:text-foreground">
              Privacidade
            </Link>
          </div>

          {/* Powered by */}
          <p className="text-muted-foreground text-xs">
            Powered by{' '}
            <Link href="/" className="text-primary hover:underline">
              {BRAND_SHORT}
            </Link>
          </p>
        </div>
      </footer>
    </main>
  )
}
