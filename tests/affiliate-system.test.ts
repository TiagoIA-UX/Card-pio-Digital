import test from 'node:test'
import assert from 'node:assert/strict'
import {
  AFFILIATE_TIERS,
  getTierByRestaurantes,
  getNextTier,
  getComissaoDireta,
  getTotalBonusAcumulado,
} from '@/lib/domains/affiliate/affiliate-tiers'
import {
  getAffiliateApprovalDate,
  getNextAffiliatePayoutDate,
  getAffiliatePayoutWindow,
  AFFILIATE_APPROVAL_WINDOW_DAYS,
} from '@/lib/domains/affiliate/affiliate-payout'
import {
  validatePayoutItemSnapshot,
  buildPayoutBatchValidationSummary,
  buildPayoutCsv,
  formatValidationErrors,
} from '@/lib/domains/affiliate/payout-batches'

// ═══════════════════════════════════════════════════════════════
// Tiers — hierarquia
// ═══════════════════════════════════════════════════════════════

test('AFFILIATE_TIERS tem 6 níveis', () => {
  assert.equal(AFFILIATE_TIERS.length, 6)
})

test('Tiers são ordenados por minRestaurantes crescente', () => {
  for (let i = 1; i < AFFILIATE_TIERS.length; i++) {
    assert.ok(AFFILIATE_TIERS[i].minRestaurantes > AFFILIATE_TIERS[i - 1].minRestaurantes)
  }
})

test('Último tier tem maxRestaurantes Infinity', () => {
  assert.equal(AFFILIATE_TIERS[AFFILIATE_TIERS.length - 1].maxRestaurantes, Infinity)
})

test('getTierByRestaurantes(0) → trainee', () => {
  assert.equal(getTierByRestaurantes(0).slug, 'trainee')
})

test('getTierByRestaurantes(3) → analista', () => {
  assert.equal(getTierByRestaurantes(3).slug, 'analista')
})

test('getTierByRestaurantes(10) → coordenador', () => {
  assert.equal(getTierByRestaurantes(10).slug, 'coordenador')
})

test('getTierByRestaurantes(25) → gerente', () => {
  assert.equal(getTierByRestaurantes(25).slug, 'gerente')
})

test('getTierByRestaurantes(50) → diretor', () => {
  assert.equal(getTierByRestaurantes(50).slug, 'diretor')
})

test('getTierByRestaurantes(100) → socio', () => {
  assert.equal(getTierByRestaurantes(100).slug, 'socio')
})

test('getTierByRestaurantes(9999) → socio', () => {
  assert.equal(getTierByRestaurantes(9999).slug, 'socio')
})

test('getNextTier de trainee → analista', () => {
  const trainee = getTierByRestaurantes(0)
  const next = getNextTier(trainee)
  assert.equal(next?.slug, 'analista')
})

test('getNextTier de socio → null', () => {
  const socio = getTierByRestaurantes(100)
  assert.equal(getNextTier(socio), null)
})

// ═══════════════════════════════════════════════════════════════
// Comissão
// ═══════════════════════════════════════════════════════════════

test('Comissão base é 30%', () => {
  const trainee = getTierByRestaurantes(0)
  assert.equal(getComissaoDireta(trainee), 0.3)
})

test('Diretor recebe +2% extra (32% total)', () => {
  const diretor = getTierByRestaurantes(50)
  assert.equal(getComissaoDireta(diretor), 0.32)
})

test('Sócio recebe +5% extra (35% total)', () => {
  const socio = getTierByRestaurantes(100)
  assert.equal(getComissaoDireta(socio), 0.35)
})

// ═══════════════════════════════════════════════════════════════
// Bônus acumulado
// ═══════════════════════════════════════════════════════════════

test('Bônus acumulado trainee = 0', () => {
  assert.equal(getTotalBonusAcumulado('trainee'), 0)
})

test('Bônus acumulado socio = R$185', () => {
  assert.equal(getTotalBonusAcumulado('socio'), 185)
})

test('Bônus acumulado coordenador = R$10', () => {
  assert.equal(getTotalBonusAcumulado('coordenador'), 10)
})

// ═══════════════════════════════════════════════════════════════
// Payout dates
// ═══════════════════════════════════════════════════════════════

test('Aprovação é 30 dias após criação', () => {
  const created = new Date('2026-01-01T12:00:00Z')
  const approval = getAffiliateApprovalDate(created)
  assert.equal(approval.getUTCDate(), 31)
  assert.equal(approval.getUTCMonth(), 0) // Janeiro
})

test('AFFILIATE_APPROVAL_WINDOW_DAYS = 30', () => {
  assert.equal(AFFILIATE_APPROVAL_WINDOW_DAYS, 30)
})

test('Próximo pagamento: antes do dia 1 → dia 1 do mês', () => {
  const now = new Date(Date.UTC(2026, 3, 1, 0, 0, 0)) // 1 de abril
  const result = getNextAffiliatePayoutDate(now)
  assert.equal(result.data, '2026-04-01')
  assert.equal(result.dias, 0)
})

test('Próximo pagamento: dia 2 → dia 15', () => {
  const now = new Date(Date.UTC(2026, 3, 2, 0, 0, 0)) // 2 de abril
  const result = getNextAffiliatePayoutDate(now)
  assert.equal(result.data, '2026-04-15')
})

