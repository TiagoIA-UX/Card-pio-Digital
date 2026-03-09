import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/painel'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirecionar para a página solicitada (painel, meus-templates, etc)
      // NÃO forçar criar restaurante - isso é opcional
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Erro no OAuth - redirecionar para login
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
