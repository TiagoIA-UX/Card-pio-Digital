import crypto from 'crypto'

export function validateMercadoPagoWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  secret: string
): boolean {
  if (!xSignature || !xRequestId || !secret) {
    return false
  }

  const parts = xSignature.split(',')
  let ts = ''
  let v1 = ''

  for (const part of parts) {
    const [key, value] = part.split('=')
    if (key?.trim() === 'ts') ts = value?.trim() || ''
    if (key?.trim() === 'v1') v1 = value?.trim() || ''
  }

  if (!ts || !v1) {
    return false
  }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const expectedSignature = crypto.createHmac('sha256', secret).update(manifest).digest()

  let receivedSignature: Buffer
  try {
    receivedSignature = Buffer.from(v1, 'hex')
  } catch {
    return false
  }

  if (expectedSignature.length !== receivedSignature.length) {
    return false
  }

  return crypto.timingSafeEqual(expectedSignature, receivedSignature)
}
