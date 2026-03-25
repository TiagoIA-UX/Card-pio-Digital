export interface CreateDeliveryWizardFormValues {
  nome: string
  slug: string
  telefone: string
}

export type SetupWizardStepStatus = 'complete' | 'current' | 'upcoming'

export interface SetupWizardStep {
  id: 'negocio' | 'contato' | 'publicacao'
  title: string
  description: string
  status: SetupWizardStepStatus
}

function hasValue(value: string) {
  return value.trim().length > 0
}

export function getCreateDeliveryWizardSteps(
  form: CreateDeliveryWizardFormValues,
  remainingCredits: number
): SetupWizardStep[] {
  const hasBusinessIdentity = hasValue(form.nome) && hasValue(form.slug)
  const hasContactChannel = hasValue(form.telefone)
  const canPublish = hasBusinessIdentity && hasContactChannel && remainingCredits > 0

  return [
    {
      id: 'negocio',
      title: 'Dados do delivery',
      description: 'Defina nome e link principal do canal digital.',
      status: hasBusinessIdentity ? 'complete' : 'current',
    },
    {
      id: 'contato',
      title: 'Canal de pedidos',
      description: 'Configure o WhatsApp que vai receber os pedidos.',
      status: hasBusinessIdentity ? (hasContactChannel ? 'complete' : 'current') : 'upcoming',
    },
    {
      id: 'publicacao',
      title: 'Publicação inicial',
      description: 'Revise os dados e entre no painel para continuar a configuração.',
      status:
        hasBusinessIdentity && hasContactChannel
          ? canPublish
            ? 'current'
            : 'upcoming'
          : 'upcoming',
    },
  ]
}

export function getCreateDeliveryWizardProgress(steps: SetupWizardStep[]) {
  return steps.filter((step) => step.status === 'complete').length
}
