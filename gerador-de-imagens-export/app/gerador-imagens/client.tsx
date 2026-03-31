'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Download,
  RefreshCw,
  Zap,
  Star,
  Crown,
  Check,
  ImageIcon,
  Loader2,
  ChevronRight,
  Info,
  History,
  ShoppingCart,
  LogIn,
  Layers,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CREDIT_PACKS, STYLE_LABELS, type ImageStyle, type CreditPack } from '@/lib/ai-image-generator'
import { PARTNERS } from '@/lib/ai-image-generator-partners'
import { BRAND_SHORT } from '@/lib/brand'
import { isPublicSandboxMode } from '@/lib/payment-mode'

// ── Tipos ──────────────────────────────────────────────────────────────────

interface CreditsData {
  authenticated: boolean
  credits_available: number
  credits_used: number
  free_credits_given: boolean
  recent_generations?: {
    id: string
    prompt: string
    style: string
    image_url: string
    provider: string
    created_at: string
  }[]
}

interface ValidationInfo {
  score: number
  issues: string[]
  skipped: boolean
  attempts: number
}

// ── Helpers ────────────────────────────────────────────────────────────────

const STYLES = Object.entries(STYLE_LABELS) as [ImageStyle, string][]

const PROMPT_EXAMPLES = [
  'Pizza margherita com molho de tomate fresco e mussarela',
  'Hambúrguer artesanal duplo com queijo cheddar e bacon crocante',
  'Açaí na tigela com granola, banana e mel',
  'Frango assado inteiro dourado com ervas e limão',
  'Bolo de chocolate com cobertura ganache e morangos',
  'Sushi variado em prato de madeira com shoyu e wasabi',
  'Combo de pizza e refrigerante em fundo vermelho vibrante',
  'Logotipo minimalista para restaurante italiano',
]

// ── Componente Principal ──────────────────────────────────────────────────

