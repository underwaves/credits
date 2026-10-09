import { chromium } from 'playwright-core';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 }
  });

  // 1. Inspect Homepage & scroll through portfolio to load all lazy images
  console.log('=== INSPECTING HOMEPAGE (/) ===');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

  // Scroll down to portfolio
  await page.locator('#portfolio').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // Scroll through portfolio cards to trigger lazy loading
  await page.evaluate(async () => {
    const cards = document.querySelectorAll('.portfolio-card');
    for (const card of cards) {
      card.scrollIntoView({ behavior: 'instant', block: 'center' });
      await new Promise(r => setTimeout(r, 50));
    }
    // Wait for all images to complete
    await Promise.all(Array.from(document.images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = img.onerror = resolve;
      });
    }));
  });

  await page.waitForTimeout(800);

  // Take screenshot of portfolio section
  const portfolioEl = page.locator('#portfolio');
  await portfolioEl.screenshot({ path: 'scripts/screenshot_home_portfolio_full.png' });
  console.log('Saved screenshot_home_portfolio_full.png');

  // Also check top 6 cards on home
  await page.locator('.portfolio-card').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scripts/screenshot_home_top.png' });
  console.log('Saved screenshot_home_top.png');

  await browser.close();
})();
