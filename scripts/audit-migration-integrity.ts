#!/usr/bin/env tsx

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'

import {
  analyzeMigrationFiles,
  analyzeMigrationDependencies,
  parseMigrationFileName,
  parseSeedPathsFromConfig,
  sortMigrationFiles,
} from '@/lib/shared/migration-integrity'

type CliOptions = {
  migrationsDir: string
  configPath: string
  simulateLocal: boolean
  keepTemp: boolean
}

function parseArgs(): CliOptions {
  const cwd = process.cwd()
  const args = process.argv.slice(2)

  const migrationsDirArg = args.find((arg) => arg.startsWith('--migrations-dir='))
  const configArg = args.find((arg) => arg.startsWith('--config='))

  return {
    migrationsDir: path.resolve(
      cwd,
      migrationsDirArg?.slice('--migrations-dir='.length) || 'supabase/migrations'
    ),
    configPath: path.resolve(cwd, configArg?.slice('--config='.length) || 'supabase/config.toml'),
    simulateLocal: args.includes('--simulate-local'),
    keepTemp: args.includes('--keep-temp'),
  }
}

function listSqlFiles(dirPath: string) {
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.sql'))
    .map((entry) => path.join(dirPath, entry.name))
}

function ensurePathExists(targetPath: string, label: string) {
  if (!fs.existsSync(targetPath)) {
    throw new Error(`${label} não encontrado: ${targetPath}`)
  }
}

function detectMissingSeedFiles(configPath: string) {
  if (!fs.existsSync(configPath)) {
    return []
  }

  const configContent = fs.readFileSync(configPath, 'utf8')
  const seedPaths = parseSeedPathsFromConfig(configContent)
  const configDir = path.dirname(configPath)

  return seedPaths.filter((seedPath) => !fs.existsSync(path.resolve(configDir, seedPath)))
}

function buildReplayWorkspace(params: {
  repoRoot: string
  configPath: string
  orderedMigrationPaths: string[]
}) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cardapio-migration-replay-'))
  const replayRoot = path.join(tempRoot, 'workspace')
  const replaySupabaseDir = path.join(replayRoot, 'supabase')
  const replayMigrationsDir = path.join(replaySupabaseDir, 'migrations')
  fs.mkdirSync(replayMigrationsDir, { recursive: true })

  const originalConfig = fs.readFileSync(params.configPath, 'utf8')
  const projectId = `migration-replay-${Date.now()}`
  const basePort = 55321
  const replayConfig = originalConfig
    .replace(/project_id\s*=\s*".*?"/, `project_id = "${projectId}"`)
    .replace(/port\s*=\s*54321/, `port = ${basePort}`)
    .replace(/port\s*=\s*54322/, `port = ${basePort + 1}`)
    .replace(/shadow_port\s*=\s*54320/, `shadow_port = ${basePort - 1}`)
    .replace(/port\s*=\s*54323/, `port = ${basePort + 2}`)
    .replace(/port\s*=\s*54324/, `port = ${basePort + 3}`)
    .replace(/port\s*=\s*54329/, `port = ${basePort + 8}`)
    .replace(
      /enabled\s*=\s*true\s*\n# Specifies an ordered list of seed files to load during db reset\.\s*\n# Supports glob patterns relative to supabase directory: "\.\/seeds\/\*\.sql"\s*\nsql_paths\s*=\s*\[[\s\S]*?\]/,
      'enabled = false\n# Specifies an ordered list of seed files to load during db reset.\n# Supports glob patterns relative to supabase directory: "./seeds/*.sql"\nsql_paths = []'
    )

  fs.writeFileSync(path.join(replaySupabaseDir, 'config.toml'), replayConfig, 'utf8')

  params.orderedMigrationPaths.forEach((filePath, index) => {
    const parsed = parseMigrationFileName(filePath, params.repoRoot)
    const sourceName = parsed?.fileName || path.basename(filePath)
    const replayName = `${String(index + 1).padStart(4, '0')}__${sourceName}`
    fs.copyFileSync(filePath, path.join(replayMigrationsDir, replayName))
  })

  return {
    tempRoot,
    replayRoot,
    projectId,
  }
}

