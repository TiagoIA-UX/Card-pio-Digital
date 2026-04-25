import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  analyzeMigrationDependencies,
  analyzeMigrationFiles,
  parseMigrationFileName,
} from '@/lib/shared/migration-integrity'

function writeMigration(dir: string, fileName: string, content: string) {
  const filePath = path.join(dir, fileName)
  fs.writeFileSync(filePath, content, 'utf8')
  return filePath
}

test('parseMigrationFileName extrai versao e slug do arquivo padrão', () => {
  const parsed = parseMigrationFileName(
    'C:/repo/supabase/migrations/078_checkout_sessions_recovery_controls.sql',
    'C:/repo'
  )

  assert.deepEqual(parsed, {
    absolutePath: 'C:/repo/supabase/migrations/078_checkout_sessions_recovery_controls.sql',
    relativePath: 'supabase/migrations/078_checkout_sessions_recovery_controls.sql',
    fileName: '078_checkout_sessions_recovery_controls.sql',
    version: 78,
    versionLabel: '078',
    slug: 'checkout_sessions_recovery_controls',
  })
})

test('analyzeMigrationFiles detecta duplicidade, gap e ordem determinística', () => {
  const report = analyzeMigrationFiles({
    rootDir: 'C:/repo',
    filePaths: [
      'C:/repo/supabase/migrations/002_second.sql',
      'C:/repo/supabase/migrations/001_first.sql',
      'C:/repo/supabase/migrations/002_second_b.sql',
      'C:/repo/supabase/migrations/readme.txt',
      'C:/repo/supabase/migrations/004_fourth.sql',
    ],
  })

  assert.equal(report.totalFiles, 5)
  assert.equal(report.firstVersion, 1)
  assert.equal(report.lastVersion, 4)
  assert.deepEqual(report.missingVersions, [3])
  assert.deepEqual(report.duplicateVersions, [
    {
      version: 2,
      files: ['supabase/migrations/002_second.sql', 'supabase/migrations/002_second_b.sql'],
    },
  ])
  assert.deepEqual(report.nonStandardFiles, ['supabase/migrations/readme.txt'])
  assert.deepEqual(report.orderedFiles, [
    'supabase/migrations/001_first.sql',
    'supabase/migrations/002_second.sql',
    'supabase/migrations/002_second_b.sql',
    'supabase/migrations/004_fourth.sql',
  ])
})

test('analyzeMigrationFiles aceita somente as excecoes historicas formalizadas', () => {
  const report = analyzeMigrationFiles({
    rootDir: 'C:/repo',
    filePaths: [
      'C:/repo/supabase/migrations/028_alpha.sql',
      'C:/repo/supabase/migrations/030_beta.sql',
      'C:/repo/supabase/migrations/035_idempotent_increment_template_sales.sql',
      'C:/repo/supabase/migrations/035_payout_validation_and_exports.sql',
      'C:/repo/supabase/migrations/040_order_payment_receipt.sql',
      'C:/repo/supabase/migrations/040_system_alerts_notified_python.sql',
      'C:/repo/supabase/migrations/041_gamma.sql',
    ],
  })

  assert.deepEqual(report.allowedGapVersions, [29])
  assert.deepEqual(report.missingVersions, [31, 32, 33, 34, 36, 37, 38, 39])
  assert.deepEqual(report.allowedDuplicateVersions, [
    {
      version: 35,
      files: [
        'supabase/migrations/035_idempotent_increment_template_sales.sql',
        'supabase/migrations/035_payout_validation_and_exports.sql',
      ],
    },
    {
      version: 40,
      files: [
        'supabase/migrations/040_order_payment_receipt.sql',
        'supabase/migrations/040_system_alerts_notified_python.sql',
      ],
    },
  ])
  assert.deepEqual(report.duplicateVersions, [])
})

test('analyzeMigrationFiles ainda falha para novas duplicatas ou gaps nao permitidos', () => {
  const report = analyzeMigrationFiles({
    rootDir: 'C:/repo',
    filePaths: [
      'C:/repo/supabase/migrations/001_first.sql',
      'C:/repo/supabase/migrations/002_second.sql',
      'C:/repo/supabase/migrations/002_second_b.sql',
      'C:/repo/supabase/migrations/004_fourth.sql',
    ],
  })

  assert.deepEqual(report.allowedGapVersions, [])
  assert.deepEqual(report.missingVersions, [3])
  assert.deepEqual(report.allowedDuplicateVersions, [])
  assert.deepEqual(report.duplicateVersions, [
    {
      version: 2,
      files: ['supabase/migrations/002_second.sql', 'supabase/migrations/002_second_b.sql'],
    },
  ])
})

