const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export const CHECKOUT_CONTRACT_SUMMARY_VERSION = '2026-04-06.v1'

export type CheckoutContractPlanSlug = 'self-service' | 'feito-pra-voce'
export type CheckoutContractPaymentMethod = 'pix' | 'card'

export interface CheckoutContractSummary extends Record<string, unknown> {
  version: string
  templateName: string
  planSlug: CheckoutContractPlanSlug
  planName: string
  capacityPlanName?: string
  paymentMethod: CheckoutContractPaymentMethod
  paymentMethodLabel: string
  initialChargeLabel: string
  monthlyChargeLabel: string
  accountBindingLabel: string
  renewalPolicy: string
  cancellationPolicy: string
  withdrawalPolicy: string
  scopeLabel: string
  termsPath: string
  privacyPath: string
}

function formatCurrency(value: number) {
  return BRL_FORMATTER.format(value)
}

export function buildCheckoutContractSummary(input: {
  templateName: string
  planSlug: CheckoutContractPlanSlug
  planName: string
  capacityPlanName?: string
  paymentMethod: CheckoutContractPaymentMethod
  installments: number
  initialChargeAmount: number
  monthlyChargeAmount: number
  accountEmail?: string | null
}): CheckoutContractSummary {
  const initialChargeLabel =
    input.paymentMethod === 'card'
      ? `${input.installments}x de ${formatCurrency(input.initialChargeAmount / input.installments)}`
      : formatCurrency(input.initialChargeAmount)

  return {
    version: CHECKOUT_CONTRACT_SUMMARY_VERSION,
    templateName: input.templateName,
    planSlug: input.planSlug,
    planName: input.planName,
    capacityPlanName: input.capacityPlanName?.trim() || undefined,
    paymentMethod: input.paymentMethod,
    paymentMethodLabel: input.paymentMethod === 'pix' ? 'PIX' : `${input.installments}x no cartão`,
    initialChargeLabel,
    monthlyChargeLabel: `${formatCurrency(input.monthlyChargeAmount)}/mês`,
    accountBindingLabel: input.accountEmail?.trim()
      ? `A compra e a liberação do template ficam vinculadas à conta ${input.accountEmail.trim().toLowerCase()}.`
      : 'A compra e a liberação do template ficam vinculadas à conta autenticada usada no checkout.',
    renewalPolicy:
      'Após a ativação, o uso contínuo depende da mensalidade do plano correspondente, com renovação automática por ciclo.',
    cancellationPolicy:
      'O cancelamento segue os termos vigentes e produz efeito ao final do período pago, salvo política comercial mais favorável.',
    withdrawalPolicy:
      'Na contratação online, o direito de arrependimento é de 7 dias corridos, conforme o CDC, salvo oferta pública mais favorável.',
    scopeLabel:
      input.planSlug === 'feito-pra-voce'
        ? `Este checkout inclui implantação inicial pela equipe e continuidade do plano mensal${input.capacityPlanName?.trim() ? ` ${input.capacityPlanName.trim()}` : ' correspondente'}.`
        : `Este checkout inclui implantação inicial self-service e continuidade do plano mensal${input.capacityPlanName?.trim() ? ` ${input.capacityPlanName.trim()}` : ' correspondente'}.`,
    termsPath: '/termos',
    privacyPath: '/privacidade',
  }
}

