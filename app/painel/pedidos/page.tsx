'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient, type Order, type OrderItem } from '@/lib/supabase/client'
import { Loader2, X, Clock, CheckCircle, Package, Truck, XCircle, Eye } from 'lucide-react'

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const supabase = createClient()

  const loadOrders = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
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
  }, [supabase])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadOrders()
    }, 0)

    return () => clearTimeout(timer)
  }, [loadOrders])

  const viewOrder = async (order: Order) => {
    setSelectedOrder(order)
    setLoadingItems(true)

    const { data } = await supabase.from('order_items').select('*').eq('order_id', order.id)

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
    pending: {
      color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      icon: Clock,
      label: 'Pendente',
    },
    confirmed: {
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      icon: CheckCircle,
      label: 'Confirmado',
    },
    preparing: {
      color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      icon: Package,
      label: 'Preparando',
    },
    ready: {
      color: 'bg-green-500/10 text-green-600 border-green-500/20',
      icon: CheckCircle,
      label: 'Pronto',
    },
    delivered: {
      color: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
      icon: Truck,
      label: 'Entregue',
    },
    cancelled: {
      color: 'bg-red-500/10 text-red-600 border-red-500/20',
      icon: XCircle,
      label: 'Cancelado',
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="text-foreground text-2xl font-bold">Pedidos</h1>
        <p className="text-muted-foreground">{orders.length} pedidos recebidos</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-card border-border rounded-xl border py-12 text-center">
          <Clock className="text-muted-foreground mx-auto mb-4 h-12 w-12 opacity-50" />
          <h3 className="text-foreground mb-2 font-semibold">Nenhum pedido ainda</h3>
          <p className="text-muted-foreground">
            Compartilhe seu cardápio para começar a receber pedidos!
          </p>
        </div>
      ) : (
        <div className="bg-card border-border overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-foreground p-4 text-left text-sm font-medium">#</th>
                  <th className="text-foreground p-4 text-left text-sm font-medium">Cliente</th>
                  <th className="text-foreground p-4 text-left text-sm font-medium">Total</th>
                  <th className="text-foreground p-4 text-left text-sm font-medium">Status</th>
                  <th className="text-foreground p-4 text-left text-sm font-medium">Data</th>
                  <th className="text-foreground p-4 text-left text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {orders.map((order) => {
                  const config = statusConfig[order.status]
                  return (
                    <tr key={order.id} className="hover:bg-secondary/30">
                      <td className="text-foreground p-4 font-medium">
                        #{order.numero_pedido || order.numero}
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-foreground font-medium">
                            {order.cliente_nome || 'Cliente'}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {order.cliente_telefone || 'Sem telefone'}
                          </p>
                        </div>
                      </td>
                      <td className="text-primary p-4 font-bold">
                        R$ {Number(order.total).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.color}`}
                        >
                          <config.icon className="h-3.5 w-3.5" />
                          {config.label}
                        </span>
                      </td>
                      <td className="text-muted-foreground p-4 text-sm">
                        {new Date(order.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => viewOrder(order)}
                          className="hover:bg-secondary rounded-lg p-2"
                          title="Ver detalhes"
                        >
                          <Eye className="text-primary h-5 w-5" />
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
          <div className="bg-background relative m-4 max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl shadow-xl">
            <div className="border-border flex items-center justify-between border-b p-4">
              <h3 className="text-foreground text-lg font-bold">
                Pedido #{selectedOrder.numero_pedido || selectedOrder.numero}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="hover:bg-secondary rounded-lg p-2"
                title="Fechar detalhes"
                aria-label="Fechar detalhes"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              {/* Info do Cliente */}
              <div className="bg-secondary/30 rounded-lg p-4">
                <h4 className="text-foreground mb-2 font-semibold">Dados do Cliente</h4>
                <p className="text-sm">
                  <span className="text-muted-foreground">Nome:</span>{' '}
                  {selectedOrder.cliente_nome || '-'}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Telefone:</span>{' '}
                  {selectedOrder.cliente_telefone || '-'}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Origem:</span>{' '}
                  {selectedOrder.origem_pedido === 'mesa'
                    ? `Mesa ${selectedOrder.mesa_numero || ''}`.trim()
                    : 'Online'}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Tipo:</span>{' '}
                  {selectedOrder.origem_pedido === 'mesa'
                    ? 'Consumir no local'
                    : selectedOrder.tipo_entrega === 'delivery'
                      ? 'Entrega'
                      : 'Retirada'}
                </p>
                {selectedOrder.tipo_entrega === 'delivery' && (
                  <>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Endereço:</span>{' '}
                      {selectedOrder.cliente_endereco?.logradouro ||
                        (selectedOrder as any).endereco_rua ||
                        '-'}
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Bairro:</span>{' '}
                      {selectedOrder.cliente_endereco?.bairro ||
                        (selectedOrder as any).endereco_bairro ||
                        '-'}
                    </p>
                    {(selectedOrder.cliente_endereco?.complemento ||
                      (selectedOrder as any).endereco_complemento) && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Complemento:</span>{' '}
                        {selectedOrder.cliente_endereco?.complemento ||
                          (selectedOrder as any).endereco_complemento}
                      </p>
                    )}
                  </>
                )}
                <p className="text-sm">
                  <span className="text-muted-foreground">Pagamento:</span>{' '}
                  {selectedOrder.forma_pagamento || '-'}
                </p>
                {selectedOrder.observacoes && (
                  <p className="mt-2 rounded bg-yellow-500/10 p-2 text-sm text-yellow-700">
                    <span className="font-medium">Obs:</span> {selectedOrder.observacoes}
                  </p>
                )}
              </div>

              {/* Itens */}
              <div>
                <h4 className="text-foreground mb-2 font-semibold">Itens do Pedido</h4>
                {loadingItems ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="text-primary h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orderItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-card border-border flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="text-foreground font-medium">
                            {item.quantidade}x {item.nome_produto || item.nome_snapshot}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            R${' '}
                            {Number(item.preco_unitario || item.preco_snapshot || 0)
                              .toFixed(2)
                              .replace('.', ',')}{' '}
                            cada
                          </p>
                          {(item.observacoes || item.observacao) && (
                            <p className="mt-1 text-sm text-yellow-600">
                              Obs: {item.observacoes || item.observacao}
                            </p>
                          )}
                        </div>
                        <span className="text-primary font-bold">
                          R${' '}
                          {(
                            Number(item.preco_unitario || item.preco_snapshot || 0) *
                            item.quantidade
                          )
                            .toFixed(2)
                            .replace('.', ',')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="bg-primary/10 flex items-center justify-between rounded-lg p-4">
                <span className="text-foreground font-semibold">Total</span>
                <span className="text-primary text-xl font-bold">
                  R$ {Number(selectedOrder.total).toFixed(2).replace('.', ',')}
                </span>
              </div>

              {/* Ações de Status */}
              <div>
                <h4 className="text-foreground mb-2 font-semibold">Atualizar Status</h4>
                <div className="flex flex-wrap gap-2">
                  {['confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map((status) => {
                    const config = statusConfig[status]
                    const isActive = selectedOrder.status === status
                    return (
                      <button
                        key={status}
                        onClick={() => updateStatus(selectedOrder.id, status)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                          isActive
                            ? config.color
                            : 'bg-secondary/50 text-muted-foreground border-border hover:bg-secondary'
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
