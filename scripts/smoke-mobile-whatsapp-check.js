const { chromium } = require('playwright')

async function run() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  })

  const page = await context.newPage()
  const url = 'http://localhost:3000/r/demo'

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForTimeout(2000)

  const title = await page.title()
  const body = (await page.textContent('body')) || ''
  const hasCrash = /(application error|internal server error|something went wrong)/i.test(body)

  const waSelector =
    'a[href*="api.whatsapp.com"],a[href*="wa.me"],button:has-text("WhatsApp"),button:has-text("whatsapp")'
  const waCount = await page.locator(waSelector).count()

  console.log(
    JSON.stringify({
      url: page.url(),
      title,
      hasCrash,
      waCount,
      hasBody: body.length > 100,
    })
  )

  await browser.close()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
