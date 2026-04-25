import { formatCurrency } from '@/lib/shared/format-currency'

export interface QuickOrderItem {
  nome: string
  preco: number
  quantidade?: number
}

const WHATSAPP_FALLBACK_DELAY_MS = 1800

function normalizePhone(phone: string): string {
  let clean = phone.replace(/\D/g, '')
  if (!clean.startsWith('55')) {
    clean = '55' + clean
  }
  return clean
}

/**
 * Monta a mensagem para pedido rápido (1 clique) no WhatsApp.
 * Usado no botão "Pedir direto" do ProductCard.
 */
export function buildQuickOrderMessage(
  items: QuickOrderItem[],
  options?: { includeFooter?: boolean }
): string {
  const includeFooter = options?.includeFooter ?? true

  let message = 'Olá! Gostaria de pedir:\n\n'

  let total = 0
  items.forEach((item, index) => {
    const qty = item.quantidade ?? 1
    const subtotal = item.preco * qty
    total += subtotal
    message += `${index + 1}. ${qty}x ${item.nome} - ${formatCurrency(subtotal)}\n`
  })

  message += `\n*Total:* ${formatCurrency(total)}\n`

  if (includeFooter) {
    message += '\nPor favor, confirme disponibilidade e forma de pagamento.'
  }

  return message.trim()
}

/**
 * Gera a URL do WhatsApp com a mensagem codificada.
 * Usa wa.me — funciona em mobile e desktop sem forçar WhatsApp Web.
 */
export function getWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = normalizePhone(phone)
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

/**
 * @deprecated Use getWhatsAppUrl. O endpoint legado força WhatsApp Web.
 */
export function getQuickOrderWhatsAppUrl(phone: string, message: string): string {
  return getWhatsAppUrl(phone, message)
}

/**
 * Abre o WhatsApp nativo com fallback controlado para wa.me.
 * Lança erro se o telefone não estiver configurado — sem fallback silencioso.
 */
export function openWhatsApp(phone: string, message: string): void {
  if (!phone) {
    throw new Error('Este restaurante não configurou o WhatsApp.')
  }

  const cleanPhone = normalizePhone(phone)
  const encodedMessage = encodeURIComponent(message)
  const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`
  const fallbackUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`

  let appOpenDetected = false
  let fallbackTimer: number | null = null

  const cleanup = () => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('pagehide', onNavigationAway, { capture: true })
    window.removeEventListener('blur', onNavigationAway)
    if (fallbackTimer !== null) {
      window.clearTimeout(fallbackTimer)
      fallbackTimer = null
    }
  }

  const onNavigationAway = () => {
    appOpenDetected = true
    cleanup()
  }

  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      onNavigationAway()
    }
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('pagehide', onNavigationAway, { once: true, capture: true })
  window.addEventListener('blur', onNavigationAway, { once: true })

  fallbackTimer = window.setTimeout(() => {
    cleanup()
    if (!appOpenDetected) {
      window.location.assign(fallbackUrl)
    }
  }, WHATSAPP_FALLBACK_DELAY_MS)

  window.location.assign(appUrl)
}

