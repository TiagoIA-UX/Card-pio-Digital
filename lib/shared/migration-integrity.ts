import fs from 'node:fs'
import path from 'node:path'

export interface MigrationFileInfo {
  absolutePath: string
  relativePath: string
  fileName: string
  version: number
  versionLabel: string
  slug: string
}

export interface MigrationIntegrityReport {
  totalFiles: number
  firstVersion: number | null
  lastVersion: number | null
  allowedGapVersions: number[]
  duplicateVersions: Array<{
    version: number
    files: string[]
  }>
  allowedDuplicateVersions: Array<{
    version: number
    files: string[]
  }>
  missingVersions: number[]
  orderedFiles: string[]
  nonStandardFiles: string[]
}

export interface MigrationDependencyFinding {
  file: string
  version: number
  line: number
  kind: 'table' | 'function' | 'type' | 'view' | 'sequence'
  name: string
  dependencyKind: 'missing_definition' | 'used_before_definition'
  usedBy: string
}

export interface MigrationDependencyReport {
  totalFindings: number
  findings: MigrationDependencyFinding[]
}

const ALLOWED_GAPS = new Set([29])

const ALLOWED_DUPLICATE_VERSIONS = new Map<number, Set<string>>([
  [
    35,
    new Set([
      '035_idempotent_increment_template_sales.sql',
      '035_payout_validation_and_exports.sql',
    ]),
  ],
  [40, new Set(['040_order_payment_receipt.sql', '040_system_alerts_notified_python.sql'])],
])

const DEFAULT_SCHEMA = 'public'

