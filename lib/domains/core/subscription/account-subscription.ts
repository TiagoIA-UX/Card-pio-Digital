type SubscriptionAccessWindowSource = {
  cancel_at?: string | null
  current_period_end?: string | null
  trial_ends_at?: string | null
  next_payment_date?: string | null
}

export function getProviderLabel(provider: string) {
  switch (provider) {
    case 'google':
      return 'Google'
    case 'email':
      return 'E-mail'
    default:
      return provider
  }
}

export function getPlanLabel(planSlug?: string | null) {
  switch (planSlug) {
    case 'premium':
      return 'Premium'
    case 'pro':
      return 'Pro'
    case 'basico':
      return 'Básico'
    case 'semente':
      return 'Semente'
    default:
      return 'Não definido'
  }
}

export function getPaymentStatusLabel(status?: string | null) {
  switch (status) {
    case 'ativo':
      return 'Pagamento ativo'
    case 'pendente':
      return 'Pagamento pendente'
    case 'aguardando':
      return 'Aguardando confirmação'
    case 'expirado':
      return 'Assinatura expirada'
    case 'cancelado':
      return 'Assinatura cancelada'
    default:
      return 'Status indisponível'
  }
}

export function resolveSubscriptionAccessUntil(
  subscription?: SubscriptionAccessWindowSource | null
) {
  return (
    subscription?.cancel_at ||
    subscription?.current_period_end ||
    subscription?.trial_ends_at ||
    subscription?.next_payment_date ||
    null
  )
}

export function getDaysUntilDate(dateValue?: string | null, now = new Date()) {
  if (!dateValue) return null

  const expiryDate = new Date(dateValue)
  const diffTime = expiryDate.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function isFutureScheduledCancellation(cancelAt?: string | null, now = Date.now()) {
  if (!cancelAt) return false
  return new Date(cancelAt).getTime() > now
}

export function formatAccessUntilLabel(dateValue?: string | null) {
  return dateValue ? new Date(dateValue).toLocaleDateString('pt-BR') : 'data indisponível'
}

export function formatAlreadyCancelledRenewalMessage(cancelAt?: string | null) {
  const accessUntilLabel = formatAccessUntilLabel(cancelAt)
  return `A renovação automática já está cancelada. Seu acesso permanece até ${accessUntilLabel}.`
}

export function formatCancelledRenewalSuccessMessage(accessUntil?: string | null) {
  if (!accessUntil) {
    return 'Renovação automática cancelada com sucesso.'
  }

  return `Renovação automática cancelada. Seu acesso continua até ${formatAccessUntilLabel(accessUntil)}.`
}

