const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 2200 } });
  await page.goto('https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1050047844-88080453-05cb-4d47-bc2b-f1f26af424f8', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  const title = await page.title();
  const buttons = await page.locator('button').evaluateAll(nodes => nodes.map((node, index) => ({ index, text: (node.innerText || '').trim(), disabled: node.disabled, ariaDisabled: node.getAttribute('aria-disabled'), className: node.className })).filter(item => item.text));
  const bodyText = (await page.locator('body').innerText()).slice(0, 4000);
  console.log(JSON.stringify({ title, url: page.url(), buttons, bodyText }, null, 2));
  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
