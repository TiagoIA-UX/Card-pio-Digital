#!/usr/bin/env node

const color = {
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
}

const PERMISSIONS = {
  'panel.authenticated-user': {
    label: 'Usuario autenticado no painel',
    description: 'Sessao Supabase valida para navegar nas rotas autenticadas.',
  },
  'panel.commercial-access': {
    label: 'Acesso comercial liberado',
    description: 'Compra ativa ou pedido aprovado suficiente para criar/acessar delivery.',
  },
  'panel.tenant-owned': {
    label: 'Tenant ativo pertence ao usuario',
    description: 'restaurant selecionado precisa pertencer ao usuario autenticado.',
  },
  'panel.editor-write': {
    label: 'Permissao de escrita no editor',
    description: 'Usuario com delivery provisionado pode editar branding, blocos e configuracoes.',
  },
  'panel.catalog-write': {
    label: 'Permissao de escrita no catalogo',
    description: 'Usuario pode editar produtos, categorias e dados usados pelo preview.',
  },
  'panel.orders-read': {
    label: 'Permissao de leitura operacional',
    description:
      'Usuario pode consultar pedidos, QR code e configuracoes operacionais do delivery.',
  },
  'admin.support': {
    label: 'Admin support',
    description: 'Leitura e operacoes de suporte em rotas /api/admin/* com role minima support.',
  },
  'admin.admin': {
    label: 'Admin admin',
    description: 'Operacoes administrativas de provisionamento, metricas e manutencao.',
  },
  'admin.owner': {
    label: 'Admin owner',
    description: 'Operacoes sensiveis de gestao total e service account por ADMIN_SECRET_KEY.',
  },
  'service.rate-limit': {
    label: 'Rate limit ativo nas APIs',
    description: 'Mutacoes sensiveis devem manter withRateLimit e identificador consistente.',
  },
  'service.audit-log': {
    label: 'Auditoria de eventos',
    description: 'Mudancas criticas devem gerar trilha auditavel para suporte e investigacao.',
  },
}

const TASKS = [
  {
    phase: 'Fase 1',
    id: '1.1',
    title: 'Extrair painel shell minimo',
    goal: 'Separar carregamento de sessao, acesso comercial, tenant ativo e renderizacao do menu.',
    requires: ['panel.authenticated-user', 'panel.commercial-access', 'panel.tenant-owned'],
    touches: ['app/painel/layout.tsx', 'lib/active-restaurant.ts'],
    validations: ['npm run check', 'npm run test:e2e:painel-context-auth'],
  },
  {
    phase: 'Fase 1',
    id: '1.2',
    title: 'Criar route registry do painel',
    goal: 'Remover menu hardcoded do layout e registrar modulos com match, href e capability.',
    requires: ['panel.authenticated-user', 'panel.tenant-owned'],
    touches: ['app/painel/layout.tsx', 'lib/panel/*'],
    validations: ['npm run check'],
  },
  {
    phase: 'Fase 1',
    id: '1.3',
    title: 'Definir capability resolver',
    goal: 'Traduzir status comercial, tenant e contexto operacional em capacidades reutilizaveis.',
    requires: ['panel.authenticated-user', 'panel.commercial-access', 'panel.tenant-owned'],
    touches: ['lib/panel/*', 'app/painel/layout.tsx', 'app/meus-templates/page.tsx'],
    validations: ['npm run check', 'npm test'],
  },
  {
    phase: 'Fase 2',
    id: '2.1',
    title: 'Separar workspace do editor',
    goal: 'Quebrar a pagina gigante em workspace, canvas, inspector e outline.',
    requires: ['panel.editor-write', 'panel.tenant-owned', 'panel.catalog-write'],
    touches: ['app/painel/editor/page.tsx', 'components/template-editor/*'],
    validations: ['npm run check', 'npm test'],
  },
  {
    phase: 'Fase 2',
    id: '2.2',
    title: 'Introduzir schema de blocos',
    goal: 'Trocar estado espalhado por definicoes declarativas de bloco, campo e inspector.',
    requires: ['panel.editor-write', 'panel.catalog-write'],
    touches: [
      'components/template-editor/*',
      'lib/cardapio-renderer.ts',
      'lib/restaurant-customization.ts',
    ],
    validations: ['npm run check', 'npm test'],
  },
  {
    phase: 'Fase 2',
    id: '2.3',
    title: 'Criar adapter draft para preview',
    goal: 'Formalizar a conversao entre estado de edicao e preview sem acoplar preview ao persistido.',
    requires: ['panel.editor-write', 'panel.catalog-write', 'service.audit-log'],
    touches: ['lib/cardapio-renderer.ts', 'components/template-editor/*'],
    validations: ['npm run check', 'npm test'],
  },
  {
    phase: 'Fase 3',
    id: '3.1',
    title: 'Formalizar lifecycle do template',
    goal: 'Transformar compra, provisao e ativacao em estados explicitos e auditaveis.',
    requires: ['panel.commercial-access', 'admin.admin', 'service.audit-log'],
    touches: [
      'app/api/pagamento/*',
      'app/api/onboarding/*',
      'app/api/webhook/mercadopago/route.ts',
    ],
    validations: ['npm run check', 'npm run test:webhook', 'npm run test:e2e:checkout'],
  },
  {
    phase: 'Fase 3',
    id: '3.2',
    title: 'Criar bloqueios seguros de acesso',
    goal: 'Negar editor e painel quando tenant, ativacao ou vinculacao comercial estiverem inconsistentes.',
    requires: ['panel.authenticated-user', 'panel.commercial-access', 'panel.tenant-owned'],
    touches: ['app/painel/layout.tsx', 'app/meus-templates/page.tsx', 'app/painel/editor/page.tsx'],
    validations: ['npm run check', 'npm run test:e2e:painel-context-auth'],
  },
  {
    phase: 'Fase 4',
    id: '4.1',
    title: 'Agrupar APIs admin por dominio',
    goal: 'Separar tenant-context, editor, catalog, template-lifecycle e observability em dominios claros.',
    requires: ['admin.support', 'admin.admin', 'service.rate-limit'],
    touches: ['app/api/admin/*', 'lib/admin-auth.ts', 'lib/rate-limit.ts'],
    validations: ['npm run check', 'npm test'],
  },
  {
    phase: 'Fase 4',
    id: '4.2',
    title: 'Preservar gates de seguranca',
    goal: 'Garantir requireAdmin, rate limit, ownership check e segredos de servico nas mutacoes novas.',
    requires: ['admin.support', 'admin.admin', 'admin.owner', 'service.rate-limit'],
    touches: ['app/api/admin/*', 'app/api/pagamento/*', 'app/api/onboarding/*'],
    validations: ['npm run check', 'npm test'],
  },
  {
    phase: 'Fase 5',
    id: '5.1',
    title: 'Cobrir regressao critica do painel',
    goal: 'Proteger menu por capability, troca de tenant, editor-save-preview e acesso bloqueado.',
    requires: ['panel.authenticated-user', 'panel.tenant-owned', 'panel.editor-write'],
    touches: ['tests/e2e/*', 'tests/**/*.test.ts'],
    validations: ['npm run check', 'npm test', 'npm run test:e2e:painel-context-auth'],
  },
  {
    phase: 'Fase 5',
    id: '5.2',
    title: 'Validar fluxo comercial final',
    goal: 'Assegurar que checkout, aprovacao, provisao e editor permanecem consistentes ponta a ponta.',
    requires: ['panel.commercial-access', 'admin.admin', 'service.audit-log'],
    touches: ['tests/e2e/*', 'scripts/test-webhook-mp.ts', 'scripts/simulate-onboarding.ts'],
    validations: [
      'npm run check',
      'npm run test:e2e:checkout',
      'npm run test:webhook',
      'npm run simulate:onboarding',
    ],
  },
]

