import { test, expect, Page, Route } from '@playwright/test'

// Make sure you have a running development server (`npm run dev`) and
// the required environment variables in .env.local before executing these tests.
// You can run them with: `npx playwright test tests/e2e/checkout.spec.ts`

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// helper to create a temporary user via Supabase auth
async function createTempUser() {
  const email = `test+${Date.now()}@example.com`
  const password = 'Password123!'
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  })
  const data = await res.json()
  if (!data?.access_token) throw new Error('failed to create user')
  return { email, password, token: data.access_token }
}

test.describe('purchase flow', () => {
  test('can add template to cart and simulate checkout', async ({ page }: { page: Page }) => {
    // create and log in user
    const { token } = await createTempUser()

    // persist supabase auth token in localStorage before navigation
    await page.goto(BASE_URL)
    await page.evaluate((t: string) => {
      localStorage.setItem('supabase.auth.token', t)
    }, token)

    // visit templates and add first item to cart
    await page.goto(`${BASE_URL}/templates`)
    await page.click('button:has-text("Comprar")')

    // go to checkout
    await page.goto(`${BASE_URL}/checkout-novo`)

    // intercept the checkout API so we don't actually call MercadoPago
    await page.route('**/api/checkout/criar-sessao', (route: Route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          init_point: 'https://sandbox.mercadopago.com.br/checkout/v1/redirect',
          orderId: 'test-order-id',
          orderNumber: 'ORD-TEST'
        })
      })
    })

    // accept terms and submit form
    await page.check('input[type=checkbox][name=acceptTerms]')
    await page.click('button:has-text("Finalizar Compra")')

    // verify that the intercept was hit and we received the fake redirect
    const url = page.url()
    expect(url).toContain('sandbox.mercadopago.com.br')

    // simulate webhook call: we stub mercadopago.payment.get by returning a fixed object
    // here we call the endpoint directly with minimal payload and an approved status
    await fetch(`${BASE_URL}/api/webhook/templates`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'payment',
        action: 'payment.created',
        data: { id: 123456789 }
      })
    })

    // after webhook processing, visit "Meus Templates" page and assert that
    // at least one item is listed
    await page.goto(`${BASE_URL}/meus-templates`)
    await expect(page.locator('text=Você ainda não tem templates')).not.toBeVisible()
    await expect(page.locator('text=Template')).toBeVisible()
  })
})
