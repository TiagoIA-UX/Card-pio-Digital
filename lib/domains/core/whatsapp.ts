import { formatCurrency } from '@/lib/shared/format-currency'

export interface QuickOrderItem {
  nome: string
  preco: number
  quantidade?: number
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
 * Usa encodeURIComponent para garantir que caracteres especiais não quebrem.
 */
export function getQuickOrderWhatsAppUrl(phone: string, message: string): string {
  let cleanPhone = phone.replace(/\D/g, '')
  if (!cleanPhone.startsWith('55')) {
    cleanPhone = '55' + cleanPhone
  }
  const encodedMessage = encodeURIComponent(message)
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`
}
