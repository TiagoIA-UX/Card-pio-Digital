import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const identifier = getRateLimitIdentifier(request)
  const rateLimit = await checkRateLimit(identifier, { limit: 30, windowMs: 60_000 })

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Muitas requisições' },
      { status: 429, headers: rateLimit.headers }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      {
        authenticated: false,
        credits_available: 0,
        credits_used: 0,
        free_credits_given: false,
      },
      { headers: rateLimit.headers }
    )
  }

  const admin = createAdminClient()

  // Buscar ou criar registro de créditos
  let { data: credits } = await admin
    .from('ai_image_credits')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!credits) {
    // Primeiro acesso: dar créditos gratuitos via função RPC segura
    await admin.rpc('give_free_ai_image_credits', { p_user_id: user.id })

    const { data: newCredits } = await admin
      .from('ai_image_credits')
      .select('*')
      .eq('user_id', user.id)
      .single()

    credits = newCredits
  }

  // Buscar histórico recente de gerações
  const { data: recentGenerations } = await admin
    .from('ai_image_generations')
    .select('id, prompt, style, image_url, provider, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json(
    {
      authenticated: true,
      credits_available: credits?.credits_available ?? 0,
      credits_used: credits?.credits_used ?? 0,
      free_credits_given: credits?.free_credits_given ?? false,
      recent_generations: recentGenerations ?? [],
    },
    { headers: rateLimit.headers }
  )
}
