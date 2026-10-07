import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const svgBase = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E8F4FD"/>
      <stop offset="45%" stop-color="#FFFDF7"/>
      <stop offset="100%" stop-color="#FFF5D6"/>
    </linearGradient>

    <!-- Sun Halo Gradient -->
    <radialGradient id="sunHalo" cx="50%" cy="50%" r="50%">
      <stop offset="40%" stop-color="#FFDD55" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#FFDD55" stop-opacity="0"/>
    </radialGradient>

    <!-- Disc Gradient -->
    <radialGradient id="discGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFDF0"/>
      <stop offset="70%" stop-color="#FFEBB0"/>
      <stop offset="100%" stop-color="#FFDE82"/>
    </radialGradient>

    <!-- Drop Shadows -->
    <filter id="mascotShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="22" flood-color="#F59E0B" flood-opacity="0.32"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)"/>

  <!-- Halo & Backing Stage Circle for Mascot -->
  <circle cx="280" cy="315" r="240" fill="url(#sunHalo)"/>
  <circle cx="280" cy="315" r="185" fill="url(#discGrad)" filter="url(#mascotShadow)"/>
  <circle cx="280" cy="315" r="180" fill="none" stroke="#FFFFFF" stroke-width="6" opacity="0.8"/>

  <!-- Subtle background dots/stars -->
  <circle cx="120" cy="100" r="4" fill="#FFC93E" opacity="0.8"/>
  <circle cx="220" cy="70" r="6" fill="#70B8F8" opacity="0.6"/>
  <circle cx="1060" cy="120" r="5" fill="#FFB72B" opacity="0.7"/>
  <circle cx="1120" cy="220" r="7" fill="#70B8F8" opacity="0.5"/>
  <circle cx="560" cy="90" r="5" fill="#FFAA00" opacity="0.6"/>
  <circle cx="680" cy="560" r="5" fill="#FFC93E" opacity="0.8"/>

  <!-- Right Side Information Card -->
  <g transform="translate(540, 115)">
    <!-- Brand Badge -->
    <rect x="0" y="0" width="250" height="44" rx="22" fill="#FEF3C7" stroke="#FBBF24" stroke-width="2"/>
    <text x="26" y="28" font-family="'Segoe UI', -apple-system, sans-serif" font-size="16" font-weight="bold" fill="#D97706">
      ⭐ DIGITAL &amp; TECH STUDIO
    </text>

    <!-- Main Title -->
    <text x="0" y="110" font-family="'Segoe UI', -apple-system, sans-serif" font-size="64" font-weight="900" fill="#16203D" letter-spacing="1.5">
      SUNFZENITH
    </text>

    <!-- Slogan -->
    <text x="0" y="160" font-family="'Segoe UI', -apple-system, sans-serif" font-size="28" font-weight="700" fill="#2563EB">
      “Small Dream, Big Zenith”
    </text>

    <!-- Description -->
    <text x="0" y="215" font-family="'Segoe UI', -apple-system, sans-serif" font-size="20" font-weight="500" fill="#4B5563">
      บริการทำเว็บไซต์ • ช่วยเขียนโค้ด • สไลด์พรีเซนต์ • โปสเตอร์
    </text>

    <!-- Pill Badges -->
    <g transform="translate(0, 255)">
      <rect x="0" y="0" width="195" height="46" rx="14" fill="#E0F2FE"/>
      <text x="20" y="29" font-family="'Segoe UI', -apple-system, sans-serif" font-size="16" font-weight="bold" fill="#0369A1">
        💬 ปรึกษาฟรี 100%
      </text>

      <rect x="210" y="0" width="235" height="46" rx="14" fill="#FEF3C7"/>
      <text x="230" y="29" font-family="'Segoe UI', -apple-system, sans-serif" font-size="16" font-weight="bold" fill="#92400E">
        🎨 สไลด์/โปสเตอร์ เริ่มต้น 49 ฿
      </text>
    </g>

    <!-- Bottom URL Link Pill -->
    <g transform="translate(0, 340)">
      <text x="0" y="24" font-family="'Segoe UI', -apple-system, sans-serif" font-size="18" font-weight="600" fill="#6B7280">
        🌐 sunfz-credits.onrender.com
      </text>
    </g>
  </g>
</svg>
`;

async function main() {
  const mascotPath = path.join(root, 'web', 'public', 'images', 'mascot.png');
  const mascotBuf = await sharp(mascotPath)
    .resize(370, 370, { fit: 'contain' })
    .toBuffer();

  const baseBuf = Buffer.from(svgBase);
  const outPath1 = path.join(root, 'web', 'public', 'images', 'og-sun.png');
  const outPath2 = path.join(root, 'public', 'images', 'og-sun.png');

  fs.mkdirSync(path.dirname(outPath1), { recursive: true });
  fs.mkdirSync(path.dirname(outPath2), { recursive: true });

  const finalImg = sharp(baseBuf)
    .resize(1200, 630)
    .composite([
      {
        input: mascotBuf,
        top: Math.round(315 - 370 / 2),
        left: Math.round(280 - 370 / 2)
      }
    ])
    .png({ quality: 95, compressionLevel: 8 });

  await finalImg.toFile(outPath1);
  fs.copyFileSync(outPath1, outPath2);

  console.log('✅ Generated 1200x630 OG image with Mascot at:', outPath1);
}

main().catch(console.error);
