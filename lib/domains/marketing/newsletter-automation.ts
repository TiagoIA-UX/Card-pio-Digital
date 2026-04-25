import crypto from 'node:crypto'

export interface NewsletterContact {
  id: string
  email: string
  name: string | null
  tags: string[] | null
  unsubscribed_at: string | null
}

export interface NewsletterDraft {
  title: string
  subject: string
  bodyText: string
  bodyHtml: string
}

const DEFAULT_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zairyx.com.br'

export function getIsoWeekKey(date = new Date()): string {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayNum = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export function buildWeeklyNewsletterDraft(
  weekKey: string,
  focus = 'crescimento previsivel'
): NewsletterDraft {
  const title = `Newsletter Semanal ${weekKey}`
  const subject = `Plano de 7 dias para ${focus}`
  const bodyText = [
    'Ola! Aqui e a Zairyx.',
    '',
    `Semana ${weekKey}: selecionamos um plano pratico de 7 dias para ${focus}.`,
    '1) Revise seu cardapio com foco nos itens com melhor margem.',
    '2) Ative uma oferta simples e transparente para recompra.',
    '3) Publique um conteudo curto no canal principal da sua operacao.',
    '4) Monitore pedidos e ajuste o que ficou abaixo da meta.',
    '',
    'Se quiser, responda este email com sua cidade e nicho para receber uma sugestao personalizada.',
    '',
    'Equipe Zairyx',
  ].join('\n')

  const bodyHtml = `
  <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111827;">
    <h1 style="font-size:22px;line-height:1.3;margin:0 0 12px;">Plano de 7 dias para ${escapeHtml(focus)}</h1>
    <p style="margin:0 0 12px;">Semana <strong>${escapeHtml(weekKey)}</strong>: roteiro pratico para execucao sem complicacao.</p>
    <ol style="padding-left:20px;line-height:1.7;">
      <li>Revise o cardapio com foco em margem.</li>
      <li>Ative uma oferta simples e transparente para recompra.</li>
      <li>Publique um conteudo curto no canal principal.</li>
      <li>Monitore pedidos e ajuste o que ficou abaixo da meta.</li>
    </ol>
    <p style="margin-top:16px;">Responda este email com sua cidade e nicho para receber uma sugestao personalizada.</p>
    <p style="font-size:12px;color:#6b7280;margin-top:20px;">Voce esta recebendo este email porque autorizou comunicacoes da Zairyx.</p>
  </div>`

  return { title, subject, bodyText, bodyHtml }
}

export function personalizeNewsletter(
  draft: NewsletterDraft,
  contact: Pick<NewsletterContact, 'name' | 'email'>,
  unsubscribeToken: string
): NewsletterDraft {
  const firstName = getFirstName(contact.name)
  const greeting = firstName ? `Ola, ${firstName}!` : 'Ola!'
  const unsubscribeUrl = `${DEFAULT_SITE_URL}/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`

  return {
    ...draft,
    bodyText: `${greeting}\n\n${draft.bodyText}\n\nCancelar inscricao: ${unsubscribeUrl}`,
    bodyHtml: `${draft.bodyHtml}<p style="font-size:12px;color:#6b7280;margin-top:16px;">Nao quer mais receber? <a href="${unsubscribeUrl}">Cancelar inscricao</a></p>`,
  }
}

export function buildUnsubscribeToken(email: string): string {
  const secret = process.env.INTERNAL_API_SECRET || process.env.CRON_SECRET || ''
  if (!secret) {
    throw new Error('INTERNAL_API_SECRET ou CRON_SECRET nao configurado para unsubscribe token')
  }

  const normalized = email.trim().toLowerCase()
  const payload = Buffer.from(normalized).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function parseUnsubscribeToken(token: string): string | null {
  const secret = process.env.INTERNAL_API_SECRET || process.env.CRON_SECRET || ''
  if (!secret) return null

  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  if (!timingSafeEqual(signature, expected)) return null

  try {
    const email = Buffer.from(payload, 'base64url').toString('utf8').trim().toLowerCase()
    if (!email.includes('@')) return null
    return email
  } catch {
    return null
  }
}

export async function sendEmailWithResend(input: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<{ ok: true; messageId?: string } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY nao configurada' }
  }

  const fromDomain = process.env.RESEND_FROM_DOMAIN ?? 'zairyx.com.br'

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Zairyx Newsletter <newsletter@${fromDomain}>`,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      return { ok: false, error: `Resend error ${response.status}: ${body}` }
    }

    const payload = (await response.json()) as { id?: string }
    return { ok: true, messageId: payload.id }
  } catch (error) {
    return { ok: false, error: (error as Error).message }
  }
}

function getFirstName(name: string | null): string {
  if (!name) return ''
  return name.trim().split(' ')[0] ?? ''
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

