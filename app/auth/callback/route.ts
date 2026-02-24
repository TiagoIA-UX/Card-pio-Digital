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
      // Verificar se o usuário já tem restaurante
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        // Se não tem restaurante, redirecionar para criar
        if (!restaurant) {
          return NextResponse.redirect(`${origin}/painel/criar-restaurante`)
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Erro no OAuth - redirecionar para login
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
