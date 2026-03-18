#!/usr/bin/env node
/**
 * Captura screenshots do painel e editor para a landing page.
 * Execute: npm run screenshots
 * Requer: servidor rodando em http://localhost:3000 (npm run dev)
 */
import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'
const OUTPUT_DIR = join(__dirname, '..', 'public', 'screenshots')

async function capture() {
  await mkdir(OUTPUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  })

  const page = await context.newPage()

  // Oculta o aviso de demonstração para print limpo
  const hideDemoBanner = `
    document.querySelectorAll('[class*="border-b"][class*="py-2"]').forEach(el => {
      if (el.textContent && el.textContent.includes('Demonstração')) el.style.display = 'none';
    });
  `

  try {
    // Dashboard
    console.log('Capturando /demo (dashboard)...')
    await page.goto(`${BASE_URL}/demo`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    await page.evaluate(hideDemoBanner)
    await page.screenshot({
      path: join(OUTPUT_DIR, 'painel-dashboard.png'),
      fullPage: false,
    })
    console.log('  → public/screenshots/painel-dashboard.png')

    // Editor
    console.log('Capturando /demo/editor...')
    await page.goto(`${BASE_URL}/demo/editor`, { waitUntil: 'networkidle' })
    // Aguarda as imagens (banner) carregarem completamente
    await page
      .waitForFunction(
        () => {
          const imgs = Array.from(document.querySelectorAll('img'))
          return imgs.every((img) => img.complete && img.naturalWidth > 0)
        },
        { timeout: 10000 }
      )
      .catch(() => {})
    await page.waitForTimeout(800)
    await page.evaluate(hideDemoBanner)
    await page.screenshot({
      path: join(OUTPUT_DIR, 'painel-editor.png'),
      fullPage: false,
    })
    console.log('  → public/screenshots/painel-editor.png')

    // Editor - viewport tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(500)
    await page.evaluate(hideDemoBanner)
    await page.screenshot({
      path: join(OUTPUT_DIR, 'painel-editor-tablet.png'),
      fullPage: false,
    })
    console.log('  → public/screenshots/painel-editor-tablet.png')
  } catch (err) {
    console.error('Erro:', err.message)
    console.error('Certifique-se de que o servidor está rodando: npm run dev')
    process.exit(1)
  } finally {
    await browser.close()
  }

  console.log('\nScreenshots capturados com sucesso!')
}

capture()
