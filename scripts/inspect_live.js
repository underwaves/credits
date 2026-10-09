import { chromium } from 'playwright-core';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 }
  });

  const failedImages = [];
  page.on('response', response => {
    if (response.request().resourceType() === 'image' && response.status() >= 400) {
      failedImages.push({ url: response.url(), status: response.status() });
    }
  });

  // 1. Inspect Live Homepage
  console.log('=== INSPECTING LIVE HOMEPAGE (https://sunfz-credits.onrender.com/) ===');
  await page.goto('https://sunfz-credits.onrender.com/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const heroCtaText = await page.locator('.hero-cta-group').innerText();
  console.log('Live Hero CTAs:\n', heroCtaText);

  // Scroll to portfolio
  await page.locator('#portfolio').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  const homeCards = await page.locator('.portfolio-card').count();
  const homeVisibleCards = await page.locator('.portfolio-card:visible').count();
  console.log(`Live Home Portfolio: total=${homeCards}, visible=${homeVisibleCards}`);

  await page.screenshot({ path: 'scripts/screenshot_live_home.png', fullPage: false });
  console.log('Saved screenshot_live_home.png');

  // 2. Inspect Live Credits Page
  console.log('\n=== INSPECTING LIVE CREDITS PAGE (https://sunfz-credits.onrender.com/credits) ===');
  await page.goto('https://sunfz-credits.onrender.com/credits', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const headerCreditCount = await page.locator('#header-total-count').innerText();
  const resultLabel = await page.locator('#result-count-label').innerText();
  const creditCards = await page.locator('#credits-grid .clean-card').count();
  const emptyVisible = await page.locator('#empty-state').isVisible();

  console.log(`Live Credits Header Count: ${headerCreditCount}`);
  console.log(`Live Credits Result Label: ${resultLabel}`);
  console.log(`Live Credit Cards in Grid: ${creditCards}`);
  console.log(`Live Empty state visible: ${emptyVisible}`);

  for (let i = 0; i < Math.min(3, creditCards); i++) {
    const card = page.locator('#credits-grid .clean-card').nth(i);
    const title = await card.locator('h3').first().innerText().catch(() => 'no h3');
    const img = await card.locator('img').first().getAttribute('src');
    console.log(`  Live Credit ${i+1}: title=${title}, img=${img}`);
  }

  await page.screenshot({ path: 'scripts/screenshot_live_credits.png', fullPage: false });
  console.log('Saved screenshot_live_credits.png');

  console.log('\nLive Failed images during navigation:', failedImages);

  await browser.close();
})();
