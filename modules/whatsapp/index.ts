// =====================================================
// WHATSAPP MODULE
// Formatação de pedidos para envio via WhatsApp
// Integrado com SafeSender para proteção anti-ban Meta
// =====================================================

import type { Order, OrderItem, Tenant, PersonalizacaoPizza } from '@/types/database'
import {
  checkSafeSend,
  recordMessageSent,
  auditMessageContent,
  type SafeSendResult,
} from './safe-sender'

/**
 * Formata preço em Real brasileiro
 */
export function formatarPreco(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

/**
 * Formata número de telefone para WhatsApp
 * Remove caracteres não numéricos e adiciona código do país se necessário
 */
export function formatarTelefoneWhatsApp(telefone: string): string {
  const input = telefone.trim()

  // Aceita colagem de links do WhatsApp como wa.me/5511999999999 ou api.whatsapp.com/send?phone=...
  const phoneParamMatch = input.match(/[?&]phone=([0-9]+)/i)
  const waMeMatch = input.match(/wa\.me\/(\d{10,20})/i)

  let numeroFonte = input
  if (phoneParamMatch?.[1]) {
    numeroFonte = phoneParamMatch[1]
  } else if (waMeMatch?.[1]) {
    numeroFonte = waMeMatch[1]
  }

  // Remove tudo que não é número
  let numero = numeroFonte.replace(/\D/g, '')

  if (!numero) return ''

  // Aceita prefixo internacional 00XXXXXXXX
  if (numero.startsWith('00')) {
    numero = numero.slice(2)
  }

  // Formato internacional já válido (E.164 sem +): 10 a 15 dígitos
  if (numero.length >= 10 && numero.length <= 15) {
    // Caso BR local com 10/11 dígitos sem DDI, prefixa 55
    if (!numero.startsWith('55') && (numero.length === 10 || numero.length === 11)) {
      return `55${numero}`
    }

    return numero
  }

  // Compatibilidade com entradas legadas BR
  if (numero.startsWith('55')) {
    numero = numero.slice(2)
  }

  if (numero.startsWith('0')) {
    numero = numero.slice(1)
  }

  if (numero.length >= 10 && numero.length <= 11) {
    return `55${numero}`
  }

  return ''
}

/**
 * Gera link direto para WhatsApp
 */
export function gerarLinkWhatsApp(telefone: string, mensagem: string): string {
  const numeroFormatado = formatarTelefoneWhatsApp(telefone)
  const mensagemCodificada = encodeURIComponent(mensagem)
  return `https://wa.me/${numeroFormatado}?text=${mensagemCodificada}`
}

/**
 * Formata personalização de pizza para texto
 */
function formatarPersonalizacao(personalizacao: PersonalizacaoPizza): string {
  const partes: string[] = []

  if (personalizacao.tamanho) {
    partes.push(`📏 Tamanho: ${personalizacao.tamanho.nome}`)
  }

  if (personalizacao.sabores && personalizacao.sabores.length > 0) {
    const sabores = personalizacao.sabores.map((s) => s.nome).join(' + ')
    partes.push(`🍕 ${personalizacao.sabores.length > 1 ? 'Sabores' : 'Sabor'}: ${sabores}`)
  }

  if (personalizacao.borda) {
    partes.push(`🧀 Borda: ${personalizacao.borda.nome}`)
  }

  if (personalizacao.adicionais && personalizacao.adicionais.length > 0) {
    const adicionais = personalizacao.adicionais.map((a) => a.nome).join(', ')
    partes.push(`➕ Adicionais: ${adicionais}`)
  }

  return partes.join('\n')
}

/**
 * Formata item do pedido para texto
 */
function formatarItem(item: OrderItem, index: number): string {
  let texto = `${index + 1}. ${item.nome_produto}`
  texto += ` x${item.quantidade}`
  texto += ` = ${formatarPreco(item.preco_total)}`

  // Se tem personalização (pizza)
  if (item.personalizacao && Object.keys(item.personalizacao).length > 0) {
    texto += '\n' + formatarPersonalizacao(item.personalizacao)
  }

  // Observações do item
  if (item.observacoes) {
    texto += `\n📝 Obs: ${item.observacoes}`
  }

  return texto
}

/**
 * Formata endereço para texto
 */
function formatarEndereco(endereco: Order['cliente_endereco']): string {
  if (!endereco) return 'Não informado'

  const partes = []

  if (endereco.logradouro) {
    partes.push(endereco.logradouro)
    if (endereco.numero) partes[0] += `, ${endereco.numero}`
  }

  if (endereco.complemento) partes.push(endereco.complemento)
  if (endereco.bairro) partes.push(endereco.bairro)
  if (endereco.referencia) partes.push(`Ref: ${endereco.referencia}`)

  return partes.join(' - ') || 'Não informado'
}

/**
 * Formata forma de pagamento
 */
function formatarPagamento(formaPagamento: Order['forma_pagamento'], troco?: number): string {
  const formas: Record<string, string> = {
    dinheiro: '💵 Dinheiro',
    cartao_credito: '💳 Cartão de Crédito',
    cartao_debito: '💳 Cartão de Débito',
    cartao: '💳 Cartão (débito/crédito)',
    pix: '📱 PIX',
    vale_refeicao: '🎫 Vale Refeição',
    online: '🌐 Online (PIX/cartão)',
  }

  let texto = formas[formaPagamento || ''] || formaPagamento || 'A definir'

  if (formaPagamento === 'dinheiro' && troco && troco > 0) {
    texto += ` (Troco para ${formatarPreco(troco)})`
  }

  return texto
}

/**
 * Emoji dinâmico por template de negócio
 */
export const TEMPLATE_EMOJIS: Record<string, string> = {
  restaurante: '🍽️',
  pizzaria: '🍕',
  lanchonete: '🍔',
  bar: '🍺',
  cafeteria: '☕',
  acai: '🫐',
  sushi: '🍣',
  adega: '🍷',
  mercadinho: '🛒',
  minimercado: '🏪',
  padaria: '🥖',
  sorveteria: '🍦',
  acougue: '🥩',
  hortifruti: '🥬',
  petshop: '🐾',
  doceria: '🍰',
}

/**
 * Interface para dados do pedido
 */
export interface DadosPedido {
  /** @deprecated Use `store` */
  pizzaria?: Pick<Tenant, 'nome' | 'whatsapp' | 'template_slug'>
  store?: Pick<Tenant, 'nome' | 'whatsapp' | 'template_slug'>
  pedido: Order
  itens: OrderItem[]
}

/**
 * Formata pedido completo para envio via WhatsApp
 */
export function formatarPedidoWhatsApp(dados: DadosPedido): string {
  const store = dados.store || dados.pizzaria
  if (!store) throw new Error('DadosPedido requer store ou pizzaria')
  const { pedido, itens } = dados
  const dataHora = new Date(pedido.created_at).toLocaleString('pt-BR')
  const emoji = TEMPLATE_EMOJIS[store.template_slug || ''] || '🏪'

  let mensagem = `${emoji} *NOVO PEDIDO - ${store.nome}*\n`
  mensagem += `━━━━━━━━━━━━━━━━━━━━━\n\n`

  // Número do pedido
  mensagem += `📋 *Pedido #${pedido.numero}*\n`
  mensagem += `🕐 ${dataHora}\n\n`

  // Dados do cliente
  mensagem += `👤 *CLIENTE*\n`
  mensagem += `Nome: ${pedido.cliente_nome}\n`
  mensagem += `Telefone: ${pedido.cliente_telefone}\n`
  if (pedido.cliente_email) {
    mensagem += `Email: ${pedido.cliente_email}\n`
  }
  mensagem += `\n`

  // Tipo de entrega
  mensagem += `🚚 *ENTREGA*\n`
  mensagem += `Tipo: ${pedido.tipo_entrega === 'delivery' ? '🛵 Delivery' : '🏃 Retirada'}\n`

  if (pedido.tipo_entrega === 'delivery' && pedido.cliente_endereco) {
    mensagem += `Endereço: ${formatarEndereco(pedido.cliente_endereco)}\n`
  }
  mensagem += `\n`

  // Itens do pedido
  mensagem += `🛒 *ITENS DO PEDIDO*\n`
  mensagem += `━━━━━━━━━━━━━━━━━━━━━\n`

  itens.forEach((item, index) => {
    mensagem += formatarItem(item, index)
    mensagem += '\n'
    if (index < itens.length - 1) mensagem += '---\n'
  })

  mensagem += `━━━━━━━━━━━━━━━━━━━━━\n\n`

  // Totais
  mensagem += `💰 *VALORES*\n`
  mensagem += `Subtotal: ${formatarPreco(pedido.subtotal)}\n`

  if (pedido.taxa_entrega > 0) {
    mensagem += `Taxa de entrega: ${formatarPreco(pedido.taxa_entrega)}\n`
  }

  if (pedido.desconto > 0) {
    mensagem += `Desconto: -${formatarPreco(pedido.desconto)}\n`
    if (pedido.cupom_codigo) {
      mensagem += `(Cupom: ${pedido.cupom_codigo})\n`
    }
  }

  mensagem += `\n*TOTAL: ${formatarPreco(pedido.total)}*\n\n`

  // Pagamento
  mensagem += `💳 *PAGAMENTO*\n`
  mensagem += formatarPagamento(pedido.forma_pagamento, pedido.troco_para || undefined)
  mensagem += `\n`

  // Observações
  if (pedido.observacoes) {
    mensagem += `\n📝 *OBSERVAÇÕES*\n`
    mensagem += pedido.observacoes
    mensagem += `\n`
  }

  // Tempo estimado
  if (pedido.tempo_estimado) {
    mensagem += `\n⏱️ Tempo estimado: ${pedido.tempo_estimado} minutos\n`
  }

  // Footer
  mensagem += `\n━━━━━━━━━━━━━━━━━━━━━\n`
  mensagem += `✅ Pedido realizado via Zairyx CardápioDigital\n`
  mensagem += `🌐 zairyx.com.br`

  return mensagem
}

/**
 * Formata pedido simplificado (para cliente)
 */
export function formatarPedidoCliente(dados: DadosPedido): string {
  const store = dados.store || dados.pizzaria
  if (!store) throw new Error('DadosPedido requer store ou pizzaria')
  const { pedido, itens } = dados

  let mensagem = `Olá! Gostaria de fazer um pedido:\n\n`

  // Itens
  mensagem += `*Itens:*\n`
  itens.forEach((item, index) => {
    mensagem += `${index + 1}. ${item.nome_produto} x${item.quantidade}\n`

    if (item.personalizacao?.sabores?.length) {
      const sabores = item.personalizacao.sabores.map((s) => s.nome).join(' + ')
      mensagem += `   (${sabores})\n`
    }
  })

  mensagem += `\n*Total: ${formatarPreco(pedido.total)}*\n`

  // Entrega
  mensagem += `\nTipo: ${pedido.tipo_entrega === 'delivery' ? 'Delivery' : 'Retirada'}\n`

  if (pedido.tipo_entrega === 'delivery' && pedido.cliente_endereco) {
    mensagem += `Endereço: ${formatarEndereco(pedido.cliente_endereco)}\n`
  }

  // Pagamento
  mensagem += `Pagamento: ${formatarPagamento(pedido.forma_pagamento, pedido.troco_para || undefined)}\n`

  // Observações
  if (pedido.observacoes) {
    mensagem += `\nObs: ${pedido.observacoes}\n`
  }

  return mensagem
}

/**
 * Gera link completo para envio do pedido
 */
export function gerarLinkPedidoWhatsApp(dados: DadosPedido): string {
  const mensagem = formatarPedidoCliente(dados)
  const store = dados.store || dados.pizzaria
  if (!store) throw new Error('DadosPedido requer store ou pizzaria')
  return gerarLinkWhatsApp(store.whatsapp, mensagem)
}

// =====================================================
// ENVIO SEGURO — Proteção Anti-Ban Meta
// =====================================================

export interface SafeLinkResult {
  /** Link gerado (null se bloqueado) */
  link: string | null
  /** Resultado da verificação de segurança */
  safety: SafeSendResult
  /** Alertas sobre o conteúdo da mensagem */
  contentWarnings: string[]
  /** Se o envio foi permitido */
  allowed: boolean
}

/**
 * Gera link de pedido WhatsApp COM verificação anti-ban.
 * Usa o SafeSender para throttling e compliance antes de gerar o link.
 */
export function gerarLinkPedidoSeguro(
  dados: DadosPedido,
  recipientPhone: string,
  restaurantId: string,
  messageType: 'order' | 'status_update' | 'promo' | 'support' = 'order'
): SafeLinkResult {
  const mensagem = formatarPedidoCliente(dados)

  // 1. Verifica se é seguro enviar agora
  const safety = checkSafeSend(restaurantId, recipientPhone, messageType)

  // 2. Audita conteúdo da mensagem
  const contentWarnings = auditMessageContent(mensagem)

  if (!safety.allowed) {
    console.warn(
      '[WHATSAPP_BLOCKED]',
      JSON.stringify({
        restaurantId,
        reason: safety.reason,
        riskLevel: safety.riskLevel,
        stats: safety.stats,
      })
    )

    return {
      link: null,
      safety,
      contentWarnings,
      allowed: false,
    }
  }

  // 3. Gera o link normalmente
  const store = dados.store || dados.pizzaria
  if (!store) throw new Error('DadosPedido requer store ou pizzaria')
  const link = gerarLinkWhatsApp(store.whatsapp, mensagem)

  // 4. Registra o envio
  recordMessageSent(restaurantId, recipientPhone, messageType)

  if (contentWarnings.length > 0) {
    console.warn(
      '[WHATSAPP_CONTENT_WARNING]',
      JSON.stringify({
        restaurantId,
        warnings: contentWarnings,
      })
    )
  }

  console.log(
    '[WHATSAPP_SAFE_SEND]',
    JSON.stringify({
      restaurantId,
      riskLevel: safety.riskLevel,
      stats: safety.stats,
    })
  )

  return {
    link,
    safety,
    contentWarnings,
    allowed: true,
  }
}

// Re-export do SafeSender para uso direto
export {
  checkSafeSend,
  recordMessageSent,
  getWhatsAppHealth,
  auditMessageContent,
} from './safe-sender'
export type { SafeSendResult, WhatsAppHealthReport, SafeSenderConfig } from './safe-sender'
