import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPrivateRepoAccessGrant } from '@/lib/domains/auth/private-repo-access'
import {
  buildPrivateRepoAccessLedgerRecord,
  buildPrivateRepoAccessRevokePatch,
} from '@/lib/domains/auth/private-repo-access-ledger'

const admin = {
  id: 'admin-1',
  email: 'owner@example.com',
  role: 'owner' as const,
}

test('private repo access ledger builds persistent record from commercial grant', () => {
  const grant = buildPrivateRepoAccessGrant({
    repository: 'TiagoIA-UX/Cardapio-Digital',
    githubUsername: 'cliente-pago',
    customerName: 'Cliente Pago',
    customerEmail: 'cliente@example.com',
    templateSlug: 'pizzaria',
    plan: 'pro',
    paidAmountCents: 99700,
    grantedBy: 'tiago',
  })

  const record = buildPrivateRepoAccessLedgerRecord(grant, admin)

  assert.equal(record.repository, 'TiagoIA-UX/Cardapio-Digital')
  assert.equal(record.github_username, 'cliente-pago')
  assert.equal(record.permission, 'pull')
  assert.equal(record.granted_by_admin_email, 'owner@example.com')
  assert.ok(Array.isArray(record.metadata.checklist))
})

test('private repo access ledger builds revoke patch with actor attribution', () => {
  const revoke = buildPrivateRepoAccessRevokePatch(
    {
      repository: 'TiagoIA-UX/Cardapio-Digital',
      githubUsername: 'cliente-pago',
      templateSlug: 'pizzaria',
      reason: 'chargeback confirmado',
    },
    admin
  )

  assert.equal(revoke.match.repository, 'TiagoIA-UX/Cardapio-Digital')
  assert.equal(revoke.match.github_username, 'cliente-pago')
  assert.equal(revoke.patch.revoked_by_admin_email, 'owner@example.com')
  assert.equal(revoke.patch.revoked_reason, 'chargeback confirmado')
  assert.ok(revoke.patch.revoked_at)
})

test('private repo access revoke patch rejects empty reason', () => {
  assert.throws(
    () =>
      buildPrivateRepoAccessRevokePatch(
        {
          repository: 'TiagoIA-UX/Cardapio-Digital',
          githubUsername: 'cliente-pago',
          templateSlug: 'pizzaria',
          reason: '   ',
        },
        admin
      ),
    /Motivo da revogação/
  )
})
