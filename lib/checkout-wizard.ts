import type { OnboardingPlanSlug, PaymentMethod } from '@/lib/pricing'

export type CheckoutWizardStepStatus = 'complete' | 'current' | 'upcoming'

export interface CheckoutWizardStep {
  id: 'oferta' | 'cadastro' | 'pagamento'
  title: string
  description: string
  status: CheckoutWizardStepStatus
}

export interface CheckoutWizardFormValues {
  restaurantName: string
  customerName: string
  phone: string
}

export interface ResolveCheckoutWizardStepsInput {
  selectedPlan: OnboardingPlanSlug
  paymentMethod: PaymentMethod
  isAuthenticated: boolean
  form: CheckoutWizardFormValues
}

function hasValue(value: string) {
  return value.trim().length > 0
}

function isCheckoutFormReady(form: CheckoutWizardFormValues) {
  return hasValue(form.restaurantName) && hasValue(form.customerName) && hasValue(form.phone)
}

export function getCheckoutWizardSteps({
  selectedPlan,
  paymentMethod,
  isAuthenticated,
  form,
}: ResolveCheckoutWizardStepsInput): CheckoutWizardStep[] {
  const hasOfferSelection = Boolean(selectedPlan) && Boolean(paymentMethod)
  const hasReadyAccount = isAuthenticated && isCheckoutFormReady(form)

  return [
    {
      id: 'oferta',
      title: 'Oferta escolhida',
      description: 'Selecione plano e forma de pagamento na mesma tela.',
      status: hasOfferSelection ? 'complete' : 'current',
    },
    {
      id: 'cadastro',
      title: 'Dados de liberação',
      description: 'Confirme conta, nome do negócio e WhatsApp para liberar o template certo.',
      status: hasOfferSelection ? (hasReadyAccount ? 'complete' : 'current') : 'upcoming',
    },
    {
      id: 'pagamento',
      title: 'Pagamento e ativação',
      description: 'Revise o resumo e siga para o Mercado Pago.',
      status: hasOfferSelection && hasReadyAccount ? 'current' : 'upcoming',
    },
  ]
}

export function getCheckoutWizardProgress(steps: CheckoutWizardStep[]) {
  return steps.filter((step) => step.status === 'complete').length
}