test('analyzeMigrationDependencies aceita ordem declarada e ignora built-ins', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'migration-deps-ok-'))

  try {
    const files = [
      writeMigration(
        tempDir,
        '001_create_tables.sql',
        [
          'CREATE TABLE public.customers (',
          '  id uuid primary key,',
          '  created_at timestamptz not null default now()',
          ');',
        ].join('\n')
      ),
      writeMigration(
        tempDir,
        '002_create_function.sql',
        [
          'CREATE OR REPLACE FUNCTION public.set_customer_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$',
          'BEGIN',
          '  RETURN NEW;',
          'END;',
          '$$;',
        ].join('\n')
      ),
      writeMigration(
        tempDir,
        '003_create_trigger.sql',
        [
          'CREATE TRIGGER set_customer_updated_at BEFORE UPDATE ON public.customers',
          'FOR EACH ROW EXECUTE FUNCTION public.set_customer_updated_at();',
        ].join('\n')
      ),
    ]

    const report = analyzeMigrationDependencies({ filePaths: files, rootDir: tempDir })

    assert.equal(report.totalFindings, 0)
    assert.deepEqual(report.findings, [])
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
})

test('analyzeMigrationDependencies falha quando tabela é usada antes de ser criada', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'migration-deps-table-'))

  try {
    const files = [
      writeMigration(
        tempDir,
        '001_use_customers.sql',
        'ALTER TABLE public.customers ADD COLUMN note text;'
      ),
      writeMigration(
        tempDir,
        '002_create_customers.sql',
        'CREATE TABLE public.customers (id uuid primary key);'
      ),
    ]

    const report = analyzeMigrationDependencies({ filePaths: files, rootDir: tempDir })

    assert.equal(report.totalFindings, 1)
    assert.deepEqual(report.findings[0], {
      file: '001_use_customers.sql',
      version: 1,
      line: 1,
      kind: 'table',
      name: 'public.customers',
      dependencyKind: 'used_before_definition',
      usedBy: 'ALTER TABLE public.customers ADD COLUMN note text;',
    })
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
})

test('analyzeMigrationDependencies falha quando função é usada antes da definição', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'migration-deps-fn-'))

  try {
    const files = [
      writeMigration(
        tempDir,
        '001_create_trigger.sql',
        [
          'CREATE TABLE public.customers (id uuid primary key);',
          'CREATE TRIGGER set_customer_updated_at BEFORE UPDATE ON public.customers',
          'FOR EACH ROW EXECUTE FUNCTION public.set_customer_updated_at();',
        ].join('\n')
      ),
      writeMigration(
        tempDir,
        '002_create_function.sql',
        [
          'CREATE OR REPLACE FUNCTION public.set_customer_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$',
          'BEGIN',
          '  RETURN NEW;',
          'END;',
          '$$;',
        ].join('\n')
      ),
    ]

    const report = analyzeMigrationDependencies({ filePaths: files, rootDir: tempDir })

    assert.equal(report.totalFindings, 1)
    assert.deepEqual(report.findings[0].kind, 'function')
    assert.deepEqual(report.findings[0].name, 'public.set_customer_updated_at')
    assert.deepEqual(report.findings[0].dependencyKind, 'used_before_definition')
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
})

test('analyzeMigrationDependencies respeita exceções históricas explícitas', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'migration-deps-ignore-'))

  try {
    const files = [
      writeMigration(
        tempDir,
        '003_ecommerce_checkout_tables.sql',
        [
          'CREATE TABLE public.template_orders (',
          '  id uuid primary key,',
          '  coupon_id uuid,',
          '  FOREIGN KEY (coupon_id) REFERENCES coupons(id)',
          ');',
          'CREATE TABLE public.template_order_items (',
          '  id uuid primary key,',
          '  template_id uuid,',
          '  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL',
          ');',
          'CREATE TABLE public.user_purchases (',
          '  id uuid primary key,',
          '  template_id uuid,',
          '  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL',
          ');',
        ].join('\n')
      ),
      writeMigration(
        tempDir,
        '007_cupom_primeiros_clientes.sql',
        'CREATE TABLE coupons (id uuid);'
      ),
      writeMigration(tempDir, '009_templates_seed.sql', 'CREATE TABLE templates (id uuid);'),
    ]

    const report = analyzeMigrationDependencies({ filePaths: files, rootDir: tempDir })

    assert.equal(report.totalFindings, 0)
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
})

