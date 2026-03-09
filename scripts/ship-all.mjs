import { spawnSync } from 'node:child_process'

function runNpm(scriptName) {
  if (process.platform === 'win32') {
    return {
      command: 'cmd.exe',
      args: ['/d', '/s', '/c', `npm run ${scriptName}`],
    }
  }

  return {
    command: 'npm',
    args: ['run', scriptName],
  }
}

const steps = [
  {
    title: 'Validar ambiente',
    ...runNpm('doctor'),
    required: true,
  },
  {
    title: 'Executar lint',
    ...runNpm('lint'),
    required: true,
  },
  {
    title: 'Executar testes',
    ...runNpm('test'),
    required: true,
  },
  {
    title: 'Simular onboarding',
    ...runNpm('simulate:onboarding'),
    required: false,
  },
]

const results = []

for (const step of steps) {
  console.log(`\n==> ${step.title}`)

  const run = spawnSync(step.command, step.args, {
    stdio: 'inherit',
    env: process.env,
  })

  if (run.error) {
    console.error(run.error)
  }

  const success = run.status === 0
  results.push({ ...step, success, code: run.status ?? 1 })

  if (!success && step.required) {
    console.error(`\nFluxo interrompido em: ${step.title}`)
    printSummary(results)
    process.exit(run.status ?? 1)
  }

  if (!success && !step.required) {
    console.warn(`\nEtapa opcional falhou: ${step.title}`)
  }
}

printSummary(results)

function printSummary(items) {
  console.log('\nResumo do fluxo:')
  for (const item of items) {
    const status = item.success ? 'OK' : item.required ? 'FALHOU' : 'AVISO'
    console.log(`- [${status}] ${item.title}`)
  }

  const requiredFailures = items.filter((item) => !item.success && item.required)
  if (requiredFailures.length > 0) {
    console.error('\nExistem etapas obrigatorias com falha.')
    return
  }

  console.log('\nFluxo principal concluido.')
  console.log('Se quiser seguir para entrega, revise o diff e depois faça commit/push.')
}