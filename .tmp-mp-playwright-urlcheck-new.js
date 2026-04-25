const { chromium } = require('playwright');
const url = process.argv[2];
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 2200 } });
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  const bodyText = (await page.locator('body').innerText()).slice(0, 2000);
  console.log(JSON.stringify({ status: response && response.status(), finalUrl: page.url(), bodyText }, null, 2));
  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
