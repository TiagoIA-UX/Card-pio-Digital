const { chromium } = require('playwright')

async function run() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForTimeout(2000)

  const bodyText = (await page.textContent('body')) || ''
  const hasSignupText = /(criar conta|cadastre-se|registrar|sign up|começar)/i.test(bodyText)

  const signupCandidate = page.locator(
    'a:has-text("Criar"), a:has-text("Cadastro"), a:has-text("Cadastre"), button:has-text("Criar"), button:has-text("Cadastro"), button:has-text("Cadastre")'
  )
  const signupCount = await signupCandidate.count()

  console.log(JSON.stringify({ hasSignupText, signupCount, url: page.url() }))

  await browser.close()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
