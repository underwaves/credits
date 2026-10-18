import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createApp } from '../src/server/app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'facebook_images');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  console.log('🚀 Starting local server for screenshot generation...');
  const app = createApp({ isProd: false });
  const server = http.createServer(app);

  const PORT = 3333;
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Server listening at http://localhost:${PORT}`);

  console.log('🌐 Launching Chrome...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });

  const context = await browser.newContext({
    viewport: { width: 1200, height: 750 },
    deviceScaleFactor: 2 // High-DPI / Retina for sharp Facebook uploads
  });

  const page = await context.newPage();

  console.log('📸 Navigating to homepage...');
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Hero Cover Shot (Frame beautifully)
  console.log('📸 Capturing 1: Hero Cover...');
  const heroEl = page.locator('#hero');
  await heroEl.screenshot({
    path: path.join(outputDir, '1_hero_cover.png')
  });

  // 2. Services Section
  console.log('📸 Capturing 2: Services Grid...');
  await page.evaluate(() => {
    const nav = document.getElementById('site-navbar');
    if (nav) nav.style.display = 'none';
  });
  const servicesContainer = page.locator('#services .container');
  await servicesContainer.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await servicesContainer.screenshot({
    path: path.join(outputDir, '2_services_rates.png')
  });
  await page.evaluate(() => {
    const nav = document.getElementById('site-navbar');
    if (nav) nav.style.display = '';
  });

  // 3. Rate Card Modal (Web Development Rates) - set viewport width 1440 to fit cards in grid
  console.log('📸 Capturing 3: Rate Card Modal...');
  await page.setViewportSize({ width: 1360, height: 950 });
  await page.evaluate(() => {
    window.openRateCardModal('web');
  });
  await page.waitForTimeout(800);
  const modalBox = page.locator('.rate-card-modal-box');
  await modalBox.screenshot({
    path: path.join(outputDir, '3_rate_card_web.png')
  });

  // Close modal and restore viewport
  await page.evaluate(() => {
    window.closeRateCardModal();
  });
  await page.setViewportSize({ width: 1200, height: 750 });
  await page.waitForTimeout(400);

  // 4. Portfolio Showcase
  console.log('📸 Capturing 4: Portfolio Showcase...');
  const portfolioEl = page.locator('#portfolio');
  await portfolioEl.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  // Filter to web projects
  await page.click('button.filter-tab[data-filter="website"]');
  await page.waitForTimeout(600);
  await portfolioEl.screenshot({
    path: path.join(outputDir, '4_portfolio_website_ai.png')
  });

  console.log('✅ All Facebook screenshots captured in:', outputDir);

  await browser.close();
  server.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
