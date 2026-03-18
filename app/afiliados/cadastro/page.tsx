import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AfiliadosCadastro() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login?redirect=/painel/afiliados')
  }

  redirect('/painel/afiliados')
}
