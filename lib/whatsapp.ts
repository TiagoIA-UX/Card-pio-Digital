import { formatCurrency } from '@/lib/format-currency'

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
  const cleanPhone = phone.replace(/\D/g, '')
  const encodedMessage = encodeURIComponent(message)
  return `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodedMessage}`
}