const args = new Set(process.argv.slice(2))
const asJson = args.has('--json')
const phaseFilterArg = [...args].find((arg) => arg.startsWith('--phase='))
const phaseFilter = phaseFilterArg ? phaseFilterArg.split('=')[1] : null

const filteredTasks = phaseFilter
  ? TASKS.filter((task) => task.phase.toLowerCase() === phaseFilter.toLowerCase())
  : TASKS

if (asJson) {
  process.stdout.write(JSON.stringify({ permissions: PERMISSIONS, tasks: filteredTasks }, null, 2))
  process.exit(0)
}

console.log('')
console.log(color.bold('SCRIPT DE TAREFAS - REIMPLEMENTACAO DO EDITOR/Painel'))
console.log(color.gray('Execucao segura, incremental e sempre validada por testes.'))

console.log(`\n${color.bold('Permissoes obrigatorias do dominio')}`)
console.log('----------------------------------------------------------')

for (const [id, permission] of Object.entries(PERMISSIONS)) {
  console.log(`- ${color.cyan(id)}: ${permission.label}`)
  console.log(`  ${color.gray(permission.description)}`)
}

let currentPhase = null

for (const task of filteredTasks) {
  if (task.phase !== currentPhase) {
    currentPhase = task.phase
    console.log(`\n${color.bold(currentPhase)}`)
    console.log('----------------------------------------------------------')
  }

  console.log(`${color.green(task.id)} ${task.title}`)
  console.log(`  Objetivo: ${task.goal}`)
  console.log(`  Permissoes: ${task.requires.join(', ')}`)
  console.log(`  Arquivos/escopo: ${task.touches.join(', ')}`)
  console.log(`  Validacoes: ${task.validations.join(' | ')}`)
}

console.log(`\n${color.bold('Uso')}`)
console.log('----------------------------------------------------------')
console.log('- npm run tasks:editor-panel')
console.log('- npm run tasks:editor-panel -- --json')
console.log('- npm run tasks:editor-panel -- --phase=Fase 2')

console.log(`\n${color.bold('Regra de ouro')}`)
console.log('----------------------------------------------------------')
console.log(
  'Nenhuma fase e considerada concluida sem manter gates de permissao, tenant ownership e pelo menos os comandos de validacao listados para a etapa.'
)
