"use client"

import { useEffect, useState } from "react"
import { createClient, type Order, type OrderItem } from "@/lib/supabase/client"
import { Loader2, X, Clock, CheckCircle, Package, Truck, XCircle, Eye } from "lucide-react"

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: rest } = await supabase
      .from('restaurants')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!rest) return
    setRestaurantId(rest.id)

    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', rest.id)
      .order('created_at', { ascending: false })

    setOrders(data || [])
    setLoading(false)
  }

  const viewOrder = async (order: Order) => {
    setSelectedOrder(order)
    setLoadingItems(true)

    const { data } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)

    setOrderItems(data || [])
    setLoadingItems(false)
  }

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId)
    await loadOrders()
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: status as any })
    }
  }

  const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
    pending: { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Clock, label: 'Pendente' },
    confirmed: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: CheckCircle, label: 'Confirmado' },
    preparing: { color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: Package, label: 'Preparando' },
    ready: { color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle, label: 'Pronto' },
    delivered: { color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: Truck, label: 'Entregue' },
    cancelled: { color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle, label: 'Cancelado' },
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
        <p className="text-muted-foreground">{orders.length} pedidos recebidos</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-card border border-border">
          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-semibold text-foreground mb-2">Nenhum pedido ainda</h3>
          <p className="text-muted-foreground">Compartilhe seu cardápio para começar a receber pedidos!</p>
        </div>
      ) : (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-foreground">#</th>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Cliente</th>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Total</th>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Data</th>
                  <th className="text-left p-4 text-sm font-medium text-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map(order => {
                  const config = statusConfig[order.status]
                  return (
                    <tr key={order.id} className="hover:bg-secondary/30">
                      <td className="p-4 font-medium text-foreground">#{order.numero_pedido}</td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-foreground">{order.cliente_nome || 'Cliente'}</p>
                          <p className="text-sm text-muted-foreground">{order.cliente_telefone || 'Sem telefone'}</p>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-primary">
                        R$ {Number(order.total).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                          <config.icon className="h-3.5 w-3.5" />
                          {config.label}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => viewOrder(order)}
                          className="p-2 rounded-lg hover:bg-secondary"
                          title="Ver detalhes"
                        >
                          <Eye className="h-5 w-5 text-primary" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-lg bg-background rounded-xl shadow-xl m-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">Pedido #{selectedOrder.numero_pedido}</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-secondary rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Info do Cliente */}
              <div className="p-4 rounded-lg bg-secondary/30">
                <h4 className="font-semibold text-foreground mb-2">Dados do Cliente</h4>
                <p className="text-sm"><span className="text-muted-foreground">Nome:</span> {selectedOrder.cliente_nome || '-'}</p>
                <p className="text-sm"><span className="text-muted-foreground">Telefone:</span> {selectedOrder.cliente_telefone || '-'}</p>
                <p className="text-sm"><span className="text-muted-foreground">Tipo:</span> {selectedOrder.tipo_entrega === 'entrega' ? 'Entrega' : 'Retirada'}</p>
                {selectedOrder.tipo_entrega === 'entrega' && (
                  <>
                    <p className="text-sm"><span className="text-muted-foreground">Endereço:</span> {selectedOrder.endereco_rua || '-'}</p>
                    <p className="text-sm"><span className="text-muted-foreground">Bairro:</span> {selectedOrder.endereco_bairro || '-'}</p>
                    {selectedOrder.endereco_complemento && (
                      <p className="text-sm"><span className="text-muted-foreground">Complemento:</span> {selectedOrder.endereco_complemento}</p>
                    )}
                  </>
                )}
                <p className="text-sm"><span className="text-muted-foreground">Pagamento:</span> {selectedOrder.forma_pagamento || '-'}</p>
                {selectedOrder.observacoes && (
                  <p className="text-sm mt-2 p-2 rounded bg-yellow-500/10 text-yellow-700">
                    <span className="font-medium">Obs:</span> {selectedOrder.observacoes}
                  </p>
                )}
              </div>

              {/* Itens */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">Itens do Pedido</h4>
                {loadingItems ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orderItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                        <div>
                          <p className="font-medium text-foreground">{item.quantidade}x {item.nome_snapshot}</p>
                          <p className="text-sm text-muted-foreground">
                            R$ {Number(item.preco_snapshot).toFixed(2).replace('.', ',')} cada
                          </p>
                          {item.observacao && (
                            <p className="text-sm text-yellow-600 mt-1">Obs: {item.observacao}</p>
                          )}
                        </div>
                        <span className="font-bold text-primary">
                          R$ {(Number(item.preco_snapshot) * item.quantidade).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-xl font-bold text-primary">
                  R$ {Number(selectedOrder.total).toFixed(2).replace('.', ',')}
                </span>
              </div>

              {/* Ações de Status */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">Atualizar Status</h4>
                <div className="flex flex-wrap gap-2">
                  {['confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map(status => {
                    const config = statusConfig[status]
                    const isActive = selectedOrder.status === status
                    return (
                      <button
                        key={status}
                        onClick={() => updateStatus(selectedOrder.id, status)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          isActive ? config.color : 'bg-secondary/50 text-muted-foreground border-border hover:bg-secondary'
                        }`}
                      >
                        <config.icon className="h-4 w-4" />
                        {config.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
