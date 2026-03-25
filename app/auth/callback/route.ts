import { createClient } from '@/lib/supabase/server'
import { getRequestSiteUrl } from '@/lib/site-url'
import {
  getAuthFailureRedirect,
  getPostAuthSuccessRedirect,
  getSafeAuthRedirect,
  parseAuthCallbackFlowType,
  requiresPasswordSetup,
} from '@/lib/auth-access'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const flowType = parseAuthCallbackFlowType(searchParams.get('type'))
  const siteUrl = getRequestSiteUrl(request)
  const next = getSafeAuthRedirect(searchParams.get('next'))
  const supabase = await createClient()

  if (tokenHash && flowType) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: flowType,
    })

    if (error) {
      return NextResponse.redirect(new URL(getAuthFailureRedirect(flowType), siteUrl))
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(new URL(getAuthFailureRedirect(flowType), siteUrl))
    }
  } else {
    return NextResponse.redirect(new URL(getAuthFailureRedirect(flowType), siteUrl))
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const target = getPostAuthSuccessRedirect({
    next,
    flowType,
    requiresPasswordSetup: !!user && requiresPasswordSetup(user.user_metadata),
  })

  // Detect new signup (created within last 2 minutes)
  const targetUrl = new URL(target, siteUrl)
  if (user) {
    const ageMs = Date.now() - new Date(user.created_at).getTime()
    if (ageMs < 120_000) {
      const method = user.app_metadata?.provider === 'google' ? 'google' : 'magic_link'
      targetUrl.searchParams.set('event', 'signup')
      targetUrl.searchParams.set('method', method)
    }
  }

  return NextResponse.redirect(targetUrl)
}
