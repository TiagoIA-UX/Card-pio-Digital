const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 2200 } });
  const url = 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1050047844-88080453-05cb-4d47-bc2b-f1f26af424f8';
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.screenshot({ path: 'tmp-mp-checkout.png', fullPage: true });
  console.log(JSON.stringify({ status: response && response.status(), finalUrl: page.url() }, null, 2));
  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
