#!/usr/bin/env tsx

import path from 'node:path'
import fs from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

type NomeOficial = 'ForgeOps' | 'ZAEA'
type ModoLegado = 'remove_all' | 'keep_legacy_alias'
type Fase = 'perguntar' | 'validar' | 'confirmar' | 'executar' | 'concluido' | 'bloqueado'

interface EstadoOrquestracao {
  nomeOficial?: NomeOficial
  modoLegado?: ModoLegado
  confirmado?: boolean
  executarMudancas?: boolean
  fase: Fase
}

interface ResultadoFluxo {
  fase: Fase
  motivo?: string
  perguntas?: string[]
}

const repoRoot = process.cwd()
const policyPath = path.join(repoRoot, 'docs/ops/naming-policy.json')

function getArg(name: string) {
  const prefix = `--${name}=`
  const arg = process.argv.find((value) => value.startsWith(prefix))
  return arg ? arg.slice(prefix.length).trim() : null
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`)
}

function parseNomeOficial(value: string | null): NomeOficial | undefined {
  if (!value) return undefined
  if (value === 'ForgeOps' || value === 'ZAEA') return value
  return undefined
}

function parseModoLegado(value: string | null): ModoLegado | undefined {
  if (!value) return undefined
  if (value === 'remove_all' || value === 'keep_legacy_alias') return value
  return undefined
}

function executarFluxo(state: EstadoOrquestracao): ResultadoFluxo {
  if (state.fase === 'perguntar') {
    return {
      fase: 'validar',
      perguntas: [
        'Qual será o nome oficial? (ForgeOps ou ZAEA)',
        'Você quer manter alias legado ou remover completamente? (keep_legacy_alias/remove_all)',
      ],
    }
  }

  if (state.fase === 'validar') {
    if (!state.nomeOficial || !state.modoLegado) {
      return { fase: 'bloqueado', motivo: 'Faltam respostas obrigatórias.' }
    }

    if (!['ForgeOps', 'ZAEA'].includes(state.nomeOficial)) {
      return { fase: 'bloqueado', motivo: 'Nome oficial inválido.' }
    }

    return { fase: 'confirmar' }
  }

  if (state.fase === 'confirmar') {
    if (!state.confirmado) {
      return { fase: 'bloqueado', motivo: 'Confirmação humana explícita é obrigatória.' }
    }
    return { fase: 'executar' }
  }

  if (state.fase === 'executar') {
    return { fase: 'concluido' }
  }

  return { fase: state.fase }
}

function ensurePolicyDir() {
  fs.mkdirSync(path.dirname(policyPath), { recursive: true })
}

function salvarPolicy(nomeOficial: NomeOficial, modoLegado: ModoLegado) {
  ensurePolicyDir()
  const data = {
    updatedAt: new Date().toISOString(),
    nomeOficial,
    modoLegado,
  }
  fs.writeFileSync(policyPath, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function mostrarUso() {
  console.log(
    [
      'Uso interativo (recomendado):',
      'npm run naming:orchestrate',
      '',
      'Uso não interativo:',
      'npm run naming:orchestrate -- --nome-oficial=ForgeOps --modo-legado=keep_legacy_alias --confirmar --execute',
      '',
      'Regras:',
      '- Sem respostas obrigatórias -> bloqueia',
      '- Sem --confirmar -> bloqueia',
      '- Sem --execute -> roda em dry-run (não persiste)',
    ].join('\n')
  )
}

async function obterEstadoInterativo(base: EstadoOrquestracao): Promise<EstadoOrquestracao> {
  const rl = createInterface({ input, output })
  try {
    const nome = (await rl.question('Qual será o nome oficial? (ForgeOps ou ZAEA): ')).trim()
    const modo = (
      await rl.question(
        'Manter alias legado ou remover totalmente? (keep_legacy_alias/remove_all): '
      )
    ).trim()
    const confirmar = (await rl.question('Confirma execução? (sim/nao): ')).trim().toLowerCase()
    const executar = (
      await rl.question('Executar mudanças reais agora? (sim/nao, padrão: nao): ')
    )
      .trim()
      .toLowerCase()

    return {
      ...base,
      nomeOficial: parseNomeOficial(nome),
      modoLegado: parseModoLegado(modo),
      confirmado: confirmar === 'sim',
      executarMudancas: executar === 'sim',
    }
  } finally {
    rl.close()
  }
}

async function main() {
  if (hasFlag('help')) {
    mostrarUso()
    return
  }

  const nonInteractive = hasFlag('non-interactive')
  let state: EstadoOrquestracao = {
    fase: 'perguntar',
    nomeOficial: parseNomeOficial(getArg('nome-oficial')),
    modoLegado: parseModoLegado(getArg('modo-legado')),
    confirmado: hasFlag('confirmar'),
    executarMudancas: hasFlag('execute'),
  }

  const primeiroPasso = executarFluxo(state)
  if (primeiroPasso.perguntas && !nonInteractive) {
    console.log('Perguntas obrigatórias:')
    for (const pergunta of primeiroPasso.perguntas) {
      console.log(`- ${pergunta}`)
    }
    state = await obterEstadoInterativo({ ...state, fase: 'validar' })
  } else {
    state.fase = 'validar'
  }

  const validacao = executarFluxo(state)
  if (validacao.fase === 'bloqueado') {
    console.error(`Bloqueado: ${validacao.motivo}`)
    process.exit(1)
  }

  state.fase = 'confirmar'
  const confirmacao = executarFluxo(state)
  if (confirmacao.fase === 'bloqueado') {
    console.error(`Bloqueado: ${confirmacao.motivo}`)
    process.exit(1)
  }

  state.fase = 'executar'
  const execucao = executarFluxo(state)
  if (execucao.fase !== 'concluido') {
    console.error('Fluxo não concluído por inconsistência interna.')
    process.exit(1)
  }

  if (!state.executarMudancas) {
    console.log('Dry-run concluído com sucesso. Nenhuma mudança persistida.')
    console.log(`Nome oficial sugerido: ${state.nomeOficial}`)
    console.log(`Modo legado sugerido: ${state.modoLegado}`)
    console.log('Para aplicar de verdade, rode com --execute.')
    return
  }

  salvarPolicy(state.nomeOficial as NomeOficial, state.modoLegado as ModoLegado)
  console.log(`Concluído: política salva em ${path.relative(repoRoot, policyPath)}`)
  console.log(`Nome oficial: ${state.nomeOficial}`)
  console.log(`Modo legado: ${state.modoLegado}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})

