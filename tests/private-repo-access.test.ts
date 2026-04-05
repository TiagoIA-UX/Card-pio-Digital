import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildPrivateRepoAccessGrant,
  isValidGithubUsername,
  isValidRepositorySlug,
  normalizeGithubUsername,
  normalizeRepositorySlug,
  normalizeTemplateSlug,
} from '@/lib/domains/auth/private-repo-access'

test('private repo access helpers normalize repository, username and template slugs', () => {
  assert.equal(normalizeGithubUsername('@TiagoIA-UX'), 'TiagoIA-UX')
  assert.equal(
    normalizeRepositorySlug('https://github.com/TiagoIA-UX/Cardapio-Digital.git'),
    'TiagoIA-UX/Cardapio-Digital'
  )
  assert.equal(normalizeTemplateSlug('Pizza Premium'), 'pizza-premium')
})

test('private repo access validation accepts valid GitHub identifiers', () => {
  assert.equal(isValidGithubUsername('tiago-ux'), true)
  assert.equal(isValidGithubUsername('-tiago'), false)
  assert.equal(isValidRepositorySlug('TiagoIA-UX/Cardapio-Digital'), true)
  assert.equal(isValidRepositorySlug('repositorio-invalido'), false)
})

test('private repo access grant builds a pull-only invitation workflow', () => {
  const grant = buildPrivateRepoAccessGrant({
    repository: 'TiagoIA-UX/Cardapio-Digital',
    githubUsername: '@cliente-pago',
    customerName: 'Cliente Pago',
    customerEmail: 'cliente@example.com',
    templateSlug: 'Pizzaria Pro',
    plan: 'pro',
    paidAmountCents: 99700,
    paidCurrency: 'brl',
    grantedBy: 'tiago',
  })

  assert.equal(grant.permission, 'pull')
  assert.equal(grant.visibility, 'private')
  assert.equal(grant.githubUsername, 'cliente-pago')
  assert.equal(grant.templateSlug, 'pizzaria-pro')
  assert.match(grant.inviteCommand, /gh api/)
  assert.match(grant.inviteCommand, /permission=pull/)
  assert.match(grant.revokeCommand, /-X DELETE/)
  assert.ok(grant.checklist.length >= 4)
})

test('private repo access grant rejects missing commercial data', () => {
  assert.throws(
    () =>
      buildPrivateRepoAccessGrant({
        repository: 'TiagoIA-UX/Cardapio-Digital',
        githubUsername: 'cliente-pago',
        customerName: ' ',
        customerEmail: 'cliente@example.com',
        templateSlug: 'pizzaria',
        plan: 'pro',
        paidAmountCents: 99700,
        grantedBy: 'tiago',
      }),
    /Nome do cliente/
  )
})