function runLocalReplay(params: { replayRoot: string; projectId: string; keepTemp: boolean }) {
  const safeText = (value: string | Buffer | null | undefined) => String(value || '').trim()
  const runSupabase = (args: string[]) => {
    if (process.platform === 'win32') {
      return spawnSync('cmd.exe', ['/d', '/s', '/c', `npx ${args.join(' ')}`], {
        cwd: params.replayRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          SUPABASE_LOAD_DOTENV: '0',
        },
      })
    }

    return spawnSync('npx', args, {
      cwd: params.replayRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        SUPABASE_LOAD_DOTENV: '0',
      },
    })
  }

  const replayCommand = runSupabase(['--yes', 'supabase', 'db', 'reset', '--local', '--debug'])

  const stopCommand = runSupabase(['--yes', 'supabase', 'stop', '--project-id', params.projectId])

  if (!params.keepTemp) {
    fs.rmSync(path.dirname(params.replayRoot), { recursive: true, force: true })
  }

  return {
    ok: replayCommand.status === 0 && !replayCommand.error,
    exitCode: replayCommand.status,
    stdout: safeText(replayCommand.stdout),
    stderr: safeText(replayCommand.stderr),
    error: replayCommand.error ? replayCommand.error.message : null,
    stopExitCode: stopCommand.status,
    stopStdout: safeText(stopCommand.stdout),
    stopStderr: safeText(stopCommand.stderr),
    stopError: stopCommand.error ? stopCommand.error.message : null,
  }
}

function main() {
  const options = parseArgs()
  ensurePathExists(options.migrationsDir, 'Diretório de migrations')
  ensurePathExists(options.configPath, 'Arquivo de configuração do Supabase')

  const repoRoot = process.cwd()
  const migrationFiles = listSqlFiles(options.migrationsDir)
  const integrity = analyzeMigrationFiles({
    filePaths: migrationFiles,
    rootDir: repoRoot,
  })
  const dependencies = analyzeMigrationDependencies({
    filePaths: migrationFiles,
    rootDir: repoRoot,
  })
  const missingSeedFiles = detectMissingSeedFiles(options.configPath)
  const orderedParsed = sortMigrationFiles(
    migrationFiles
      .map((filePath) => parseMigrationFileName(filePath, repoRoot))
      .filter((file): file is NonNullable<typeof file> => Boolean(file))
  )

  const result: Record<string, unknown> = {
    ok:
      integrity.duplicateVersions.length === 0 &&
      integrity.missingVersions.length === 0 &&
      dependencies.totalFindings === 0 &&
      integrity.nonStandardFiles.length === 0 &&
      missingSeedFiles.length === 0,
    summary: {
      total_files: integrity.totalFiles,
      first_version: integrity.firstVersion,
      last_version: integrity.lastVersion,
      allowed_gap_versions: integrity.allowedGapVersions,
      duplicate_versions: integrity.duplicateVersions.length,
      allowed_duplicate_versions: integrity.allowedDuplicateVersions.length,
      missing_versions: integrity.missingVersions.length,
      dependency_findings: dependencies.totalFindings,
      non_standard_files: integrity.nonStandardFiles.length,
      missing_seed_files: missingSeedFiles.length,
    },
    allowed_gap_versions: integrity.allowedGapVersions,
    allowed_duplicate_versions: integrity.allowedDuplicateVersions,
    duplicate_versions: integrity.duplicateVersions,
    missing_versions: integrity.missingVersions,
    dependency_findings: dependencies.findings,
    non_standard_files: integrity.nonStandardFiles,
    missing_seed_files: missingSeedFiles,
    deterministic_order: integrity.orderedFiles,
  }

  if (options.simulateLocal) {
    const replayWorkspace = buildReplayWorkspace({
      repoRoot,
      configPath: options.configPath,
      orderedMigrationPaths: orderedParsed.map((file) => file.absolutePath),
    })
    const replay = runLocalReplay({
      replayRoot: replayWorkspace.replayRoot,
      projectId: replayWorkspace.projectId,
      keepTemp: options.keepTemp,
    })

    result.local_replay = {
      workspace_removed: !options.keepTemp,
      replay_workspace: options.keepTemp ? replayWorkspace.replayRoot.replace(/\\/g, '/') : null,
      project_id: replayWorkspace.projectId,
      ...replay,
    }

    if (!replay.ok) {
      result.ok = false
    }
  }

  console.log(JSON.stringify(result, null, 2))

  if (result.ok !== true) {
    process.exit(1)
  }
}

try {
  main()
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2
    )
  )
  process.exit(1)
}

