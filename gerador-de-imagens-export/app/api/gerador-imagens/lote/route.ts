import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'
import {
  buildBatchItems,
  validateBatchInput,
  estimateBatchCost,
  generateWithValidation,
  type ImageProvider,
  type ImageStyle,
  type BatchItem,
} from '@/lib/ai-image-generator'

const BatchSchema = z.object({
  prompts: z
    .array(
      z.object({
        prompt: z.string().min(3).max(500),
        style: z
          .enum(['food', 'packshot', 'lifestyle', 'abstract', 'product', 'logo'])
          .optional()
          .default('food'),
      })
    )
    .min(1)
    .max(877),
  provider: z.enum(['pollinations', 'dalle', 'gemini']).optional().default('pollinations'),
  /** Se true, valida visualmente cada imagem gerada (usa GEMINI_API_KEY) */
  validate: z.boolean().optional().default(true),
  /** ID do parceiro para rastreamento de afiliado */
  partnerId: z.string().max(64).optional(),
})

export async function POST(request: NextRequest) {
  const identifier = getRateLimitIdentifier(request)
  const rateLimit = await checkRateLimit(identifier, { limit: 5, windowMs: 60_000 })

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Muitas requisições de lote. Aguarde um momento.' },
      { status: 429, headers: rateLimit.headers }
    )
  }

  // Auth obrigatória para lote (consome múltiplos créditos)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Faça login para usar a geração em lote', code: 'UNAUTHENTICATED' },
      { status: 401, headers: rateLimit.headers }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = BatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { prompts, provider, validate, partnerId } = parsed.data
  const admin = createAdminClient()

  // Garantir créditos inicializados
  const { data: creditsRow } = await admin
    .from('ai_image_credits')
    .select('credits_available')
    .eq('user_id', user.id)
    .single()

  if (!creditsRow) {
    await admin.rpc('give_free_ai_image_credits', { p_user_id: user.id })
  }

  const { data: credits } = await admin
    .from('ai_image_credits')
    .select('credits_available')
    .eq('user_id', user.id)
    .single()

  const available = credits?.credits_available ?? 0

  // Validar tamanho do lote e créditos disponíveis
  const validationError = validateBatchInput(prompts, available, provider as ImageProvider)
  if (validationError) {
    return NextResponse.json(
      { error: validationError, code: available < prompts.length ? 'INSUFFICIENT_CREDITS' : 'BATCH_TOO_LARGE' },
      { status: 400, headers: rateLimit.headers }
    )
  }

  const { estimatedSeconds } = estimateBatchCost(prompts.length, provider as ImageProvider)
  const items = buildBatchItems(prompts as { prompt: string; style?: ImageStyle }[])

  // Criar job no banco
  const { data: job, error: jobError } = await admin
    .from('ai_image_batch_jobs')
    .insert({
      user_id: user.id,
      status: 'pending',
      provider,
      total: prompts.length,
      done: 0,
      errors: 0,
      credits_charged: 0,
      items,
      metadata: { validate, partner_id: partnerId ?? null },
    })
    .select('id')
    .single()

  if (jobError || !job) {
    console.error('[lote] Erro ao criar job:', jobError)
    return NextResponse.json({ error: 'Erro ao criar job. Tente novamente.' }, { status: 500 })
  }

  const jobId = job.id as string

  // Para Pollinations, geração é instantânea (apenas monta URLs)
  // Processa de forma síncrona para dar resultado imediato
  if (provider === 'pollinations') {
    await processPollinationsBatchSync(admin, user.id, jobId, items, validate)
  } else {
    // Para DALL-E / Gemini: inicia processamento em background (não bloqueia)
    // Em produção, usar uma fila (Upstash, BullMQ, etc.)
    // Por agora, processa de forma assíncrona com captura de erro
    processApiBatchAsync(admin, user.id, jobId, items, provider as ImageProvider, validate).catch(
      (err: unknown) => {
        console.error('[lote] Erro no processamento assíncrono do job', {
          jobId,
          userId: user.id,
          provider,
          error: err instanceof Error ? err.message : String(err),
        })
        admin
          .from('ai_image_batch_jobs')
          .update({ status: 'failed' })
          .eq('id', jobId)
          .then(({ error: dbErr }) => {
            if (dbErr) {
              console.error('[lote] Falha ao marcar job como failed no banco', { jobId, dbErr })
            }
          })
      }
    )
  }

  return NextResponse.json(
    {
      success: true,
      jobId,
      total: prompts.length,
      estimatedSeconds,
      provider,
      pollUrl: `/api/gerador-imagens/lote/${jobId}`,
    },
    { status: 202, headers: rateLimit.headers }
  )
}

