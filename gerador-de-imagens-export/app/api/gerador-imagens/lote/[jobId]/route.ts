import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calcBatchPercent } from '@/lib/ai-image-generator'
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const identifier = getRateLimitIdentifier(request)
  const rateLimit = await checkRateLimit(identifier, { limit: 60, windowMs: 60_000 })

  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Muitas requisições' }, { status: 429 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 })
  }

  const { jobId } = await params
  const admin = createAdminClient()

  const { data: job, error } = await admin
    .from('ai_image_batch_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', user.id) // garante que só o dono vê o job
    .single()

  if (error || !job) {
    return NextResponse.json({ error: 'Job não encontrado' }, { status: 404 })
  }

  const percent = calcBatchPercent(
    job.total as number,
    job.done as number,
    job.errors as number
  )

  return NextResponse.json(
    {
      jobId: job.id,
      status: job.status,
      total: job.total,
      done: job.done,
      errors: job.errors,
      pending: (job.total as number) - (job.done as number) - (job.errors as number),
      percent,
      creditsCharged: job.credits_charged,
      provider: job.provider,
      items: job.items,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    },
    { headers: rateLimit.headers }
  )
}

/** Cancela um job pendente ou em processamento */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 })
  }

  const { jobId } = await params
  const admin = createAdminClient()

  const { data: job } = await admin
    .from('ai_image_batch_jobs')
    .select('id, status')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single()

  if (!job) {
    return NextResponse.json({ error: 'Job não encontrado' }, { status: 404 })
  }

  if (job.status === 'completed' || job.status === 'cancelled') {
    return NextResponse.json({ error: `Job já está ${job.status}` }, { status: 400 })
  }

  await admin
    .from('ai_image_batch_jobs')
    .update({ status: 'cancelled' })
    .eq('id', jobId)

  return NextResponse.json({ success: true, jobId, status: 'cancelled' })
}
