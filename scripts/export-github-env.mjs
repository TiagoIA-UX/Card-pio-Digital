import { appendFileSync } from 'node:fs'

const outputPath = process.env.GITHUB_ENV
const secretsContext = process.env.SECRETS_CONTEXT ?? '{}'
const keysJson = process.env.EXPORT_KEYS_JSON ?? '[]'

if (!outputPath) {
  console.error('GITHUB_ENV não definido.')
  process.exit(1)
}

let secrets
let keys

try {
  secrets = JSON.parse(secretsContext)
  keys = JSON.parse(keysJson)
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Falha ao ler contexto de exportação.')
  process.exit(1)
}

if (!Array.isArray(keys)) {
  console.error('EXPORT_KEYS_JSON deve ser um array JSON.')
  process.exit(1)
}

const lines = []

for (const entry of keys) {
  const key = typeof entry === 'string' ? entry : entry?.target
  const source = typeof entry === 'string' ? entry : (entry?.source ?? entry?.target)

  if (!key || !source) {
    continue
  }

  const value = secrets[source]
  if (!value) {
    continue
  }

  lines.push(`${key}<<__EOF__`)
  lines.push(String(value))
  lines.push('__EOF__')
}

if (lines.length > 0) {
  appendFileSync(outputPath, `${lines.join('\n')}\n`)
}
