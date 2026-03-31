/**
 * Validador de Imagens IA — Análise Visual com Gemini Vision
 *
 * Após gerar uma imagem, este módulo analisa o resultado visualmente
 * (não apenas o código) para detectar problemas comuns:
 *
 *   ❌ Texto incorreto / watermarks indesejados
 *   ❌ Conteúdo que não corresponde ao prompt
 *   ❌ Imagem distorcida, borrada ou de baixa qualidade
 *   ❌ Conteúdo inapropriado
 *   ❌ Pessoas visíveis (indesejável em imagens de produto)
 *
 * Usa Gemini 1.5 Flash (vision) — gratuito no tier básico.
 * Se GEMINI_API_KEY não estiver configurada, retorna validação "bypass" (confiança zero).
 */

export interface ImageValidationResult {
  /** true = imagem aprovada, false = rejeitada */
  valid: boolean
  /** Pontuação 0–100 (100 = perfeita) */
  score: number
  /** Lista de problemas encontrados (vazia se nenhum) */
  issues: string[]
  /** Sugestão de ajuste no prompt para nova tentativa */
  suggestion?: string
  /** true = validação foi pulada (sem API key configurada) */
  skipped: boolean
}

export interface ValidationContext {
  prompt: string
  style: string
  provider: string
}

// ── Prompt de análise estruturada ─────────────────────────────────────────

function buildAnalysisPrompt(ctx: ValidationContext): string {
  return `Você é um inspetor de qualidade de imagens geradas por IA para uso comercial em cardápios digitais e e-commerce.

Analise esta imagem e responda SOMENTE com um JSON válido, sem markdown, seguindo exatamente o schema abaixo:

{
  "score": <número 0-100, onde 100 é perfeito>,
  "matches_prompt": <true|false — a imagem representa bem o assunto?>,
  "has_unwanted_text": <true|false — há texto, letras ou watermark visível?>,
  "has_visible_people": <true|false — há pessoas visíveis?>,
  "is_blurry_or_distorted": <true|false — está borrada ou distorcida?>,
  "issues": [<lista de string com problemas encontrados, em português>],
  "suggestion": "<sugestão de ajuste no prompt para melhorar, em português, ou null se ok>"
}

Contexto da geração:
- Prompt usado: "${ctx.prompt}"
- Estilo esperado: ${ctx.style}
- Provider: ${ctx.provider}

Critérios:
- score >= 70: aprovada para uso
- score 40-69: aceitável mas com ressalvas
- score < 40: rejeitada, deve ser regerada
- Texto visível na imagem (logos de provider, watermarks, letras aleatórias) = grande penalidade
- Conteúdo totalmente diferente do prompt = rejeição automática`
}

// ── Analisar via Gemini Vision ────────────────────────────────────────────

