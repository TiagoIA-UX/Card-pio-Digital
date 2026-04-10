import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { spawnSync } from 'node:child_process'

function collectTestFiles(dirPath) {
  const entries = readdirSync(dirPath)
  const files = []

  for (const entry of entries) {
    const fullPath = join(dirPath, entry)
    const stats = statSync(fullPath)

    if (stats.isDirectory()) {
      files.push(...collectTestFiles(fullPath))
      continue
    }

    if (entry.endsWith('.test.ts')) {
      files.push(fullPath)
    }
  }

  return files
}

const rootDir = process.cwd()
const testsDir = join(rootDir, 'tests')
const testFiles = collectTestFiles(testsDir)
  .map((filePath) => relative(rootDir, filePath))
  .sort((left, right) => left.localeCompare(right))

if (testFiles.length === 0) {
  console.error('Nenhum arquivo .test.ts encontrado em tests/.')
  process.exit(1)
}

const tsxCliPath = join(rootDir, 'node_modules', 'tsx', 'dist', 'cli.mjs')
const result = spawnSync(process.execPath, [tsxCliPath, '--test', ...testFiles], {
  stdio: 'inherit',
  cwd: rootDir,
  env: process.env,
})

if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
