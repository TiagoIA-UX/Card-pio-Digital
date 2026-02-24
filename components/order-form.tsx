"use client"

import React from "react"
import { ArrowLeft, User, MapPin, CreditCard, FileText } from "lucide-react"

export interface OrderInfo {
  nome: string
  telefone: string
  tipoAtendimento: "entrega" | "retirada"
  endereco: string
  bairro: string
  complemento: string
  pagamento: string
  observacoes: string
}

interface OrderFormProps {
  orderInfo: OrderInfo
  setOrderInfo: (info: OrderInfo) => void
  onBack: () => void
}

export function OrderForm({ orderInfo, setOrderInfo, onBack }: OrderFormProps) {
  return (
    <div className="space-y-4">
      {/* Dados do Cliente */}
      <div className="space-y-3">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <User className="h-4 w-4" /> Dados do Cliente
        </h4>
        <input
          type="text"
          placeholder="Nome completo *"
          value={orderInfo.nome}
          onChange={(e) => setOrderInfo({...orderInfo, nome: e.target.value})}
          className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="tel"
          placeholder="Telefone com DDD *"
          value={orderInfo.telefone}
          onChange={(e) => setOrderInfo({...orderInfo, telefone: e.target.value})}
          className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Tipo de Atendimento */}
      <div className="space-y-3">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <MapPin className="h-4 w-4" /> Tipo de Atendimento
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setOrderInfo({...orderInfo, tipoAtendimento: "entrega"})}
            className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
              orderInfo.tipoAtendimento === "entrega" 
                ? "border-primary bg-primary/10 text-primary" 
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            🛵 Entrega
          </button>
          <button
            onClick={() => setOrderInfo({...orderInfo, tipoAtendimento: "retirada"})}
            className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
              orderInfo.tipoAtendimento === "retirada" 
                ? "border-primary bg-primary/10 text-primary" 
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            🏪 Retirada
          </button>
        </div>
      </div>

      {/* Endereço (só aparece se for entrega) */}
      {orderInfo.tipoAtendimento === "entrega" && (
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground">Endereço de Entrega</h4>
          <input
            type="text"
            placeholder="Rua e número *"
            value={orderInfo.endereco}
            onChange={(e) => setOrderInfo({...orderInfo, endereco: e.target.value})}
            className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="Bairro *"
            value={orderInfo.bairro}
            onChange={(e) => setOrderInfo({...orderInfo, bairro: e.target.value})}
            className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="Complemento (apto, bloco, referência)"
            value={orderInfo.complemento}
            onChange={(e) => setOrderInfo({...orderInfo, complemento: e.target.value})}
            className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}

      {/* Forma de Pagamento */}
      <div className="space-y-3">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <CreditCard className="h-4 w-4" /> Forma de Pagamento
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {["PIX", "Dinheiro", "Cartão Crédito", "Cartão Débito"].map((opcao) => (
            <button
              key={opcao}
              onClick={() => setOrderInfo({...orderInfo, pagamento: opcao})}
              className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                orderInfo.pagamento === opcao 
                  ? "border-primary bg-primary/10 text-primary" 
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {opcao}
            </button>
          ))}
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-3">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-4 w-4" /> Observações
        </h4>
        <textarea
          placeholder="Alguma observação sobre o pedido? (opcional)"
          value={orderInfo.observacoes}
          onChange={(e) => setOrderInfo({...orderInfo, observacoes: e.target.value})}
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>
    </div>
  )
}

export function canSubmitOrder(orderInfo: OrderInfo): boolean {
  return !!(orderInfo.nome && orderInfo.telefone && 
    (orderInfo.tipoAtendimento === "retirada" || (orderInfo.endereco && orderInfo.bairro)))
}

export function formatOrderMessage(
  cart: Array<{ id: string; name: string; price: number; quantity: number; category: string }>,
  orderInfo: OrderInfo,
  totalPrice: number,
  templateName: string,
  emoji: string
): string {
  // Agrupar itens por categoria
  const itemsByCategory: { [key: string]: typeof cart } = {}
  cart.forEach(item => {
    if (!itemsByCategory[item.category]) {
      itemsByCategory[item.category] = []
    }
    itemsByCategory[item.category].push(item)
  })

  let itemsList = ""
  Object.entries(itemsByCategory).forEach(([category, items]) => {
    itemsList += `*Categoria: ${category}*\n`
    items.forEach(item => {
      itemsList += `- ${item.quantity}x ${item.name} (R$ ${item.price.toFixed(2).replace('.', ',')})\n`
    })
    itemsList += "\n"
  })

  const formatDate = () => {
    const now = new Date()
    return now.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const enderecoInfo = orderInfo.tipoAtendimento === "entrega" 
    ? `*Endereço:* ${orderInfo.endereco}\n*Bairro:* ${orderInfo.bairro}${orderInfo.complemento ? `\n*Complemento:* ${orderInfo.complemento}` : ""}`
    : "_Retirada no local_"

  return `${emoji} *Pedido via Cardápio Digital*
*Template:* ${templateName}
*Data:* ${formatDate()}

*Cliente:* ${orderInfo.nome}
*Telefone:* ${orderInfo.telefone}
*Atendimento:* ${orderInfo.tipoAtendimento === "entrega" ? "Entrega" : "Retirada"}
${enderecoInfo}
*Pagamento:* ${orderInfo.pagamento}

*Itens do Pedido:*
${itemsList}
💰 *Total: R$ ${totalPrice.toFixed(2).replace('.', ',')}*
${orderInfo.observacoes ? `\n📝 *Observações:* ${orderInfo.observacoes}` : ""}

_(Pedido de demonstração)_`
}

export const defaultOrderInfo: OrderInfo = {
  nome: "",
  telefone: "",
  tipoAtendimento: "entrega",
  endereco: "",
  bairro: "",
  complemento: "",
  pagamento: "PIX",
  observacoes: ""
}
