/**
 * Gerador de Imagens IA — Módulo Core
 *
 * Providers suportados:
 *   - Pollinations.ai (gratuito, sem API key)
 *   - DALL-E 3 via OpenAI (pago, ~$0.04/imagem)
 *   - Gemini Imagen 3 via Google (pago, ~$0.04/imagem)
 *
 * Estratégia de routing:
 *   - Usuários free → Pollinations.ai (gratuito)
 *   - Usuários com pacote pago → Pollinations.ai (melhor relação custo-benefício)
 *   - Usuários premium → DALL-E 3 ou Gemini (maior qualidade)
 *
 * Geração em Lote (Batch):
 *   - Aceita lista de prompts (até MAX_BATCH_SIZE itens por job)
 *   - Processa com pool de concorrência configurável
 *   - Registra progresso incremental no banco (checkpoint/resume)
 *   - Compatível com os scripts existentes: generate-images-gemini.js,
 *     generate-images-dalle.js, generate-images-pollinations.js
 */

export type ImageProvider = 'pollinations' | 'dalle' | 'gemini'
export type ImageStyle =
  | 'food'
  | 'packshot'
  | 'lifestyle'
  | 'abstract'
  | 'product'
  | 'logo'

export type BatchJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface GenerateImageInput {
  prompt: string
  style?: ImageStyle
  width?: number
  height?: number
  provider?: ImageProvider
}

export interface GenerateImageResult {
  imageUrl: string
  provider: ImageProvider
  width: number
  height: number
  translatedPrompt?: string
}

// ── Batch types ───────────────────────────────────────────────────────────

/** Um item individual dentro de um job em lote */
export interface BatchItem {
  /** Índice na lista original (0-based) */
  index: number
  prompt: string
  style: ImageStyle
  /** Preenchido quando processado com sucesso */
  imageUrl?: string
  /** Preenchido quando falha */
  error?: string
  /** 'pending' | 'done' | 'error' */
  status: 'pending' | 'done' | 'error'
}

/** Resumo de progresso de um job em lote */
export interface BatchProgress {
  jobId: string
  status: BatchJobStatus
  total: number
  done: number
  errors: number
  pending: number
  /** Porcentagem 0–100 */
  percent: number
  items: BatchItem[]
  createdAt: string
  updatedAt: string
  creditsCharged: number
}

// ── Limites do sistema ────────────────────────────────────────────────────

/** Máximo de itens por job de lote por request */
export const MAX_BATCH_SIZE = 50
/** Máximo de requisições simultâneas por job */
export const MAX_BATCH_CONCURRENCY = 5
/** Delay mínimo entre requisições (ms) — evita rate-limit do provider */
export const BATCH_ITEM_DELAY_MS = 500

// ── Style presets ─────────────────────────────────────────────────────────

export const STYLE_PRESETS: Record<ImageStyle, string> = {
  food: 'restaurant menu photography, appetizing, realistic plating, commercial food styling, high resolution, vivid colors, soft natural lighting, no text, no watermark, no people',
  packshot:
    'isolated product packshot, centered composition, clean white studio background, soft shadow, realistic packaging, e-commerce photography, commercial lighting, high resolution, no text overlay, no watermark',
  lifestyle:
    'lifestyle photography, modern setting, natural light, editorial style, high resolution, professional photography, no text, no watermark',
  abstract:
    'abstract digital art, vibrant colors, geometric shapes, modern design, high resolution, no text, no watermark',
  product:
    'professional product photography, clean background, commercial studio lighting, sharp focus, high resolution, e-commerce ready, no text, no watermark',
  logo: 'clean modern logo design, vector style, minimal, professional branding, white background, no gradients, scalable',
}

export const STYLE_LABELS: Record<ImageStyle, string> = {
  food: '🍕 Comida / Cardápio',
  packshot: '📦 Produto em Fundo Branco',
  lifestyle: '✨ Lifestyle / Ambiente',
  abstract: '🎨 Arte Abstrata',
  product: '🛒 Produto E-commerce',
  logo: '🏷️ Logo / Marca',
}

// ── Pure helpers (testáveis sem network) ─────────────────────────────────

/**
 * Monta o prompt completo adicionando o preset de estilo ao final.
 * Função pura — usada tanto pelo gerador individual quanto pelo batch.
 */
export function buildFullPrompt(prompt: string, style: ImageStyle = 'food'): string {
  return `${prompt}, ${STYLE_PRESETS[style]}`
}

/**
 * Gera a URL do Pollinations.ai para um prompt.
 * Exportado para ser testado diretamente.
 */
