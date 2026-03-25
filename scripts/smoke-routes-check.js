const { chromium } = require('playwright')

const routes = ['/demo', '/demo/editor', '/cadastro', '/painel', '/painel/pedidos']

async function run() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
  })

  const results = []

  for (const route of routes) {
    const url = `http://localhost:3000${route}`
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
      await page.waitForTimeout(1000)
      const body = (await page.textContent('body')) || ''
      const crashed = /(application error|internal server error|something went wrong)/i.test(body)
      results.push({
        route,
        status: response ? response.status() : null,
        finalUrl: page.url(),
        crashed,
      })
    } catch (error) {
      results.push({ route, error: String(error) })
    }
  }

  console.log(JSON.stringify(results, null, 2))
  await browser.close()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
