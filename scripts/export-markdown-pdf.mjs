import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function applyInlineMarkdown(text) {
  let html = escapeHtml(text)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  return html
}

function tableToHtml(tableLines) {
  const rows = tableLines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\||\|$/g, '').split('|').map((cell) => applyInlineMarkdown(cell.trim())))

  const [header, ...rest] = rows.filter((row) => !row.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/<[^>]+>/g, ''))))
  if (!header) {
    return ''
  }

  const thead = `<thead><tr>${header.map((cell) => `<th>${cell}</th>`).join('')}</tr></thead>`
  const tbodyRows = rest
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
    .join('')

  return `<table>${thead}<tbody>${tbodyRows}</tbody></table>`
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const html = []
  let paragraph = []
  let listType = null
  let tableLines = []
  let inCode = false
  let codeFence = 'text'
  let codeLines = []
  let blockquote = []

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    html.push(`<p>${applyInlineMarkdown(paragraph.join(' '))}</p>`)
    paragraph = []
  }

  const flushList = () => {
    if (!listType) return
    html.push(`</${listType}>`)
    listType = null
  }

  const flushTable = () => {
    if (tableLines.length === 0) return
    html.push(tableToHtml(tableLines))
    tableLines = []
  }

  const flushBlockquote = () => {
    if (blockquote.length === 0) return
    html.push(`<blockquote><p>${applyInlineMarkdown(blockquote.join(' '))}</p></blockquote>`)
    blockquote = []
  }

  const flushCode = () => {
    if (!inCode) return
    html.push(`<pre><code class="language-${escapeHtml(codeFence)}">${escapeHtml(codeLines.join('\n'))}</code></pre>`)
    inCode = false
    codeFence = 'text'
    codeLines = []
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      flushParagraph()
      flushTable()
      flushBlockquote()
      if (inCode) {
        flushCode()
      } else {
        flushList()
        inCode = true
        codeFence = trimmed.slice(3).trim() || 'text'
      }
      continue
    }

    if (inCode) {
      codeLines.push(line)
      continue
    }

    if (trimmed.startsWith('|')) {
      flushParagraph()
      flushList()
      flushBlockquote()
      tableLines.push(line)
      continue
    }

    flushTable()

    if (!trimmed) {
      flushParagraph()
      flushList()
      flushBlockquote()
      continue
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      flushParagraph()
      flushList()
      flushBlockquote()
      const level = headingMatch[1].length
      html.push(`<h${level}>${applyInlineMarkdown(headingMatch[2])}</h${level}>`)
      continue
    }

    if (/^---+$/.test(trimmed)) {
      flushParagraph()
      flushList()
      flushBlockquote()
      html.push('<hr />')
      continue
    }

    const quoteMatch = line.match(/^>\s?(.*)$/)
    if (quoteMatch) {
      flushParagraph()
      flushList()
      blockquote.push(quoteMatch[1])
      continue
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/)
    if (orderedMatch) {
      flushParagraph()
      flushBlockquote()
      if (listType !== 'ol') {
        flushList()
        listType = 'ol'
        html.push('<ol>')
      }
      html.push(`<li>${applyInlineMarkdown(orderedMatch[1])}</li>`)
      continue
    }

    const unorderedMatch = trimmed.match(/^[-*]\s+(.*)$/)
    if (unorderedMatch) {
      flushParagraph()
      flushBlockquote()
      if (listType !== 'ul') {
        flushList()
        listType = 'ul'
        html.push('<ul>')
      }
      html.push(`<li>${applyInlineMarkdown(unorderedMatch[1])}</li>`)
      continue
    }

    flushList()
    flushBlockquote()
    paragraph.push(trimmed)
  }

  flushParagraph()
  flushList()
  flushTable()
  flushBlockquote()
  flushCode()

  return html.join('\n')
}

function resolveBrowser() {
  const candidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ]

  for (const candidate of candidates) {
    try {
      const result = spawnSync(candidate, ['--version'], { encoding: 'utf8' })
      if (result.status === 0) {
        return candidate
      }
    } catch {
      // noop
    }
  }

  throw new Error('Nenhum navegador compatível encontrado para exportar PDF.')
}

async function main() {
  const [, , markdownPathArg, outputPdfArg] = process.argv
  if (!markdownPathArg || !outputPdfArg) {
    throw new Error('Uso: node scripts/export-markdown-pdf.mjs <markdown> <saida.pdf>')
  }

  const markdownPath = path.resolve(markdownPathArg)
  const outputPdfPath = path.resolve(outputPdfArg)
  const markdown = await fs.readFile(markdownPath, 'utf8')
  const content = markdownToHtml(markdown)
  const title = path.basename(markdownPath, path.extname(markdownPath))
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ebook-pdf-'))
  const htmlPath = path.join(tempDir, `${title}.html`)

  const htmlDocument = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    body { font-family: "Segoe UI", Arial, sans-serif; color: #1f2937; line-height: 1.55; font-size: 12px; }
    h1, h2, h3 { color: #0f172a; margin: 1.2em 0 0.45em; }
    h1 { font-size: 24px; }
    h2 { font-size: 18px; border-bottom: 1px solid #dbe2ea; padding-bottom: 4px; }
    h3 { font-size: 14px; }
    p, ul, ol, blockquote, table, pre { margin: 0.6em 0; }
    ul, ol { padding-left: 1.4em; }
    blockquote { margin-left: 0; padding: 10px 14px; border-left: 4px solid #94a3b8; background: #f8fafc; }
    code { font-family: Consolas, "Courier New", monospace; background: #f1f5f9; padding: 1px 4px; border-radius: 4px; }
    pre { background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: 8px; overflow: hidden; white-space: pre-wrap; }
    pre code { background: transparent; color: inherit; padding: 0; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #cbd5e1; padding: 7px 8px; vertical-align: top; }
    th { background: #e2e8f0; text-align: left; }
    hr { border: 0; border-top: 1px solid #dbe2ea; margin: 1.2em 0; }
    a { color: #0f766e; text-decoration: none; }
  </style>
</head>
<body>
${content}
</body>
</html>`

  await fs.writeFile(htmlPath, htmlDocument, 'utf8')
  await fs.mkdir(path.dirname(outputPdfPath), { recursive: true })

  const browser = resolveBrowser()
  const result = spawnSync(
    browser,
    [
      '--headless',
      '--disable-gpu',
      '--allow-file-access-from-files',
      `--print-to-pdf=${outputPdfPath}`,
      pathToFileURL(htmlPath).href,
    ],
    { encoding: 'utf8' }
  )

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'Falha ao gerar PDF.')
  }

  console.log(outputPdfPath)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})