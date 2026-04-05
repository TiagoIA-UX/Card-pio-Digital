export const PRIVATE_REPO_ACCESS_PLANS = ['starter', 'pro', 'white-label'] as const

export type PrivateRepoAccessPlan = (typeof PRIVATE_REPO_ACCESS_PLANS)[number]

export interface BuildPrivateRepoAccessInput {
  repository: string
  githubUsername: string
  customerName: string
  customerEmail: string
  templateSlug: string
  plan: PrivateRepoAccessPlan
  paidAmountCents: number
  paidCurrency?: string
  grantedBy: string
  expiresAt?: string | null
}

export interface PrivateRepoAccessGrant {
  repository: string
  githubUsername: string
  customerName: string
  customerEmail: string
  templateSlug: string
  plan: PrivateRepoAccessPlan
  paidAmountCents: number
  paidCurrency: string
  grantedBy: string
  permission: 'pull'
  visibility: 'private'
  licenseModel: 'BUSL-1.1 + commercial grant'
  expiresAt: string | null
  inviteCommand: string
  revokeCommand: string
  checklist: string[]
}

function quoteForPowerShell(value: string) {
  return `'${value.replace(/'/g, "''")}'`
}

export function normalizeGithubUsername(value: string) {
  return value.trim().replace(/^@/, '')
}

export function isValidGithubUsername(value: string) {
  const normalized = normalizeGithubUsername(value)
  return /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(normalized)
}

export function normalizeRepositorySlug(value: string) {
  return value
    .trim()
    .replace(/^https:\/\/github\.com\//i, '')
    .replace(/\.git$/i, '')
}

export function isValidRepositorySlug(value: string) {
  return /^[\w.-]+\/[\w.-]+$/.test(normalizeRepositorySlug(value))
}

export function normalizeTemplateSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function buildPrivateRepoAccessGrant(
  input: BuildPrivateRepoAccessInput
): PrivateRepoAccessGrant {
  const repository = normalizeRepositorySlug(input.repository)
  const githubUsername = normalizeGithubUsername(input.githubUsername)
  const templateSlug = normalizeTemplateSlug(input.templateSlug)
  const paidCurrency = (input.paidCurrency || 'BRL').trim().toUpperCase()

  if (!isValidRepositorySlug(repository)) {
    throw new Error('Repositório inválido. Use o formato owner/repo.')
  }

  if (!isValidGithubUsername(githubUsername)) {
    throw new Error('Usuário GitHub inválido para convite de acesso privado.')
  }

  if (!templateSlug) {
    throw new Error('Template inválido para concessão de acesso.')
  }

  if (!input.customerName.trim()) {
    throw new Error('Nome do cliente é obrigatório.')
  }

  if (!input.customerEmail.trim() || !input.customerEmail.includes('@')) {
    throw new Error('Email do cliente é obrigatório.')
  }

  if (!Number.isFinite(input.paidAmountCents) || input.paidAmountCents <= 0) {
    throw new Error('Valor pago deve ser maior que zero.')
  }

  const apiPath = `/repos/${repository}/collaborators/${githubUsername}`
  const inviteCommand = [
    'gh api',
    '-X PUT',
    quoteForPowerShell(apiPath),
    '-f permission=pull',
  ].join(' ')
  const revokeCommand = ['gh api', '-X DELETE', quoteForPowerShell(apiPath)].join(' ')

  return {
    repository,
    githubUsername,
    customerName: input.customerName.trim(),
    customerEmail: input.customerEmail.trim().toLowerCase(),
    templateSlug,
    plan: input.plan,
    paidAmountCents: input.paidAmountCents,
    paidCurrency,
    grantedBy: input.grantedBy.trim(),
    permission: 'pull',
    visibility: 'private',
    licenseModel: 'BUSL-1.1 + commercial grant',
    expiresAt: input.expiresAt?.trim() || null,
    inviteCommand,
    revokeCommand,
    checklist: [
      'Confirmar pagamento compensado e valor coerente com o plano vendido.',
      'Registrar aceite da licença comercial e do escopo de uso do template.',
      `Conceder acesso pull somente ao usuário GitHub ${githubUsername}.`,
      'Não compartilhar acesso com organizações ou times sem contrato específico.',
      'Revogar acesso imediatamente em caso de chargeback, inadimplência ou violação contratual.',
    ],
  }
}
