#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const cwd = process.cwd()
const API_ROOT = path.join(cwd, 'app', 'api')
const SCAN_ROOTS = ['app', 'components', 'lib', 'services', 'hooks']
const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const IGNORE_DIRS = new Set(['.git', '.next', 'node_modules', 'dist', 'build', 'coverage'])

function walk(dirPath, visitor) {
  if (!fs.existsSync(dirPath)) return

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue

    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, visitor)
      continue
    }

    visitor(fullPath)
  }
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/')
}

function collectApiRoutes() {
  const routes = new Set()

  walk(API_ROOT, (filePath) => {
    if (path.basename(filePath) !== 'route.ts' && path.basename(filePath) !== 'route.js') return

    const relative = path.relative(API_ROOT, filePath)
    const routePath = relative
      .replace(/\\/g, '/')
      .replace(/\/route\.(ts|js)$/, '')
      .replace(/\/index$/, '')

    routes.add(`/api${routePath ? `/${routePath}` : ''}`)
  })

  return routes
}

function collectCodeFiles() {
  const files = []

  for (const root of SCAN_ROOTS) {
    walk(path.join(cwd, root), (filePath) => {
      if (!CODE_EXTENSIONS.has(path.extname(filePath))) return
      files.push(filePath)
    })
  }

  return files
}

function findApiReferences(source) {
  const patterns = [
    /fetch\(\s*(['"])(\/api\/[A-Za-z0-9_\-\/]+)\1/g,
    /href\s*=\s*(['"])(\/api\/[A-Za-z0-9_\-\/]+)\1/g,
    /router\.(push|replace)\(\s*(['"])(\/api\/[A-Za-z0-9_\-\/]+)\2/g,
  ]

  const matches = []

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const route = match[2] || match[3]
      const index = match.index ?? 0
      matches.push({ route, index })
    }
  }

  return matches
}

function getLineNumber(source, index) {
  return source.slice(0, index).split(/\r?\n/).length
}

const apiRoutes = collectApiRoutes()
const codeFiles = collectCodeFiles()
const missingReferences = []

for (const filePath of codeFiles) {
  const source = fs.readFileSync(filePath, 'utf8')
  const references = findApiReferences(source)

  for (const reference of references) {
    if (apiRoutes.has(reference.route)) continue

    missingReferences.push({
      filePath: toPosix(path.relative(cwd, filePath)),
      route: reference.route,
      line: getLineNumber(source, reference.index),
    })
  }
}

if (missingReferences.length > 0) {
  console.error('Rotas /api referenciadas no front sem arquivo correspondente:')
  for (const issue of missingReferences) {
    console.error(`- ${issue.filePath}:${issue.line} -> ${issue.route}`)
  }
  process.exit(1)
}

console.log(
  `OK: ${apiRoutes.size} rotas /api mapeadas e nenhuma referencia estatica orfa encontrada.`
)
