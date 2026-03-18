// =====================================================
// WHATSAPP MODULE
// Formatação de pedidos para envio via WhatsApp
// =====================================================

import type { Order, OrderItem, Tenant, PersonalizacaoPizza } from '@/types/database'

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
  // Remove tudo que não é número
  let numero = telefone.replace(/\D/g, '')

  // Se não começar com 55, adiciona
  if (!numero.startsWith('55')) {
    numero = '55' + numero
  }

  return numero
}

/**
 * Gera link direto para WhatsApp
 */
export function gerarLinkWhatsApp(telefone: string, mensagem: string): string {
  const numeroFormatado = formatarTelefoneWhatsApp(telefone)
  const mensagemCodificada = encodeURIComponent(mensagem)
  return `https://api.whatsapp.com/send?phone=${numeroFormatado}&text=${mensagemCodificada}`
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
 * Interface para dados do pedido
 */
export interface DadosPedido {
  pizzaria: Pick<Tenant, 'nome' | 'whatsapp'>
  pedido: Order
  itens: OrderItem[]
}

/**
 * Formata pedido completo para envio via WhatsApp
 */
export function formatarPedidoWhatsApp(dados: DadosPedido): string {
  const { pizzaria, pedido, itens } = dados
  const dataHora = new Date(pedido.created_at).toLocaleString('pt-BR')

  let mensagem = `🍕 *NOVO PEDIDO - ${pizzaria.nome}*\n`
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
  mensagem += `✅ Pedido realizado via CardápioDigital\n`
  mensagem += `🌐 cardapiodigital.com.br`

  return mensagem
}

/**
 * Formata pedido simplificado (para cliente)
 */
export function formatarPedidoCliente(dados: DadosPedido): string {
  const { pizzaria, pedido, itens } = dados

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
  return gerarLinkWhatsApp(dados.pizzaria.whatsapp, mensagem)
}
