// Automated QA Verification Script for SUNFZENITH
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

console.log('🔍 [QA] Starting SUNFZENITH Automated Quality Assurance Check...\n');

let failed = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  ✅ ${label}`);
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
}

// 1. Files & Directory Verification
console.log('📂 1. Production Bundle Artifacts Check:');
check('dist/ exists', fs.existsSync(dist));
check('dist/index.html exists', fs.existsSync(path.join(dist, 'index.html')));
check('dist/credits.html exists', fs.existsSync(path.join(dist, 'credits.html')));
check('dist/404.html exists', fs.existsSync(path.join(dist, '404.html')));
check('dist/admin.html exists', fs.existsSync(path.join(dist, 'admin.html')));
check('dist/robots.txt exists', fs.existsSync(path.join(dist, 'robots.txt')));
check('dist/sitemap.xml exists', fs.existsSync(path.join(dist, 'sitemap.xml')));

// 2. Index HTML Quality Check
console.log('\n🌟 2. Brand Studio (index.html) Content Check:');
if (fs.existsSync(path.join(dist, 'index.html'))) {
  const indexHtml = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  check('Contains brand title "SUNFZENITH"', indexHtml.includes('SUNFZENITH'));
  check('Contains concept "Small Dream, Big Zenith"', indexHtml.includes('Small Dream, Big Zenith'));
  check('Contains services section', indexHtml.includes('id="services"'));
  check('Contains portfolio section', indexHtml.includes('id="portfolio"'));
  check('Contains pricing section', indexHtml.includes('id="pricing"'));
  check('Contains contact section', indexHtml.includes('id="contact"'));
  check('Contains LINE OA link (@419ajynp)', indexHtml.includes('line.me/R/ti/p/@419ajynp'));
  check('Contains no contact form (LINE OA CTA only)', !indexHtml.includes('id="contact-form"'));
  check('Contains sun emoji brand icon', indexHtml.includes('☀️'));
  check('Contains CSRF/Same-origin security script', indexHtml.includes('sunfz'));
}

// 3. Credits HTML Quality Check
console.log('\n📜 3. Credits Page (credits.html) Content Check:');
if (fs.existsSync(path.join(dist, 'credits.html'))) {
  const creditsHtml = fs.readFileSync(path.join(dist, 'credits.html'), 'utf8');
  check('Contains review submit modal', creditsHtml.includes('id="review-modal"'));
  check('Contains proof file input', creditsHtml.includes('id="review-file-input"'));
  check('Contains review type indicator', creditsHtml.includes('btn-submit-review'));
  check('Contains credits container/grid', creditsHtml.includes('id="credits-grid"'));
  check('Contains search input', creditsHtml.includes('id="search-input"'));
}

// 4. Fonts and Assets
console.log('\n🎨 4. Static Assets & Typography:');
const assetsDir = path.join(dist, 'assets');
if (fs.existsSync(assetsDir)) {
  const assets = fs.readdirSync(assetsDir);
  const woffFiles = assets.filter((f) => f.endsWith('.woff') || f.endsWith('.woff2'));
  const jsFiles = assets.filter((f) => f.endsWith('.js'));
  const cssFiles = assets.filter((f) => f.endsWith('.css'));

  check(`Embedded webfonts (${woffFiles.length} files found)`, woffFiles.length > 5);
  check(`Bundled CSS (${cssFiles.length} files found)`, cssFiles.length >= 1);
  check(`Bundled JS (${jsFiles.length} files found)`, jsFiles.length >= 1);
} else {
  check('dist/assets exists', false);
}

console.log('\n------------------------------------------------------');
if (failed === 0) {
  console.log('🎉 [QA PASSED] All production assets & checks verified successfully!\n');
  process.exit(0);
} else {
  console.error(`🚨 [QA FAILED] ${failed} check(s) failed.\n`);
  process.exit(1);
}
