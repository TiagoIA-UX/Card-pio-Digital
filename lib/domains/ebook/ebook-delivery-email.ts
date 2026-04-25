/**
 * Entrega do e-book por e-mail via Resend.
 *
 * Chamado pelo webhook do MercadoPago quando external_reference começa com
 * "ebook_gmb:" e o status do pagamento é approved / accredited.
 *
 * A idempotência é garantida pelo próprio sistema de webhookEvents — este
 * módulo não precisa controlar duplicatas.
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'

const EBOOK_PDF_PATH = path.join(
  process.cwd(),
  'private',
  'ebooks',
  'google-meu-negocio-guia-completo.pdf'
)
const EBOOK_FILENAME = 'Google-Meu-Negocio-Guia-Completo-Zairyx.pdf'
const EBOOK_TITLE = 'E-book: Google Meu Negócio — Guia Completo'

export interface SendEbookDeliveryEmailInput {
  /** E-mail do comprador — extraído de external_reference (ebook_gmb:EMAIL) */
  email: string
  /** Nome do pagador, extraído de payment.payer.first_name / payer.name */
  payerName?: string | null
  /** ID do pagamento MercadoPago — usado no link de download de fallback */
  paymentId: string | number
  /** URL base do site (ex: https://zairyx.com.br) */
  siteUrl?: string
}

export type SendEbookDeliveryEmailResult =
  | { ok: true; messageId?: string }
  | { ok: false; error: string }

/**
 * Envia o e-book em PDF como anexo de e-mail ao comprador.
 * Também inclui link de fallback para download via payment_id.
 */
export async function sendEbookDeliveryEmail(
  input: SendEbookDeliveryEmailInput
): Promise<SendEbookDeliveryEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY não configurada' }
  }

  const fromDomain = process.env.RESEND_FROM_DOMAIN ?? 'zairyx.com.br'
  const siteUrl = input.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zairyx.com.br'

  const firstName = input.payerName?.trim().split(' ')[0] ?? null
  const greeting = firstName ? `Olá, ${firstName}!` : 'Olá!'
  const downloadUrl = `${siteUrl}/api/ebook-gmb/download?payment_id=${encodeURIComponent(String(input.paymentId))}`

  let pdfBase64: string
  try {
    const pdfBuffer = await readFile(EBOOK_PDF_PATH)
    pdfBase64 = pdfBuffer.toString('base64')
  } catch (err) {
    return { ok: false, error: `Falha ao ler PDF do e-book: ${(err as Error).message}` }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Zairyx <contato@${fromDomain}>`,
        to: [input.email],
        subject: `📖 ${EBOOK_TITLE} — Seu download chegou!`,
        html: buildEmailHtml({ greeting, downloadUrl, siteUrl }),
        text: buildEmailText({ greeting, downloadUrl }),
        attachments: [
          {
            filename: EBOOK_FILENAME,
            content: pdfBase64,
          },
        ],
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      return { ok: false, error: `Resend error ${response.status}: ${body}` }
    }

    const payload = (await response.json()) as { id?: string }
    return { ok: true, messageId: payload.id }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ── Templates de e-mail ───────────────────────────────────────────────────────

function buildEmailHtml(params: {
  greeting: string
  downloadUrl: string
  siteUrl: string
}): string {
  const { greeting, downloadUrl, siteUrl } = params
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${EBOOK_TITLE}</title>
</head>
<body style="margin:0; padding:0; background:#f4f4f5; font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5; padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4338ca 0%,#6366f1 100%); padding:32px 40px; text-align:center;">
              <p style="margin:0 0 8px; font-size:12px; font-weight:700; letter-spacing:0.15em; color:rgba(255,255,255,0.75); text-transform:uppercase;">Zairyx Canais Digitais</p>
              <h1 style="margin:0; font-size:24px; font-weight:800; color:#ffffff; line-height:1.3;">
                📖 Google Meu Negócio<br/>Guia Completo
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 16px; font-size:18px; font-weight:700; color:#1a1a2e;">${greeting}</p>
              <p style="margin:0 0 16px; font-size:15px; line-height:1.65; color:#374151;">
                Seu pagamento foi confirmado! O <strong>e-book completo em PDF</strong> está
                anexado a este e-mail — é só abrir o arquivo <code style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:13px;">${EBOOK_FILENAME}</code>
                na sua caixa de entrada.
              </p>

              <!-- Destaque de conteúdo -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#ede9fe; border-radius:12px; margin:24px 0;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 12px; font-size:13px; font-weight:700; letter-spacing:0.1em; color:#6d28d9; text-transform:uppercase;">O que você vai aprender</p>
                    <ul style="margin:0; padding:0 0 0 20px; color:#374151; font-size:14px; line-height:1.8;">
                      <li>Como aparecer no topo do Google Maps</li>
                      <li>Configuração passo a passo do perfil GMB</li>
                      <li>Como responder avaliações e criar engajamento</li>
                      <li>Métricas que realmente importam para o seu delivery</li>
                      <li>Checklist completo de otimização</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- CTA alternativo -->
              <p style="margin:0 0 16px; font-size:14px; color:#6b7280;">
                Se o anexo não carregar, use o link abaixo para fazer o download diretamente:
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#1e1b4b; border-radius:10px;">
                    <a href="${downloadUrl}" style="display:inline-block; padding:14px 28px; font-size:14px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:10px;">
                      ⬇ Baixar e-book (PDF)
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0; font-size:13px; line-height:1.65; color:#9ca3af;">
                Este link é exclusivo para você e ficará disponível enquanto o pagamento
                estiver aprovado no Mercado Pago.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fa; padding:24px 40px; border-top:1px solid #e5e7eb;">
              <p style="margin:0; font-size:12px; color:#9ca3af; text-align:center; line-height:1.6;">
                Você recebeu este e-mail porque comprou o <strong>${EBOOK_TITLE}</strong>.<br/>
                Dúvidas? Responda este e-mail ou acesse
                <a href="${siteUrl}" style="color:#6366f1; text-decoration:none;">${siteUrl.replace('https://', '')}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildEmailText(params: { greeting: string; downloadUrl: string }): string {
  const { greeting, downloadUrl } = params
  return `${greeting}

Seu pagamento foi confirmado! O e-book "${EBOOK_TITLE}" está anexado a este e-mail em PDF.

O que você vai aprender:
- Como aparecer no topo do Google Maps
- Configuração passo a passo do perfil GMB
- Como responder avaliações e criar engajamento
- Métricas que realmente importam para o seu delivery
- Checklist completo de otimização

Se o anexo não carregar, use este link para download direto:
${downloadUrl}

Dúvidas? Responda este e-mail.

-- Zairyx Canais Digitais`
}

