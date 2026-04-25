import { promises as fs } from 'node:fs'
import path from 'node:path'

type RouteSet = {
  staticRoutes: Set<string>
  dynamicRoutes: RegExp[]
}

type LinkRef = {
  filePath: string
  line: number
}

const ROOT = process.cwd()
const APP_DIR = path.join(ROOT, 'app')
const SCAN_DIRS = [path.join(ROOT, 'app'), path.join(ROOT, 'components')]
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])

const LINK_PATTERNS: RegExp[] = [
  /href\s*=\s*["'`]([^"'`]+)["'`]/g,
  /href\s*=\s*{\s*["'`]([^"'`]+)["'`]\s*}/g,
  /router\.push\(\s*["'`]([^"'`]+)["'`]/g,
  /redirect\(\s*["'`]([^"'`]+)["'`]/g,
  /window\.location(?:\.href)?\s*=\s*["'`]([^"'`]+)["'`]/g,
]

async function walk(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue
    if (entry.name === 'playwright-report' || entry.name === 'test-results') continue

    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)))
      continue
    }

    if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }

  return files
}

function normalizeLink(rawHref: string): string | null {
  if (!rawHref) return null

  const href = rawHref.trim()
  if (href.includes('${')) return null
  if (!href.startsWith('/')) return null
  if (href.startsWith('//')) return null

  const pathname = href.split('#')[0]?.split('?')[0] ?? '/'
  if (!pathname) return '/'
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname
}

function normalizeRoutePath(routePath: string): string {
  if (!routePath) return '/'
  if (routePath.length > 1 && routePath.endsWith('/')) return routePath.slice(0, -1)
  return routePath
}

function toRouteSegments(relativeDir: string): string[] {
  const parts = relativeDir.split(path.sep).filter(Boolean)
  return parts.filter((segment) => !segment.startsWith('(') || !segment.endsWith(')'))
}

function segmentToRegex(segment: string): string {
  if (/^\[\.\.\.[^\]]+\]$/.test(segment)) return '.+'
  if (/^\[\[\.\.\.[^\]]+\]\]$/.test(segment)) return '.*'
  if (/^\[[^\]]+\]$/.test(segment)) return '[^/]+'
  return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function addRoute(routeSet: RouteSet, segments: string[]) {
  const routePath = normalizeRoutePath('/' + segments.join('/'))
  if (!segments.some((segment) => segment.includes('['))) {
    routeSet.staticRoutes.add(routePath)
    return
  }

  const regexSource =
    '^/' +
    segments
      .map((segment) => segmentToRegex(segment))
      .filter(Boolean)
      .join('/') +
    '$'

  routeSet.dynamicRoutes.push(new RegExp(regexSource))
}

async function buildRouteSet(): Promise<RouteSet> {
  const routeSet: RouteSet = {
    staticRoutes: new Set<string>(['/']),
    dynamicRoutes: [],
  }

  const files = await walk(APP_DIR)

  for (const filePath of files) {
    const fileName = path.basename(filePath)
    if (fileName !== 'page.tsx' && fileName !== 'page.ts' && fileName !== 'route.ts') continue

    const relativeDir = path.dirname(path.relative(APP_DIR, filePath))
    const segments = toRouteSegments(relativeDir)

    if (fileName === 'route.ts') {
      const apiSegments = segments[0] === 'api' ? segments : ['api', ...segments]
      addRoute(routeSet, apiSegments)
      continue
    }

    addRoute(routeSet, segments)
  }

  return routeSet
}

function lineFromIndex(content: string, index: number): number {
  return content.slice(0, index).split('\n').length
}

function routeExists(routeSet: RouteSet, routePath: string): boolean {
  if (routeSet.staticRoutes.has(routePath)) return true
  return routeSet.dynamicRoutes.some((regex) => regex.test(routePath))
}

async function main() {
  const routeSet = await buildRouteSet()
  const files = (await Promise.all(SCAN_DIRS.map((dirPath) => walk(dirPath)))).flat()

  const invalidLinks = new Map<string, LinkRef[]>()
  const checkedLinks = new Set<string>()

  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf8')

    for (const pattern of LINK_PATTERNS) {
      pattern.lastIndex = 0

      let match = pattern.exec(content)
      while (match) {
        const rawHref = match[1]
        const normalized = normalizeLink(rawHref)
        if (!normalized) {
          match = pattern.exec(content)
          continue
        }

        // Não tratamos assets internos do Next e âncoras de API externas aqui.
        if (normalized.startsWith('/_next')) {
          match = pattern.exec(content)
          continue
        }

        checkedLinks.add(normalized)

        if (!routeExists(routeSet, normalized)) {
          const current = invalidLinks.get(normalized) ?? []
          current.push({
            filePath: path.relative(ROOT, filePath).split(path.sep).join('/'),
            line: lineFromIndex(content, match.index),
          })
          invalidLinks.set(normalized, current)
        }

        match = pattern.exec(content)
      }
    }
  }

  if (invalidLinks.size === 0) {
    console.log(`Link monitor: OK (${checkedLinks.size} links internos verificados).`)
    return
  }

  console.error(`Link monitor: ${invalidLinks.size} rota(s) interna(s) potencialmente quebrada(s).`)

  for (const [route, refs] of invalidLinks.entries()) {
    console.error(`- ${route}`)
    for (const ref of refs.slice(0, 5)) {
      console.error(`  -> ${ref.filePath}:${ref.line}`)
    }
    if (refs.length > 5) {
      console.error(`  -> +${refs.length - 5} ocorrência(s) adicional(is)`)
    }
  }

  process.exitCode = 1
}

main().catch((error) => {
  console.error('Link monitor: falha inesperada.', error)
  process.exitCode = 1
})

