/**
 * Script de geração do e-book PDF
 * Uso: npx tsx scripts/generate-ebook-pdf.ts
 *
 * Lê: private/ebooks/google-meu-negocio-guia-completo.md
 * Gera: private/ebooks/google-meu-negocio-guia-completo.pdf
 */

import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { marked } from 'marked'

const ROOT = process.cwd()
const MD_PATH = path.join(ROOT, 'private', 'ebooks', 'google-meu-negocio-guia-completo.md')
const PDF_PATH = path.join(ROOT, 'private', 'ebooks', 'google-meu-negocio-guia-completo.pdf')

// ── Configurar marked ──────────────────────────────────────────────────────────
marked.setOptions({ gfm: true, breaks: false })

// Renderer customizado para melhor controle visual
const renderer = new marked.Renderer()

renderer.heading = ({ text, depth }: { text: string; depth: number }) => {
  const sizes: Record<number, string> = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' }
  const tag = sizes[depth] || 'h6'
  const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `<${tag} id="${id}">${text}</${tag}>\n`
}

renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<pre><code class="language-${lang || ''}">${escaped}</code></pre>\n`
}

renderer.table = ({
  header,
  rows,
}: {
  header: { text: string; align: string | null }[]
  rows: { text: string }[][]
}) => {
  const thead = header.map((h) => `<th>${h.text}</th>`).join('')
  const tbody = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell.text}</td>`).join('')}</tr>`)
    .join('')
  return `<table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>\n`
}

marked.use({ renderer })

// ── Template HTML ──────────────────────────────────────────────────────────────
function buildHtml(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Google Meu Negócio – Guia Completo · Zairyx</title>
  <style>
    /* ── Reset & Base ─────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @page {
      size: A4;
      margin: 18mm 15mm 20mm 15mm;
    }

    body {
      font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.65;
      color: #1a1a2e;
      background: #ffffff;
    }

    /* ── Headings ─────────────────────────────── */
    h1 {
      font-size: 22pt;
      font-weight: 800;
      color: #3730a3;
      margin: 28pt 0 12pt;
      padding-bottom: 8pt;
      border-bottom: 3px solid #6366f1;
      page-break-after: avoid;
    }
    h2 {
      font-size: 16pt;
      font-weight: 700;
      color: #4338ca;
      margin: 22pt 0 10pt;
      padding-bottom: 5pt;
      border-bottom: 1.5px solid #c7d2fe;
      page-break-after: avoid;
    }
    h3 {
      font-size: 13pt;
      font-weight: 700;
      color: #312e81;
      margin: 16pt 0 8pt;
      page-break-after: avoid;
    }
    h4 {
      font-size: 11.5pt;
      font-weight: 700;
      color: #1e1b4b;
      margin: 12pt 0 6pt;
      page-break-after: avoid;
    }

    /* ── Paragraphs & inline ──────────────────── */
    p {
      margin: 0 0 10pt;
      orphans: 2;
      widows: 2;
    }
    strong { color: #1e1b4b; }
    em { color: #374151; }
    a { color: #4f46e5; text-decoration: none; }

    /* ── Horizontal rule ──────────────────────── */
    hr {
      border: none;
      border-top: 1.5px solid #e0e7ff;
      margin: 18pt 0;
    }

    /* ── Code ─────────────────────────────────── */
    code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 9.5pt;
      background: #f1f5f9;
      color: #0f172a;
      padding: 1pt 4pt;
      border-radius: 3pt;
    }
    pre {
      background: #0f172a;
      color: #e2e8f0;
      border-radius: 8pt;
      padding: 14pt 16pt;
      margin: 10pt 0 14pt;
      overflow-wrap: break-word;
      white-space: pre-wrap;
      font-size: 8.5pt;
      line-height: 1.55;
      page-break-inside: avoid;
    }
    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      font-size: inherit;
    }

    /* ── Tables ───────────────────────────────── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10pt 0 16pt;
      font-size: 10pt;
      page-break-inside: avoid;
    }
    thead {
      background: #4338ca;
      color: #ffffff;
    }
    th {
      padding: 8pt 10pt;
      text-align: left;
      font-weight: 700;
      font-size: 9.5pt;
    }
    td {
      padding: 6pt 10pt;
      border-bottom: 1px solid #e0e7ff;
      vertical-align: top;
    }
    tbody tr:nth-child(even) { background: #f8f8ff; }
    tbody tr:hover { background: #ede9fe; }

    /* ── Lists ────────────────────────────────── */
    ul, ol {
      margin: 6pt 0 12pt 20pt;
      padding: 0;
    }
    li {
      margin-bottom: 4pt;
    }
    ul li { list-style-type: disc; }
    ol li { list-style-type: decimal; }

    /* ── Inline HTML div boxes (ebook styles) ─── */
    div[style] {
      margin: 14pt 0;
      page-break-inside: avoid;
    }

    /* ── Cover page (first h1 + special div) ──── */
    .cover {
      text-align: center;
      padding: 40pt 20pt;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12pt;
      margin-bottom: 30pt;
      page-break-after: always;
    }
    .cover h1 {
      color: white;
      border: none;
      font-size: 28pt;
    }
    .cover h2 {
      color: rgba(255,255,255,0.9);
      border: none;
    }
    .cover h3 {
      color: white;
    }

    /* ── Chapter header ───────────────────────── */
    h1:not(:first-child) {
      page-break-before: always;
    }

    /* ── Footer note ──────────────────────────── */
    .ebook-footer {
      margin-top: 30pt;
      padding-top: 12pt;
      border-top: 1px solid #e0e7ff;
      font-size: 8.5pt;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>
  ${bodyContent}
  <div class="ebook-footer">
    E-book: Google Meu Negócio – Guia Completo · Zairyx Canais Digitais · Versão 2.0 · Abril 2026
  </div>
</body>
</html>`
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!existsSync(MD_PATH)) {
    console.error(`❌  Arquivo não encontrado: ${MD_PATH}`)
    process.exit(1)
  }

  console.log('📖  Lendo markdown...')
  const mdContent = readFileSync(MD_PATH, 'utf8')

  console.log('🔄  Convertendo para HTML...')
  const bodyHtml = await marked(mdContent)
  const fullHtml = buildHtml(bodyHtml)

  console.log('🚀  Iniciando Chromium headless...')
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  await page.setContent(fullHtml, { waitUntil: 'networkidle' })

  console.log('📄  Gerando PDF...')
  await page.pdf({
    path: PDF_PATH,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '18mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm',
    },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="width:100%; font-family:Arial,sans-serif; font-size:8pt; color:#9ca3af;
                  display:flex; justify-content:space-between; padding:0 15mm;">
        <span>Google Meu Negócio – Guia Completo · Zairyx</span>
        <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
      </div>`,
  })

  await browser.close()

  const { statSync } = await import('node:fs')
  const stats = statSync(PDF_PATH)
  const sizeKb = Math.round(stats.size / 1024)

  console.log(`✅  PDF gerado com sucesso!`)
  console.log(`📁  Arquivo: ${PDF_PATH}`)
  console.log(`📦  Tamanho: ${sizeKb} KB`)
}

main().catch((err) => {
  console.error('❌  Erro ao gerar PDF:', err)
  process.exit(1)
})
