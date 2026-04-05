export function mapMercadoPagoStatus(status?: string | null) {
  if (status === 'approved') {
    return {
      paymentStatus: 'approved',
      orderStatus: 'completed',
      restaurantPaymentStatus: 'ativo',
    }
  }

  if (status === 'pending' || status === 'in_process' || status === 'authorized') {
    return {
      paymentStatus: 'pending',
      orderStatus: 'processing',
      restaurantPaymentStatus: 'aguardando',
    }
  }

  return {
    paymentStatus: 'rejected',
    orderStatus: 'cancelled',
    restaurantPaymentStatus: 'cancelado',
  }
}
