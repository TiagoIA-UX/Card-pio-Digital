#!/usr/bin/env node

/**
 * pre-merge-check.mjs
 * Script de validação pré-merge. Roda antes de qualquer merge para garantir
 * que o código está production-ready.
 *
 * Uso: node scripts/pre-merge-check.mjs
 *      npm run pre-merge
 */

import { execSync } from 'child_process'

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'

/** @type {{ name: string; cmd: string; required: boolean }[]} */
const CHECKS = [
  {
    name: 'TypeScript — verificação de tipos (tsc --noEmit)',
    cmd: 'npx tsc --noEmit',
    required: true,
  },
  {
    name: 'ESLint — análise estática',
    cmd: 'npm run lint',
    required: true,
  },
  {
    name: 'Next.js Build — compilação de produção',
    cmd: 'npm run build',
    required: true,
  },
  {
    name: 'Testes unitários',
    cmd: 'npm test',
    required: false,
  },
]

/**
 * Executa um comando e retorna se passou ou falhou.
 * @param {string} cmd
 * @returns {{ ok: boolean; output: string }}
 */
function runCheck(cmd) {
  try {
    const output = execSync(cmd, {
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 5 * 60 * 1000,
    })
    return { ok: true, output }
  } catch (/** @type {unknown} */ err) {
    const error = /** @type {{ stdout?: string; stderr?: string; message?: string }} */ (err)
    const output = [error.stdout ?? '', error.stderr ?? '', error.message ?? '']
      .filter(Boolean)
      .join('\n')
    return { ok: false, output }
  }
}

async function main() {
  console.log(`\n${BOLD}${BLUE}╔══════════════════════════════════════════════╗${RESET}`)
  console.log(`${BOLD}${BLUE}║     🔍 Cardápio Digital — Pre-Merge Check    ║${RESET}`)
  console.log(`${BOLD}${BLUE}╚══════════════════════════════════════════════╝${RESET}\n`)

  /** @type {{ name: string; ok: boolean; required: boolean; output: string }[]} */
  const results = []

  for (const check of CHECKS) {
    process.stdout.write(`${YELLOW}⏳ Rodando:${RESET} ${check.name} ... `)

    const { ok, output } = runCheck(check.cmd)
    results.push({ name: check.name, ok, required: check.required, output })

    if (ok) {
      console.log(`${GREEN}✅ OK${RESET}`)
    } else {
      const label = check.required ? `${RED}❌ FALHOU${RESET}` : `${YELLOW}⚠️  AVISO${RESET}`
      console.log(label)
      if (output) {
        console.log(`\n${output.slice(0, 1000)}\n`)
      }
    }
  }

  console.log(`\n${BOLD}${BLUE}══════════════════ Resultado Final ══════════════════${RESET}`)

  const failed = results.filter((r) => !r.ok && r.required)
  const warned = results.filter((r) => !r.ok && !r.required)
  const passed = results.filter((r) => r.ok)

  for (const r of passed) {
    console.log(`  ${GREEN}✅ ${r.name}${RESET}`)
  }
  for (const r of warned) {
    console.log(`  ${YELLOW}⚠️  ${r.name} (não obrigatório)${RESET}`)
  }
  for (const r of failed) {
    console.log(`  ${RED}❌ ${r.name}${RESET}`)
  }

  console.log()

  if (failed.length > 0) {
    console.log(
      `${BOLD}${RED}╔══════════════════════════════════════════════╗${RESET}`,
    )
    console.log(
      `${BOLD}${RED}║  ❌ DO NOT MERGE — ${failed.length} verificação(ões) falharam  ║${RESET}`,
    )
    console.log(
      `${BOLD}${RED}╚══════════════════════════════════════════════╝${RESET}\n`,
    )
    process.exit(1)
  } else {
    console.log(
      `${BOLD}${GREEN}╔══════════════════════════════════════════════╗${RESET}`,
    )
    console.log(
      `${BOLD}${GREEN}║     ✅ Safe to merge — todas as verificações  ║${RESET}`,
    )
    console.log(
      `${BOLD}${GREEN}║             passaram com sucesso!             ║${RESET}`,
    )
    console.log(
      `${BOLD}${GREEN}╚══════════════════════════════════════════════╝${RESET}\n`,
    )
    process.exit(0)
  }
}

main().catch((err) => {
  console.error(`${RED}Erro inesperado no script de pre-merge:${RESET}`, err)
  process.exit(1)
})
