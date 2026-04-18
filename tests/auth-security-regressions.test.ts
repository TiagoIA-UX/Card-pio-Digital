import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const proxySource = readFileSync(resolve(__dirname, '..', 'proxy.ts'), 'utf-8')
const adminAuthSource = readFileSync(
  resolve(__dirname, '..', 'lib', 'domains', 'auth', 'admin-auth.ts'),
  'utf-8'
)

test('proxy valida auth com getUser em vez de getSession', () => {
  assert.match(proxySource, /supabase\.auth\.getUser\(\)/)
  assert.doesNotMatch(proxySource, /supabase\.auth\.getSession\(\)/)
})

test('proxy distingue falha operacional de ausência de permissão admin', () => {
  assert.match(proxySource, /error:\s*adminLookupError/)
  assert.match(proxySource, /Admin authorization check failed/)
  assert.match(proxySource, /status:\s*503/)
  assert.match(proxySource, /new URL\('\/painel', request\.url\)/)
})

test('admin auth registra trilha no acesso por ADMIN_SECRET_KEY', () => {
  assert.match(adminAuthSource, /Service-account admin access granted/)
  assert.match(adminAuthSource, /path:\s*req\.nextUrl\.pathname/)
  assert.match(adminAuthSource, /method:\s*req\.method/)
})

test('proxy documenta limitação do rate limit por instância', () => {
  assert.match(proxySource, /local ao processo\/instância/)
  assert.match(proxySource, /backend distribuído/)
})