test('Próximo pagamento: dia 16 → dia 1 do mês seguinte', () => {
  const now = new Date(Date.UTC(2026, 3, 16, 0, 0, 0)) // 16 de abril
  const result = getNextAffiliatePayoutDate(now)
  assert.equal(result.data, '2026-05-01')
})

test('Janela de pagamento do dia 15 = Q1', () => {
  const now = new Date(Date.UTC(2026, 3, 15)) // 15 de abril
  const window = getAffiliatePayoutWindow(now)
  assert.ok(window)
  assert.ok(window.referencia.endsWith('-Q1'))
})

test('Janela de pagamento do dia 1 = Q2 do mês anterior', () => {
  const now = new Date(Date.UTC(2026, 3, 1)) // 1 de abril
  const window = getAffiliatePayoutWindow(now)
  assert.ok(window)
  assert.ok(window.referencia.endsWith('-Q2'))
})

test('Janela de pagamento em dia aleatório = null', () => {
  const now = new Date(Date.UTC(2026, 3, 10)) // 10 de abril
  const window = getAffiliatePayoutWindow(now)
  assert.equal(window, null)
})

// ═══════════════════════════════════════════════════════════════
// Payout batches — validação de itens
// ═══════════════════════════════════════════════════════════════

test('Snapshot válido → pronto', () => {
  const result = validatePayoutItemSnapshot({
    affiliateId: 'aff-1',
    affiliateName: 'João',
    amount: 50,
    pixKey: '12345678900',
  })
  assert.equal(result.status, 'pronto')
  assert.equal(result.issues.length, 0)
  assert.equal(result.normalizedPixKey, '12345678900')
})

test('Snapshot sem PIX → bloqueado com missing_pix', () => {
  const result = validatePayoutItemSnapshot({
    affiliateId: 'aff-1',
    affiliateName: 'João',
    amount: 50,
    pixKey: null,
  })
  assert.equal(result.status, 'bloqueado')
  assert.ok(result.issues.some((i) => i.code === 'missing_pix'))
})

test('Snapshot com PIX inválido → bloqueado', () => {
  const result = validatePayoutItemSnapshot({
    affiliateId: 'aff-1',
    affiliateName: 'João',
    amount: 50,
    pixKey: 'invalido',
  })
  assert.equal(result.status, 'bloqueado')
  assert.ok(result.issues.some((i) => i.code === 'invalid_pix'))
})

test('Snapshot com valor zero → bloqueado', () => {
  const result = validatePayoutItemSnapshot({
    affiliateId: 'aff-1',
    affiliateName: 'João',
    amount: 0,
    pixKey: '12345678900',
  })
  assert.equal(result.status, 'bloqueado')
  assert.ok(result.issues.some((i) => i.code === 'invalid_amount'))
})

test('Snapshot sem nome → bloqueado', () => {
  const result = validatePayoutItemSnapshot({
    affiliateId: 'aff-1',
    affiliateName: '',
    amount: 50,
    pixKey: '12345678900',
  })
  assert.equal(result.status, 'bloqueado')
  assert.ok(result.issues.some((i) => i.code === 'missing_affiliate'))
})

// ═══════════════════════════════════════════════════════════════
// Payout batches — summary e CSV
// ═══════════════════════════════════════════════════════════════

test('buildPayoutBatchValidationSummary calcula totais', () => {
  const snapshots = [
    { affiliateId: 'a', affiliateName: 'A', amount: 100, pixKey: '12345678900' },
    { affiliateId: 'b', affiliateName: 'B', amount: 50, pixKey: null },
  ]
  const validations = [
    validatePayoutItemSnapshot(snapshots[0]),
    validatePayoutItemSnapshot(snapshots[1]),
  ]
  const summary = buildPayoutBatchValidationSummary(snapshots, validations)

  assert.equal(summary.totalItems, 2)
  assert.equal(summary.readyItems, 1)
  assert.equal(summary.blockedItems, 1)
  assert.equal(summary.totalAmount, 150)
  assert.equal(summary.blockedAmount, 50)
  assert.equal(summary.missingPixCount, 1)
  assert.equal(summary.status, 'bloqueado')
})

test('buildPayoutCsv gera CSV com header e separador ;', () => {
  const csv = buildPayoutCsv([
    {
      affiliate_id: 'aff-1',
      affiliate_name: 'João',
      tipo: 'pix',
      valor: 100,
      chave_pix: '12345678900',
      referencia: '2026-04-Q1',
      validation_status: 'pronto',
      validation_errors: '',
    },
  ])
  const lines = csv.split('\n')
  assert.equal(lines.length, 2)
  assert.ok(lines[0].includes('affiliate_id'))
  assert.ok(lines[1].includes('João'))
  assert.ok(lines[1].includes(';'))
})

test('formatValidationErrors junta mensagens com pipe', () => {
  assert.equal(formatValidationErrors([]), '')
  const result = formatValidationErrors([
    { code: 'missing_pix', message: 'Sem PIX' },
    { code: 'invalid_amount', message: 'Valor errado' },
  ])
  assert.equal(result, 'Sem PIX | Valor errado')
})