export function buildPollinationsUrl(
  prompt: string,
  width = 1024,
  height = 1024,
  seed?: number
): string {
  const encoded = encodeURIComponent(prompt)
  const s = seed ?? Math.floor(Math.random() * 999999)
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${s}&nologo=true&enhance=true`
}

/**
 * Estima o custo em créditos e tempo de um batch.
 * Um crédito = uma imagem. Retorna também estimativa de duração em segundos
 * baseada no provider escolhido.
 */
export function estimateBatchCost(
  itemCount: number,
  provider: ImageProvider = 'pollinations',
  concurrency = 1
): { credits: number; estimatedSeconds: number } {
  const credits = itemCount
  // Pollinations: ~2s/img; DALL-E: ~15s/img (rate 4/min); Gemini: ~5s/img
  const secsPerItem: Record<ImageProvider, number> = {
    pollinations: 2,
    dalle: 15,
    gemini: 5,
  }
  const spi = secsPerItem[provider]
  const estimatedSeconds = Math.ceil((itemCount * spi) / Math.max(1, concurrency))
  return { credits, estimatedSeconds }
}

/**
 * Inicializa a lista de BatchItems a partir de prompts brutos.
 * Função pura — não faz chamadas de rede.
 */
export function buildBatchItems(
  prompts: { prompt: string; style?: ImageStyle }[]
): BatchItem[] {
  return prompts.map((p, index) => ({
    index,
    prompt: p.prompt,
    style: p.style ?? 'food',
    status: 'pending',
  }))
}

/**
 * Calcula o percentual de progresso de um batch.
 * Função pura.
 */
export function calcBatchPercent(total: number, done: number, errors: number): number {
  if (total === 0) return 0
  return Math.round(((done + errors) / total) * 100)
}

/**
 * Valida se um batch é aceitável.
 * Retorna null se OK, ou string de erro se inválido.
 */
export function validateBatchInput(
  prompts: unknown[],
  userCredits: number
): string | null {
  if (!Array.isArray(prompts) || prompts.length === 0) {
    return 'A lista de prompts não pode estar vazia.'
  }
  if (prompts.length > MAX_BATCH_SIZE) {
    return `Máximo de ${MAX_BATCH_SIZE} imagens por lote. Envie ${prompts.length - MAX_BATCH_SIZE} a menos.`
  }
  if (userCredits < prompts.length) {
    return `Créditos insuficientes: você tem ${userCredits} crédito(s) mas o lote requer ${prompts.length}.`
  }
  return null
}

// ── Pollinations.ai (free, no API key) ───────────────────────────────────

async function generateWithPollinations(input: GenerateImageInput): Promise<GenerateImageResult> {
  const style = input.style ?? 'food'
  const fullPrompt = buildFullPrompt(input.prompt, style)
  const width = input.width ?? 1024
  const height = input.height ?? 1024
  const imageUrl = buildPollinationsUrl(fullPrompt, width, height)

  return {
    imageUrl,
    provider: 'pollinations',
    width,
    height,
    translatedPrompt: fullPrompt,
  }
}

// ── DALL-E 3 (OpenAI) ─────────────────────────────────────────────────────

async function generateWithDalle(input: GenerateImageInput): Promise<GenerateImageResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurada')

  const style = input.style ?? 'food'
  const fullPrompt = buildFullPrompt(input.prompt, style)

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: fullPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error((error as { error?: { message?: string } }).error?.message ?? 'Erro DALL-E API')
  }

  const data = (await response.json()) as { data: { url: string }[] }
  const imageUrl = data.data[0]?.url
  if (!imageUrl) throw new Error('DALL-E não retornou URL de imagem')

  return {
    imageUrl,
    provider: 'dalle',
    width: 1024,
    height: 1024,
    translatedPrompt: fullPrompt,
  }
}

// ── Gemini Imagen 3 ───────────────────────────────────────────────────────

async function generateWithGemini(input: GenerateImageInput): Promise<GenerateImageResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada')

  const style = input.style ?? 'food'
  const fullPrompt = buildFullPrompt(input.prompt, style)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: fullPrompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '1:1',
          safetyFilterLevel: 'BLOCK_ONLY_HIGH',
          personGeneration: 'DONT_ALLOW',
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      (error as { error?: { message?: string } }).error?.message ?? 'Erro Gemini API'
    )
  }

  const data = (await response.json()) as {
    predictions?: { bytesBase64Encoded?: string; mimeType?: string }[]
  }
  const prediction = data.predictions?.[0]
  if (!prediction?.bytesBase64Encoded) throw new Error('Gemini não retornou imagem')

  const mimeType = prediction.mimeType ?? 'image/png'
  const imageUrl = `data:${mimeType};base64,${prediction.bytesBase64Encoded}`

  return {
    imageUrl,
    provider: 'gemini',
    width: 1024,
    height: 1024,
    translatedPrompt: fullPrompt,
  }
}

// ── Router principal ──────────────────────────────────────────────────────

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageResult> {
  const provider = input.provider ?? 'pollinations'

  switch (provider) {
    case 'dalle':
      return generateWithDalle(input)
    case 'gemini':
      return generateWithGemini(input)
    case 'pollinations':
    default:
      return generateWithPollinations(input)
  }
}

// ── Pacotes de créditos ───────────────────────────────────────────────────

export interface CreditPack {
  slug: string
  name: string
  credits: number
  price: number
  pricePerCredit: number
  popular?: boolean
  description: string
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    slug: 'starter',
    name: 'Starter',
    credits: 10,
    price: 9.9,
    pricePerCredit: 0.99,
    description: 'Ideal para testar e criar primeiras imagens',
  },
  {
    slug: 'basic',
    name: 'Básico',
    credits: 50,
    price: 29.9,
    pricePerCredit: 0.6,
    description: 'Para criadores de conteúdo iniciantes',
  },
  {
    slug: 'pro',
    name: 'Profissional',
    credits: 150,
    price: 69.9,
    pricePerCredit: 0.47,
    popular: true,
    description: 'Mais popular — para negócios e agências',
  },
  {
    slug: 'unlimited',
    name: 'Ilimitado',
    credits: 500,
    price: 149.9,
    pricePerCredit: 0.3,
    description: 'Para uso intensivo e equipes',
  },
]

export const FREE_CREDITS = 3

export function getCreditPack(slug: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.slug === slug)
}