export function GeradorImagensClient() {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState<ImageStyle>('food')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [validationInfo, setValidationInfo] = useState<ValidationInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [credits, setCredits] = useState<CreditsData | null>(null)
  const [loadingCredits, setLoadingCredits] = useState(true)
  const [buyingPack, setBuyingPack] = useState<string | null>(null)
  const isSandbox = isPublicSandboxMode()

  const loadCredits = useCallback(async () => {
    try {
      const res = await fetch('/api/gerador-imagens/creditos')
      if (res.ok) {
        const data = (await res.json()) as CreditsData
        setCredits(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoadingCredits(false)
    }
  }, [])

  useEffect(() => {
    void loadCredits()
  }, [loadCredits])

  // Handle URL params for payment status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status')
    const pack = params.get('pack')
    if (status === 'sucesso' && pack) {
      void loadCredits()
      setError(null)
    }
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

    try {
      const res = await fetch('/api/gerador-imagens/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), style }),
      })

      const data = (await res.json()) as {
        success?: boolean
        imageUrl?: string
        error?: string
        code?: string
        message?: string
        validation?: ValidationInfo
      }

      if (!res.ok) {
        if (data.code === 'INSUFFICIENT_CREDITS') {
          setError(
            data.message ??
              'Você não tem créditos. Adquira um pacote para continuar gerando imagens.'
          )
        } else {
          setError(data.error ?? 'Erro ao gerar imagem. Tente novamente.')
        }
        return
      }

      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl)
        if (data.validation) setValidationInfo(data.validation)
        void loadCredits()
      }
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleBuyPack(pack: CreditPack) {
    if (!credits?.authenticated) {
      window.location.href = `/login?redirect=/gerador-imagens`
      return
    }

    setBuyingPack(pack.slug)
    try {
      const res = await fetch('/api/gerador-imagens/comprar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packSlug: pack.slug }),
      })

      const data = (await res.json()) as {
        success?: boolean
        checkoutUrl?: string
        sandboxCheckoutUrl?: string
        error?: string
      }

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Erro ao criar pagamento.')
        return
      }

      const url = isSandbox ? data.sandboxCheckoutUrl : data.checkoutUrl
      if (url) {
        window.location.href = url
      }
    } catch {
      setError('Erro ao processar compra. Tente novamente.')
    } finally {
      setBuyingPack(null)
    }
  }

  function handleDownload() {
    if (!generatedImage) return
    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `${BRAND_SHORT.toLowerCase()}-ia-${Date.now()}.jpg`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <main className="bg-background min-h-screen">
      {/* Header */}
      <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="text-foreground hover:text-primary flex items-center gap-2 text-lg font-bold transition-colors"
          >
            <span className="text-primary">{BRAND_SHORT}</span>
            <span className="text-muted-foreground hidden text-sm font-normal md:inline">
              / Gerador de Imagens IA
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {isSandbox && (
              <Badge variant="outline" className="border-yellow-500 text-yellow-600 text-xs">
                SANDBOX
              </Badge>
            )}
            {loadingCredits ? null : credits?.authenticated ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Zap className="h-3 w-3" />
                  {credits.credits_available} créditos
                </Badge>
                <Link href="/painel" className="text-muted-foreground text-sm hover:underline">
                  Painel
                </Link>
              </div>
            ) : (
              <Link
                href="/login?redirect=/gerador-imagens"
                className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
              >
                <LogIn className="h-4 w-4" />
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="from-primary/5 to-background bg-linear-to-b px-4 py-10 md:py-14">
        <div className="mx-auto max-w-4xl text-center">
          <div className="bg-primary/10 text-primary mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Powered by IA Generativa
          </div>
          <h1 className="text-foreground mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            Gere imagens profissionais
            <br />
            <span className="text-primary">em segundos com IA</span>
          </h1>
          <p className="text-muted-foreground mx-auto mb-6 max-w-2xl text-lg">
            Crie fotos de comidas, produtos, logos e conteúdo para redes sociais usando Inteligência
            Artificial. Perfeito para cardápios digitais, e-commerce e marketing.
          </p>
          <div className="text-muted-foreground flex flex-wrap justify-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Check className="text-primary h-4 w-4" />3 imagens grátis para testar
            </span>
            <span className="flex items-center gap-1">
              <Check className="text-primary h-4 w-4" />
              Sem cartão para começar
            </span>
            <span className="flex items-center gap-1">
              <Check className="text-primary h-4 w-4" />
              Resultado em &lt;10 segundos
            </span>
          </div>
        </div>
      </section>

      {/* Generator */}
      <section className="px-4 py-8">
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
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt input */}
            <div className="mb-4">
              <label className="text-foreground mb-2 block text-sm font-semibold">
                Descreva o que você quer gerar
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Pizza margherita com borda recheada, mussarela derretida e manjericão fresco..."
                className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary/30 w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
                rows={3}
                maxLength={500}
              />
              <div className="mt-1 flex items-center justify-between">
                <p className="text-muted-foreground text-xs">{prompt.length}/500 caracteres</p>
                <div className="flex gap-2">
                  {PROMPT_EXAMPLES.slice(0, 3).map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(ex)}
                      className="text-primary hover:underline text-xs"
                    >
                      {i === 0 ? 'Pizza' : i === 1 ? 'Hambúrguer' : 'Açaí'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error message */}
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
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Gerando e validando imagem...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Gerar Imagem
                  {!credits?.authenticated && (
                    <span className="ml-1 opacity-70">(gratuito)</span>
                  )}
                </>
              )}
            </Button>

            {/* Credits info */}
            {credits?.authenticated && (
              <p className="text-muted-foreground mt-2 text-center text-xs">
                Você tem <strong>{credits.credits_available} crédito(s)</strong> disponível(is).
                Cada geração consome 1 crédito.
              </p>
            )}
            {!credits?.authenticated && !loadingCredits && (
              <p className="text-muted-foreground mt-2 text-center text-xs">
                <Link href="/login?redirect=/gerador-imagens" className="text-primary hover:underline">
                  Faça login
                </Link>{' '}
                para salvar suas imagens e ganhar 3 créditos grátis.
              </p>
            )}
          </div>

          {/* Generated Image Result */}
          {generatedImage && (
            <div className="mt-6">
              <div className="bg-card border-border overflow-hidden rounded-2xl border shadow-sm">
                <div className="p-4 pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-foreground font-semibold">Imagem gerada ✨</h3>
                      <p className="text-muted-foreground text-sm">{prompt}</p>
                    </div>
                    {/* Validation score badge */}
                    {validationInfo && !validationInfo.skipped && (
                      <div
                        className={`shrink-0 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
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
                          <span className="ml-1 opacity-70">({validationInfo.attempts}ª tent.)</span>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Validation issues */}
                  {validationInfo && validationInfo.issues.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {validationInfo.issues.map((issue, i) => (
                        <span key={i} className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs text-yellow-700">
                          ⚠ {issue}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative mx-4 my-4 overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={generatedImage}
                    alt={prompt}
                    className="w-full rounded-xl object-cover"
                    style={{ maxHeight: '512px', objectFit: 'contain' }}
                  />
                </div>
                <div className="flex gap-2 p-4 pt-0">
                  <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                    <Download className="h-4 w-4" />
                    Baixar
                  </Button>
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
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedImage).catch(() => {})
                    }}
                    className="ml-auto gap-2"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Copiar URL
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Example prompts */}
          <div className="mt-6">
            <p className="text-muted-foreground mb-3 text-sm font-medium">
              💡 Exemplos de prompts para usar:
            </p>
            <div className="flex flex-wrap gap-2">
              {PROMPT_EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(ex)}
                  className="bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground rounded-full px-3 py-1 text-xs transition-colors"
                >
                  {ex.length > 45 ? ex.slice(0, 45) + '…' : ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Credit Packs */}
      <section className="bg-muted/30 px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <Badge variant="outline" className="mb-3">
              <ShoppingCart className="mr-1 h-3 w-3" />
              Pacotes de Créditos
            </Badge>
            <h2 className="text-foreground mb-2 text-2xl font-bold md:text-3xl">
              Crie imagens sem limites
            </h2>
            <p className="text-muted-foreground">
              Pague apenas o que usar. Sem mensalidade, sem contrato. Créditos não expiram.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.slug}
                className={`bg-card border-border relative rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
                  pack.popular ? 'border-primary ring-primary ring-2 ring-offset-2' : ''
                }`}
              >
                {pack.popular && (
                  <div className="bg-primary text-primary-foreground absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold">
                    ⭐ Mais popular
                  </div>
                )}
                <div className="mb-3">
                  <h3 className="text-foreground font-bold">{pack.name}</h3>
                  <p className="text-muted-foreground text-xs">{pack.description}</p>
                </div>
                <div className="mb-1">
                  <span className="text-foreground text-3xl font-bold">
                    R$ {pack.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="text-muted-foreground mb-4 text-sm">
                  <span className="text-primary font-semibold">{pack.credits} créditos</span>
                  {' — '}
                  R$ {pack.pricePerCredit.toFixed(2).replace('.', ',')}/imagem
                </div>
                <Button
                  onClick={() => handleBuyPack(pack)}
                  variant={pack.popular ? 'default' : 'outline'}
                  size="sm"
                  className="w-full"
                  disabled={buyingPack === pack.slug}
                >
                  {buyingPack === pack.slug ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <ChevronRight className="mr-1 h-4 w-4" />
                      Comprar {pack.name}
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>

          <div className="text-muted-foreground mt-6 text-center text-sm">
            <span className="flex items-center justify-center gap-1">
              <Check className="text-primary h-4 w-4" />
              Pagamento via PIX ou cartão de crédito pelo Mercado Pago
            </span>
            <span className="mt-1 flex items-center justify-center gap-1">
              <Check className="text-primary h-4 w-4" />
              Créditos adicionados automaticamente após pagamento
            </span>
          </div>
        </div>
      </section>

      {/* History (for authenticated users) */}
      {credits?.authenticated && credits.recent_generations && credits.recent_generations.length > 0 && (
        <section className="px-4 py-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex items-center gap-2">
              <History className="text-primary h-5 w-5" />
              <h2 className="text-foreground text-xl font-bold">Suas imagens recentes</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {credits.recent_generations.map((gen) => (
                <div
                  key={gen.id}
                  className="border-border group relative overflow-hidden rounded-xl border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={gen.image_url}
                    alt={gen.prompt}
                    className="aspect-square w-full object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="line-clamp-2 text-xs text-white">{gen.prompt}</p>
                    <a
                      href={gen.image_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 text-xs text-white/80 hover:text-white"
                    >
                      <Download className="h-3 w-3" />
                      Baixar
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="bg-muted/20 px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <h2 className="text-foreground mb-2 text-2xl font-bold">
              Por que usar o Gerador IA da {BRAND_SHORT}?
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
            {[
              {
                icon: <Zap className="text-primary h-6 w-6" />,
                title: 'Resultado imediato',
                desc: 'Gere imagens profissionais em menos de 10 segundos.',
              },
              {
                icon: <Star className="text-primary h-6 w-6" />,
                title: 'Qualidade validada',
                desc: 'IA analisa visualmente o resultado e refaz se vier com texto errado ou watermark.',
              },
              {
                icon: <Layers className="text-primary h-6 w-6" />,
                title: 'Geração em lote',
                desc: 'Gere até 877 imagens de uma vez para o seu catálogo completo.',
              },
              {
                icon: <Crown className="text-primary h-6 w-6" />,
                title: 'Integrado ao cardápio',
                desc: 'Use as imagens geradas diretamente nos seus produtos do cardápio digital.',
              },
            ].map((feature, i) => (
              <div key={i} className="bg-card border-border rounded-2xl border p-5">
                <div className="mb-3">{feature.icon}</div>
                <h3 className="text-foreground mb-1 font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners section */}
      <section className="border-border border-t px-4 py-12">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-muted-foreground mb-6 text-sm font-medium uppercase tracking-wide">
            Usado por
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {PARTNERS.map((partner) => (
              <Link
                key={partner.slug}
                href={`/gerador-imagens/p/${partner.slug}`}
                className="group flex flex-col items-center gap-2"
              >
                <div
                  className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-lg font-bold transition-all group-hover:shadow-md ${
                    partner.slug === 'blog-da-elisa'
                      ? 'border-rose-200 text-rose-500 group-hover:border-rose-400'
                      : 'border-primary/20 text-primary group-hover:border-primary/50'
                  }`}
                >
                  <span className="text-2xl">{partner.logoEmoji}</span>
                  <span>{partner.logoText}</span>
                </div>
                <p className="text-muted-foreground text-xs">{partner.targetAudience.split(',')[0]}</p>
                <span className="text-primary flex items-center gap-1 text-xs group-hover:underline">
                  Ver página exclusiva <ExternalLink className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
          <p className="text-muted-foreground mt-6 text-xs">
            Tem um blog ou negócio e quer co-branded page?{' '}
            <a href={`mailto:zairyx.ai@gmail.com?subject=Parceria Gerador IA`} className="text-primary hover:underline">
              Fale com a gente
            </a>
          </p>
        </div>
      </section>

      {/* Batch mode CTA */}
      {credits?.authenticated && (
        <section className="bg-primary/5 border-primary/10 border-t px-4 py-8">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center md:flex-row md:text-left">
            <div className="flex-1">
              <h3 className="text-foreground mb-1 font-bold">
                <Layers className="mr-2 inline h-5 w-5 text-primary" />
                Precisa gerar muitas imagens?
              </h3>
              <p className="text-muted-foreground text-sm">
                Use a geração em lote para criar até 877 imagens de uma vez — perfeito para
                montar o catálogo completo do seu cardápio digital.
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0">
              {credits.credits_available} créditos disponíveis
            </Badge>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="from-primary/10 to-background bg-linear-to-b px-4 py-12 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-foreground mb-4 text-2xl font-bold md:text-3xl">
            Pronto para criar imagens incríveis?
          </h2>
          <p className="text-muted-foreground mb-6">
            Comece agora com 3 imagens gratuitas. Sem cartão necessário.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {credits?.authenticated ? (
              <Button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                size="lg"
                className="gap-2"
              >
                <Sparkles className="h-5 w-5" />
                Gerar minha primeira imagem
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="gap-2">
                  <Link href="/cadastro">
                    <Sparkles className="h-5 w-5" />
                    Criar conta grátis
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login?redirect=/gerador-imagens">Já tenho conta</Link>
                </Button>
              </>
            )}
          </div>
          <p className="text-muted-foreground mt-4 text-xs">
            Ou explore o{' '}
            <Link href="/" className="text-primary hover:underline">
              Cardápio Digital
            </Link>{' '}
            — a plataforma completa para deliverys e restaurantes.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-border border-t px-4 py-6 text-center">
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} {BRAND_SHORT} — Gerador de Imagens IA.{' '}
          <Link href="/privacidade" className="hover:underline">
            Privacidade
          </Link>{' '}
          ·{' '}
          <Link href="/termos" className="hover:underline">
            Termos
          </Link>
        </p>
      </footer>
    </main>
  )
}