const TABLE_REFERENCE_PATTERNS = [
  /\bALTER\s+TABLE\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/gi,
  /\bINSERT\s+INTO\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/gi,
  /\bUPDATE\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/gi,
  /\bDELETE\s+FROM\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/gi,
  /\bCREATE\s+INDEX(?:\s+CONCURRENTLY)?\s+\S+\s+ON\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/gi,
  /\bCREATE\s+POLICY\s+"?[^"]+"?\s+ON\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/gi,
  /\bALTER\s+POLICY\s+"?[^"]+"?\s+ON\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/gi,
  /\bCOMMENT\s+ON\s+TABLE\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/gi,
  /\bGRANT\s+[^;]+?\s+ON\s+(?:TABLE\s+|VIEW\s+|SEQUENCE\s+)?((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/gi,
  /\bREFERENCES\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/gi,
  /\bFROM\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/gi,
  /\bJOIN\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/gi,
]

const FUNCTION_REFERENCE_PATTERNS = [
  /\bALTER\s+FUNCTION\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/gi,
  /\bGRANT\s+EXECUTE\s+ON\s+FUNCTION\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/gi,
  /\bEXECUTE\s+FUNCTION\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/gi,
  /\bEXECUTE\s+PROCEDURE\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/gi,
]

const TYPE_REFERENCE_PATTERNS = [
  /\bALTER\s+TABLE\s+.+?\bTYPE\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/gi,
]

const VIEW_REFERENCE_PATTERNS = [
  /\bALTER\s+VIEW\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/gi,
  /\bCOMMENT\s+ON\s+VIEW\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/gi,
]

const SEQUENCE_REFERENCE_PATTERNS = [
  /\bALTER\s+SEQUENCE\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/gi,
  /\bCOMMENT\s+ON\s+SEQUENCE\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/gi,
]

const TABLE_DEFINITION_PATTERN =
  /\bCREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/i
const FUNCTION_DEFINITION_PATTERN =
  /\bCREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION(?:\s+IF\s+NOT\s+EXISTS)?\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/i
const TYPE_DEFINITION_PATTERN =
  /\bCREATE\s+TYPE(?:\s+IF\s+NOT\s+EXISTS)?\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/i
const VIEW_DEFINITION_PATTERN =
  /\bCREATE\s+(?:OR\s+REPLACE\s+)?VIEW(?:\s+IF\s+NOT\s+EXISTS)?\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/i
const SEQUENCE_DEFINITION_PATTERN =
  /\bCREATE\s+SEQUENCE(?:\s+IF\s+NOT\s+EXISTS)?\s+((?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*)/i

const IGNORED_DEPENDENCY_EDGES = new Set([
  'supabase/migrations/003_ecommerce_checkout_tables.sql|table|public.coupons',
  'supabase/migrations/003_ecommerce_checkout_tables.sql|table|public.templates',
])

function shouldIgnoreDependencyEdge(relativePath: string, kind: DefinitionKind, name: string) {
  const normalizedName = qualifyIdentifier(name)
  const normalizedRelativePath = relativePath.replace(/\\/g, '/')
  const normalizedBaseName = path.basename(normalizedRelativePath)

  if (
    normalizedBaseName === '003_ecommerce_checkout_tables.sql' &&
    kind === 'table' &&
    (normalizedName === 'public.coupons' || normalizedName === 'public.templates')
  ) {
    return true
  }

  return [
    `${normalizedRelativePath}|${kind}|${normalizedName}`,
    `${normalizedBaseName}|${kind}|${normalizedName}`,
  ].some((candidate) => IGNORED_DEPENDENCY_EDGES.has(candidate))
}

function normalizeIdentifier(name: string) {
  return name.trim().replace(/"/g, '').replace(/\s+/g, '').toLowerCase()
}

function qualifyIdentifier(name: string, defaultSchema = DEFAULT_SCHEMA) {
  const normalized = normalizeIdentifier(name)
  if (normalized.includes('.')) {
    return normalized
  }

  return `${defaultSchema}.${normalized}`
}

function stripSqlComments(line: string) {
  return line.replace(/--.*$/, '').trim()
}

function collectMatches(line: string, patterns: RegExp[]) {
  const values: string[] = []

  for (const pattern of patterns) {
    pattern.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = pattern.exec(line))) {
      if (match[1]) {
        values.push(match[1])
      }
      if (!pattern.global) {
        break
      }
    }
  }

  return values
}

type DefinitionKind = MigrationDependencyFinding['kind']

type DefinitionInfo = {
  name: string
  kind: DefinitionKind
  file: string
  version: number
  line: number
}

function getFileContent(filePath: string) {
  return fs.readFileSync(filePath, 'utf8')
}

function findDefinitionsForFile(filePath: string, rootDir?: string) {
  const parsed = parseMigrationFileName(filePath, rootDir)
  if (!parsed) {
    return [] as Array<{
      name: string
      kind: DefinitionKind
      line: number
      file: string
      version: number
    }>
  }

  const content = getFileContent(filePath)
  const lines = content.split(/\r?\n/)
  const findings: Array<{
    name: string
    kind: DefinitionKind
    line: number
    file: string
    version: number
  }> = []

  lines.forEach((rawLine, index) => {
    const line = stripSqlComments(rawLine)
    if (!line) {
      return
    }

    const tableDefinition = TABLE_DEFINITION_PATTERN.exec(line)
    if (tableDefinition?.[1]) {
      findings.push({
        name: qualifyIdentifier(tableDefinition[1]),
        kind: 'table',
        line: index + 1,
        file: parsed.relativePath,
        version: parsed.version,
      })
    }

    const functionDefinition = FUNCTION_DEFINITION_PATTERN.exec(line)
    if (functionDefinition?.[1]) {
      findings.push({
        name: qualifyIdentifier(functionDefinition[1]),
        kind: 'function',
        line: index + 1,
        file: parsed.relativePath,
        version: parsed.version,
      })
    }

    const typeDefinition = TYPE_DEFINITION_PATTERN.exec(line)
    if (typeDefinition?.[1]) {
      findings.push({
        name: qualifyIdentifier(typeDefinition[1]),
        kind: 'type',
        line: index + 1,
        file: parsed.relativePath,
        version: parsed.version,
      })
    }

    const viewDefinition = VIEW_DEFINITION_PATTERN.exec(line)
    if (viewDefinition?.[1]) {
      findings.push({
        name: qualifyIdentifier(viewDefinition[1]),
        kind: 'view',
        line: index + 1,
        file: parsed.relativePath,
        version: parsed.version,
      })
    }

    const sequenceDefinition = SEQUENCE_DEFINITION_PATTERN.exec(line)
    if (sequenceDefinition?.[1]) {
      findings.push({
        name: qualifyIdentifier(sequenceDefinition[1]),
        kind: 'sequence',
        line: index + 1,
        file: parsed.relativePath,
        version: parsed.version,
      })
    }
  })

  return findings
}

export function analyzeMigrationDependencies(params: {
  filePaths: string[]
  rootDir?: string
}): MigrationDependencyReport {
  const definitionEntries: DefinitionInfo[] = []
  const definedNames = new Set<string>()

  for (const filePath of params.filePaths) {
    const definitions = findDefinitionsForFile(filePath, params.rootDir)
    for (const definition of definitions) {
      const key = `${definition.kind}:${definition.name}`
      if (definedNames.has(key)) {
        continue
      }

      definedNames.add(key)
      definitionEntries.push(definition)
    }
  }

  const definitionMap = new Map<string, DefinitionInfo>()
  for (const definition of definitionEntries) {
    definitionMap.set(`${definition.kind}:${definition.name}`, definition)
  }

  const findings: MigrationDependencyFinding[] = []

  for (const filePath of params.filePaths) {
    const parsed = parseMigrationFileName(filePath, params.rootDir)
    if (!parsed) {
      continue
    }

    const content = getFileContent(filePath)
    const lines = content.split(/\r?\n/)

    lines.forEach((rawLine, index) => {
      const line = stripSqlComments(rawLine)
      if (!line) {
        return
      }

      const lineDefinitions = collectMatches(line, [
        TABLE_DEFINITION_PATTERN,
        FUNCTION_DEFINITION_PATTERN,
        TYPE_DEFINITION_PATTERN,
        VIEW_DEFINITION_PATTERN,
        SEQUENCE_DEFINITION_PATTERN,
      ]).map((name) => qualifyIdentifier(name))

      const tableReferences = collectMatches(line, TABLE_REFERENCE_PATTERNS)
      const functionReferences = collectMatches(line, FUNCTION_REFERENCE_PATTERNS)
      const typeReferences = collectMatches(line, TYPE_REFERENCE_PATTERNS)
      const viewReferences = collectMatches(line, VIEW_REFERENCE_PATTERNS)
      const sequenceReferences = collectMatches(line, SEQUENCE_REFERENCE_PATTERNS)

      const evaluateReference = (
        name: string,
        kind: DefinitionKind,
        usedBy: string,
        allowSameLineSelfReference: boolean = false
      ) => {
        const normalizedName = qualifyIdentifier(name)
        if (shouldIgnoreDependencyEdge(parsed.relativePath, kind, normalizedName)) {
          return
        }

        const key = `${kind}:${normalizedName}`
        const definition = definitionMap.get(key)
        if (!definition) {
          return
        }

        if (allowSameLineSelfReference && lineDefinitions.includes(normalizedName)) {
          return
        }

        const usePosition = {
          file: parsed.relativePath,
          version: parsed.version,
          line: index + 1,
        }

        const definitionComesLater =
          definition.version > usePosition.version ||
          (definition.version === usePosition.version && definition.line > usePosition.line)

        if (!definitionComesLater) {
          return
        }

        findings.push({
          file: usePosition.file,
          version: usePosition.version,
          line: usePosition.line,
          kind,
          name: normalizedName,
          dependencyKind: 'used_before_definition',
          usedBy,
        })
      }

      for (const tableReference of tableReferences) {
        evaluateReference(tableReference, 'table', line, true)
      }

      for (const functionReference of functionReferences) {
        evaluateReference(functionReference, 'function', line)
      }

      for (const typeReference of typeReferences) {
        evaluateReference(typeReference, 'type', line)
      }

      for (const viewReference of viewReferences) {
        evaluateReference(viewReference, 'view', line)
      }

      for (const sequenceReference of sequenceReferences) {
        evaluateReference(sequenceReference, 'sequence', line)
      }
    })
  }

  return {
    totalFindings: findings.length,
    findings,
  }
}

const MIGRATION_FILE_RE = /^(\d+)_([a-z0-9][a-z0-9_\-]*)\.sql$/i

export function parseMigrationFileName(
  filePath: string,
  rootDir?: string
): MigrationFileInfo | null {
  const fileName = path.basename(filePath)
  const match = MIGRATION_FILE_RE.exec(fileName)
  if (!match) {
    return null
  }

  const versionLabel = match[1]
  const version = Number.parseInt(versionLabel, 10)
  if (!Number.isFinite(version)) {
    return null
  }

  return {
    absolutePath: filePath,
    relativePath: rootDir ? path.relative(rootDir, filePath).replace(/\\/g, '/') : fileName,
    fileName,
    version,
    versionLabel,
    slug: match[2],
  }
}

export function sortMigrationFiles(files: MigrationFileInfo[]) {
  return [...files].sort((left, right) => {
    if (left.version !== right.version) {
      return left.version - right.version
    }

    const leftKey = left.fileName.toLowerCase()
    const rightKey = right.fileName.toLowerCase()
    if (leftKey < rightKey) return -1
    if (leftKey > rightKey) return 1
    return 0
  })
}

export function analyzeMigrationFiles(params: {
  filePaths: string[]
  rootDir?: string
}): MigrationIntegrityReport {
  const parsedFiles: MigrationFileInfo[] = []
  const nonStandardFiles: string[] = []

  for (const filePath of params.filePaths) {
    const parsed = parseMigrationFileName(filePath, params.rootDir)
    if (!parsed) {
      nonStandardFiles.push(
        params.rootDir
          ? path.relative(params.rootDir, filePath).replace(/\\/g, '/')
          : path.basename(filePath)
      )
      continue
    }

    parsedFiles.push(parsed)
  }

  const ordered = sortMigrationFiles(parsedFiles)
  const firstVersion = ordered[0]?.version ?? null
  const lastVersion = ordered.at(-1)?.version ?? null
  const versions = ordered.map((file) => file.version)
  const uniqueVersions = Array.from(new Set(versions)).sort((left, right) => left - right)
  const missingVersions: number[] = []
  const allowedGapVersions: number[] = []

  if (uniqueVersions.length > 0) {
    for (let version = uniqueVersions[0]; version <= uniqueVersions.at(-1)!; version += 1) {
      if (!uniqueVersions.includes(version)) {
        if (ALLOWED_GAPS.has(version)) {
          allowedGapVersions.push(version)
        } else {
          missingVersions.push(version)
        }
      }
    }
  }

  const duplicateVersions: Array<{ version: number; files: string[] }> = []
  const allowedDuplicateVersions: Array<{ version: number; files: string[] }> = []

  for (const version of uniqueVersions) {
    const files = ordered
      .filter((file) => file.version === version)
      .map((file) => file.relativePath)
    if (files.length <= 1) {
      continue
    }

    const allowedFiles = ALLOWED_DUPLICATE_VERSIONS.get(version)
    const normalizedFiles = files.map((file) => path.basename(file)).sort()
    const normalizedAllowedFiles = allowedFiles ? Array.from(allowedFiles).sort() : []
    const isAllowedDuplicate =
      normalizedFiles.length === normalizedAllowedFiles.length &&
      normalizedFiles.every((file, index) => file === normalizedAllowedFiles[index])

    if (isAllowedDuplicate) {
      allowedDuplicateVersions.push({ version, files })
    } else {
      duplicateVersions.push({ version, files })
    }
  }

  return {
    totalFiles: params.filePaths.length,
    firstVersion,
    lastVersion,
    allowedGapVersions,
    duplicateVersions,
    allowedDuplicateVersions,
    missingVersions,
    orderedFiles: ordered.map((file) => file.relativePath),
    nonStandardFiles,
  }
}

export function parseSeedPathsFromConfig(configContent: string) {
  const sqlPathsMatch = configContent.match(/sql_paths\s*=\s*\[([\s\S]*?)\]/)
  if (!sqlPathsMatch) {
    return []
  }

  return sqlPathsMatch[1]
    .split(',')
    .map((value) => value.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)
}
