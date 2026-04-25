import { execSync } from 'node:child_process'
import {
  PRIVATE_REPO_ACCESS_PLANS,
  buildPrivateRepoAccessGrant,
  type PrivateRepoAccessPlan,
} from '@/lib/domains/auth/private-repo-access'

interface ParsedArgs {
  repository: string
  githubUsername: string
  customerName: string
  customerEmail: string
  templateSlug: string
  plan: PrivateRepoAccessPlan
  paidAmountCents: number
  paidCurrency: string
  grantedBy: string
  expiresAt: string | null
  dryRun: boolean
}

function printHelp() {
  console.log(`
Uso:
  npx tsx scripts/grant-private-repo-access.ts --github usuario --customer "Nome" --email cliente@dominio.com --template pizzaria --plan pro --price 99700 --granted-by tiago

Flags:
  --repository  owner/repo            Default: env GITHUB_REPOSITORY ou TiagoIA-UX/Cardapio-Digital
  --github      usuario-github        Obrigatório
  --customer    Nome do cliente       Obrigatório
  --email       Email do cliente      Obrigatório
  --template    slug do template      Obrigatório
  --plan        ${PRIVATE_REPO_ACCESS_PLANS.join(' | ')}
  --price       valor em centavos     Obrigatório
  --currency    moeda                 Default: BRL
  --granted-by  operador              Obrigatório
  --expires-at  ISO date opcional
  --dry-run                           Default: true
  --apply                             Executa convite real via gh api
  --help
`)
}

function getArgValue(args: string[], flag: string) {
  const index = args.indexOf(flag)
  if (index === -1) return null
  return args[index + 1] || null
}

function hasFlag(args: string[], flag: string) {
  return args.includes(flag)
}

function parseArgs(argv: string[]): ParsedArgs {
  if (hasFlag(argv, '--help')) {
    printHelp()
    process.exit(0)
  }

  const repository =
    getArgValue(argv, '--repository') ||
    process.env.GITHUB_REPOSITORY ||
    'TiagoIA-UX/Cardapio-Digital'
  const githubUsername = getArgValue(argv, '--github') || ''
  const customerName = getArgValue(argv, '--customer') || ''
  const customerEmail = getArgValue(argv, '--email') || ''
  const templateSlug = getArgValue(argv, '--template') || ''
  const plan = (getArgValue(argv, '--plan') || 'pro') as PrivateRepoAccessPlan
  const paidAmountCents = Number(getArgValue(argv, '--price') || '0')
  const paidCurrency = getArgValue(argv, '--currency') || 'BRL'
  const grantedBy = getArgValue(argv, '--granted-by') || ''
  const expiresAt = getArgValue(argv, '--expires-at') || null
  const dryRun = !hasFlag(argv, '--apply')

  if (!PRIVATE_REPO_ACCESS_PLANS.includes(plan)) {
    throw new Error(`Plano inválido. Use: ${PRIVATE_REPO_ACCESS_PLANS.join(', ')}`)
  }

  return {
    repository,
    githubUsername,
    customerName,
    customerEmail,
    templateSlug,
    plan,
    paidAmountCents,
    paidCurrency,
    grantedBy,
    expiresAt,
    dryRun,
  }
}

function ensureGhCliAvailable() {
  execSync('gh --version', { stdio: 'ignore' })
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const grant = buildPrivateRepoAccessGrant(args)

  console.log(JSON.stringify({ dryRun: args.dryRun, grant }, null, 2))

  if (args.dryRun) {
    return
  }

  ensureGhCliAvailable()
  execSync(grant.inviteCommand, { stdio: 'inherit', shell: 'powershell.exe' })
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

