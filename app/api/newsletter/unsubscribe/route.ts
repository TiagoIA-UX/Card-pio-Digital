import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import { parseUnsubscribeToken } from '@/lib/domains/marketing/newsletter-automation'

function htmlResponse(message: string, status = 200) {
  return new NextResponse(
    `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Newsletter Zairyx</title>
  </head>
  <body style="font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;padding:24px;">
    <main style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
      <h1 style="margin-top:0;">Newsletter Zairyx</h1>
      <p>${message}</p>
    </main>
  </body>
</html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''
  const email = parseUnsubscribeToken(token)

  if (!email) {
    return htmlResponse('Token invalido ou expirado para cancelar inscricao.', 400)
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('marketing_contacts')
    .update({ unsubscribed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('email', email)

  if (error) {
    return htmlResponse('Nao foi possivel processar seu cancelamento agora. Tente novamente.', 500)
  }

  return htmlResponse('Inscricao cancelada com sucesso. Voce nao recebera novas campanhas.')
}