async function analyzeWithGemini(
  imageUrl: string,
  ctx: ValidationContext
): Promise<ImageValidationResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { valid: true, score: 0, issues: [], skipped: true }
  }

  const analysisPrompt = buildAnalysisPrompt(ctx)

  // Gemini Vision: para URLs HTTP externas (Pollinations, etc.), buscamos
  // a imagem como buffer e enviamos como inlineData (base64).
  // fileUri/fileData apenas aceita URIs gs:// do Google Cloud Storage.
  let imageBase64: string | null = null
  let imageMime = 'image/jpeg'
  try {
    const imgResponse = await fetch(imageUrl, { signal: AbortSignal.timeout(10_000) })
    if (imgResponse.ok) {
      const contentType = imgResponse.headers.get('content-type') ?? 'image/jpeg'
      imageMime = contentType.split(';')[0].trim() || 'image/jpeg'
      const buffer = await imgResponse.arrayBuffer()
      imageBase64 = Buffer.from(buffer).toString('base64')
    }
  } catch {
    // Se não conseguir baixar a imagem, faz bypass
    console.warn('[ai-image-validator] Não foi possível buscar imagem para análise, bypass:', imageUrl)
    return { valid: true, score: 0, issues: [], skipped: true }
  }

  if (!imageBase64) {
    return { valid: true, score: 0, issues: [], skipped: true }
  }

  const requestBody = {
    contents: [
      {
        parts: [
          { text: analysisPrompt },
          {
            // inlineData aceita qualquer URL — imagem codificada em base64
            inlineData: {
              mimeType: imageMime,
              data: imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 512,
    },
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15_000),
    }
  )

  if (!response.ok) {
    // Falha na análise → bypass (não bloqueia a geração)
    console.warn('[ai-image-validator] Gemini Vision falhou, bypass:', response.status)
    return { valid: true, score: 0, issues: [], skipped: true }
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  return parseAnalysisResponse(rawText)
}

// ── Parser da resposta JSON do Gemini ─────────────────────────────────────

export function parseAnalysisResponse(rawText: string): ImageValidationResult {
  // Extrai o JSON da resposta (ignora markdown se houver)
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return { valid: true, score: 0, issues: ['Resposta de análise inválida'], skipped: true }
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>
  } catch {
    return { valid: true, score: 0, issues: ['JSON de análise inválido'], skipped: true }
  }

  const score = typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 50
  const issues: string[] = Array.isArray(parsed.issues)
    ? (parsed.issues as unknown[]).filter((i): i is string => typeof i === 'string')
    : []

  // Adiciona problemas específicos como issues descritivos
  if (parsed.has_unwanted_text === true) {
    if (!issues.some((i) => i.toLowerCase().includes('texto'))) {
      issues.unshift('Texto ou watermark indesejado visível na imagem')
    }
  }
  if (parsed.matches_prompt === false) {
    if (!issues.some((i) => i.toLowerCase().includes('prompt') || i.toLowerCase().includes('conteúdo'))) {
      issues.unshift('Conteúdo da imagem não corresponde ao prompt')
    }
  }
  if (parsed.is_blurry_or_distorted === true) {
    if (!issues.some((i) => i.toLowerCase().includes('borrad') || i.toLowerCase().includes('distorcid'))) {
      issues.push('Imagem borrada ou distorcida')
    }
  }
  if (parsed.has_visible_people === true) {
    if (!issues.some((i) => i.toLowerCase().includes('pessoa'))) {
      issues.push('Pessoas visíveis (indesejável para produto)')
    }
  }

  const suggestion =
    typeof parsed.suggestion === 'string' && parsed.suggestion !== 'null'
      ? parsed.suggestion
      : undefined

  return {
    valid: score >= 40,
    score,
    issues,
    suggestion,
    skipped: false,
  }
}

// ── Interface pública ─────────────────────────────────────────────────────

/**
 * Analisa visualmente uma imagem gerada e retorna um relatório de qualidade.
 * Se não houver GEMINI_API_KEY configurada, retorna bypass sem bloquear.
 *
 * @param imageUrl - URL pública da imagem (Pollinations, DALL-E, etc.)
 * @param ctx - contexto do prompt e estilo usados na geração
 */
export async function validateImageContent(
  imageUrl: string,
  ctx: ValidationContext
): Promise<ImageValidationResult> {
  // Imagens base64 (Gemini Imagen) não precisam de validação adicional via Vision
  // (já passam pelo filtro de segurança do próprio Gemini durante a geração)
  if (imageUrl.startsWith('data:')) {
    return { valid: true, score: 85, issues: [], skipped: true }
  }

  try {
    return await analyzeWithGemini(imageUrl, ctx)
  } catch (error) {
    // Em caso de erro na análise, não bloqueia a geração
    console.warn('[ai-image-validator] Erro na análise, bypass:', error)
    return { valid: true, score: 0, issues: [], skipped: true }
  }
}

/**
 * Determina se um resultado de validação justifica uma nova tentativa.
 * Retorna true apenas para falhas recuperáveis (não por conteúdo proibido).
 */
export function shouldRetryGeneration(result: ImageValidationResult): boolean {
  if (result.skipped) return false
  if (!result.valid) return true
  // Retry se score baixo mas não por razão de conteúdo inadequado
  if (result.score < 40) return true
  // Retry se tem texto/watermark indesejado (problema do provider, não do prompt)
  if (result.issues.some((i) => i.toLowerCase().includes('texto') || i.toLowerCase().includes('watermark'))) {
    return true
  }
  return false
}
