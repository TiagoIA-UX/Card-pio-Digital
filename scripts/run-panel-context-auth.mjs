import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'

const storageStatePath = process.env.PLAYWRIGHT_CLIENT_STORAGE_STATE || 'private/playwright-auth/client.json'

if (!existsSync(storageStatePath)) {
  console.error(`Auth file não encontrado em ${storageStatePath}`)
  console.error('Gere primeiro com: npm run auth:cliente')
  process.exit(1)
}

const child = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['playwright', 'test', 'tests/e2e/painel-context-regression.spec.ts', '--project=chromium'],
  {
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      PLAYWRIGHT_CLIENT_STORAGE_STATE: storageStatePath,
    },
  }
)

child.on('exit', (code) => {
  process.exit(code ?? 1)
})