// ── Processamento Pollinations (síncrono — URLs imediatas) ────────────────

async function processPollinationsBatchSync(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  jobId: string,
  items: BatchItem[],
  validate: boolean
) {
  await admin
    .from('ai_image_batch_jobs')
    .update({ status: 'processing' })
    .eq('id', jobId)

  const updatedItems = [...items]
  let done = 0
  let errors = 0
  let creditsCharged = 0

  for (let i = 0; i < updatedItems.length; i++) {
    const item = updatedItems[i]

    try {
      const result = await generateWithValidation(
        { prompt: item.prompt, style: item.style, provider: 'pollinations' },
        validate ? 2 : 1
      )

      updatedItems[i] = {
        ...item,
        imageUrl: result.imageUrl,
        status: 'done',
        error: result.validationIssues.length > 0 ? result.validationIssues.join('; ') : undefined,
      }

      // Consumir crédito
      const { data: consumed } = await admin.rpc('consume_ai_image_credit', {
        p_user_id: userId,
        p_amount: 1,
      })
      if (consumed !== false) creditsCharged++

      done++
    } catch (e) {
      updatedItems[i] = {
        ...item,
        status: 'error',
        error: e instanceof Error ? e.message : 'Erro desconhecido',
      }
      errors++
    }

    // Salvar progresso a cada 10 itens ou no final
    if ((i + 1) % 10 === 0 || i === updatedItems.length - 1) {
      await admin
        .from('ai_image_batch_jobs')
        .update({
          items: updatedItems,
          done,
          errors,
          credits_charged: creditsCharged,
        })
        .eq('id', jobId)
    }
  }

  // Marcar como concluído
  await admin
    .from('ai_image_batch_jobs')
    .update({
      status: errors === updatedItems.length ? 'failed' : 'completed',
      items: updatedItems,
      done,
      errors,
      credits_charged: creditsCharged,
    })
    .eq('id', jobId)

  // Salvar cada geração no histórico
  const toInsert = updatedItems
    .filter((item) => item.status === 'done' && item.imageUrl)
    .map((item) => ({
      user_id: userId,
      prompt: item.prompt,
      style: item.style,
      image_url: item.imageUrl!,
      provider: 'pollinations',
      width: 800,
      height: 800,
      credits_charged: 1,
      metadata: { batch_job_id: jobId, item_index: item.index },
    }))

  if (toInsert.length > 0) {
    await admin.from('ai_image_generations').insert(toInsert)
  }
}

// ── Processamento DALL-E / Gemini (assíncrono) ────────────────────────────

async function processApiBatchAsync(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  jobId: string,
  items: BatchItem[],
  provider: ImageProvider,
  validate: boolean
) {
  // Mesma lógica do Pollinations, mas com rate limiting entre chamadas
  const DELAY_MS = provider === 'dalle' ? 15_000 : 2_000

  await admin
    .from('ai_image_batch_jobs')
    .update({ status: 'processing' })
    .eq('id', jobId)

  const updatedItems = [...items]
  let done = 0
  let errors = 0
  let creditsCharged = 0

  for (let i = 0; i < updatedItems.length; i++) {
    const item = updatedItems[i]

    try {
      const result = await generateWithValidation(
        { prompt: item.prompt, style: item.style, provider },
        validate ? 2 : 1
      )

      updatedItems[i] = { ...item, imageUrl: result.imageUrl, status: 'done' }

      const { data: consumed } = await admin.rpc('consume_ai_image_credit', {
        p_user_id: userId,
        p_amount: 1,
      })
      if (consumed !== false) creditsCharged++

      done++
    } catch (e) {
      updatedItems[i] = {
        ...item,
        status: 'error',
        error: e instanceof Error ? e.message : 'Erro',
      }
      errors++
    }

    // Checkpoint a cada 5 itens
    if ((i + 1) % 5 === 0 || i === updatedItems.length - 1) {
      await admin
        .from('ai_image_batch_jobs')
        .update({ items: updatedItems, done, errors, credits_charged: creditsCharged })
        .eq('id', jobId)
    }

    // Rate limiting entre chamadas de API
    if (i < updatedItems.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS))
    }
  }

  await admin
    .from('ai_image_batch_jobs')
    .update({
      status: errors === updatedItems.length ? 'failed' : 'completed',
      items: updatedItems,
      done,
      errors,
      credits_charged: creditsCharged,
    })
    .eq('id', jobId)
}
